import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../application/clients/client.service';
import { OperationService } from '../../application/operations/operation.service';
import { ProductService } from '../../application/products/product.service';
import { ServiceService } from '../../application/services/service.service';
import type { Operation } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
import type { Product } from '../../domain/models/product';
import type { Service } from '../../domain/models/service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { ListFilterPanelComponent } from '../../shared/components/list-filter-panel.component';

type DeadlineSortKey = 'date' | 'offer' | 'customer' | 'status';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ListFilterPanelComponent, PageHeaderComponent],
  selector: 'app-deadlines-page',
  templateUrl: './deadlines-page.html',
  styleUrl: './deadlines-page.scss',
})
export class DeadlinesPage implements OnInit {
  private readonly router = inject(Router);
  private readonly operationService = inject(OperationService);
  private readonly clientService = inject(ClientService);
  private readonly productService = inject(ProductService);
  private readonly serviceService = inject(ServiceService);

  protected readonly works = signal<readonly Operation[]>([]);
  protected readonly parties = signal<readonly Party[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly loading = signal(true);
  protected readonly filtersOpen = signal(false);
  protected readonly sortOpen = signal(false);
  protected readonly query = signal('');
  protected readonly statusFilter = signal<'all' | 'overdue' | 'due-soon'>('all');
  protected readonly sortKey = signal<DeadlineSortKey>('date');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void { void this.load(); }

  protected offerName(work: Operation): string { return work.serviceId ? this.services().find((service) => service.id === work.serviceId)?.description ?? 'Servizio non trovato' : this.products().find((product) => product.id === work.productId)?.name ?? 'Prodotto non indicato'; }
  protected customerName(work: Operation): string { return work.partyId ? this.parties().find((party) => party.id === work.partyId)?.displayName ?? 'Cliente non trovato' : work.customerName || 'Cliente non indicato'; }
  protected formatDate(value?: string): string { return value ? new Intl.DateTimeFormat('it-IT').format(new Date(`${value}T00:00:00`)) : 'Non indicata'; }
  protected isOverdue(work: Operation): boolean { return Boolean(work.deliveryDate && work.deliveryDate < this.today()); }
  protected isDueSoon(work: Operation): boolean {
    if (!work.deliveryDate || this.isOverdue(work)) return false;
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    return work.deliveryDate <= limit.toISOString().slice(0, 10);
  }
  protected openWork(work: Operation): void { void this.router.navigate(['/works'], { queryParams: { open: work.id } }); }
  protected visibleWorks(): readonly Operation[] {
    const query = this.query().trim().toLocaleLowerCase();
    const works = this.works().filter((work) => {
      if (this.statusFilter() === 'overdue' && !this.isOverdue(work)) return false;
      if (this.statusFilter() === 'due-soon' && !this.isDueSoon(work)) return false;
      return !query || `${work.title} ${this.offerName(work)} ${this.customerName(work)}`.toLocaleLowerCase().includes(query);
    });
    return [...works].sort((first, second) => { const value = (work: Operation): string => this.sortKey() === 'date' ? work.deliveryDate ?? '9999-12-31' : this.sortKey() === 'offer' ? this.offerName(work) : this.sortKey() === 'customer' ? this.customerName(work) : this.isOverdue(work) ? '0' : this.isDueSoon(work) ? '1' : '2'; const result = value(first).localeCompare(value(second), 'it', { numeric: true, sensitivity: 'base' }); return this.sortDirection() === 'asc' ? result : -result; });
  }
  protected hasActiveFilters(): boolean { return Boolean(this.query().trim()) || this.statusFilter() !== 'all'; }
  protected closeFilterPanel(): void { this.filtersOpen.set(false); }
  protected resetFilters(): void { this.query.set(''); this.statusFilter.set('all'); this.filtersOpen.set(false); }
  protected hasActiveSort(): boolean { return this.sortKey() !== 'date' || this.sortDirection() !== 'asc'; }
  protected toggleSort(): void { this.sortOpen.update((open) => !open); this.filtersOpen.set(false); }
  protected restoreSort(): void { this.sortKey.set('date'); this.sortDirection.set('asc'); this.sortOpen.set(false); }
  protected changeSortDirection(): void { this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc'); }
  @HostListener('document:click', ['$event']) protected closeSortOutside(event: MouseEvent): void { const target = event.target; if (this.sortOpen() && (!(target instanceof Element) || (!target.closest('.sort-panel') && !target.closest('.sort-toggle')))) this.sortOpen.set(false); }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [operations, parties, products, services] = await Promise.all([this.operationService.list('all'), this.clientService.list(), this.productService.list(), this.serviceService.list()]);
      this.works.set(operations.filter((operation) => operation.workStatus === 'requested' || operation.workStatus === 'in-progress'));
      this.parties.set(parties); this.products.set(products); this.services.set(services);
    } finally { this.loading.set(false); }
  }

  private today(): string { return new Date().toISOString().slice(0, 10); }
}