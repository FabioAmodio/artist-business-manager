import { TestBed } from '@angular/core/testing';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Party } from '../../domain/models/party';
import { SupplierRepository } from './supplier.repository';

const parties: readonly Party[] = [
  { id: 'client', type: 'person', displayName: 'Cliente', roles: ['customer'], email: '', createdAt: '', updatedAt: '' },
  { id: 'zeta', type: 'organization', displayName: 'Zeta Print', roles: ['supplier'], supplierType: 'printer', email: '', createdAt: '', updatedAt: '' },
  { id: 'alfa', type: 'organization', displayName: 'Alfa Market', roles: ['supplier'], supplierType: 'marketplace', email: 'hello@alfa.test', createdAt: '', updatedAt: '' },
  { id: 'deleted', type: 'organization', displayName: 'Deleted', roles: ['supplier'], supplierType: 'other', email: '', createdAt: '', updatedAt: '', deletedAt: '2026-01-01T00:00:00.000Z' },
];

describe('SupplierRepository', () => {
  it('searches active supplier parties and sorts them by display name', async () => {
    TestBed.configureTestingModule({
      providers: [
        SupplierRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => parties } },
      ],
    });

    const result = await TestBed.inject(SupplierRepository).search('');

    expect(result.map((party) => party.id)).toEqual(['alfa', 'zeta']);
  });
});