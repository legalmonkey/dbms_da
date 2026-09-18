import type { Test, TestCategory, TestInput } from '@/types'
import { qs, request } from './http'

export const getTests = (params: { category?: TestCategory; q?: string } = {}) =>
  request<Test[]>('GET', `/tests${qs({ ...params })}`)

export const createTest = (testData: TestInput) => request<Test>('POST', '/tests', testData)

export const updateTest = (testId: string, testData: TestInput) =>
  request<Test>('PATCH', `/tests/${testId}`, testData)

/** Refused with 409 if the test appears on any existing order. */
export const deleteTest = (testId: string) => request<{ ok: true }>('DELETE', `/tests/${testId}`)
