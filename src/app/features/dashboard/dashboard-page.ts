import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FairService } from '../../application/fairs/fair.service';
import { FairContextService } from '../../core/event/fair-context.service';
import type { Fair } from '../../domain/models/fair';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  private readonly fairContext = inject(FairContextService);
  private readonly fairService = inject(FairService);
  protected readonly dashboard = this.fairContext.dashboard;
  protected readonly activeFair = signal<Fair | null>(null);

  ngOnInit(): void { void this.loadActiveFair(); }

  private async loadActiveFair(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const fairs = await this.fairService.list();
    this.activeFair.set(fairs.find((fair) => fair.startDate <= today && today <= fair.endDate) ?? null);
  }
}
