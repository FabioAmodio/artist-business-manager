import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Party } from '../../domain/models/party';
import type { PartyFilter } from '../../domain/repositories/repository-types';
import type { IContactRepository } from '../../domain/repositories/contact.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'parties';

@Injectable({ providedIn: 'root' })
export class ContactRepository implements IContactRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Party | null> {
    const party = await this.storage.get<Party>(COLLECTION, id);
    return party?.deletedAt ? null : party ? this.normalizeRoles(party) : null;
  }

  async list(filter?: PartyFilter): Promise<readonly Party[]> {
    const normalized = filter?.text?.trim().toLowerCase();
    const parties = (await this.storage.list<Party>(COLLECTION)).map((party) => this.normalizeRoles(party));
    return parties
      .filter((party) => filter?.includeDeleted || !party.deletedAt)
      .filter((party) => !filter?.role || party.roles?.includes(filter.role))
      .filter((party) => !normalized || this.searchableText(party).includes(normalized))
      .sort((first, second) => first.displayName.localeCompare(second.displayName, 'it', { sensitivity: 'base' }));
  }

  save(party: Party): Promise<void> {
    return this.storage.put(COLLECTION, party);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }

  private searchableText(party: Party): string {
    const extra = (party.contacts ?? []).map((contact) => contact.value).join(' ');
    return `${party.displayName} ${party.email ?? ''} ${party.phone ?? ''} ${party.website ?? ''} ${party.social ?? ''} ${party.supplierType ?? ''} ${extra}`.toLowerCase();
  }

  /** 'commissioner' e stato unificato in 'customer': normalizza i record legacy non ancora risalvati con il nuovo ruolo. */
  private normalizeRoles(party: Party): Party {
    if (!party.roles?.some((role) => (role as string) === 'commissioner')) return party;
    const roles = Array.from(new Set(party.roles.map((role) => (role as string) === 'commissioner' ? 'customer' : role)));
    return { ...party, roles: roles as Party['roles'] };
  }
}
