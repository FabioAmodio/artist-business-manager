import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../core/repositories/supplier.repository';
import type { Party, PartyRole, SupplierType } from '../../domain/models/party';

export type SupplierInput = Pick<Party, 'displayName' | 'email' | 'phone' | 'website' | 'notes'> & {
  readonly supplierType: SupplierType;
};

const SUPPLIER_ROLES: readonly PartyRole[] = ['supplier'];

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly repository = inject(SupplierRepository);

  list(query = ''): Promise<readonly Party[]> {
    return this.repository.search(query, 200);
  }

  async create(input: SupplierInput): Promise<Party> {
    this.validate(input);
    const now = new Date().toISOString();
    const supplier: Party = {
      ...input,
      id: crypto.randomUUID(),
      type: 'organization',
      roles: SUPPLIER_ROLES,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(supplier);
    return supplier;
  }

  async update(id: string, input: SupplierInput): Promise<Party> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Fornitore non trovato.');
    const supplier: Party = { ...existing, ...input, roles: this.withSupplierRole(existing.roles), updatedAt: new Date().toISOString() };
    await this.repository.save(supplier);
    return supplier;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: SupplierInput): void {
    if (!input.displayName.trim()) throw new Error('Il nome e obbligatorio.');
  }

  private withSupplierRole(roles: readonly PartyRole[] | undefined): readonly PartyRole[] {
    return roles?.includes('supplier') ? roles : [...(roles ?? []), 'supplier'];
  }
}