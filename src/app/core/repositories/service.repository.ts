import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Service } from '../../domain/models/service';
import type { IServiceRepository } from '../../domain/repositories/service.repository';
import type { ServiceFilter } from '../../domain/repositories/repository-types';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'services';

@Injectable({ providedIn: 'root' })
export class ServiceRepository implements IServiceRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Service | null> {
    const service = await this.storage.get<Service>(COLLECTION, id);
    return service?.deletedAt ? null : service;
  }

  async list(filter?: ServiceFilter): Promise<readonly Service[]> {
    const query = filter?.text?.trim().toLowerCase() ?? '';
    const services = await this.storage.list<Service>(COLLECTION);
    return services.filter((service) => filter?.includeDeleted || !service.deletedAt)
      .filter((service) => !query || `${service.code} ${service.description}`.toLowerCase().includes(query))
      .sort((first, second) => first.description.localeCompare(second.description));
  }

  save(service: Service): Promise<void> { return this.storage.put(COLLECTION, service); }
  softDelete(id: string): Promise<void> { return this.storage.deleteLogical(COLLECTION, id); }
}