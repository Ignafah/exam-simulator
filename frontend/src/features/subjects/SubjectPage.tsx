import { Link } from 'react-router'
import './SubjectPage.css'

export default function SubjectPage() {
  return (
    <main className="subject-page">
      <h1>Sujet</h1>
      <Link className="subject-page__back" to="/">
        Retour à l'accueil
      </Link>
    </main>
  )
}
