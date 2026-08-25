import { TestBed } from '@angular/core/testing';
import { ClientRepository } from '../../core/repositories/client.repository';
import type { Party } from '../../domain/models/party';
import { ClientService } from './client.service';

function createRepositoryMock() {
  const clients = new Map<string, Party>();
  return {
    clients,
    getById: async (id: string) => clients.get(id) ?? null,
    search: async (query = '') => [...clients.values()].filter((client) => client.displayName.toLowerCase().includes(query.toLowerCase())),
    save: async (client: Party) => { clients.set(client.id, client); },
    softDelete: async (id: string) => {
      const client = clients.get(id);
      if (client) clients.set(id, { ...client, deletedAt: new Date().toISOString() });
    },
  };
}

describe('ClientService', () => {
  it('creates and updates a client without changing identity', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [ClientService, { provide: ClientRepository, useValue: repository }] });
    const service = TestBed.inject(ClientService);

    const created = await service.create({ type: 'person', displayName: 'Marco Rossi', email: 'marco@example.test', phone: '', website: '', social: '', notes: '' });
    const updated = await service.update(created.id, { ...created, displayName: 'Marco R.' });

    expect(updated.id).toBe(created.id);
    expect(updated.displayName).toBe('Marco R.');
    expect(updated.roles).toContain('customer');
    expect(repository.clients.size).toBe(1);
  });

  it('rejects empty names and delegates logical deletion', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [ClientService, { provide: ClientRepository, useValue: repository }] });
    const service = TestBed.inject(ClientService);

    await expect(service.create({ type: 'organization', displayName: ' ', email: '', phone: '', website: '', social: '', notes: '' })).rejects.toThrow();
    const created = await service.create({ type: 'organization', displayName: 'Studio Blu', email: '', phone: '', website: '', social: '', notes: '' });
    await service.delete(created.id);

    expect(repository.clients.get(created.id)?.deletedAt).toBeDefined();
  });
});
