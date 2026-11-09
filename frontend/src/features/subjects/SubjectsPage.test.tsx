import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SubjectsPage from './SubjectsPage.tsx'

function subject(id: string, name: string, categoryName: string) {
  return { id, name, categoryName }
}

function pageBody(items: unknown[], totalCount = items.length) {
  return { items, page: 1, pageSize: 20, totalCount }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SubjectsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('affiche chaque sujet avec son nom et sa catégorie, dans l’ordre reçu', async () => {
    const body = pageBody([
      subject('1', 'Zèbre', 'Tech'),
      subject('2', 'Alpha', 'Concours public'),
    ])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body)))

    renderPage()

    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Zèbre')
    expect(items[0]).toHaveTextContent('Tech')
    expect(items[1]).toHaveTextContent('Alpha')
    expect(items[1]).toHaveTextContent('Concours public')
  })

  it('affiche un indicateur de chargement pendant la requête', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Chargement')
  })

  it('affiche « Aucun sujet disponible » pour une liste vide', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(pageBody([]))))

    renderPage()

    expect(await screen.findByText('Aucun sujet disponible')).toBeInTheDocument()
  })

  it('affiche une erreur et « Réessayer » si l’API répond 500, et un clic relance l’appel', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ title: 'Erreur' }, 500))
      .mockResolvedValueOnce(jsonResponse(pageBody([subject('1', 'Alpha', 'Tech')])))
    vi.stubGlobal('fetch', fetchMock)

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))

    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('affiche une erreur si l’API est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })

  it('affiche une erreur sans planter si la réponse est invalide', async () => {
    const invalid = { items: [{ id: '1', name: 'Alpha' }], page: 1, pageSize: 20, totalCount: 1 }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(invalid)))

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })

  it('n’affiche que la première page, sans pagination ni « Voir plus »', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(pageBody([subject('1', 'Alpha', 'Tech')], 45)))
    vi.stubGlobal('fetch', fetchMock)

    renderPage()

    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/subjects/1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('page=1')
  })

  it('affiche chaque sujet comme un lien accessible vers sa page', async () => {
    const body = pageBody([
      subject('11111111-1111-1111-1111-111111111111', 'AZ-204', 'Tech'),
      subject('22222222-2222-2222-2222-222222222222', 'Attaché territorial', 'Concours public'),
    ])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body)))

    renderPage()

    const links = await screen.findAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAccessibleName(/AZ-204/)
    expect(links[0]).toHaveAttribute('href', '/subjects/11111111-1111-1111-1111-111111111111')
    expect(links[1]).toHaveAttribute('href', '/subjects/22222222-2222-2222-2222-222222222222')
  })

  it('n’affiche aucun lien de sujet si l’API répond 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ title: 'Erreur' }, 500)))

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
