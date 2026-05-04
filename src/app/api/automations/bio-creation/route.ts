import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check access
  const hasAccess = await prisma.userAutomation.findFirst({
    where: { userId: session.user.id, automationId: 'bio-creation' },
  })
  if (!hasAccess && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'You do not have access to this automation.' }, { status: 403 })
  }

  const { artistName, bioContext, videoName, thumbnailBase64 } = await request.json() as {
    artistName: string
    bioContext?: string
    videoName?: string
    thumbnailBase64?: string
  }

  if (!artistName?.trim()) {
    return NextResponse.json({ error: 'Artist name is required.' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const contentBlocks: Anthropic.MessageParam['content'] = []

  if (thumbnailBase64) {
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: thumbnailBase64 },
    })
  }

  contentBlocks.push({
    type: 'text',
    text: `Generate an Instagram caption for this video.

ARTIST: ${artistName}
VIDEO: ${videoName ?? 'video'}
CONTEXT: ${bioContext?.trim() || 'general post'}
${thumbnailBase64 ? '\nThe image above is a frame from the video. Use it to understand the mood, setting, energy, and content.' : ''}

Write the output in EXACTLY this format — no preamble, no explanation:

---MAIN---
[1-3 lines of caption copy. Match the mood of the video and context. Sound like ${artistName} wrote it personally. 1-2 emoji max. Keep line 1 under 125 chars.]

#tag1 #tag2 #tag3 #tag4 #tag5
---END_MAIN---

---COMMENT---
#tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12 #tag13 #tag14 #tag15 #tag16 #tag17 #tag18 #tag19 #tag20 #tag21 #tag22 #tag23 #tag24 #tag25
---END_COMMENT---

Hashtag rules: mix artist-name tags, genre tags, mood tags, and niche tags. All lowercase. 5 in main caption, 20 in comment.`,
  })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: contentBlocks }],
    })

    // Extract text from response
    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    console.log('[BIO-CREATION] raw:', rawText.slice(0, 200))

    // Try to extract structured sections
    const mainMatch    = rawText.match(/---MAIN---\n([\s\S]*?)---END_MAIN---/)
    const commentMatch = rawText.match(/---COMMENT---\n([\s\S]*?)---END_COMMENT---/)

    // Strip any dot-only separator lines Claude may still include
    const stripDots = (s: string) =>
      s.split('\n').filter(line => line.trim() !== '.').join('\n').trim()

    const mainCaption  = stripDots(mainMatch?.[1] ?? rawText)
    const firstComment = stripDots(commentMatch?.[1] ?? '')

    if (!mainCaption) {
      return NextResponse.json({ error: 'Failed to generate bio — no content returned. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ mainCaption, firstComment })
  } catch (err) {
    console.error('[BIO-CREATION ERROR]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Generation failed: ${msg}` }, { status: 500 })
  }
}
