import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FairContextService } from '../../core/event/fair-context.service';
import { PersistenceService } from '../../application/persistence/persistence.service';
import type { PersistenceSource } from '../../core/persistence/persistence.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  selector: 'app-settings-page',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnInit {
  private readonly fairContext = inject(FairContextService);
  protected readonly persistence = inject(PersistenceService);
  protected readonly settings = this.fairContext.transparencySettings;

  ngOnInit(): void { void this.persistence.initialize(); }

  protected async selectPersistenceSource(source: PersistenceSource): Promise<void> {
    try {
      if (source === 'none') await this.persistence.disable();
      else if (source === 'file-system') await this.persistence.chooseFileSystem();
      else this.persistence.status.set('Inserisci il Client ID e collega Google Drive.');
    } catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile configurare la persistenza.'); }
  }

  protected async connectDrive(): Promise<void> {
    try { await this.persistence.connectDrive(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile collegare Google Drive.'); }
  }

  protected async selectDriveFolder(folderId: string): Promise<void> {
    try { await this.persistence.selectDriveFolder(folderId); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile selezionare la cartella Drive.'); }
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

  protected async synchronizePersistence(): Promise<void> {
    try { await this.persistence.synchronize(); }
    catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile sincronizzare i dati.'); }
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

  protected toggleEnabled(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.fairContext.updateAiSettings({ ...this.settings(), enabled, consentGiven: enabled });
  }

  protected toggleCloud(event: Event): void {
    const allowCloudProcessing = (event.target as HTMLInputElement).checked;
    this.fairContext.updateAiSettings({ ...this.settings(), allowCloudProcessing });
  }
}
