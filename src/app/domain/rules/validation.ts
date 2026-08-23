export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssue<TCode extends string = string> {
  readonly severity: ValidationSeverity;
  readonly code: TCode;
  readonly message: string;
  readonly fields?: readonly string[];
  readonly relatedEntityIds?: readonly string[];
}
