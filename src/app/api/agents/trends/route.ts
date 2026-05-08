import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { askClaude } from '@/lib/claude'
import fs from 'fs/promises'
import path from 'path'

export const maxDuration = 120

const TRENDS_DIR = path.join(process.cwd(), 'data', 'trends')
const LATEST_FILE = path.join(TRENDS_DIR, 'latest.json')

interface ContentOpportunity {
  opportunity: string
  platforms: string[]
  urgency: 'low' | 'medium' | 'high'
  brief: string
}

export interface TrendsData {
  date: string
  platformTrends: {
    tiktok: { trendingFormats: string[]; contentThemes: string[]; hookStyles: string[] }
    instagram: { trendingFormats: string[]; contentThemes: string[]; trendingAesthetics: string[] }
    linkedin: { trendingTopics: string[]; postFormats: string[] }
    x: { trendingTopics: string[]; contentStyles: string[] }
    youtube: { trendingFormats: string[]; contentThemes: string[] }
  }
  universalThemes: string[]
  contentOpportunities: ContentOpportunity[]
  avoidThisWeek: string[]
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

async function readCached(): Promise<TrendsData | null> {
  try {
    const raw = await fs.readFile(LATEST_FILE, 'utf8')
    const data = JSON.parse(raw) as TrendsData
    if (data.date === todayString()) return data
  } catch {
    // not cached or stale
  }
  return null
}

async function generateTrends(): Promise<TrendsData> {
  const today = todayString()

  const text = await askClaude(
    'You are a social media trend analyst. Return ONLY valid JSON.',
    `Generate a comprehensive social media trends report for ${today}. Return exactly this JSON structure with all arrays containing 4-6 specific, actionable items based on what is trending right now:

{
  "date": "${today}",
  "platformTrends": {
    "tiktok": {
      "trendingFormats": [],
      "contentThemes": [],
      "hookStyles": []
    },
    "instagram": {
      "trendingFormats": [],
      "contentThemes": [],
      "trendingAesthetics": []
    },
    "linkedin": {
      "trendingTopics": [],
      "postFormats": []
    },
    "x": {
      "trendingTopics": [],
      "contentStyles": []
    },
    "youtube": {
      "trendingFormats": [],
      "contentThemes": []
    }
  },
  "universalThemes": [],
  "contentOpportunities": [
    {
      "opportunity": "Specific opportunity title",
      "platforms": ["tiktok", "instagram"],
      "urgency": "high",
      "brief": "Why this is a strong opportunity right now and how to execute it quickly"
    }
  ],
  "avoidThisWeek": []
}

Return ONLY the JSON object. No markdown, no code fences, no explanation.`,
    4096,
  )

  let data: TrendsData
  try {
    data = JSON.parse(text) as TrendsData
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) {
      data = JSON.parse(text.slice(start, end + 1)) as TrendsData
    } else {
      throw new Error('Claude returned invalid JSON')
    }
  }

  await fs.mkdir(TRENDS_DIR, { recursive: true })
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(LATEST_FILE, json)
  await fs.writeFile(path.join(TRENDS_DIR, `trends-${today}.json`), json)

  return data
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const cached = await readCached()
    if (cached) return NextResponse.json(cached)
    const data = await generateTrends()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch trends' },
      { status: 500 },
    )
  }
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const data = await generateTrends()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to regenerate trends' },
      { status: 500 },
    )
  }
}
