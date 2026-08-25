import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-mobile-action-bar',
  templateUrl: './mobile-action-bar.component.html',
  styleUrl: './mobile-action-bar.component.scss',
})
export class MobileActionBarComponent {
  private readonly router = inject(Router);

  protected openQuickAction(): void {
    void this.router.navigate(['/sales'], { queryParams: { create: Date.now().toString() } });
  }
}
