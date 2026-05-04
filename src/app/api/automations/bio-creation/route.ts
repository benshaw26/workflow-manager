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

${thumbnailBase64 ? 'The frame above shows what is happening in the video — use it to inform the mood, setting, and energy of the caption.' : ''}

Output ONLY these two sections, nothing else:

SECTION_1_MAIN:
[Write 1–3 lines of punchy, authentic caption copy here. Match the mood of the video and context. Sound like ${artistName} wrote it — never AI-sounding. Use 1–2 emoji max, placed naturally. Keep line 1 under 125 characters.]
.
.
.
.
.
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
END_SECTION_1

SECTION_2_FIRST_COMMENT:
#hashtag6 #hashtag7 #hashtag8 #hashtag9 #hashtag10 #hashtag11 #hashtag12 #hashtag13 #hashtag14 #hashtag15 #hashtag16 #hashtag17 #hashtag18 #hashtag19 #hashtag20 #hashtag21 #hashtag22 #hashtag23 #hashtag24 #hashtag25
END_SECTION_2

Rules for hashtags:
- 5 in the main caption, 20+ in the first comment
- Mix high-reach and niche — match the artist tier and genre
- All lowercase, no spaces
- Include artist name tag, genre tags, mood tags, and any relevant event/song tags`,
  })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: contentBlocks }],
    })

    const text = response.content.find((b) => b.type === 'text')?.type === 'text'
      ? (response.content.find((b) => b.type === 'text') as Anthropic.TextBlock).text
      : ''

    const extract = (raw: string, tag: string) => {
      const m = raw.match(new RegExp(`${tag}:?\\n([\\s\\S]*?)END_${tag}`))
      return m?.[1]?.trim() ?? ''
    }

    const mainCaption  = extract(text, 'SECTION_1_MAIN')
    const firstComment = extract(text, 'SECTION_2_FIRST_COMMENT')

    if (!mainCaption) {
      return NextResponse.json({ error: 'Failed to generate bio. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ mainCaption, firstComment })
  } catch (err) {
    console.error('[BIO-CREATION ERROR]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
