import type { ZodType } from 'zod'
import { ApiError } from './errors.ts'

const baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiGet<T>(
  path: string,
  query: Record<string, string | number>,
  schema: ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    params.set(key, String(value))
  }
  const url = `${baseUrl.replace(/\/$/, '')}${path}?${params.toString()}`

  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  } catch (cause) {
    throw new ApiError('network', 'API injoignable', { cause })
  }

  if (!response.ok) {
    throw new ApiError('http', `Réponse HTTP ${response.status}`, { status: response.status })
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (cause) {
    throw new ApiError('invalid-response', 'Réponse non JSON', { status: response.status, cause })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError('invalid-response', 'Réponse inattendue de l’API', {
      status: response.status,
      cause: parsed.error,
    })
  }
  return parsed.data
}
