import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { askClaude } from '@/lib/claude'
import { loadBrand } from '@/lib/brandLoader'
import { addJob } from '@/lib/agentQueue'

export const maxDuration = 120

interface SeoBody {
  clientId: string
  topic: string
  targetKeyword: string
  secondaryKeywords: string[]
  audience: string
  wordCount: number
  includeSocialRepurpose: boolean
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as SeoBody
  const {
    clientId,
    topic,
    targetKeyword,
    secondaryKeywords,
    audience,
    wordCount,
    includeSocialRepurpose,
  } = body

  if (!topic?.trim() || !targetKeyword?.trim()) {
    return NextResponse.json({ error: 'Topic and target keyword are required.' }, { status: 400 })
  }

  let brandName = 'Unknown'
  try {
    const brand = await loadBrand(clientId)
    brandName = brand.name
  } catch {
    // proceed without brand
  }

  const secondaryKwStr = secondaryKeywords?.length ? secondaryKeywords.join(', ') : 'none provided'
  const socialNote = includeSocialRepurpose
    ? 'Fully populate the socialRepurpose object with high-quality content.'
    : 'Set all socialRepurpose string fields to "" and xThread to [].'

  const text = await askClaude(
    'You are a world-class SEO content strategist and copywriter. Return ONLY valid JSON with no markdown, code fences, or explanation.',
    `Generate a comprehensive SEO article for the following brief:

Topic: ${topic}
Brand: ${brandName}
Primary Keyword: ${targetKeyword}
Secondary Keywords: ${secondaryKwStr}
Target Audience: ${audience}
Target Word Count: ${wordCount}

${socialNote}

Return this exact JSON structure, fully populated:
{
  "meta": {
    "title": "SEO title under 60 chars including primary keyword",
    "metaDescription": "Compelling meta description 150-160 chars with primary keyword",
    "slug": "url-friendly-slug",
    "estimatedReadTime": "X min read"
  },
  "keywordClusters": [
    {
      "primary": "primary keyword",
      "related": ["related 1", "related 2", "related 3", "related 4"],
      "searchIntent": "informational"
    }
  ],
  "article": {
    "h1": "Engaging H1 heading with primary keyword",
    "introduction": "Compelling 2-3 sentence introduction that hooks the reader and states the value",
    "sections": [
      {
        "h2": "Section heading",
        "h3s": ["Sub-heading A", "Sub-heading B"],
        "contentBrief": "Key points and angle for this section",
        "wordTarget": 200
      }
    ],
    "conclusion": "Strong conclusion paragraph with clear next steps or CTA",
    "internalLinkSuggestions": ["Related page 1", "Related page 2", "Related page 3"],
    "cta": "Clear call to action text"
  },
  "fullArticleText": "The complete, fully-written article in markdown format, approximately ${wordCount} words. Include H1, all H2/H3 sections with full body copy, and a conclusion. Publish-ready content optimised for ${targetKeyword}.",
  "socialRepurpose": {
    "instagramCaption": "",
    "linkedinPost": "",
    "xThread": [],
    "tiktokHook": ""
  }
}

Return ONLY the JSON object.`,
    8000,
  )

  let result: Record<string, unknown>
  try {
    result = JSON.parse(text) as Record<string, unknown>
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) {
      result = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
    } else {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 })
    }
  }

  const job = await addJob({
    clientId,
    contentType: 'blog_post',
    platform: 'web',
    payload: result,
  })

  return NextResponse.json({ ...result, jobId: job.id })
}
