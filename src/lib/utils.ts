import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MIN_BOOKING_LEAD_HOURS } from '@/lib/cleaning-pricing'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date/Time Utilities (KST) ───────────────────────────────────────────────

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 한국 시간 기준 현재 Date */
export function nowKST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
}

/** 오늘 날짜 YYYY-MM-DD (KST) */
export function getToday(): string {
  const d = nowKST()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 내일 날짜 YYYY-MM-DD (KST) */
export function getTomorrow(): string {
  const d = nowKST()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "4월 15일 (화)" */
export function formatDateLabel(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(isoDate).getDay()]
  return `${m}월 ${d}일 (${weekday})`
}

/** "오전 11:00" / "오후 2:30" */
export function formatTimeKorean(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr, 10)
  const period = h < 12 ? '오전' : '오후'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${period} ${displayH}:${mStr}`
}

// ─── Time Slots ──────────────────────────────────────────────────────────────

/** All 30-min slots from 09:00 to 22:00 */
export const ALL_TIME_SLOTS: string[] = (() => {
  const slots: string[] = []
  for (let h = 9; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 22) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})()

/** Minimum bookable time as "HH:MM" string, or undefined if date is not today */
export function getMinTime(selectedDate: string): string | undefined {
  if (selectedDate !== getToday()) return undefined
  const now = nowKST()
  now.setHours(now.getHours() + MIN_BOOKING_LEAD_HOURS)
  const m = now.getMinutes()
  if (m === 0) {
    // exact hour
  } else if (m <= 30) {
    now.setMinutes(30)
    now.setSeconds(0)
  } else {
    now.setHours(now.getHours() + 1)
    now.setMinutes(0)
    now.setSeconds(0)
  }
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function getAvailableTimeSlots(selectedDate: string): string[] {
  const minTime = getMinTime(selectedDate)
  if (!minTime) return ALL_TIME_SLOTS
  return ALL_TIME_SLOTS.filter((t) => t >= minTime)
}

export function getDefaultTime(selectedDate: string): string {
  const minTime = getMinTime(selectedDate)
  if (!minTime) return '11:00'
  return minTime > '11:00' ? minTime : '11:00'
}

// ─── Phone Formatting ────────────────────────────────────────────────────────

// ─── Cleaning plan helpers ───────────────────────────────────────────────────

/** 청구월(KST) 시작/다음 달 시작 시점 (UTC Date) */
export function getKstMonthBoundsUtc(now: Date = new Date()): { start: Date; end: Date } {
  const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const year = kstNow.getFullYear()
  const month = kstNow.getMonth()
  const start = new Date(Date.UTC(year, month, 1, -9, 0, 0, 0))
  const end = new Date(Date.UTC(year, month + 1, 1, -9, 0, 0, 0))
  return { start, end }
}

/** 특정 숙소의 이번 청구월 결제완료(미취소) 청소 건수 */
export function countPaidCleaningsThisMonth(
  cleanings: Array<{ propertyId: string; paidAt: string | null; status: string }>,
  propertyId: string,
  now: Date = new Date(),
): number {
  const { start, end } = getKstMonthBoundsUtc(now)
  const startMs = start.getTime()
  const endMs = end.getTime()
  return cleanings.filter((cleaning) => {
    if (cleaning.propertyId !== propertyId) return false
    if (cleaning.status === 'cancelled') return false
    if (!cleaning.paidAt) return false
    const paidMs = new Date(cleaning.paidAt).getTime()
    return paidMs >= startMs && paidMs < endMs
  }).length
}

/** "+821012345678" → "010-1234-5678" (한국식 표기) */
export function formatKoreanPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('82') ? `0${digits.slice(2)}` : digits
  if (local.length < 4) return local
  if (local.length < 8) return `${local.slice(0, 3)}-${local.slice(3)}`
  if (local.length === 10) return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`
  return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7, 11)}`
}
