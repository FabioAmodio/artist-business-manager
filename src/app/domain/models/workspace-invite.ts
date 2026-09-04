import type { EntityId, IsoDateTime } from '../shared/types';
import type { WorkspaceRole } from './workspace';

export type WorkspaceInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface WorkspaceInvite {
  readonly id: EntityId;
  readonly workspaceId: EntityId;
  readonly email: string;
  readonly role: Exclude<WorkspaceRole, 'owner'>;
  readonly status: WorkspaceInviteStatus;
  readonly createdBy: EntityId;
  readonly createdAt: IsoDateTime;
  readonly expiresAt: IsoDateTime;
  readonly acceptedBy?: EntityId;
  readonly acceptedAt?: IsoDateTime;
}
