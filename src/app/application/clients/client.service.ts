import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '../../core/repositories/client.repository';
import type { Party, PartyRole } from '../../domain/models/party';

export type ClientInput = Pick<Party, 'type' | 'displayName' | 'email' | 'phone' | 'website' | 'social' | 'notes'>;
const CLIENT_ROLES: readonly PartyRole[] = ['customer'];

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly repository = inject(ClientRepository);

  list(query = ''): Promise<readonly Party[]> {
    return this.repository.search(query, 200);
  }

  async create(input: ClientInput): Promise<Party> {
    this.validate(input);
    const now = new Date().toISOString();
    const client: Party = {
      ...input,
      id: crypto.randomUUID(),
      roles: CLIENT_ROLES,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(client);
    return client;
  }

  async update(id: string, input: ClientInput): Promise<Party> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Cliente non trovato.');
    const client: Party = { ...existing, ...input, roles: this.withClientRole(existing.roles), updatedAt: new Date().toISOString() };
    await this.repository.save(client);
    return client;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: ClientInput): void {
    if (!input.displayName.trim()) throw new Error('Il nome e obbligatorio.');
  }

  private withClientRole(roles: readonly PartyRole[] | undefined): readonly PartyRole[] {
    return roles?.includes('customer') ? roles : [...(roles ?? []), 'customer'];
  }
}
