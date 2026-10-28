import { z } from 'zod'
import { apiGet } from './client.ts'
import type { components } from './schema'

const subjectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryName: z.string(),
})

const subjectsPageSchema = z.object({
  items: z.array(subjectSummarySchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalCount: z.number().int(),
})

// Le type exposé est celui du schéma Zod ; l'affectation ci-dessous échoue à la compilation
// s'il cesse d'être compatible avec le type généré depuis l'OpenAPI.
export type SubjectsPage = z.infer<typeof subjectsPageSchema>
type GeneratedSubjectsPage = components['schemas']['PagedResultOfSubjectSummaryDto']
export const assertCompatible = (page: SubjectsPage): GeneratedSubjectsPage => page

export function getSubjects(
  params: { page: number; pageSize: number },
  signal?: AbortSignal,
): Promise<SubjectsPage> {
  return apiGet('/api/v1/subjects', params, subjectsPageSchema, signal)
}
