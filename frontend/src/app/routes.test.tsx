import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { createQueryClient } from './queryClient.ts'
import { routes } from './routes.tsx'

describe('routeur de l’application', () => {
  it('affiche la page d’accueil sur la route /', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })

    render(
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exam Simulator')
  })
})
