import { TestBed } from '@angular/core/testing';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Party } from '../../domain/models/party';
import { ClientRepository } from './client.repository';

const parties: readonly Party[] = [
  { id: 'zeta', type: 'person', displayName: 'Zeta', email: '', createdAt: '', updatedAt: '' },
  { id: 'alfa', type: 'organization', displayName: 'Alfa Studio', email: 'hello@alfa.test', createdAt: '', updatedAt: '' },
  { id: 'supplier', type: 'organization', displayName: 'Print Lab', roles: ['supplier'], email: '', createdAt: '', updatedAt: '' },
  { id: 'deleted', type: 'person', displayName: 'Deleted', email: '', createdAt: '', updatedAt: '', deletedAt: '2026-01-01T00:00:00.000Z' },
];

describe('ClientRepository', () => {
  it('searches active parties and sorts them by display name', async () => {
    TestBed.configureTestingModule({
      providers: [
        ClientRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => parties } },
      ],
    });

    const result = await TestBed.inject(ClientRepository).search('');

    expect(result.map((party) => party.id)).toEqual(['alfa', 'zeta']);
  });
});
