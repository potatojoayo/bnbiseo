// Resend email helper.
// Configure RESEND_API_KEY and RESEND_FROM (e.g. "BnBiseo <noreply@bnbiseo.com>") in env.

type SendEmailParams = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}

export async function sendEmail(params: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey) throw new Error('RESEND_API_KEY env var is not set')
  if (!from) throw new Error('RESEND_FROM env var is not set')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Resend send failed (${response.status}): ${detail}`)
  }

  return response.json() as Promise<{ id: string }>
}
