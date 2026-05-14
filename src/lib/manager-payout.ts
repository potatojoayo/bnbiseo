/**
 * 매니저 정산 비율 — 부가세(10%) + 플랫폼 수수료(10%)를 제한 80%.
 */
export const MANAGER_PAYOUT_RATE = 0.8

export function calculateManagerPayout(grossAmount: number): number {
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) return 0
  return Math.floor(grossAmount * MANAGER_PAYOUT_RATE)
}
