import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, FileText, CheckCircle2,
  Zap, Clock, Hash, Target,
} from 'lucide-react'
import fs from 'fs/promises'
import path from 'path'

interface ContentOpportunity {
  opportunity: string
  platforms: string[]
  urgency: 'low' | 'medium' | 'high'
  brief: string
}

interface TrendsData {
  date?: string
  contentOpportunities?: ContentOpportunity[]
}

async function getOpportunities(): Promise<ContentOpportunity[]> {
  try {
    const file = path.join(process.cwd(), 'data', 'trends', 'latest.json')
    const raw = await fs.readFile(file, 'utf8')
    const today = new Date().toISOString().slice(0, 10)
    const data = JSON.parse(raw) as TrendsData
    if (data.date !== today) return []
    return (data.contentOpportunities ?? []).slice(0, 3)
  } catch {
    return []
  }
}

const URGENCY_STYLES: Record<string, string> = {
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const BENEFITS = [
  'Keyword cluster mapping with search intent classification',
  'Fully written, publish-ready articles up to 3,000 words',
  'Structured headings, H2/H3 hierarchy and internal link suggestions',
  'Built-in social repurposing for Instagram, LinkedIn, X and TikTok',
  'Meta title and description optimised for click-through rate',
]

const QUICK_STATS = [
  { label: 'Avg. Generation Time', value: '45s', Icon: Clock },
  { label: 'Max Word Count', value: '3,000', Icon: FileText },
  { label: 'Social Platforms', value: '4', Icon: Zap },
  { label: 'Keywords per Article', value: '5+', Icon: Hash },
]

export default async function SeoWriterDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) notFound()

  const opportunities = await getOpportunities()

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/my-automations"
          className="inline-flex items-center gap-1.5 text-bms-muted hover:text-bms-text text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          My Automations
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-bms-cyan/10 text-bms-cyan">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-bms-text">SEO Writer</h2>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Active</span>
                </span>
              </div>
              <p className="text-bms-muted text-sm mt-0.5">
                AI SEO writer — generates fully optimised blog posts with keyword clusters, structured headings, and built-in social repurposing
              </p>
            </div>
          </div>

          <Link
            href="/seo-writer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bms-cyan text-bms-dark font-semibold text-sm hover:bg-bms-cyan-dark transition-colors"
          >
            Launch SEO Writer
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {QUICK_STATS.map(({ label, value, Icon }) => (
          <div key={label} className="bg-bms-card border border-bms-border rounded-xl p-4">
            <Icon className="w-4 h-4 text-bms-cyan mb-2" />
            <div className="text-2xl font-bold text-bms-text">{value}</div>
            <div className="text-bms-muted text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* About */}
        <div className="bg-bms-card border border-bms-border rounded-xl p-6">
          <h3 className="text-bms-text font-semibold mb-3 text-sm uppercase tracking-wide">
            About this Automation
          </h3>
          <p className="text-bms-muted text-sm leading-relaxed mb-4">
            Enter a topic and target keyword to receive a fully structured, SEO-optimised blog article
            with keyword cluster analysis, heading hierarchy, internal link suggestions, and optional
            social media repurposing — all generated in a single click.
          </p>
          <ul className="space-y-2">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-bms-muted">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Today's trend opportunities */}
        <div className="bg-bms-card border border-bms-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-bms-text font-semibold text-sm uppercase tracking-wide">
              Today&apos;s Content Opportunities
            </h3>
            <span className="flex items-center gap-1.5 text-[10px] text-bms-cyan font-medium">
              <Zap className="w-3 h-3" />
              Live Trends
            </span>
          </div>

          {opportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="w-8 h-8 text-bms-muted mb-2" />
              <p className="text-bms-muted text-sm">No trends loaded yet.</p>
              <p className="text-bms-muted text-xs mt-1">
                Visit{' '}
                <Link href="/dashboard/my-automations/trend-research" className="text-bms-cyan hover:underline">
                  Trend Research
                </Link>{' '}
                to generate today&apos;s data.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp, i) => (
                <Link
                  key={i}
                  href={`/seo-writer?topic=${encodeURIComponent(opp.opportunity)}`}
                  className="block p-3 rounded-lg border border-bms-border hover:border-bms-cyan/40 hover:bg-bms-cyan/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-bms-text text-sm font-medium group-hover:text-bms-cyan transition-colors line-clamp-1">
                      {opp.opportunity}
                    </span>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${URGENCY_STYLES[opp.urgency] ?? URGENCY_STYLES.low}`}
                    >
                      {opp.urgency}
                    </span>
                  </div>
                  <p className="text-bms-muted text-xs line-clamp-2">{opp.brief}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {opp.platforms.slice(0, 3).map(p => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-bms-border text-bms-muted uppercase tracking-wide"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] text-bms-cyan opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Write about this <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
