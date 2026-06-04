export async function sendEmail(to: string, toName: string, subject: string, body: string) {
  const html = body.split('\n').map(l => `<p style="margin:0 0 12px 0;font-family:sans-serif;font-size:15px;color:#333">${l}</p>`).join('')

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Ben from BMS Services', email: process.env.BREVO_SENDER_EMAIL || 'ben@bmsservices.uk' },
      to: [{ email: to, name: toName }],
      subject, htmlContent: html, textContent: body,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    return { error: err.message || 'Send failed' }
  }
  return { ok: true }
}
