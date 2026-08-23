import type { EntityId } from '../shared/types';
import type { Bundle } from '../models/bundle';
import type { BundleConfiguration } from './repository-types';

export interface IBundleRepository {
  getById(id: EntityId): Promise<Bundle | null>;
  list(): Promise<readonly Bundle[]>;
  save(bundle: Bundle): Promise<void>;
  resolveConfiguration(id: EntityId): Promise<BundleConfiguration>;
}
