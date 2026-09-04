import type { EntityId, IsoDateTime } from '../shared/types';

export interface Workspace {
  readonly id: EntityId;
  readonly name: string;
  readonly ownerId: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface WorkspaceMembership {
  readonly uid: EntityId;
  readonly workspaceId: EntityId;
  readonly role: WorkspaceRole;
  readonly email?: string;
  readonly displayName?: string;
  readonly inviteId?: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly disabledAt?: IsoDateTime;
}
