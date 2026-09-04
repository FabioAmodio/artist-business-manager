import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersistenceService } from '../../application/persistence/persistence.service';
import type { PersistenceMode, PersistenceSource } from '../../core/persistence/persistence.models';
import type { WorkspaceRole } from '../../domain/models/workspace';
import { APP_ENVIRONMENT } from '../../core/configuration/environment.tokens';
import { SyncStatusService } from '../../core/synchronization/sync-status.service';
import { FirebaseAuthService } from '../../core/firebase/firebase-auth.service';
import { WorkspaceService } from '../../core/firebase/workspace.service';

type ResetTarget = 'local' | 'remote' | 'both';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  selector: 'app-settings-page',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnInit {
  protected readonly persistence = inject(PersistenceService);
  protected readonly syncStatus = inject(SyncStatusService);
  protected readonly firebaseAuth = inject(FirebaseAuthService);
  protected readonly workspace = inject(WorkspaceService);
  protected readonly environment = inject(APP_ENVIRONMENT);
  protected readonly resetStep = signal<0 | 1 | 2>(0);
  protected readonly resetCode = signal('');
  protected readonly resetError = signal('');
  protected readonly resetting = signal(false);
  protected readonly selectingDriveFolderId = signal<string | null>(null);
  protected readonly synchronizing = signal(false);
  protected readonly authenticating = signal(false);
  protected readonly seedingFirestore = signal(false);
  protected readonly mergingFirestore = signal(false);
  protected readonly resetTarget = signal<ResetTarget>('local');
  protected readonly inviteDialogOpen = signal(false);
  protected readonly inviteError = signal('');
  protected readonly inviting = signal(false);
  protected inviteEmail = '';
  protected inviteRole: Exclude<WorkspaceRole, 'owner'> = 'editor';
  protected resetCodeInput = '';

  constructor() {
    effect(() => {
      if (this.persistence.mode() === 'firestore' && this.firebaseAuth.initialized() && this.firebaseAuth.user()) void this.workspace.loadForCurrentUser();
      else if (!this.firebaseAuth.user()) this.workspace.loadForCurrentUser();
    });
  }

  ngOnInit(): void {
    void this.initializePersistenceSettings();
  }

  private async initializePersistenceSettings(): Promise<void> {
    await this.persistence.initialize();
    if (this.persistence.mode() === 'firestore') this.firebaseAuth.start();
  }

  protected async selectPersistenceSource(source: PersistenceSource): Promise<void> {
    try {
      if (source === 'none') await this.persistence.disable();
      else if (source === 'file-system') await this.persistence.chooseFileSystem();
      else this.persistence.status.set('Inserisci il Client ID e collega Google Drive.');
    } catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile configurare la persistenza.'); }
  }

  protected async selectPersistenceMode(mode: PersistenceMode): Promise<void> {
    try { await this.persistence.setMode(mode); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile cambiare modalità di persistenza.'); }
  }

  protected async signInWithGoogle(): Promise<void> {
    if (this.authenticating()) return;
    this.authenticating.set(true);
    try { await this.firebaseAuth.signInWithGoogle(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile accedere con Google.'); }
    finally { this.authenticating.set(false); }
  }

  protected async signOutFromFirebase(): Promise<void> {
    try { await this.firebaseAuth.signOut(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile disconnettere l\'account Google.'); }
  }

  protected async seedFirestoreFromOffline(): Promise<void> {
    if (this.seedingFirestore()) return;
    this.seedingFirestore.set(true);
    try { await this.persistence.seedFirestoreFromOffline(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile copiare i dati locali in Firebase.'); }
    finally { this.seedingFirestore.set(false); }
  }

  protected async mergeOfflineIntoFirestore(): Promise<void> {
    if (this.mergingFirestore()) return;
    this.mergingFirestore.set(true);
    try { await this.persistence.mergeOfflineIntoFirestore(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile unire i dati locali in Firebase.'); }
    finally { this.mergingFirestore.set(false); }
  }

  protected selectWorkspace(workspaceId: string): void { this.workspace.selectWorkspace(workspaceId); }

  protected async createWorkspace(): Promise<void> {
    const name = window.prompt('Nome del workspace');
    if (name === null) return;
    try { await this.workspace.createWorkspace(name); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile creare il workspace.'); }
  }

  protected async addMember(): Promise<void> {
    this.inviteEmail = '';
    this.inviteRole = 'editor';
    this.inviteError.set('');
    this.inviteDialogOpen.set(true);
  }

  protected closeInviteDialog(): void {
    if (this.inviting()) return;
    this.inviteDialogOpen.set(false);
  }

  protected async sendInvite(): Promise<void> {
    if (this.inviting() || !this.inviteEmail.trim()) return;
    this.inviting.set(true);
    this.inviteError.set('');
    try {
      const invite = await this.workspace.createInvite(this.inviteEmail, this.inviteRole);
      const inviteUrl = new URL('invite', document.baseURI);
      inviteUrl.searchParams.set('workspaceId', invite.workspaceId);
      inviteUrl.searchParams.set('inviteId', invite.id);
      await this.firebaseAuth.sendEmailLink(invite.email, inviteUrl.toString());
      this.persistence.status.set(`Invito inviato a ${invite.email}.`);
      this.inviteDialogOpen.set(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossibile inviare l\'invito.';
      this.inviteError.set(message);
      this.persistence.status.set(message);
    }
    finally { this.inviting.set(false); }
  }

  protected async connectDrive(): Promise<void> {
    try { await this.persistence.connectDrive(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile collegare Google Drive.'); }
  }

  protected async selectDriveFolder(folderId: string): Promise<void> {
    if (this.selectingDriveFolderId()) return;
    this.selectingDriveFolderId.set(folderId);
    try { await this.persistence.selectDriveFolder(folderId); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile selezionare la cartella Drive.'); }
    finally { this.selectingDriveFolderId.set(null); }
  }

  protected async browseDriveFolder(folder: { id: string; name: string }): Promise<void> {
    try { await this.persistence.browseDriveFolder(folder); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile aprire la cartella Drive.'); }
  }

  protected async browseDriveRoot(): Promise<void> {
    try { await this.persistence.browseDriveRoot(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile aprire Drive.'); }
  }

  protected async browseDrivePath(folder: { id: string; name: string }): Promise<void> {
    try { await this.persistence.browseDrivePath(folder); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile aprire la cartella Drive.'); }
  }

  protected async createDriveFolder(): Promise<void> {
    const name = window.prompt('Nome della nuova cartella Drive');
    if (name === null) return;
    try { await this.persistence.createDriveFolder(name); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile creare la cartella Drive.'); }
  }

  protected async synchronizePersistence(): Promise<void> {
    if (this.synchronizing()) return;
    this.synchronizing.set(true);
    try { await this.persistence.synchronize(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile sincronizzare i dati.'); }
    finally { this.synchronizing.set(false); }
  }

  protected async retrySyncOperation(id: string): Promise<void> {
    await this.persistence.retrySyncOperation(id);
  }

  protected async discardSyncOperation(id: string): Promise<void> {
    await this.persistence.discardSyncOperation(id);
  }

  protected async importFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try { await this.persistence.persistImportedFile(file); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile importare i dati.'); }
    finally { (event.target as HTMLInputElement).value = ''; }
  }

  protected async exportFile(): Promise<void> {
    await this.persistence.exportLocal();
  }

  protected openFactoryReset(): void {
    this.resetError.set('');
    this.resetTarget.set('local');
    this.resetStep.set(1);
  }

  protected continueFactoryReset(): void {
    const random = crypto.getRandomValues(new Uint16Array(1))[0] % 9000 + 1000;
    this.resetCode.set(String(random));
    this.resetCodeInput = '';
    this.resetError.set('');
    this.resetStep.set(2);
  }

  protected closeFactoryReset(): void {
    if (this.resetting()) return;
    this.resetStep.set(0);
    this.resetCode.set('');
    this.resetCodeInput = '';
    this.resetError.set('');
  }

  protected async confirmFactoryReset(): Promise<void> {
    if (this.resetCodeInput !== this.resetCode()) {
      this.resetError.set('Il codice inserito non corrisponde.');
      return;
    }
    this.resetting.set(true);
    this.resetError.set('');
    try {
      const target = this.resetTarget();
      if (target === 'remote' || target === 'both') await this.persistence.resetFirestoreWorkspace();
      if (target === 'local' || target === 'both') await this.persistence.factoryReset();
      window.location.reload();
    } catch (error) {
      this.resetError.set(error instanceof Error ? error.message : 'Impossibile ripristinare il database locale.');
      this.resetting.set(false);
    }
  }

}
