import type { RouteObject } from 'react-router'
import SubjectPage from '../features/subjects/SubjectPage.tsx'
import SubjectsPage from '../features/subjects/SubjectsPage.tsx'

export const routes: RouteObject[] = [
  { path: '/', element: <SubjectsPage /> },
  { path: '/subjects/:subjectId', element: <SubjectPage /> },
]
