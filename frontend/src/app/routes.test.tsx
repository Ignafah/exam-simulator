import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from './queryClient.ts'
import { routes } from './routes.tsx'

describe('routeur de l’application', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('affiche la page des sujets sur la route /', async () => {
    const body = { items: [], page: 1, pageSize: 20, totalCount: 0 }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })

    render(
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exam Simulator')
    expect(await screen.findByText('Aucun sujet disponible')).toBeInTheDocument()
  })
})
