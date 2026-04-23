/** 최소 예약 리드타임 (시간) */
export const MIN_BOOKING_LEAD_HOURS = 3

/** 첫 청소 할인 금액 */
export const FIRST_CLEANING_DISCOUNT = 10000

export type LinenWashLocation = 'in_house' | 'external'

export const LINEN_WASH_PRICING: Record<LinenWashLocation, number> = {
  in_house: 10000,
  external: 20000,
}

export const LINEN_WASH_LABELS: Record<LinenWashLocation, string> = {
  in_house: '숙소 내 세탁기/건조기 이용',
  external: '외부 코인 세탁기/건조기 이용',
}

export const CLEANING_PRICING = {
  areaTiers: [
    { min: 1, max: 10, pricePerPyeong: 2500 },
    { min: 11, max: 20, pricePerPyeong: 2200 },
    { min: 21, max: 33, pricePerPyeong: 2000 },
    { min: 34, max: 50, pricePerPyeong: 1800 },
    { min: 51, max: Infinity, pricePerPyeong: 1600 },
  ],
  perBedroom: 8000,
  perBathroom: 10000,
  minimumCharge: 35000,
  urgentSurchargeRate: 1.5,
} as const

export function calculateCleaningPrice(input: {
  pyeong: number
  livingRooms: number
  bedrooms: number
  bathrooms: number
  isUrgent?: boolean
  linenWash?: boolean
  linenWashLocation?: LinenWashLocation | null
}) {
  const {
    pyeong,
    livingRooms,
    bedrooms,
    bathrooms,
    isUrgent = false,
    linenWash = false,
    linenWashLocation = null,
  } = input
  const tier = CLEANING_PRICING.areaTiers.find(
    (t) => pyeong >= t.min && pyeong <= t.max,
  )
  const pricePerPyeong = tier?.pricePerPyeong ?? 1600

  const areaCharge = pyeong * pricePerPyeong
  const roomCharge = (livingRooms + bedrooms) * CLEANING_PRICING.perBedroom
  const bathroomCharge = bathrooms * CLEANING_PRICING.perBathroom

  const baseSubtotal = Math.max(
    areaCharge + roomCharge + bathroomCharge,
    CLEANING_PRICING.minimumCharge,
  )

  const linenWashCharge = linenWash && linenWashLocation
    ? LINEN_WASH_PRICING[linenWashLocation]
    : 0

  const subtotal = baseSubtotal + linenWashCharge

  const urgentSurcharge = isUrgent
    ? Math.round(baseSubtotal * (CLEANING_PRICING.urgentSurchargeRate - 1))
    : 0

  const total = Math.ceil((subtotal + urgentSurcharge) / 1000) * 1000

  return { subtotal, urgentSurcharge, linenWashCharge, total, isUrgent }
}
