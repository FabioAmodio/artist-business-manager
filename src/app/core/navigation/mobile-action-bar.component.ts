import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FairContextService } from '../event/fair-context.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-mobile-action-bar',
  templateUrl: './mobile-action-bar.component.html',
  styleUrl: './mobile-action-bar.component.scss',
})
export class MobileActionBarComponent {
  private readonly fairContext = inject(FairContextService);
  protected readonly fairModeActive = this.fairContext.fairModeActive;
}
