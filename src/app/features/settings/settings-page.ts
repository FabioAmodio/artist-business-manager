import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FairContextService } from '../../core/event/fair-context.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-page',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly fairContext = inject(FairContextService);
  protected readonly settings = this.fairContext.transparencySettings;

  protected toggleEnabled(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.fairContext.updateAiSettings({ ...this.settings(), enabled, consentGiven: enabled });
  }

  protected toggleCloud(event: Event): void {
    const allowCloudProcessing = (event.target as HTMLInputElement).checked;
    this.fairContext.updateAiSettings({ ...this.settings(), allowCloudProcessing });
  }
}
