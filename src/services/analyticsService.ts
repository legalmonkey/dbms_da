import type { WorkspaceSummary } from '@/types'
import { request } from './http'

/** Lab-wide operational counts that power the four role workspaces. */
export const getWorkspaceSummary = () => request<WorkspaceSummary>('GET', '/analytics/summary')
