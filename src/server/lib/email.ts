// Email helper backed by Gmail SMTP (via nodemailer).
// Configure the following env vars:
//   GMAIL_USER         — the Gmail address used to authenticate & send (e.g. noreply@yourdomain / you@gmail.com)
//   GMAIL_APP_PASSWORD — a 16-char Google App Password (requires 2FA on the account)
//   MAIL_FROM          — optional display From, e.g. "BnBiseo <you@gmail.com>". Defaults to GMAIL_USER.

import nodemailer, { type Transporter } from 'nodemailer'

type SendEmailParams = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}

let transporter: Transporter | null = null

function getTransporter(user: string, pass: string): Transporter {
  // Reuse a single transporter across invocations so the connection pool is shared.
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }
  return transporter
}

export async function sendEmail(params: SendEmailParams) {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user) throw new Error('GMAIL_USER env var is not set')
  if (!pass) throw new Error('GMAIL_APP_PASSWORD env var is not set')

  const from = process.env.MAIL_FROM || user

  const info = await getTransporter(user, pass).sendMail({
    from,
    to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })

  return { id: info.messageId }
}
