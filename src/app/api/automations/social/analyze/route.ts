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
    .slice(0, 8000)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url, imageBase64, imageMediaType } = await request.json()

  if (!url && !imageBase64) {
    return NextResponse.json({ error: 'Provide a URL or image' }, { status: 400 })
  }

  const messages: Anthropic.MessageParam[] = []

  if (url) {
    let websiteText = ''
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BMS-Bot/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await res.text()
      websiteText = stripHtml(html)
    } catch {
      return NextResponse.json({ error: 'Could not fetch website — check the URL and try again' }, { status: 422 })
    }

    messages.push({
      role: 'user',
      content: `Analyse this website content and extract the brand personality profile.\n\nWebsite content:\n${websiteText}\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "brandName": "string",\n  "tone": "string (e.g. professional, playful, bold)",\n  "personality": "string (2-3 sentences describing the brand voice)",\n  "targetAudience": "string",\n  "keyThemes": ["string", "string", "string"],\n  "contentStyle": "string (e.g. educational, inspirational, conversational)",\n  "colorMood": "string (e.g. dark and techy, warm and approachable)"\n}`,
    })
  } else {
    const mediaType = (imageMediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imageBase64 },
        },
        {
          type: 'text',
          text: 'Analyse this image and extract a brand personality profile from the visual style, colours, typography, and any visible text or logo.\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "brandName": "string (or \'Unknown\' if not visible)",\n  "tone": "string (e.g. professional, playful, bold)",\n  "personality": "string (2-3 sentences describing the brand voice inferred from visuals)",\n  "targetAudience": "string",\n  "keyThemes": ["string", "string", "string"],\n  "contentStyle": "string",\n  "colorMood": "string"\n}',
        },
      ],
    })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse brand profile' }, { status: 500 })
    }

    const brandProfile = JSON.parse(jsonMatch[0])
    return NextResponse.json({ brandProfile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
