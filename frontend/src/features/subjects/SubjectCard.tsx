type SubjectCardProps = {
  name: string
  categoryName: string
}

export default function SubjectCard({ name, categoryName }: SubjectCardProps) {
  return (
    <li className="subject-card">
      <h2 className="subject-card__name">{name}</h2>
      <p className="subject-card__category">{categoryName}</p>
    </li>
  )
}
