// Glue between in-app notification creation and external delivery
// (Kakao Alimtalk via Solapi, email via Resend).
//
// Failures are logged and swallowed: in-app notifications must always
// succeed even if external delivery is mis-configured or down.

import { sendAlimtalk } from '@/server/lib/solapi'
import { sendEmail } from '@/server/lib/email'

type TemplateConfig<TInput> = {
  envVar: string
  buildVariables: (input: TInput) => Record<string, string>
  buildFallbackText: (input: TInput) => string
}

export async function dispatchAlimtalk<TInput>(
  template: TemplateConfig<TInput>,
  to: string | null | undefined,
  input: TInput,
) {
  if (!to) return
  const templateId = process.env[template.envVar]
  if (!templateId) {
    console.warn(`[alimtalk] ${template.envVar} not set; skipping send`)
    return
  }

  try {
    await sendAlimtalk({
      to,
      templateId,
      variables: template.buildVariables(input),
      fallbackText: template.buildFallbackText(input),
    })
  } catch (error) {
    console.error('[alimtalk] send failed', error)
  }
}

export async function dispatchAdminEmail(params: {
  subject: string
  html: string
  text: string
}) {
  const recipients = (process.env.ADMIN_NOTIFICATION_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    console.warn('[email] ADMIN_NOTIFICATION_EMAILS not set; skipping admin email')
    return
  }

  try {
    await sendEmail({
      to: recipients,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })
  } catch (error) {
    console.error('[email] admin send failed', error)
  }
}
