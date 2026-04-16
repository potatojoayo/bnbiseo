/** 최소 예약 리드타임 (시간) */
export const MIN_BOOKING_LEAD_HOURS = 3

/** 첫 청소 할인 금액 */
export const FIRST_CLEANING_DISCOUNT = 10000

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
}) {
  const { pyeong, livingRooms, bedrooms, bathrooms, isUrgent = false } = input
  const tier = CLEANING_PRICING.areaTiers.find(
    (t) => pyeong >= t.min && pyeong <= t.max,
  )
  const pricePerPyeong = tier?.pricePerPyeong ?? 1600

  const areaCharge = pyeong * pricePerPyeong
  const roomCharge = (livingRooms + bedrooms) * CLEANING_PRICING.perBedroom
  const bathroomCharge = bathrooms * CLEANING_PRICING.perBathroom

  const subtotal = Math.max(
    areaCharge + roomCharge + bathroomCharge,
    CLEANING_PRICING.minimumCharge,
  )

  const urgentSurcharge = isUrgent
    ? Math.round(subtotal * (CLEANING_PRICING.urgentSurchargeRate - 1))
    : 0

  const total = Math.ceil((subtotal + urgentSurcharge) / 1000) * 1000

  return { subtotal, urgentSurcharge, total, isUrgent }
}
