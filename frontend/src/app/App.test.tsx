import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('affiche le titre de niveau 1 « Exam Simulator »', () => {
    render(<App />)

    const title = screen.getByRole('heading', { level: 1 })

    expect(title).toHaveTextContent('Exam Simulator')
  })

  it('affiche la phrase d’accroche', () => {
    render(<App />)

    expect(
      screen.getByText('Révisez vos examens, sur mobile et sur ordinateur.'),
    ).toBeInTheDocument()
  })
})
