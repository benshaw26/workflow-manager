import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasAccess = await prisma.userAutomation.findFirst({
    where: { userId: session.user.id, automationId: 'marketing-plan' },
  })
  if (!hasAccess && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No access to this automation.' }, { status: 403 })
  }

  const { websiteUrl } = await request.json() as { websiteUrl: string }
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
        send({ type: 'stage', stage: 1, label: 'Researching brand identity…' })

        const hostname = (() => {
          try { return new URL(websiteUrl).hostname.replace('www.', '') } catch { return websiteUrl }
        })()

        let brandContext = ''
        let competitorContext = ''
        let liveSocialContext = ''
        let websiteLinks = ''

        // ── Step 1: Fetch website HTML for real social profile links ─────────
        try {
          const htmlRes = await fetch(websiteUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
            signal: AbortSignal.timeout(6000),
          })
          if (htmlRes.ok) {
            const html = await htmlRes.text()
            const links = html.match(/<a[^>]+href=["'][^"']*(?:instagram|tiktok|facebook|youtube|linkedin|twitter|pinterest)[^"']*["'][^>]*>/gi) ?? []
            const metas = html.match(/<meta[^>]+(?:og:|twitter:)[^>]+>/gi) ?? []
            websiteLinks = [...links.slice(0, 20), ...metas.slice(0, 8)].join('\n').slice(0, 1500)
          }
        } catch { /* ignore */ }

        // ── Step 2: Serper searches — brand, competitors, 7 platform audits ──
        if (process.env.SERPER_API_KEY) {
          const H = { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' }
          const sp = (q: string, num = 5) =>
            fetch('https://google.serper.dev/search', { method: 'POST', headers: H, body: JSON.stringify({ q, num }) })
              .then(r => r.ok ? r.json() as Promise<{ organic?: Array<{ title: string; snippet: string; link: string }> }> : Promise.resolve({ organic: [] }))

          send({ type: 'stage', stage: 2, label: 'Scanning live social profiles…' })

          const brand = hostname.split('.')[0]
          const [brandRes, compRes, igRes, ttRes, fbRes, ytRes, liRes, twRes, pinRes] = await Promise.all([
            sp(`site:${hostname} OR "${hostname}" about services products pricing`, 5),
            sp(`competitors alternative to ${hostname} similar companies`, 6),
            sp(`"${brand}" instagram followers profile page`, 5),
            sp(`"${brand}" tiktok followers profile page`, 5),
            sp(`"${brand}" facebook followers page likes`, 5),
            sp(`"${brand}" youtube subscribers channel`, 5),
            sp(`"${brand}" linkedin followers company page`, 5),
            sp(`"${brand}" twitter followers profile`, 4),
            sp(`"${brand}" pinterest followers profile`, 4),
          ])

          const snip = (d: { organic?: Array<{ title: string; snippet: string; link: string }> }) =>
            (d.organic ?? []).map(h => `${h.title}: ${h.snippet} (${h.link})`).join('\n')

          brandContext = snip(brandRes).slice(0, 2000)
          competitorContext = snip(compRes).slice(0, 2000)
          liveSocialContext = [
            `INSTAGRAM:\n${snip(igRes)}`,
            `TIKTOK:\n${snip(ttRes)}`,
            `FACEBOOK:\n${snip(fbRes)}`,
            `YOUTUBE:\n${snip(ytRes)}`,
            `LINKEDIN:\n${snip(liRes)}`,
            `TWITTER/X:\n${snip(twRes)}`,
            `PINTEREST:\n${snip(pinRes)}`,
          ].join('\n\n').slice(0, 6000)
        }

        send({ type: 'stage', stage: 3, label: 'Researching competitors…' })
        send({ type: 'stage', stage: 4, label: 'Generating marketing plan with Claude…' })

        const liveSocialSection = liveSocialContext
          ? `## LIVE SOCIAL MEDIA DATA (scraped from Google right now)\nIMPORTANT: Extract actual follower counts, subscriber numbers, and engagement data from these snippets. Use the real numbers you see. If a snippet says "12.4K followers" use 12.4K. Only say "unknown" if genuinely absent.\n\n${liveSocialContext}\n\n`
          : ''

        const websiteLinksSection = websiteLinks
          ? `## Social Links Found On Website\n${websiteLinks}\n\n`
          : ''

        const finalPrompt = `You are a world-class marketing strategist conducting a live brand audit. Analyse the business at: ${websiteUrl}

${brandContext ? `## Brand Research\n${brandContext}\n\n` : ''}${websiteLinksSection}${liveSocialSection}${competitorContext ? `## Competitor Research\n${competitorContext}\n\n` : ''}
## STRATEGY RULES — YOU MUST FOLLOW THESE:
1. Your recommendations MUST be driven by the live social data above. If they have 50K Instagram followers, that changes your entire strategy vs 500 followers.
2. Prioritise platforms where they already have traction. Build on strengths first.
3. Content pillars must reflect themes the brand ACTUALLY posts (inferred from social data) + gaps you identify.
4. Quick wins must address SPECIFIC weaknesses visible in their current social performance.
5. KPI targets must be realistic increments from ACTUAL current numbers (e.g. if they have 5K followers, target +500-1K/month, not +10K/month).
6. The assessment score must be grounded in what you actually found — be honest, not flattering.

Return ONLY a valid JSON object (no markdown, no code fences, no explanation):

{
  "brandSummary": "2-3 sentence summary of the brand",
  "brand": {
    "name": "Business Name",
    "tagline": "Their tagline or value prop",
    "industry": "Industry name",
    "niche": "Specific niche",
    "targetAudience": "Concise description e.g. 18-35 year old music fans UK",
    "toneOfVoice": "e.g. Bold, energetic, direct",
    "colors": ["#hex1", "#hex2"],
    "pricingTier": "budget|mid-market|premium|luxury",
    "usps": ["USP 1", "USP 2", "USP 3"],
    "geographicFocus": "Local/National/International",
    "products": ["Product/service 1", "Product/service 2"]
  },
  "socialMedia": [
    {
      "platform": "instagram",
      "status": "active|inactive|not_found",
      "handle": "@handle or unknown",
      "followers": "e.g. ~50K or unknown",
      "frequency": "e.g. 3x/week or unknown",
      "contentTypes": ["reels", "stories", "carousels"],
      "engagementLevel": "low|medium|high|unknown",
      "score": 7,
      "topThemes": ["theme1", "theme2"]
    }
  ],
  "competitors": [
    {
      "name": "Competitor Name",
      "website": "competitor.com",
      "strongestPlatform": "instagram",
      "followers": "e.g. 120K",
      "contentStyle": "Brief style description",
      "gap": "What this business can do better"
    }
  ],
  "assessment": {
    "overallScore": 6,
    "scoreJustification": "Why this score — reference actual observed metrics",
    "strongestChannel": "instagram",
    "weakestChannel": "tiktok",
    "brandConsistencyScore": 5,
    "seoPresence": "Brief SEO assessment",
    "paidAdvertising": "Any paid ads detected or not"
  },
  "recommendations": [
    {
      "platform": "instagram",
      "priority": "primary|secondary|optional",
      "rationale": "Why this platform — reference current follower count and what that unlocks",
      "postingFrequency": "5x/week",
      "formats": ["reels", "carousels", "stories"]
    }
  ],
  "contentStrategy": {
    "tone": "Tone guidelines",
    "visualStyle": "Visual direction description",
    "contentPillars": [
      { "name": "Pillar Name", "description": "What this pillar covers", "percentage": 30, "emoji": "🎵" }
    ],
    "captionStyle": "Short, punchy captions with...",
    "hashtags": {
      "niche": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "medium": ["#tag6", "#tag7", "#tag8", "#tag9", "#tag10"],
      "broad": ["#tag11", "#tag12", "#tag13", "#tag14", "#tag15"]
    },
    "reelsStrategy": "Reels approach description",
    "ugcOpportunities": "UGC description"
  },
  "adStrategy": [
    {
      "platform": "meta",
      "adTypes": ["video", "carousel"],
      "objective": "conversions",
      "budgetPercent": 50,
      "audienceTargeting": "Targeting description",
      "creativeDirection": "Creative style description",
      "messagingAngles": ["Angle 1", "Angle 2", "Angle 3"]
    }
  ],
  "contentCalendar": [
    { "day": "Monday", "platform": "instagram", "format": "Reel", "pillar": "Pillar Name", "contentType": "reel", "idea": "Brief content idea" },
    { "day": "Tuesday", "platform": "tiktok", "format": "Video", "pillar": "Pillar Name", "contentType": "video", "idea": "Brief content idea" },
    { "day": "Wednesday", "platform": "instagram", "format": "Story", "pillar": "Pillar Name", "contentType": "story", "idea": "Brief content idea" },
    { "day": "Thursday", "platform": "instagram", "format": "Carousel", "pillar": "Pillar Name", "contentType": "feed", "idea": "Brief content idea" },
    { "day": "Friday", "platform": "tiktok", "format": "Video", "pillar": "Pillar Name", "contentType": "video", "idea": "Brief content idea" },
    { "day": "Saturday", "platform": "instagram", "format": "Reel", "pillar": "Pillar Name", "contentType": "reel", "idea": "Brief content idea" },
    { "day": "Sunday", "platform": "instagram", "format": "Story", "pillar": "Pillar Name", "contentType": "story", "idea": "Brief content idea" }
  ],
  "quickWins": ["Action 1","Action 2","Action 3","Action 4","Action 5","Action 6","Action 7","Action 8"],
  "growthRoadmap": {
    "month1": { "theme": "Foundation", "focus": "One line focus", "actions": ["Action 1","Action 2","Action 3","Action 4","Action 5"] },
    "month2": { "theme": "Growth", "focus": "One line focus", "actions": ["Action 1","Action 2","Action 3","Action 4","Action 5"] },
    "month3": { "theme": "Scale", "focus": "One line focus", "actions": ["Action 1","Action 2","Action 3","Action 4","Action 5"] }
  },
  "kpis": [
    {
      "platform": "instagram",
      "followerGrowth": "+500/month",
      "engagementRate": "3-5%",
      "contentOutput": "5 posts/week",
      "adBenchmarks": "CTR 1.5%, CPL £8"
    }
  ]
}

Only output the JSON. No other text.`

        // Stream response from Claude
        let fullText = ''
        const claudeStream = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [{ role: 'user', content: finalPrompt }],
        })

        for await (const chunk of claudeStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            send({ type: 'chunk', text: chunk.delta.text })
          }
        }

        // Parse JSON from accumulated text
        let parsedData: object | null = null
        try {
          parsedData = JSON.parse(fullText)
        } catch {
          const start = fullText.indexOf('{')
          const end = fullText.lastIndexOf('}')
          if (start !== -1 && end !== -1 && end > start) {
            try { parsedData = JSON.parse(fullText.slice(start, end + 1)) } catch { /* give up */ }
          }
        }

        // Save to DB (non-fatal)
        try {
          await prisma.marketingPlanRun.create({
            data: {
              userId: session.user.id,
              websiteUrl: websiteUrl.trim(),
              plan: JSON.stringify(parsedData),
            },
          })
        } catch { /* ignore */ }

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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawRuns = await prisma.marketingPlanRun.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, websiteUrl: true, createdAt: true, plan: true },
  })

  const runs = rawRuns.map(run => {
    let plan: object | null = null
    try {
      if (run.plan) plan = JSON.parse(run.plan)
    } catch { /* fallback to null */ }
    return { id: run.id, websiteUrl: run.websiteUrl, createdAt: run.createdAt, plan }
  })

  return NextResponse.json({ runs })
}
