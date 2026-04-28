import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLATFORM_RULES: Record<string, string> = {
  linkedin: 'LinkedIn post: professional tone, up to 1300 characters, thought leadership style, 3-5 relevant hashtags, line breaks for readability, can include a call-to-action.',
  x: 'X (Twitter) post: punchy and concise, strictly under 280 characters including hashtags, direct and engaging, 1-3 hashtags max.',
  instagram: 'Instagram caption: visually descriptive, engaging and conversational, up to 2200 characters, 10-15 relevant hashtags at the end, emojis encouraged.',
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandProfile, topic, platforms, imageBase64, imageMediaType } = await request.json()

  if (!brandProfile || !topic || !platforms?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const platformList = platforms
    .map((p: string) => PLATFORM_RULES[p])
    .filter(Boolean)
    .join('\n\n')

  const brandContext = `Brand: ${brandProfile.brandName}
Tone: ${brandProfile.tone}
Personality: ${brandProfile.personality}
Target audience: ${brandProfile.targetAudience}
Key themes: ${brandProfile.keyThemes?.join(', ')}
Content style: ${brandProfile.contentStyle}`

  const imageContent: Anthropic.ContentBlockParam[] = imageBase64
    ? [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: (imageMediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: imageBase64,
          },
        },
      ]
    : []

  const textPrompt = `You are a social media expert. Generate posts for the following topic using this brand's voice.

${brandContext}

Topic / brief: ${topic}

Generate one post per platform below. Return ONLY valid JSON as an array:
[
  {
    "platform": "linkedin" | "x" | "instagram",
    "content": "the full post text including hashtags inline or at end per platform norms",
    "hashtags": ["tag1", "tag2"],
    "charCount": number
  }
]

Platform requirements:
${platformList}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: textPrompt },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate posts' }, { status: 500 })
    }

    const posts = JSON.parse(jsonMatch[0])
    return NextResponse.json({ posts })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
