import { Hono } from 'hono'
import { Webhook } from 'standardwebhooks'
import { sendSms } from '../lib/solapi'

type SendSmsHookPayload = {
  user: {
    id: string
    phone?: string
  }
  sms: {
    otp: string
    phone: string
  }
}

export const authHooksRoutes = new Hono()

// Supabase Auth → Send SMS Hook (HTTP).
// Supabase calls this with a Standard Webhooks signature; we verify the
// signature then forward the OTP to Solapi.
authHooksRoutes.post('/send-sms', async (c) => {
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET
  if (!rawSecret) {
    console.error('[send-sms hook] SUPABASE_AUTH_HOOK_SECRET is not set')
    return c.json({ error: 'Hook not configured' }, 500)
  }

  // Supabase stores the secret as "v1,whsec_<base64>". The standardwebhooks
  // library wants only the base64 payload.
  const secret = rawSecret.replace(/^v1,whsec_/, '')

  const webhookId = c.req.header('webhook-id')
  const webhookTimestamp = c.req.header('webhook-timestamp')
  const webhookSignature = c.req.header('webhook-signature')
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return c.json({ error: 'Missing webhook signature headers' }, 400)
  }

  const rawBody = await c.req.text()

  let payload: SendSmsHookPayload
  try {
    const wh = new Webhook(secret)
    payload = wh.verify(rawBody, {
      'webhook-id': webhookId,
      'webhook-timestamp': webhookTimestamp,
      'webhook-signature': webhookSignature,
    }) as SendSmsHookPayload
  } catch (err) {
    console.error('[send-sms hook] signature verification failed', err)
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const { otp, phone } = payload.sms
  if (!otp || !phone) {
    return c.json({ error: 'Malformed payload' }, 400)
  }

  try {
    const result = await sendSms({
      to: phone,
      text: `[비엔비서] 인증번호는 ${otp} 입니다. 타인에게 알려주지 마세요.`,
    })
    console.log('[send-sms hook] Solapi response:', JSON.stringify(result, null, 2))

    // Solapi reports per-message failures in failedMessageList rather than throwing
    const failed = result.failedMessageList ?? []
    if (failed.length > 0) {
      console.error('[send-sms hook] Solapi failed messages:', failed)
      return c.json(
        {
          error: {
            http_code: 500,
            message: `SMS 발송 실패: ${failed[0]?.statusMessage ?? 'unknown'}`,
          },
        },
        500,
      )
    }
  } catch (err) {
    console.error('[send-sms hook] Solapi send threw:', err)
    return c.json(
      {
        error: {
          http_code: 500,
          message: 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
        },
      },
      500,
    )
  }

  return c.json({})
})
