export type LErrorCode =
  | 'DB/NOT_FOUND'
  | 'DB/CONSTRAINT'
  | 'DB/DUPLICATE'
  | 'DB/TIMEOUT'
  | 'VALIDATION/FIELD'
  | 'VALIDATION/REQUIRED'
  | 'VALIDATION/TYPE'
  | 'DRIVER/CONNECTION'
  | 'DRIVER/UNSUPPORTED'
  | 'DRIVER/UNKNOWN'
  | 'OP/PARTIAL_FAILURE'
  | 'OP/FORBIDDEN'
  | 'OP/INVALID'

export type LError = {
  code:    LErrorCode
  message: string
  field?:  string
  meta?:   unknown
         | {
             failed:    { id: unknown; error: LError }[]
             succeeded: { id: unknown }[]
           }
}