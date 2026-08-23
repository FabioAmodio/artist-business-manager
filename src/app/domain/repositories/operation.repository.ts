import type { Operation } from '../models/operation';
import type {
  OperationCompletionPatch,
  OperationFilter,
  OperationTransition,
} from './repository-types';
import type { EntityId } from '../shared/types';

export interface IOperationRepository {
  getById(id: EntityId): Promise<Operation | null>;
  list(filter?: OperationFilter): Promise<readonly Operation[]>;
  save(operation: Operation): Promise<void>;
  transition(id: EntityId, transition: OperationTransition): Promise<Operation>;
  markComplete(id: EntityId, patch: OperationCompletionPatch): Promise<Operation>;
  softDelete(id: EntityId, reason?: string): Promise<void>;
}
