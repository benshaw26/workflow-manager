'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, Search, ArrowLeft, TrendingUp, Layers, Zap,
  BarChart2, Trophy, Wrench, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PLATFORMS, INDUSTRIES, TRENDING_2025, RESULTS_TABLE,
  INDUSTRY_BENCHMARKS, MARKETING_SKILLS,
} from './kb-data'

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'platforms' | 'industries' | 'trending' | 'results' | 'benchmarks' | 'skills'

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'platforms',   label: 'Platform Guide',     icon: Layers },
  { id: 'industries',  label: 'Industry Breakdown', icon: TrendingUp },
  { id: 'trending',    label: "What's Working",     icon: Zap },
  { id: 'results',     label: 'Results Calculator', icon: BarChart2 },
  { id: 'benchmarks',  label: 'Benchmarks',         icon: Trophy },
  { id: 'skills',      label: 'Marketing Skills',   icon: Wrench },
]

// ─── Shared helpers ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-bms-text mb-4">{children}</h2>
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', className)}>
      {children}
    </span>
  )
}

// ─── Platform Guide tab ───────────────────────────────────────────────────────

function PlatformsTab({ search }: { search: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() =>
    PLATFORMS.filter(p =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.bestIndustries.some(i => i.toLowerCase().includes(search.toLowerCase()))
    ), [search])

  return (
    <div className="space-y-3">
      {filtered.length === 0 && (
        <p className="text-bms-muted text-sm">No platforms match your search.</p>
      )}
      {filtered.map(platform => {
        const isOpen = expanded === platform.id
        return (
          <div key={platform.id} className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : platform.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-bms-darker/40 transition-colors"
            >
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl flex-shrink-0', platform.color)}>
                {platform.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-bms-text">{platform.name}</p>
                <p className="text-xs text-bms-muted mt-0.5">{platform.postingFrequency} &middot; Avg engagement: {platform.avgEngagementRate}</p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-bms-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-bms-muted flex-shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-bms-border p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-bms-darker rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-2">Best Content Types</p>
                    <ul className="space-y-1">
                      {platform.bestContentTypes.map((ct, i) => (
                        <li key={i} className="text-xs text-bms-text flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-bms-cyan flex-shrink-0" />{ct}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-bms-darker rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-2">Best Industries</p>
                    <div className="flex flex-wrap gap-1.5">
                      {platform.bestIndustries.map((ind, i) => (
                        <Chip key={i} className={platform.badge}>{ind}</Chip>
                      ))}
                    </div>
                  </div>
                  <div className="bg-bms-darker rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-2">Peak Times</p>
                    <p className="text-xs text-bms-text">{platform.peakTimes}</p>
                    <p className="text-[10px] text-bms-muted mt-2">Posting frequency</p>
                    <p className="text-sm font-semibold text-bms-cyan mt-0.5">{platform.postingFrequency}</p>
                  </div>
                </div>
                <div className="bg-bms-cyan/5 border border-bms-cyan/15 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-bms-cyan uppercase tracking-wide mb-2">What's Working in 2025</p>
                  <ul className="space-y-1.5">
                    {platform.whatWorkingNow.map((w, i) => (
                      <li key={i} className="text-xs text-bms-text flex items-start gap-2">
                        <span className="text-bms-cyan flex-shrink-0">→</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Industries tab ──────────────────────────────────────────────────────────

function IndustriesTab({ search }: { search: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() =>
    INDUSTRIES.filter(ind =>
      !search ||
      ind.name.toLowerCase().includes(search.toLowerCase()) ||
      ind.topPlatforms.some(p => p.toLowerCase().includes(search.toLowerCase()))
    ), [search])

  return (
    <div className="space-y-3">
      {filtered.length === 0 && (
        <p className="text-bms-muted text-sm">No industries match your search.</p>
      )}
      {filtered.map(industry => {
        const isOpen = expanded === industry.id
        return (
          <div key={industry.id} className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : industry.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-bms-darker/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-bms-purple/10 border border-bms-purple/20 flex items-center justify-center text-xl flex-shrink-0">
                {industry.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-bms-text">{industry.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {industry.topPlatforms.slice(0, 3).map((p, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{p}</span>
                  ))}
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-bms-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-bms-muted flex-shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-bms-border p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-bms-darker rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-1">Content Style That Works</p>
                    <p className="text-xs text-bms-text leading-relaxed">{industry.contentStyle}</p>
                  </div>
                  <div className="bg-bms-darker rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-1">Key Metrics to Track</p>
                    <p className="text-xs text-bms-text leading-relaxed">{industry.keyMetrics}</p>
                  </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-2">Common Mistakes</p>
                  <ul className="space-y-1.5">
                    {industry.commonMistakes.map((m, i) => (
                      <li key={i} className="text-xs text-bms-text flex items-start gap-2">
                        <span className="text-red-400 flex-shrink-0">✗</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1">Expected Results with Consistent Effort</p>
                  <p className="text-xs text-bms-text">{industry.expectedResults}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Trending tab ─────────────────────────────────────────────────────────────

function TrendingTab({ search }: { search: string }) {
  const filtered = useMemo(() =>
    TRENDING_2025.filter(t =>
      !search || t.title.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filtered.map((item, i) => (
        <div key={i} className={cn('bg-bms-card border rounded-2xl p-5 space-y-3', item.color)}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{item.icon}</div>
            <h3 className="font-semibold text-bms-text">{item.title}</h3>
          </div>
          <p className="text-xs text-bms-muted leading-relaxed">{item.description}</p>
          <div>
            <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-2">Key Tactics</p>
            <ul className="space-y-1.5">
              {item.tactics.map((tactic, j) => (
                <li key={j} className="text-xs text-bms-text flex items-start gap-2">
                  <span className="text-bms-cyan flex-shrink-0">→</span>{tactic}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-bms-cyan/5 border border-bms-cyan/15 rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-bms-cyan uppercase tracking-wide mb-0.5">ROI Data</p>
            <p className="text-xs text-bms-text">{item.roi}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Results calculator tab ───────────────────────────────────────────────────

function ResultsTab() {
  return (
    <div className="space-y-6">
      <SectionTitle>Expected Results Reference Table</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border border-bms-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bms-darker border-b border-bms-border">
              {['Effort Level', 'Activity', 'Followers/Month', 'Engagement Rate', 'Lead Gen', 'Revenue Impact', 'Time to Results'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-bms-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESULTS_TABLE.map((row, i) => (
              <tr key={i} className={cn('border-b border-bms-border/50', i % 2 === 0 ? 'bg-bms-card' : 'bg-bms-darker/30')}>
                <td className="px-4 py-3">
                  <Chip className={row.badge}>{row.level}</Chip>
                </td>
                <td className="px-4 py-3 text-xs text-bms-text">{row.effort}</td>
                <td className="px-4 py-3 text-xs font-semibold text-bms-cyan">{row.followersPerMonth}</td>
                <td className="px-4 py-3 text-xs text-bms-text">{row.engagementRate}</td>
                <td className="px-4 py-3 text-xs text-bms-text">{row.leadGen}</td>
                <td className="px-4 py-3 text-xs text-bms-text">{row.revenueImpact}</td>
                <td className="px-4 py-3 text-xs font-medium text-emerald-400">{row.timeToResults}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
        <h3 className="font-semibold text-bms-text mb-3">Key Insight: The Consistency Effect</h3>
        <p className="text-sm text-bms-muted leading-relaxed mb-4">
          The single biggest factor in social media success isn&apos;t talent or budget — it&apos;s consistency.
          Brands that post consistently for 90+ days see exponential results compared to those who stop and start.
          The algorithm rewards consistent creators with increased organic reach over time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: '30 Days', value: 'Foundation laid, algorithm learning your content', color: 'text-amber-400' },
            { label: '60 Days', value: 'Algorithm boost kicks in, reach expanding to non-followers', color: 'text-blue-400' },
            { label: '90 Days', value: 'Compounding effect — followers start bringing followers', color: 'text-emerald-400' },
          ].map((item, i) => (
            <div key={i} className="bg-bms-darker rounded-xl p-3">
              <p className={cn('font-bold text-sm mb-1', item.color)}>{item.label}</p>
              <p className="text-xs text-bms-muted">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Benchmarks tab ──────────────────────────────────────────────────────────

function BenchmarksTab({ search }: { search: string }) {
  const filtered = useMemo(() =>
    INDUSTRY_BENCHMARKS.filter(b =>
      !search || b.industry.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="space-y-4">
      <SectionTitle>Industry Benchmarks</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border border-bms-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bms-darker border-b border-bms-border">
              {['Industry', 'Avg Engagement', 'Follower Growth', 'Conversion Rate', 'Ad ROAS'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-bms-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} className={cn('border-b border-bms-border/50', i % 2 === 0 ? 'bg-bms-card' : 'bg-bms-darker/30')}>
                <td className="px-4 py-3 text-xs font-semibold text-bms-text">{row.industry}</td>
                <td className="px-4 py-3 text-xs font-bold text-bms-cyan">{row.avgEngagement}</td>
                <td className="px-4 py-3 text-xs text-bms-text">{row.followerGrowth}</td>
                <td className="px-4 py-3 text-xs text-bms-text">{row.conversionRate}</td>
                <td className="px-4 py-3 text-xs font-semibold text-emerald-400">{row.adROAS}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-bms-muted">
        * Benchmarks based on 2024-2025 industry data. Results vary by account age, audience quality, content quality, and posting consistency.
        These figures represent achievable targets with a consistent, strategic approach.
      </p>
    </div>
  )
}

// ─── Skills tab ──────────────────────────────────────────────────────────────

function SkillsTab({ search }: { search: string }) {
  const filtered = useMemo(() =>
    MARKETING_SKILLS.filter(s =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="space-y-4">
      <div className="bg-bms-card border border-bms-border rounded-2xl p-4">
        <p className="text-xs text-bms-muted leading-relaxed">
          These skills are available from <strong className="text-bms-text">coreyhaines31/marketingskills</strong> and can be triggered directly from your marketing workflows.
          Each skill is an AI-powered module designed to help with a specific aspect of your marketing strategy.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(skill => (
          <div key={skill.id} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-3 hover:border-bms-cyan/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{skill.icon}</div>
                <h3 className="font-semibold text-bms-text">{skill.name}</h3>
              </div>
              <Chip className={skill.categoryColor}>{skill.category}</Chip>
            </div>
            <p className="text-xs text-bms-muted leading-relaxed">{skill.description}</p>
            <div className="bg-bms-darker rounded-xl px-3 py-2">
              <p className="text-[9px] font-semibold text-bms-muted uppercase tracking-wide mb-1">When to Use</p>
              <p className="text-xs text-bms-text">{skill.whenToUse}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<TabId>('platforms')
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-bms-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-bms-text">Marketing Knowledge Base</h1>
            <p className="text-bms-muted text-sm mt-1">
              Platform guides, industry benchmarks, and proven strategies — all in one place.
            </p>
          </div>
        </div>
        <Link
          href="/marketing-plan"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-cyan/30 text-sm transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketing Plan
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bms-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search platforms, industries, strategies..."
          className="w-full pl-10 pr-4 py-3 bg-bms-card border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors"
        />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap',
                active
                  ? 'bg-bms-cyan/10 border-bms-cyan/30 text-bms-cyan'
                  : 'bg-bms-card border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-border/80'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'platforms'  && <PlatformsTab search={search} />}
      {activeTab === 'industries' && <IndustriesTab search={search} />}
      {activeTab === 'trending'   && <TrendingTab search={search} />}
      {activeTab === 'results'    && <ResultsTab />}
      {activeTab === 'benchmarks' && <BenchmarksTab search={search} />}
      {activeTab === 'skills'     && <SkillsTab search={search} />}
    </div>
  )
}
