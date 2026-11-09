import { Link } from 'react-router'

type SubjectCardProps = {
  id: string
  name: string
  categoryName: string
}

export default function SubjectCard({ id, name, categoryName }: SubjectCardProps) {
  return (
    <li className="subject-card">
      <Link className="subject-card__link" to={`/subjects/${encodeURIComponent(id)}`}>
        <h2 className="subject-card__name">{name}</h2>
        <p className="subject-card__category">{categoryName}</p>
      </Link>
    </li>
  )
}
