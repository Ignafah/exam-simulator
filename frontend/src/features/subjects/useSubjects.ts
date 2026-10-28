import { useQuery } from '@tanstack/react-query'
import { getSubjects } from '../../api/index.ts'

// Première page uniquement : la pagination est hors périmètre de la v1.
const FIRST_PAGE = { page: 1, pageSize: 20 }

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects', FIRST_PAGE],
    queryFn: ({ signal }) => getSubjects(FIRST_PAGE, signal),
  })
}
