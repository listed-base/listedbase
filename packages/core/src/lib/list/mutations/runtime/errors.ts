import { LError, LErrorCode } from '../../../error';

export function toLError(
  err: any,
  fallbackCode: LErrorCode = 'DRIVER/UNKNOWN',
  fallbackMessage = 'Operation failed'
): LError {
  if (err instanceof LError) {
    return err;
  }

  // ZodError handling
  if (err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    const firstIssue = err.issues?.[0];
    const field = firstIssue?.path?.join('.');
    return new LError({
      code: 'VALIDATION/FIELD',
      message: firstIssue?.message || err.message || 'Validation failed',
      field,
      cause: err,
    });
  }

  return new LError({
    code: fallbackCode,
    message: err?.message || fallbackMessage,
    cause: err,
  });
}
