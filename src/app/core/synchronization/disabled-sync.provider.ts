export interface ISyncProvider {
  readonly enabled: boolean;
}

export class DisabledSyncProvider implements ISyncProvider {
  readonly enabled = false;
}
