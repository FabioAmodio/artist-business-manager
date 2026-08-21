export type EntityId = string;

export type IsoDateTime = string;

export type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };
