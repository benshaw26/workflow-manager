import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url, text } = await request.json()

  if (!url && !text) {
    return NextResponse.json({ error: 'Provide a URL or text to scan' }, { status: 400 })
  }

  let content = text || ''

  if (url) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BMS-Bot/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await res.text()
      content = stripHtml(html)
    } catch {
      return NextResponse.json({ error: 'Could not fetch that URL — check it and try again' }, { status: 422 })
    }
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract all email addresses from the following content. Also infer any likely email addresses from names, roles, or contact information you find (e.g. if you see "John Smith, CEO at acme.com" infer john.smith@acme.com or john@acme.com).

Content:
${content}

Return ONLY valid JSON in this exact shape:
{
  "emails": [
    { "email": "someone@example.com", "name": "John Smith", "role": "CEO", "confidence": "found" },
    { "email": "info@company.com", "name": null, "role": null, "confidence": "found" },
    { "email": "jane@company.com", "name": "Jane Doe", "role": "Marketing", "confidence": "inferred" }
  ],
  "summary": "Brief description of what was found"
}

confidence must be "found" (directly in text) or "inferred" (logically deduced).
If no emails found or inferable, return { "emails": [], "summary": "No email addresses found" }.`,
        },
      ],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse results' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
