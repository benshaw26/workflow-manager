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
        const prompt = `You are an expert marketing strategist and brand analyst. Analyse the business at: ${websiteUrl}

${searchContext ? `Here is research data gathered from web searches:\n\n${searchContext}\n\n` : ''}

Produce a comprehensive, actionable marketing plan following ALL stages below. Be specific to THIS brand — no generic filler advice.

---

## STAGE 1 — BRAND IDENTITY RESEARCH
Extract and document:
- Business name, tagline, and value proposition
- Industry and niche
- Target audience (age, demographics, psychographics)
- Brand tone of voice
- Primary brand colours (estimate from context)
- Core products or services offered
- Pricing tier (budget, mid-market, premium, luxury)
- Unique selling points (USPs)
- Geographic focus

---

## STAGE 2 — SOCIAL MEDIA DISCOVERY
For each platform found (Instagram, Facebook, TikTok, YouTube, LinkedIn, X/Twitter, Pinterest, Threads), analyse:
- Estimated follower count
- Posting frequency
- Content types
- Engagement level
- Top content themes

---

## STAGE 3 — COMPETITOR & MARKET ANALYSIS
Identify 3–5 direct competitors. For each:
- Platform strengths
- Content strategy
- Gaps this business can exploit

---

## STAGE 4 — CURRENT MARKETING ASSESSMENT
- Overall digital presence score (1–10) with justification
- Strongest/weakest channels
- Brand consistency score (1–10)
- SEO presence indicators

---

## STAGE 5 — FULL MARKETING PLAN

### 5A — RECOMMENDED SOCIAL MEDIA PLATFORMS
For each platform: Priority tier, why it suits the brand, audience match, posting frequency, best formats.

### 5B — CONTENT STRATEGY & BRAND STYLE GUIDE
- Tone and voice guidelines
- Visual style direction
- 3–5 content pillars
- Caption style
- Hashtag strategy with examples
- Story/Reels strategy
- UGC opportunities

### 5C — AD STRATEGY
For each relevant paid channel (Meta, TikTok, Google, YouTube):
- Ad types
- Campaign objective
- Audience targeting
- Creative direction
- Budget split %
- Key messaging angles

### 5D — CONTENT CALENDAR FRAMEWORK
Sample weekly plan: day-by-day, platform, format, content pillar.

### 5E — QUICK WINS (First 30 Days)
8–10 immediate zero/low-budget actions.

### 5F — GROWTH ROADMAP
3-month phased plan: Month 1 Foundation → Month 2 Growth → Month 3 Scale.

### 5G — KPIs & SUCCESS METRICS
Per primary platform: follower growth target, engagement rate target, content output, ad benchmarks.

---

Begin with a one-paragraph brand summary, then go through all stages. Use clean markdown with tables where useful.`

        // Stream response from Claude
        let fullPlan = ''
        const claudeStream = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const chunk of claudeStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullPlan += chunk.delta.text
            send({ type: 'chunk', text: chunk.delta.text })
          }
        }

        // Save to DB (non-fatal)
        try {
          await prisma.marketingPlanRun.create({
            data: {
              userId: session.user.id,
              websiteUrl: websiteUrl.trim(),
              plan: fullPlan,
            },
          })
        } catch { /* ignore */ }

        send({ type: 'complete', plan: fullPlan })
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

  const runs = await prisma.marketingPlanRun.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, websiteUrl: true, createdAt: true, plan: true },
  })

  return NextResponse.json({ runs })
}
