const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const OWNER_PATTERNS = [
  /(?:owner|founder|director|proprietor|run by|managed by)[:\s]+([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
  /(?:hi,? i'?m|hello,? i'?m|i'?m)\s+([A-Z][a-z]+)/i,
  /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:owner|founder|director)/i,
]

function pickBestEmail(emails: string[]): string | undefined {
  if (!emails.length) return undefined
  const blocked = ['info@', 'hello@', 'contact@', 'admin@', 'support@', 'enquiries@']
  return emails.find(e => !blocked.some(b => e.startsWith(b))) || emails[0]
}

function extractOwner(text: string): string | undefined {
  for (const p of OWNER_PATTERNS) {
    const m = text.match(p)
    if (m?.[1]) { const n = m[1].trim().split(' ')[0]; if (n.length >= 2 && n.length <= 20) return n }
  }
}

export async function scrapeWebsite(url: string): Promise<{ ownerFirstName?: string; email?: string }> {
  if (!url) return {}
  let puppeteer: typeof import('puppeteer')
  try { puppeteer = await import('puppeteer') } catch { return {} }

  let browser
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (compatible; BMSServicesBot/1.0; +https://bmsservices.uk/bot)')
    await page.setRequestInterception(true)
    page.on('request', req => { if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) req.abort(); else req.continue() })

    const allEmails = new Set<string>()
    let owner: string | undefined

    for (const u of [url, `${url}/contact`, `${url}/about`]) {
      try {
        await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 10000 })
        const text = await page.evaluate(() => document.body?.innerText || '')
        const html = await page.evaluate(() => document.body?.innerHTML || '')
        const textEmails: string[] = text.match(EMAIL_RE) || []
        const hrefEmails: string[] = (html.match(/mailto:([^"'>\s]+)/g) || []).map(m => m.replace('mailto:', ''))
        const found: string[] = textEmails.concat(hrefEmails)
        found.forEach(e => { const c = e.toLowerCase().trim(); if (c.includes('@') && !c.includes('..')) allEmails.add(c) })
        if (!owner) owner = extractOwner(text)
      } catch { /* page unavailable */ }
    }

    return { ownerFirstName: owner, email: pickBestEmail(Array.from(allEmails)) }
  } catch { return {} }
  finally { await browser?.close() }
}
