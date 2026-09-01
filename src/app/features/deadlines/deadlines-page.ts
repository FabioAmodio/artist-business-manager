import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
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

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [operations, parties, products, services] = await Promise.all([this.operationService.list('all'), this.clientService.list(), this.productService.list(), this.serviceService.list()]);
      this.works.set(operations.filter((operation) => operation.workStatus === 'requested' || operation.workStatus === 'in-progress').sort((first, second) => (first.deliveryDate ?? '9999-12-31').localeCompare(second.deliveryDate ?? '9999-12-31')));
      this.parties.set(parties); this.products.set(products); this.services.set(services);
    } finally { this.loading.set(false); }
  }

  private today(): string { return new Date().toISOString().slice(0, 10); }
}