import './SubjectsPage.css'
import SubjectCard from './SubjectCard.tsx'
import { useSubjects } from './useSubjects.ts'

export default function SubjectsPage() {
  const { data, isPending, isError, refetch } = useSubjects()

  return (
    <main className="subjects-page">
      <h1>Exam Simulator</h1>
      <p>Révisez vos examens, sur mobile et sur ordinateur.</p>

      {isPending && <p role="status">Chargement des sujets…</p>}

      {isError && (
        <div role="alert" className="subjects-page__error">
          <p>Impossible de charger les sujets.</p>
          <button type="button" onClick={() => void refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {data && data.items.length === 0 && <p>Aucun sujet disponible</p>}

      {data && data.items.length > 0 && (
        <ul className="subjects-page__list">
          {data.items.map((subject) => (
            <SubjectCard key={subject.id} name={subject.name} categoryName={subject.categoryName} />
          ))}
        </ul>
      )}
    </main>
  )
}
