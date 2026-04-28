import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { campaignName, fromName, audience, tone, topic } = await request.json()

  if (!audience || !tone || !topic) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const prompt = `You are an expert email marketer. Create a complete email marketing campaign.

Campaign name: ${campaignName || 'Untitled Campaign'}
From name: ${fromName || 'The Team'}
Target audience: ${audience}
Tone: ${tone}
Topic / goal: ${topic}

Generate the following and return ONLY valid JSON in this exact shape:
{
  "subjectA": "First subject line variant (direct and benefit-focused)",
  "subjectB": "Second subject line variant (curiosity or question-based for A/B test)",
  "previewText": "Email preview text (50-90 chars shown in inbox before opening)",
  "body": "Full email body in plain text with line breaks. Include: greeting, opening hook, main value/offer, supporting points, clear CTA, sign-off. Use {{first_name}} for personalisation.",
  "sendTime": "Recommended send day and time (e.g. Tuesday 10:00 AM)",
  "personalisationTips": ["tip1", "tip2", "tip3"]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate campaign' }, { status: 500 })
    }

    const campaign = JSON.parse(jsonMatch[0])
    return NextResponse.json({ campaign })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
