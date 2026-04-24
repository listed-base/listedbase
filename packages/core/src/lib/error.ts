type LErrorCode =
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
  | 'OP/FORBIDDEN'
  | 'OP/INVALID'

  type LError = {
    code: LErrorCode,
    message: string,
    field?: string,    // VALIDATION/* فقط
    meta?: unknown,    // driver-specific
  }