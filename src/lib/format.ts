import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

const LOCALE = 'en-IN'

/** Indian Rupee, no decimals: lab pricing is always whole rupees. */
export const currency = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const compactNumber = new Intl.NumberFormat(LOCALE, { notation: 'compact' })
const plainNumber = new Intl.NumberFormat(LOCALE)

export const formatCurrency = (value: number) => currency.format(value)
export const formatNumber = (value: number) => plainNumber.format(value)
export const formatCompact = (value: number) => compactNumber.format(value)

export function formatPercent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`
}

function toDate(value: string | Date): Date | null {
  const date = typeof value === 'string' ? parseISO(value) : value
  return isValid(date) ? date : null
}

/** 14 Mar 2026 */
export function formatDate(value: string | Date) {
  const date = toDate(value)
  return date ? format(date, 'dd MMM yyyy') : '-'
}

/** 14 Mar 2026, 09:42 */
export function formatDateTime(value: string | Date) {
  const date = toDate(value)
  return date ? format(date, 'dd MMM yyyy, HH:mm') : '-'
}

/** 09:42 */
export function formatTime(value: string | Date) {
  const date = toDate(value)
  return date ? format(date, 'HH:mm') : '-'
}

/** "3h ago": always paired with an absolute date in a title attribute. */
export function formatRelative(value: string | Date) {
  const date = toDate(value)
  return date ? `${formatDistanceToNowStrict(date)} ago` : '-'
}

/** Turnaround time in minutes to a human string: 45m, 6h, 2d 4h */
export function formatTurnaround(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    const rem = minutes % 60
    return rem ? `${hours}h ${rem}m` : `${hours}h`
  }
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours ? `${days}d ${remHours}h` : `${days}d`
}

/** 34 y · 8 m for infants, whole years otherwise. */
export function formatAge(dateOfBirth: string | Date) {
  const dob = toDate(dateOfBirth)
  if (!dob) return '-'
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  if (now.getDate() < dob.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years < 2) return `${years * 12 + months} mo`
  return `${years} y`
}

/** KM, SR: used by the avatar fallback. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
