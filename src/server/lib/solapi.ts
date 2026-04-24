import { SolapiMessageService } from 'solapi'

let cachedClient: SolapiMessageService | null = null

function getClient(): SolapiMessageService {
  if (cachedClient) return cachedClient
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error('SOLAPI_API_KEY / SOLAPI_API_SECRET env vars are not set')
  }
  cachedClient = new SolapiMessageService(apiKey, apiSecret)
  return cachedClient
}

// Supabase sends phone in E.164 (e.g. "+821012345678"). Solapi expects the
// Korean domestic format ("01012345678").
export function toKoreanLocalNumber(phone: string): string {
  const trimmed = phone.trim().replace(/[^\d+]/g, '')
  if (trimmed.startsWith('+82')) return '0' + trimmed.slice(3)
  if (trimmed.startsWith('82')) return '0' + trimmed.slice(2)
  return trimmed
}

export async function sendSms(params: { to: string; text: string }) {
  const from = process.env.SOLAPI_SENDER_PHONE
  if (!from) throw new Error('SOLAPI_SENDER_PHONE env var is not set')
  return getClient().send({
    to: toKoreanLocalNumber(params.to),
    from,
    text: params.text,
  })
}
