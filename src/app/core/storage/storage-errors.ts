export type StorageErrorCode =
  | 'unavailable'
  | 'quota-exceeded'
  | 'schema-incompatible'
  | 'transaction-failed';

export class StorageError extends Error {
  constructor(
    readonly code: StorageErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'StorageError';
  }
}
