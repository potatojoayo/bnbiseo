/** 최소 예약 리드타임 (시간) */
export const MIN_BOOKING_LEAD_HOURS = 3

/** 첫 청소 할인 금액 */
export const FIRST_CLEANING_DISCOUNT = 10000

/** 에어컨 청소 1대당 가격 */
export const AC_PRICE_PER_UNIT = 90000

/** 첫 에어컨 청소 할인 금액 */
export const AC_FIRST_CLEANING_DISCOUNT = 30000

export type CleaningServiceType = 'general' | 'ac'

export const CLEANING_SERVICE_TYPE_LABELS: Record<CleaningServiceType, string> = {
  general: '일반 청소',
  ac: '에어컨 청소',
}

export type LinenWashLocation = 'in_house' | 'external'
export type CleaningPlan = 'regular' | 'one_time'

export const LINEN_WASH_PRICING: Record<LinenWashLocation, number> = {
  in_house: 10000,
  external: 20000,
}

export const LINEN_WASH_LABELS: Record<LinenWashLocation, string> = {
  in_house: '숙소 내 세탁기/건조기 이용',
  external: '외부 코인 세탁기/건조기 이용',
}

export const CLEANING_PLAN_LABELS: Record<CleaningPlan, string> = {
  regular: '정기',
  one_time: '단건',
}

/** 청구월의 결제완료 청소 건수가 이 값 이상이면 다음 청소부터 정기가 적용 */
export const REGULAR_PLAN_THRESHOLD = 2

/** 침실당 침대 1개 무료, 초과 1개당 추가금 */
export const EXTRA_BED_PRICE = 5000

/** 당일(긴급) 할증 배율 */
export const URGENT_SURCHARGE_RATE = 1.5

const REGULAR_BASE = { even: 40000, odd: 50000 } as const
const ONE_TIME_BASE = { even: 45000, odd: 55000 } as const

/**
 * 방 수 기반 베이스 가격.
 *  - 1룸은 2룸 가격
 *  - 짝수 룸 = 2룸 × (n/2)
 *  - 홀수 룸 = 3룸 × ((n-1)/2)
 */
export function getRoomBasePrice(bedrooms: number, plan: CleaningPlan): number {
  const rooms = Math.max(bedrooms, 2)
  const isEven = rooms % 2 === 0
  const multiplier = isEven ? rooms / 2 : (rooms - 1) / 2
  const base = plan === 'regular'
    ? (isEven ? REGULAR_BASE.even : REGULAR_BASE.odd)
    : (isEven ? ONE_TIME_BASE.even : ONE_TIME_BASE.odd)
  return base * multiplier
}

/** 청구월 내 결제완료 청소 건수로 정기/단건 결정 */
export function determineCleaningPlan(paidCountThisMonth: number): CleaningPlan {
  return paidCountThisMonth >= REGULAR_PLAN_THRESHOLD ? 'regular' : 'one_time'
}

/** 에어컨 청소 가격 계산 (대수 × 90,000원, 할증 없음) */
export function calculateAcCleaningPrice(input: { acCount: number }) {
  const total = AC_PRICE_PER_UNIT * Math.max(input.acCount, 0)
  return {
    acCount: input.acCount,
    pricePerUnit: AC_PRICE_PER_UNIT,
    total,
  }
}

export function calculateCleaningPrice(input: {
  bedrooms: number
  beddings: number
  plan: CleaningPlan
  isUrgent?: boolean
  linenWash?: boolean
  linenWashLocation?: LinenWashLocation | null
}) {
  const {
    bedrooms,
    beddings,
    plan,
    isUrgent = false,
    linenWash = false,
    linenWashLocation = null,
  } = input

  const roomCharge = getRoomBasePrice(bedrooms, plan)
  const extraBeds = Math.max(beddings - bedrooms, 0)
  const extraBedCharge = extraBeds * EXTRA_BED_PRICE

  const baseSubtotal = roomCharge + extraBedCharge

  const linenWashCharge = linenWash && linenWashLocation
    ? LINEN_WASH_PRICING[linenWashLocation]
    : 0

  const subtotal = baseSubtotal + linenWashCharge

  const urgentSurcharge = isUrgent
    ? Math.round(baseSubtotal * (URGENT_SURCHARGE_RATE - 1))
    : 0

  const total = Math.ceil((subtotal + urgentSurcharge) / 1000) * 1000

  return {
    plan,
    isUrgent,
    roomCharge,
    extraBeds,
    extraBedCharge,
    baseSubtotal,
    subtotal,
    urgentSurcharge,
    linenWashCharge,
    total,
  }
}
