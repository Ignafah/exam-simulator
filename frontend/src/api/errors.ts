export type ApiErrorKind = 'http' | 'network' | 'invalid-response'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined

  constructor(kind: ApiErrorKind, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = options?.status
  }
}
