import { Injectable, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
  where,
  query,
} from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseAuthService } from '../firebase/firebase-auth.service';
import { WorkspaceService } from '../firebase/workspace.service';
import type { EntityId } from '../../domain/shared/types';
import type {
  DeleteMetadata,
  IStorageProvider,
  StorageFilter,
  StorageHealth,
} from './storage-provider';

@Injectable()
export class FirestoreProvider implements IStorageProvider {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(FirebaseAuthService);
  private readonly workspace = inject(WorkspaceService);

  async open(): Promise<void> {}

  async close(): Promise<void> {}

  async get<T>(collectionName: string, id: EntityId): Promise<T | null> {
    try {
      const snapshot = await getDoc(this.documentReference(collectionName, id));
      if (!snapshot.exists()) return null;
      return { ...snapshot.data(), id: snapshot.id } as T;
    } catch (error) { throw this.withContext(error, `lettura ${collectionName}/${id}`); }
  }

  async list<T>(collectionName: string, filter?: StorageFilter): Promise<readonly T[]> {
    const collectionReference = collection(this.firebase.firestore(), this.collectionPath(collectionName));
    try {
      const snapshot = filter
        ? await getDocs(query(collectionReference, where(filter.field, '==', filter.value)))
        : await getDocs(collectionReference);
      return snapshot.docs.map((snapshotDocument) => ({ ...snapshotDocument.data(), id: snapshotDocument.id }) as T);
    } catch (error) { throw this.withContext(error, `elenco ${collectionName}`); }
  }

  async put<T>(collectionName: string, value: T): Promise<void> {
    const id = (value as { id?: EntityId }).id;
    if (!id) throw new Error(`Un documento Firestore nella collection ${collectionName} deve avere un id.`);
    const user = this.requireUser();
    const reference = this.documentReference(collectionName, id);
    try {
      await runTransaction(this.firebase.firestore(), async (transaction) => {
        const current = await transaction.get(reference);
        const currentData = current.data() as Record<string, unknown> | undefined;
        transaction.set(reference, {
          ...value as Record<string, unknown>,
          createdBy: currentData?.['createdBy'] ?? user.uid,
          updatedBy: user.uid,
          version: typeof currentData?.['version'] === 'number' ? currentData['version'] + 1 : 1,
        });
      });
    } catch (error) { throw this.withContext(error, `scrittura ${collectionName}/${id}`); }
  }

  async deleteLogical(collectionName: string, id: EntityId, metadata: DeleteMetadata = {}): Promise<void> {
    const user = this.requireUser();
    const reference = this.documentReference(collectionName, id);
    try {
      await runTransaction(this.firebase.firestore(), async (transaction) => {
        const current = await transaction.get(reference);
        if (!current.exists()) throw new Error('Documento Firestore non trovato.');
        const currentData = current.data() as Record<string, unknown>;
        transaction.update(reference, {
          deletedAt: metadata.deletedAt ?? new Date().toISOString(),
          deletedBy: metadata.deletedBy ?? user.uid,
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid,
          version: typeof currentData['version'] === 'number' ? currentData['version'] + 1 : 1,
        });
      });
    } catch (error) { throw this.withContext(error, `cancellazione logica ${collectionName}/${id}`); }
  }

  async deletePermanent(collectionName: string, id: EntityId): Promise<void> {
    this.requireUser();
    try { await deleteDoc(this.documentReference(collectionName, id)); }
    catch (error) { throw this.withContext(error, `cancellazione fisica ${collectionName}/${id}`); }
  }

  async clearCollections(_collections: readonly string[]): Promise<void> {
    this.requireUser();
    for (const collectionName of _collections) {
      const snapshot = await getDocs(collection(this.firebase.firestore(), this.collectionPath(collectionName)));
      for (const document of snapshot.docs) await deleteDoc(document.ref);
    }
  }

  async transaction<T>(_collections: readonly string[], _work: () => Promise<T>): Promise<T> {
    throw new Error('Le transazioni Firestore richiedono un adapter dedicato al caso d\'uso.');
  }

  async health(): Promise<StorageHealth> {
    return {
      available: this.firebase.isConfigured,
      provider: 'FirestoreProvider',
      databaseName: this.firebase.isConfigured ? 'Cloud Firestore' : 'non configurato',
      schemaVersion: 0,
      migrationVersion: 0,
      checkedAt: new Date().toISOString(),
    };
  }

  private collectionPath(collectionName: string): string {
    const workspaceId = this.workspace.activeWorkspaceId();
    if (!workspaceId) throw new Error('Seleziona prima un workspace Firestore.');
    return `workspaces/${workspaceId}/${collectionName}`;
  }

  private documentReference(collectionName: string, id: EntityId) {
    return doc(this.firebase.firestore(), this.collectionPath(collectionName), id);
  }

  private requireUser() {
    const user = this.auth.user();
    if (!user) throw new Error('Accedi prima di utilizzare Firestore.');
    return user;
  }

  private withContext(error: unknown, operation: string): Error {
    const message = error instanceof Error ? error.message : 'Errore Firestore.';
    return new Error(`Errore Firestore durante ${operation}: ${message}`, { cause: error });
  }
}
