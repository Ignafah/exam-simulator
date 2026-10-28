import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors.ts'
import { getSubjects } from './subjects.ts'

const validBody = {
  items: [
    {
      id: '3f2b8c1e-5d4a-4b7e-9c1a-2e6f8a9b0c1d',
      name: 'Sujet de test',
      categoryName: 'Catégorie de test',
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 1,
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Une ApiError était attendue')
}

describe('getSubjects', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retourne les données validées pour une réponse 200 valide', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validBody))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSubjects({ page: 1, pageSize: 20 })

    expect(result).toEqual(validBody)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/v1/subjects?page=1&pageSize=20')
  })

  it('lève une ApiError « invalid-response » si un champ est manquant', async () => {
    const incomplete = { items: validBody.items, page: 1, pageSize: 20 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(incomplete)))

    const error = await catchApiError(getSubjects({ page: 1, pageSize: 20 }))

    expect(error.kind).toBe('invalid-response')
  })

  it('lève une ApiError « invalid-response » si le corps n’est pas du JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })))

    const error = await catchApiError(getSubjects({ page: 1, pageSize: 20 }))

    expect(error.kind).toBe('invalid-response')
  })

  it('lève une ApiError « http » avec le statut pour une réponse 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ title: 'Erreur' }, 500)))

    const error = await catchApiError(getSubjects({ page: 1, pageSize: 20 }))

    expect(error.kind).toBe('http')
    expect(error.status).toBe(500)
  })

  it('lève une ApiError « network » si le réseau est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await catchApiError(getSubjects({ page: 1, pageSize: 20 }))

    expect(error.kind).toBe('network')
  })
})
