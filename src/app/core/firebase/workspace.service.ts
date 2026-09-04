import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import type { Workspace, WorkspaceMembership } from '../../domain/models/workspace';
import type { WorkspaceRole } from '../../domain/models/workspace';
import type { WorkspaceInvite } from '../../domain/models/workspace-invite';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';

interface WorkspaceDocument extends Omit<Workspace, 'id'> {}
interface MembershipDocument extends Omit<WorkspaceMembership, 'uid' | 'workspaceId'> {
  readonly uid?: string;
  readonly workspaceId?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(FirebaseAuthService);
  readonly workspaces = signal<readonly Workspace[]>([]);
  readonly memberships = signal<readonly WorkspaceMembership[]>([]);
  readonly activeWorkspaceId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly pendingInvites = signal<readonly WorkspaceInvite[]>([]);
  private loadingPromise: Promise<void> | null = null;

  async loadForCurrentUser(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = this.loadForCurrentUserInternal();
    try { await this.loadingPromise; }
    finally { this.loadingPromise = null; }
  }

  private async loadForCurrentUserInternal(): Promise<void> {
    this.error.set(null);
    const user = this.auth.user();
    if (!user) {
      this.workspaces.set([]);
      this.memberships.set([]);
      this.activeWorkspaceId.set(null);
      return;
    }

    try {
      const membershipSnapshot = await getDocs(collection(this.firebase.firestore(), 'users', user.uid, 'memberships'));
      await this.applyMemberships(user.uid, membershipSnapshot.docs.map((document) => ({ ...document.data(), id: document.id })));
    } catch (error) {
      const recovered = await this.recoverSavedWorkspace(user.uid);
      if (recovered) return;
      this.error.set(this.errorMessage(error, `lettura memberships dell'utente ${user.uid}`));
    }
  }

  private async applyMemberships(uid: string, membershipDocuments: readonly Record<string, unknown>[]): Promise<void> {
      const loadedMemberships: WorkspaceMembership[] = [];
      const loadedWorkspaces: Workspace[] = [];
      for (const membershipDocument of membershipDocuments) {
        const membership = membershipDocument as unknown as MembershipDocument;
        const workspaceId = membership.workspaceId ?? String(membershipDocument['id']);
        if (!workspaceId) continue;
        let workspaceSnapshot;
        try {
          workspaceSnapshot = await getDoc(doc(this.firebase.firestore(), 'workspaces', workspaceId));
        } catch {
          continue;
        }
        if (!workspaceSnapshot.exists()) continue;
        loadedMemberships.push({ ...membership, uid: membership.uid ?? uid, workspaceId });
        loadedWorkspaces.push({ ...(workspaceSnapshot.data() as WorkspaceDocument), id: workspaceSnapshot.id });
      }
      this.memberships.set(loadedMemberships);
      this.workspaces.set([...new Map(loadedWorkspaces.map((workspace) => [workspace.id, workspace])).values()]);
      const savedWorkspaceId = this.savedWorkspaceId(uid);
      this.activeWorkspaceId.set(this.workspaces().some((workspace) => workspace.id === savedWorkspaceId)
        ? savedWorkspaceId
        : this.workspaces()[0]?.id ?? null);
      try { await this.loadPendingInvites(); } catch { this.pendingInvites.set([]); }
      this.error.set(null);
  }

  private async recoverSavedWorkspace(uid: string): Promise<boolean> {
    const workspaceId = this.savedWorkspaceId(uid);
    if (!workspaceId) return false;
    try {
      const membership = await getDoc(doc(this.firebase.firestore(), 'workspaces', workspaceId, 'members', uid));
      const workspace = await getDoc(doc(this.firebase.firestore(), 'workspaces', workspaceId));
      if (!membership.exists() || !workspace.exists()) return false;
      await this.applyMemberships(uid, [{ ...membership.data(), id: uid, workspaceId }]);
      return true;
    } catch { return false; }
  }

  async createWorkspace(name: string): Promise<Workspace> {
    const user = this.auth.user();
    const trimmedName = name.trim();
    if (!user) throw new Error('Accedi prima di creare un workspace.');
    if (!trimmedName) throw new Error('Inserisci un nome per il workspace.');
    const workspaceReference = doc(collection(this.firebase.firestore(), 'workspaces'));
    const now = new Date().toISOString();
    const workspace: Workspace = { id: workspaceReference.id, name: trimmedName, ownerId: user.uid, createdAt: now, updatedAt: now };
    const membership: WorkspaceMembership = { uid: user.uid, workspaceId: workspace.id, role: 'owner', email: user.email ?? undefined, displayName: user.displayName ?? undefined, createdAt: now, updatedAt: now };
    const batch = writeBatch(this.firebase.firestore());
    batch.set(workspaceReference, { ...workspace });
    batch.set(doc(workspaceReference, 'members', user.uid), { ...membership });
    batch.set(doc(this.firebase.firestore(), 'users', user.uid, 'memberships', workspace.id), { ...membership });
    await batch.commit();
    this.workspaces.update((workspaces) => [...workspaces, workspace]);
    this.memberships.update((memberships) => [...memberships, membership]);
    this.activeWorkspaceId.set(workspace.id);
    this.saveWorkspaceId(user.uid, workspace.id);
    return workspace;
  }

  async addMember(uid: string, email: string, role: WorkspaceRole): Promise<void> {
    const owner = this.auth.user();
    const workspaceId = this.activeWorkspaceId();
    if (!owner || !workspaceId || !this.isActiveOwner()) throw new Error('Solo l\'owner di un workspace attivo può aggiungere collaboratori.');
    if (!uid.trim() || !email.trim()) throw new Error('UID ed email del collaboratore sono obbligatori.');
    if (role === 'owner') throw new Error('Il ruolo owner non può essere assegnato a un collaboratore.');
    const now = new Date().toISOString();
    const membership: WorkspaceMembership = { uid: uid.trim(), workspaceId, role, email: email.trim(), createdAt: now, updatedAt: now };
    const batch = writeBatch(this.firebase.firestore());
    batch.set(doc(this.firebase.firestore(), 'workspaces', workspaceId, 'members', membership.uid), { ...membership });
    batch.set(doc(this.firebase.firestore(), 'users', membership.uid, 'memberships', workspaceId), { ...membership });
    await batch.commit();
    await this.loadForCurrentUser();
  }

  async createInvite(email: string, role: Exclude<WorkspaceRole, 'owner'>): Promise<WorkspaceInvite> {
    const user = this.auth.user();
    const workspaceId = this.activeWorkspaceId();
    const normalizedEmail = email.trim().toLowerCase();
    if (!user || !workspaceId || !this.isActiveOwner()) throw new Error('Solo l\'owner può invitare collaboratori.');
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Inserisci un indirizzo email valido.');
    const inviteReference = doc(collection(this.firebase.firestore(), 'workspaces', workspaceId, 'invites'));
    const createdAt = new Date();
    const invite: WorkspaceInvite = {
      id: inviteReference.id, workspaceId, email: normalizedEmail, role, status: 'pending', createdBy: user.uid,
      createdAt: createdAt.toISOString(), expiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const batch = writeBatch(this.firebase.firestore());
    batch.set(inviteReference, { ...invite });
    await batch.commit();
    this.pendingInvites.update((invites) => [...invites, invite]);
    return invite;
  }

  async loadPendingInvites(): Promise<void> {
    const workspaceId = this.activeWorkspaceId();
    if (!workspaceId || !this.isActiveOwner()) { this.pendingInvites.set([]); return; }
    const snapshot = await getDocs(collection(this.firebase.firestore(), 'workspaces', workspaceId, 'invites'));
    this.pendingInvites.set(snapshot.docs
      .map((inviteDocument) => ({ ...(inviteDocument.data() as Omit<WorkspaceInvite, 'id'>), id: inviteDocument.id }))
      .filter((invite) => invite.status === 'pending' && new Date(invite.expiresAt).getTime() > Date.now()));
  }

  private errorMessage(error: unknown, operation: string): string {
    return `Errore Firestore durante ${operation}: ${error instanceof Error ? error.message : 'operazione non riuscita.'}`;
  }

  async getInvite(workspaceId: string, inviteId: string): Promise<WorkspaceInvite | null> {
    const snapshot = await getDoc(doc(this.firebase.firestore(), 'workspaces', workspaceId, 'invites', inviteId));
    return snapshot.exists() ? { ...(snapshot.data() as Omit<WorkspaceInvite, 'id'>), id: snapshot.id } : null;
  }

  async acceptInvite(invite: WorkspaceInvite): Promise<void> {
    const user = this.auth.user();
    if (!user || !user.email || user.email.toLowerCase() !== invite.email) throw new Error('L\'account autenticato non corrisponde all\'invito.');
    if (invite.status !== 'pending' || new Date(invite.expiresAt).getTime() <= Date.now()) throw new Error('Questo invito non è più valido.');
    const now = new Date().toISOString();
    const membership: WorkspaceMembership = { uid: user.uid, workspaceId: invite.workspaceId, role: invite.role, email: user.email, displayName: user.displayName ?? undefined, inviteId: invite.id, createdAt: now, updatedAt: now };
    const batch = writeBatch(this.firebase.firestore());
    batch.set(doc(this.firebase.firestore(), 'workspaces', invite.workspaceId, 'members', user.uid), { ...membership });
    batch.set(doc(this.firebase.firestore(), 'users', user.uid, 'memberships', invite.workspaceId), { ...membership });
    batch.update(doc(this.firebase.firestore(), 'workspaces', invite.workspaceId, 'invites', invite.id), { status: 'accepted', acceptedBy: user.uid, acceptedAt: now });
    await batch.commit();
    await this.loadForCurrentUser();
  }

  selectWorkspace(workspaceId: string): void {
    if (!this.workspaces().some((workspace) => workspace.id === workspaceId)) return;
    this.activeWorkspaceId.set(workspaceId);
    const user = this.auth.user();
    if (user) this.saveWorkspaceId(user.uid, workspaceId);
    void this.loadPendingInvites();
  }

  isActiveOwner(): boolean {
    const user = this.auth.user();
    const workspaceId = this.activeWorkspaceId();
    return user !== null && workspaceId !== null && this.memberships().some((membership) => membership.uid === user.uid && membership.workspaceId === workspaceId && membership.role === 'owner');
  }

  private savedWorkspaceId(uid: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.workspaceStorageKey(uid));
  }

  private saveWorkspaceId(uid: string, workspaceId: string): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.workspaceStorageKey(uid), workspaceId);
  }

  private workspaceStorageKey(uid: string): string {
    return `abm-firebase-workspace:${this.firebaseProjectId()}:${uid}`;
  }

  private firebaseProjectId(): string {
    return this.firebase.firestore().app.options.projectId ?? 'unknown';
  }
}
