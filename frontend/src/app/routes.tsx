import type { RouteObject } from 'react-router'
import SubjectsPage from '../features/subjects/SubjectsPage.tsx'

export const routes: RouteObject[] = [{ path: '/', element: <SubjectsPage /> }]
