export type LErrorCode =
  // Database
  | 'DB/NOT_FOUND'
  | 'DB/CONSTRAINT'
  | 'DB/DUPLICATE'
  | 'DB/TIMEOUT'

  // Validation
  | 'VALIDATION/FIELD'
  | 'VALIDATION/REQUIRED'
  | 'VALIDATION/TYPE'

  // Driver
  | 'DRIVER/CONNECTION'
  | 'DRIVER/UNSUPPORTED'
  | 'DRIVER/UNKNOWN'

  // Operation
  | 'OP/PARTIAL_FAILURE'
  | 'OP/FORBIDDEN'
  | 'OP/INVALID';

export interface PartialFailureMeta {
  failed: { id: unknown; error: LError }[];
  succeeded: { id: unknown }[];
}

export interface LErrorOptions {
  code: LErrorCode;
  message: string;
  field?: string;
  meta?: unknown | PartialFailureMeta;
  cause?: unknown;
}

export class LError extends Error {
  readonly code: LErrorCode;
  readonly field?: string;
  readonly meta?: unknown | PartialFailureMeta;

  constructor(options: LErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'LError';
    this.code = options.code;
    this.field = options.field;
    this.meta = options.meta;

    // Restore prototype chain for instanceof checks when transpiled
    Object.setPrototypeOf(this, LError.prototype);
  }
}

export function isLError(err: unknown): err is LError {
  return err instanceof LError;
}

export function createLError(options: LErrorOptions): LError {
  return new LError(options);
}
