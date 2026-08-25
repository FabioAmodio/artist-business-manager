import { TestBed } from '@angular/core/testing';
import { SupplierRepository } from '../../core/repositories/supplier.repository';
import type { Party } from '../../domain/models/party';
import { SupplierService } from './supplier.service';

function createRepositoryMock() {
  const suppliers = new Map<string, Party>();
  return {
    suppliers,
    getById: async (id: string) => suppliers.get(id) ?? null,
    search: async (query = '') => [...suppliers.values()].filter((supplier) => supplier.displayName.toLowerCase().includes(query.toLowerCase())),
    save: async (supplier: Party) => { suppliers.set(supplier.id, supplier); },
    softDelete: async (id: string) => {
      const supplier = suppliers.get(id);
      if (supplier) suppliers.set(id, { ...supplier, deletedAt: new Date().toISOString() });
    },
  };
}

describe('SupplierService', () => {
  it('creates and updates a supplier without changing identity', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [SupplierService, { provide: SupplierRepository, useValue: repository }] });
    const service = TestBed.inject(SupplierService);

    const created = await service.create({ supplierType: 'printer', displayName: 'Print Lab', email: 'print@example.test', phone: '', website: '', notes: '' });
    const updated = await service.update(created.id, { ...created, supplierType: 'materials', displayName: 'Print Lab Milano' });

    expect(updated.id).toBe(created.id);
    expect(updated.displayName).toBe('Print Lab Milano');
    expect(updated.roles).toContain('supplier');
    expect(updated.supplierType).toBe('materials');
    expect(repository.suppliers.size).toBe(1);
  });

  it('rejects empty names and delegates logical deletion', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [SupplierService, { provide: SupplierRepository, useValue: repository }] });
    const service = TestBed.inject(SupplierService);

    await expect(service.create({ supplierType: 'marketplace', displayName: ' ', email: '', phone: '', website: '', notes: '' })).rejects.toThrow();
    const created = await service.create({ supplierType: 'marketplace', displayName: 'Online Store', email: '', phone: '', website: '', notes: '' });
    await service.delete(created.id);

    expect(repository.suppliers.get(created.id)?.deletedAt).toBeDefined();
  });
});