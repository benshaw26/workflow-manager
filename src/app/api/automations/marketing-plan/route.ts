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
        // Stage 1-3: Research via Serper
        send({ type: 'stage', stage: 1, label: 'Researching brand identity…' })

        let searchContext = ''

        if (process.env.SERPER_API_KEY) {
          const hostname = new URL(websiteUrl).hostname
          const searches = await Promise.all([
            // Brand identity
            fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: `site:${hostname} OR "${hostname}" about services products pricing`, num: 5 }),
            }),
            // Social media
            fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: `"${hostname}" instagram OR tiktok OR facebook OR youtube OR linkedin OR twitter`, num: 8 }),
            }),
            // Competitors
            fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: `competitors alternative to ${hostname} similar companies`, num: 6 }),
            }),
          ])

          const [brandRes, socialRes, compRes] = await Promise.all(
            searches.map(r => r.ok ? r.json() as Promise<{ organic?: Array<{ title: string; snippet: string; link: string }> }> : Promise.resolve({ organic: [] }))
          )

          const extractSnippets = (data: { organic?: Array<{ title: string; snippet: string; link: string }> }) =>
            (data.organic ?? []).map(h => `${h.title}: ${h.snippet} (${h.link})`).join('\n')

          searchContext = [
            '=== BRAND/WEBSITE SEARCH ===',
            extractSnippets(brandRes),
            '=== SOCIAL MEDIA SEARCH ===',
            extractSnippets(socialRes),
            '=== COMPETITOR SEARCH ===',
            extractSnippets(compRes),
          ].join('\n\n').slice(0, 6000)
        }

        send({ type: 'stage', stage: 2, label: 'Analysing social media presence…' })
        send({ type: 'stage', stage: 3, label: 'Researching competitors…' })
        send({ type: 'stage', stage: 4, label: 'Generating marketing plan with Claude…' })

        // Full prompt
        const prompt = `You are an expert marketing strategist. Analyse the business at: ${websiteUrl}

${searchContext ? `Web research gathered:\n\n${searchContext}\n\n` : ''}

Return ONLY a valid JSON object (no markdown, no explanation, no code fences). Use this exact structure:

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
    "scoreJustification": "Why this score",
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
      "rationale": "Why this platform",
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
  "quickWins": [
    "Action 1",
    "Action 2",
    "Action 3",
    "Action 4",
    "Action 5",
    "Action 6",
    "Action 7",
    "Action 8"
  ],
  "growthRoadmap": {
    "month1": { "theme": "Foundation", "focus": "One line focus", "actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"] },
    "month2": { "theme": "Growth", "focus": "One line focus", "actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"] },
    "month3": { "theme": "Scale", "focus": "One line focus", "actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"] }
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
          messages: [{ role: 'user', content: prompt }],
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
          // Try to extract JSON from text (look for first { and last })
          const start = fullText.indexOf('{')
          const end = fullText.lastIndexOf('}')
          if (start !== -1 && end !== -1 && end > start) {
            try {
              parsedData = JSON.parse(fullText.slice(start, end + 1))
            } catch { /* give up */ }
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
