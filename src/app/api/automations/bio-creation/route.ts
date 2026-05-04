import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const runs = await prisma.bioCreationRun.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ runs })
}

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

  // ── Step 1: Research artist's industry team (3-phase) ────────────────────
  let teamHandles = ''
  try {
    // Phase A: Search Wikipedia + industry sites for team NAMES
    let searchSnippet = ''
    if (process.env.SERPER_API_KEY) {
      const [wikiRes, industryRes] = await Promise.all([
        fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: `${artistName} wikipedia record label management booking agent publisher`, num: 5 }),
        }),
        fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: `${artistName} management company booking agency music label allmusic`, num: 5 }),
        }),
      ])
      const [d1, d2] = await Promise.all([
        wikiRes.ok ? wikiRes.json() as Promise<{ organic?: Array<{ title: string; snippet: string }> }> : Promise.resolve({ organic: [] }),
        industryRes.ok ? industryRes.json() as Promise<{ organic?: Array<{ title: string; snippet: string }> }> : Promise.resolve({ organic: [] }),
      ])
      searchSnippet = [...(d1.organic ?? []), ...(d2.organic ?? [])]
        .map(h => `${h.title}: ${h.snippet}`)
        .join('\n')
        .slice(0, 2500)
      console.log('[BIO-CREATION] search snippet:', searchSnippet.slice(0, 200))
    }

    // Phase B: Extract team member NAMES from snippets
    const namesRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `From the search results below, extract the OFFICIAL INDUSTRY TEAM for the artist "${artistName}".
List ONLY: record label name, management company/manager name, booking agency name, publisher name.
Do NOT include: photographers, featured artists, directors, stylists, or anyone who worked on a single song.
${searchSnippet ? `\nSearch results:\n${searchSnippet}` : ''}
Also use your training knowledge for this artist.
Reply in this exact format (omit any you don't know):
LABEL: name
MANAGEMENT: name
AGENCY: name
PUBLISHER: name`,
      }],
    })
    const namesText = namesRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text.trim())
      .join('\n')
    console.log('[BIO-CREATION] team names:', namesText)

    // Phase C: Look up Instagram handles for those specific companies/people
    if (namesText && !namesText.includes('unknown')) {
      const handlesRes = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Given these music industry companies/people:\n${namesText}\n\nProvide their official Instagram @handles. Only include handles you are confident are correct — major labels, agencies, and publishers have well-known handles.

Reply with ONLY a space-separated list of @handles (e.g. @islandrecords @kobaltmusic @utamusic). If none are known with confidence, reply: NONE`,
        }],
      })
      const raw = handlesRes.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text.trim())
        .join(' ')
      teamHandles = raw.startsWith('NONE') ? '' : raw
      console.log('[BIO-CREATION] team handles:', teamHandles)
    }
  } catch {
    // Non-fatal — continue without team handles
  }

  // ── Step 2: Generate the caption ─────────────────────────────────────────
  contentBlocks.push({
    type: 'text',
    text: `Generate an Instagram caption for this video.

ARTIST: ${artistName}
VIDEO: ${videoName ?? 'video'}
CONTEXT: ${bioContext?.trim() || 'general post'}
${teamHandles ? `ARTIST'S TEAM INSTAGRAM HANDLES (include 1-2 naturally in the caption where it fits): ${teamHandles}` : ''}
${thumbnailBase64 ? '\nThe image above is a frame from the video. Use it to understand the mood, setting, energy, and content.' : ''}

Write the output in EXACTLY this format — no preamble, no explanation:

---MAIN---
[1-3 lines of caption copy. Match the mood of the video and context. Sound like ${artistName} wrote it personally. 1-2 emoji max. Keep line 1 under 125 chars. If team handles were provided, weave 1-2 of the most relevant ones naturally into the copy — not just appended at the end.]

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

    // Try to extract structured sections (flexible: \r?\n handles CRLF too)
    const mainMatch    = rawText.match(/---MAIN---\r?\n([\s\S]*?)---END_MAIN---/)
    const commentMatch = rawText.match(/---COMMENT---\r?\n([\s\S]*?)---END_COMMENT---/)

    console.log('[BIO-CREATION] raw:', rawText.slice(0, 300))
    console.log('[BIO-CREATION] mainMatch:', !!mainMatch, 'commentMatch:', !!commentMatch)

    // Strip dot-only separator lines
    const stripDots = (s: string) =>
      s.split('\n')
        .filter(line => line.trim() !== '.')
        .join('\n')
        .trim()

    // Never fall back to rawText (which contains markers + both sections → causes duplication)
    // If regex fails, return empty so the error path triggers a retry message
    const mainCaption  = mainMatch?.[1] ? stripDots(mainMatch[1]) : ''
    const firstComment = commentMatch?.[1] ? stripDots(commentMatch[1]) : ''

    if (!mainCaption) {
      return NextResponse.json({ error: 'Failed to generate bio — no content returned. Please try again.' }, { status: 500 })
    }

    // Save run to DB (non-fatal if it fails)
    try {
      await prisma.bioCreationRun.create({
        data: {
          userId: session.user.id,
          artistName: artistName.trim(),
          videoName: videoName ?? 'video',
          bioContext: bioContext?.trim() || null,
          mainCaption,
          firstComment,
        },
      })
    } catch (dbErr) {
      console.error('[BIO-CREATION] DB save failed:', dbErr)
    }

    return NextResponse.json({ mainCaption, firstComment })
  } catch (err) {
    console.error('[BIO-CREATION ERROR]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Generation failed: ${msg}` }, { status: 500 })
  }
}
