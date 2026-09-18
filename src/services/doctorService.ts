import type { Doctor } from '@/types'
import { request } from './http'

export const getDoctors = () => request<Doctor[]>('GET', '/doctors')
