import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from './queryClient.ts'
import { routes } from './routes.tsx'

const AZ_ID = '11111111-1111-1111-1111-111111111111'
const BACK_LINK = "Retour à l'accueil"

function pageResponse(items: unknown[]): Response {
  const body = { items, page: 1, pageSize: 20, totalCount: items.length }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubSubjects(items: unknown[]) {
  const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(pageResponse(items)))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('routeur de l’application', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('affiche la page des sujets sur la route /', async () => {
    stubSubjects([])

    renderAt('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exam Simulator')
    expect(await screen.findByText('Aucun sujet disponible')).toBeInTheDocument()
  })

  it('navigue vers la page du sujet au clic sur une carte', async () => {
    stubSubjects([{ id: AZ_ID, name: 'AZ-204', categoryName: 'Tech' }])
    const router = renderAt('/')

    fireEvent.click(await screen.findByRole('link', { name: /AZ-204/ }))

    expect(router.state.location.pathname).toBe(`/subjects/${AZ_ID}`)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sujet')
  })

  it('affiche la page du sujet sans appel réseau, avec un lien de retour', () => {
    const fetchMock = stubSubjects([])

    renderAt(`/subjects/${AZ_ID}`)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sujet')
    expect(screen.getByRole('link', { name: BACK_LINK })).toHaveAttribute('href', '/')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('revient à l’accueil via le lien de retour', async () => {
    stubSubjects([{ id: AZ_ID, name: 'AZ-204', categoryName: 'Tech' }])
    const router = renderAt(`/subjects/${AZ_ID}`)

    fireEvent.click(screen.getByRole('link', { name: BACK_LINK }))

    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exam Simulator')
    expect(await screen.findByText('AZ-204')).toBeInTheDocument()
  })

  it('affiche la même page vide pour un identifiant quelconque', () => {
    stubSubjects([])

    renderAt('/subjects/pas-un-guid')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sujet')
    expect(screen.getByRole('link', { name: BACK_LINK })).toBeInTheDocument()
  })
})
