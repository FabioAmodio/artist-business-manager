import { Injectable, inject } from '@angular/core';
import { ContactRepository } from '../../core/repositories/contact.repository';
import type { Party, PartyRole } from '../../domain/models/party';
import type { PartyFilter } from '../../domain/repositories/repository-types';

export type ContactInput = Pick<Party, 'type' | 'displayName' | 'roles' | 'supplierType' | 'email' | 'phone' | 'website' | 'social' | 'contacts' | 'notes'>;

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly repository = inject(ContactRepository);

  list(filter?: PartyFilter): Promise<readonly Party[]> {
    return this.repository.list(filter);
  }

  async create(input: ContactInput): Promise<Party> {
    this.validate(input);
    const now = new Date().toISOString();
    const party: Party = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await this.repository.save(party);
    return party;
  }

  async update(id: string, input: ContactInput): Promise<Party> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Contatto non trovato.');
    const party: Party = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(party);
    return party;
  }

  /** Aggiunge il ruolo al contatto se mancante (es. venditA/lavorazione a un contatto non ancora cliente): non tocca gli altri campi. */
  async ensureRole(id: string, role: PartyRole): Promise<Party> {
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Contatto non trovato.');
    if (existing.roles?.includes(role)) return existing;
    const party: Party = { ...existing, roles: [...(existing.roles ?? []), role], updatedAt: new Date().toISOString() };
    await this.repository.save(party);
    return party;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: ContactInput): void {
    if (!input.displayName.trim()) throw new Error('Il nome e obbligatorio.');
    if (input.roles?.includes('supplier') && !input.supplierType) throw new Error('Indica la tipologia di fornitore.');
  }
}
