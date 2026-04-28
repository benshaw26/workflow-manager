import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { recipients, subject, body, fromName, previewText } = await request.json()

  if (!recipients?.length || !subject || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const results: { email: string; success: boolean; error?: string }[] = []

  for (const email of recipients) {
    const firstName = email.split('@')[0].split('.')[0]
    const personalised = body
      .replace(/\{\{first_name\}\}/gi, firstName.charAt(0).toUpperCase() + firstName.slice(1))
      .replace(/\{\{email\}\}/gi, email)

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;color:#1a1a2e;line-height:1.6;">
          ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;color:#fff;">${previewText}</div>` : ''}
          <div style="white-space:pre-line;font-size:15px;">${personalised}</div>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
          <p style="font-size:12px;color:#999;margin:0;">
            You received this email because you subscribed to our list.
            <br/>Sent via BMS Services.
          </p>
        </body>
      </html>
    `

    try {
      await transporter.sendMail({
        from: `"${fromName}" <${process.env.GMAIL_USER}>`,
        to: email,
        subject,
        text: personalised,
        html,
      })
      results.push({ email, success: true })
    } catch (err) {
      results.push({ email, success: false, error: err instanceof Error ? err.message : 'Send failed' })
    }
  }

  const sent = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({ results, sent, failed })
}
