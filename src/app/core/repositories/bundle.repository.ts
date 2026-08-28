import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Bundle } from '../../domain/models/bundle';
import type { IBundleRepository } from '../../domain/repositories/bundle.repository';
import type { BundleConfiguration } from '../../domain/repositories/repository-types';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'bundles';

@Injectable({ providedIn: 'root' })
export class BundleRepository implements IBundleRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Bundle | null> {
    const bundle = await this.storage.get<Bundle>(COLLECTION, id);
    return bundle?.deletedAt ? null : bundle;
  }

  async list(filter?: { readonly text?: string; readonly includeDeleted?: boolean }): Promise<readonly Bundle[]> {
    const query = filter?.text?.trim().toLowerCase() ?? '';
    const bundles = await this.storage.list<Bundle>(COLLECTION);
    return bundles
      .filter((bundle) => filter?.includeDeleted || !bundle.deletedAt)
      .filter((bundle) => !query || `${bundle.name} ${bundle.description ?? ''}`.toLowerCase().includes(query))
      .sort((first, second) => first.name.localeCompare(second.name));
  }

  async save(bundle: Bundle): Promise<void> {
    await this.storage.put(COLLECTION, bundle);
  }

  async softDelete(id: string): Promise<void> {
    await this.storage.deleteLogical(COLLECTION, id);
  }

  async resolveConfiguration(id: string): Promise<BundleConfiguration> {
    return { bundleId: id };
  }
}
