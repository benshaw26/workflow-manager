import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

export type SocialProfile = {
  platform: string
  platformEmoji: string
  status: 'active' | 'inactive' | 'not_found'
  handle: string
  profileUrl: string | null
  followers: string | null
  followersNumeric: number
  following: string | null
  posts: string | null
  verified: boolean
  bio: string | null
  avgLikesPerPost: string | null
  avgCommentsPerPost: string | null
  estimatedEngagementRate: string | null
  postingFrequency: string
  lastPostedEstimate: string
  contentThemes: string[]
  healthScore: number
  vsIndustryBenchmark: {
    followers: string
    engagement: string
    frequency: string
    benchmarkNote: string
  }
  goingWell: string[]
  improvements: string[]
  quickWin: string
}

export type SocialAuditData = {
  scannedAt: string
  brandName: string
  websiteUrl: string
  overallHealthScore: number
  overallSummary: string
  topPriority: string
  profiles: SocialProfile[]
  crossPlatformInsights: string[]
  prioritisedActions: Array<{
    priority: number
    platform: string
    action: string
    impact: string
    effort: string
    timeframe: string
  }>
}

const PLATFORMS_TO_CHECK = ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'twitter', 'pinterest']

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasAccess = await prisma.userAutomation.findFirst({
    where: { userId: session.user.id, automationId: 'marketing-plan' },
  })
  if (!hasAccess && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No access to this automation.' }, { status: 403 })
  }

  const { websiteUrl, brandName } = await request.json() as { websiteUrl: string; brandName?: string }
  if (!websiteUrl?.trim()) {
    return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        let hostname = ''
        try { hostname = new URL(websiteUrl).hostname.replace('www.', '') } catch { hostname = websiteUrl }
        const brand = brandName || hostname.split('.')[0]

        send({ type: 'stage', stage: 1, label: 'Discovering social profiles…' })

        let searchContext = ''
        let websiteHtml = ''

        // Fetch website HTML to find social links
        try {
          const htmlRes = await fetch(websiteUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
            signal: AbortSignal.timeout(8000),
          })
          if (htmlRes.ok) {
            const text = await htmlRes.text()
            // Extract only relevant <a> href links and meta tags (~3000 chars)
            const linkMatches = text.match(/<a[^>]+href=["'][^"']*(?:instagram|tiktok|facebook|youtube|linkedin|twitter|pinterest)[^"']*["'][^>]*>/gi) ?? []
            const metaMatches = text.match(/<meta[^>]+(?:og:|twitter:)[^>]+>/gi) ?? []
            websiteHtml = [...linkMatches.slice(0, 20), ...metaMatches.slice(0, 10)].join('\n').slice(0, 2000)
          }
        } catch { /* ignore */ }

        if (process.env.SERPER_API_KEY) {
          send({ type: 'stage', stage: 2, label: 'Searching live social data…' })

          const searches = await Promise.all(
            PLATFORMS_TO_CHECK.map(platform =>
              fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  q: `"${brand}" ${platform} followers profile`,
                  num: 5,
                }),
              })
            )
          )

          const results = await Promise.all(
            searches.map(r => r.ok ? r.json() as Promise<{ organic?: Array<{ title: string; snippet: string; link: string }> }> : Promise.resolve({ organic: [] }))
          )

          const sections = PLATFORMS_TO_CHECK.map((platform, i) => {
            const data = results[i]
            const snippets = (data.organic ?? [])
              .map(h => `${h.title}: ${h.snippet} (${h.link})`)
              .join('\n')
            return `=== ${platform.toUpperCase()} ===\n${snippets || 'No results found'}`
          })

          searchContext = sections.join('\n\n').slice(0, 8000)
        }

        send({ type: 'stage', stage: 3, label: 'Analysing with Claude AI…' })

        const prompt = `You are a world-class social media analyst. Conduct a LIVE social media audit for the brand/business at: ${websiteUrl}

Brand name: ${brand}
Website: ${websiteUrl}

${websiteHtml ? `Social links found on website:\n${websiteHtml}\n\n` : ''}
${searchContext ? `Live search results from Google:\n\n${searchContext}\n\n` : ''}

Using ALL the above data, produce a comprehensive social media audit. Extract real follower counts, engagement data, and profile details from the search snippets wherever possible. When you see numbers like "50K followers" or "1.2M" in the snippets, use those. Only say "unknown" if genuinely not found.

Return ONLY a valid JSON object (no markdown, no code fences). Use this EXACT structure:

{
  "scannedAt": "${new Date().toISOString()}",
  "brandName": "${brand}",
  "websiteUrl": "${websiteUrl}",
  "overallHealthScore": 6,
  "overallSummary": "2-3 sentence summary of their overall social media health",
  "topPriority": "The single most important action they should take right now",
  "profiles": [
    {
      "platform": "instagram",
      "platformEmoji": "📸",
      "status": "active",
      "handle": "@handle",
      "profileUrl": "https://instagram.com/handle",
      "followers": "12.4K",
      "followersNumeric": 12400,
      "following": "850",
      "posts": "340",
      "verified": false,
      "bio": "Their bio if found",
      "avgLikesPerPost": "~180",
      "avgCommentsPerPost": "~12",
      "estimatedEngagementRate": "1.4%",
      "postingFrequency": "3-4x/week",
      "lastPostedEstimate": "2-3 days ago",
      "contentThemes": ["product showcases", "behind the scenes", "user testimonials"],
      "healthScore": 6,
      "vsIndustryBenchmark": {
        "followers": "Below average for industry (avg ~25K)",
        "engagement": "On par with industry benchmark",
        "frequency": "Good — above the 2x/week minimum",
        "benchmarkNote": "Industry avg engagement is 1.5-2% for this niche"
      },
      "goingWell": [
        "Consistent posting cadence maintained",
        "Strong use of Reels driving reach",
        "Branded hashtag used consistently"
      ],
      "improvements": [
        "Engagement rate below 2% target — vary content formats",
        "No Stories strategy — add daily Stories for engagement",
        "CTA in captions missing — add clear calls to action"
      ],
      "quickWin": "Pin a top-performing Reel to profile to capture new visitors"
    }
  ],
  "crossPlatformInsights": [
    "Brand voice is inconsistent between Instagram (casual) and LinkedIn (formal) — align tone",
    "No cross-platform promotion — link accounts in bios",
    "Missing TikTok presence despite target audience being heavily active there"
  ],
  "prioritisedActions": [
    {
      "priority": 1,
      "platform": "instagram",
      "action": "Launch a 30-day Reels challenge posting daily at 6–9pm",
      "impact": "High — Reels get 3x organic reach vs static posts",
      "effort": "Medium",
      "timeframe": "Start this week"
    }
  ]
}

IMPORTANT RULES:
- Include ALL 7 platforms: instagram, tiktok, facebook, youtube, linkedin, twitter, pinterest
- Use "not_found" status if no profile evidence exists at all
- Use REAL numbers from search snippets wherever possible
- healthScore is 1–10 (1=nonexistent, 5=average, 8+=strong)
- overallHealthScore is the average across active profiles
- goingWell must have 2-4 specific, actionable observations
- improvements must have 2-4 specific, actionable issues
- prioritisedActions must have 4-6 actions sorted by impact
- Only output the JSON. No other text.`

        let fullText = ''
        const claudeStream = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const chunk of claudeStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            send({ type: 'chunk', text: chunk.delta.text })
          }
        }

        let parsedData: SocialAuditData | null = null
        try {
          parsedData = JSON.parse(fullText)
        } catch {
          const start = fullText.indexOf('{')
          const end = fullText.lastIndexOf('}')
          if (start !== -1 && end !== -1 && end > start) {
            try { parsedData = JSON.parse(fullText.slice(start, end + 1)) } catch { /* give up */ }
          }
        }

        send({ type: 'complete', data: parsedData })
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) })
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
