import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FairContextService } from '../../core/event/fair-context.service';
import { PersistenceService } from '../../application/persistence/persistence.service';

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

  protected async selectPersistenceSource(source: 'none' | 'file-system'): Promise<void> {
    try {
      if (source === 'none') await this.persistence.disable();
      else await this.persistence.chooseFileSystem();
    } catch (error) { this.persistence.status.set(error instanceof Error ? error.message : 'Impossibile configurare la persistenza.'); }
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
