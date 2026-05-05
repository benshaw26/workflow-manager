'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, Search, ArrowLeft, TrendingUp, Layers, Zap,
  BarChart2, Trophy, Wrench, ChevronDown, ChevronUp,
  Lightbulb, Brain, Share2, Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PLATFORMS, INDUSTRIES, TRENDING_2025, RESULTS_TABLE,
  INDUSTRY_BENCHMARKS, MARKETING_SKILLS,
} from './kb-data'
import {
  HOOK_FORMULAS, COPYWRITING_FRAMEWORKS, ALGORITHM_INSIGHTS,
  VIRAL_TRIGGERS, AD_CREATIVE_PRINCIPLES, CONTENT_REPURPOSING,
  INFLUENCER_TIERS, EMAIL_BENCHMARKS, HASHTAG_STRATEGY, BRAND_STORYTELLING,
} from './kb-advanced'

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'platforms' | 'industries' | 'trending' | 'results' | 'benchmarks'
           | 'skills' | 'hooks' | 'algorithms' | 'advanced'

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'platforms',   label: 'Platform Guide',     icon: Layers    },
  { id: 'industries',  label: 'Industries',          icon: TrendingUp },
  { id: 'trending',    label: "What's Working",      icon: Zap       },
  { id: 'hooks',       label: 'Hooks & Copy',        icon: Lightbulb },
  { id: 'algorithms',  label: 'Algorithms',          icon: Brain     },
  { id: 'advanced',    label: 'Advanced Tactics',    icon: Share2    },
  { id: 'results',     label: 'Results Table',       icon: BarChart2 },
  { id: 'benchmarks',  label: 'Benchmarks',          icon: Trophy    },
  { id: 'skills',      label: 'Marketing Skills',    icon: Wrench    },
]

// ─── Shared helpers ──────────────────────────────────────────────────────────

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', className)}>
      {children}
    </span>
  )
}

// ─── Platform Guide ────────────────────────────────────────────────────────────

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
      {filtered.length === 0 && <p className="text-bms-muted text-sm">No platforms match your search.</p>}
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
                <p className="text-xs text-bms-muted mt-0.5">{platform.postingFrequency} · Avg engagement: {platform.avgEngagementRate}</p>
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

// ─── Industries ────────────────────────────────────────────────────────────────

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
      {filtered.length === 0 && <p className="text-bms-muted text-sm">No industries match your search.</p>}
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

// ─── What's Working ────────────────────────────────────────────────────────────

function TrendingTab({ search }: { search: string }) {
  const filtered = useMemo(() =>
    TRENDING_2025.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filtered.map((item, i) => (
        <div key={i} className={cn('bg-bms-card border rounded-2xl p-5 space-y-3', item.color)}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{item.icon}</div>
            <h3 className="font-semibold text-bms-text">{item.title}</h3>
          </div>
          <p className="text-xs text-bms-muted leading-relaxed">{item.description}</p>
          <ul className="space-y-1.5">
            {item.tactics.map((tactic, j) => (
              <li key={j} className="text-xs text-bms-text flex items-start gap-2">
                <span className="text-bms-cyan flex-shrink-0">→</span>{tactic}
              </li>
            ))}
          </ul>
          <div className="bg-bms-cyan/5 border border-bms-cyan/15 rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-bms-cyan uppercase tracking-wide mb-0.5">ROI Data</p>
            <p className="text-xs text-bms-text">{item.roi}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Hooks & Copywriting ────────────────────────────────────────────────────────

function HooksTab({ search }: { search: string }) {
  const [view, setView] = useState<'hooks' | 'frameworks'>('hooks')
  const filteredHooks = useMemo(() =>
    HOOK_FORMULAS.filter(h =>
      !search || h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.bestFor.some(b => b.toLowerCase().includes(search.toLowerCase()))
    ), [search])
  const filteredFrameworks = useMemo(() =>
    COPYWRITING_FRAMEWORKS.filter(f =>
      !search || f.name.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['hooks', 'frameworks'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize',
              view === v ? 'bg-bms-cyan/10 border-bms-cyan/30 text-bms-cyan' : 'bg-bms-card border-bms-border text-bms-muted hover:text-bms-text'
            )}>
            {v === 'hooks' ? '🎣 Hook Formulas' : '📋 Copy Frameworks'}
          </button>
        ))}
      </div>

      {view === 'hooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHooks.map(hook => (
            <div key={hook.id} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-bms-text">{hook.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i < hook.viralScore ? 'bg-bms-cyan' : 'bg-bms-border')} />
                      ))}
                    </div>
                    <span className="text-[10px] text-bms-muted">Viral score {hook.viralScore}/10</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {hook.platforms.slice(0, 2).map((p, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{p}</span>
                  ))}
                </div>
              </div>
              <div className="bg-bms-darker rounded-xl p-3">
                <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-1">Template</p>
                <p className="text-xs text-bms-text italic">{hook.template}</p>
              </div>
              <div className="bg-bms-cyan/5 border border-bms-cyan/15 rounded-xl p-3">
                <p className="text-[10px] text-bms-cyan uppercase tracking-wide mb-1">Example</p>
                <p className="text-xs text-bms-text">{hook.example}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {hook.bestFor.map((b, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">{b}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'frameworks' && (
        <div className="space-y-4">
          {filteredFrameworks.map(fw => (
            <div key={fw.id} className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-bms-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-bms-text text-lg">{fw.name}</p>
                    <p className="text-xs text-bms-muted mt-0.5">{fw.acronym}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-bms-muted uppercase">Avg conversion lift</p>
                    <p className="text-sm font-bold text-emerald-400">{fw.avgConversionLift}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {fw.bestFor.map((b, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{b}</span>
                  ))}
                </div>
              </div>
              <div className="p-5 space-y-3">
                {fw.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-bms-cyan">{step.letter}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-bms-text">{step.name}</p>
                      <p className="text-[10px] text-bms-muted mt-0.5">{step.description}</p>
                      <p className="text-[10px] text-bms-cyan italic mt-1">{step.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Algorithms ────────────────────────────────────────────────────────────────

function AlgorithmsTab({ search }: { search: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const filtered = useMemo(() =>
    ALGORITHM_INSIGHTS.filter(a =>
      !search || a.platform.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="space-y-3">
      {filtered.map(algo => {
        const isOpen = expanded === algo.platform
        return (
          <div key={algo.platform} className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : algo.platform)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-bms-darker/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-bms-darker border border-bms-border flex items-center justify-center text-xl flex-shrink-0">
                {algo.emoji}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-bms-text">{algo.platform} Algorithm</p>
                <p className="text-[10px] text-bms-muted mt-0.5">Distribution window: {algo.distributionWindow}</p>
              </div>
              {algo.secondChance && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">2nd chance</span>
              )}
              {isOpen ? <ChevronUp className="w-4 h-4 text-bms-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-bms-muted flex-shrink-0" />}
            </button>
            {isOpen && (
              <div className="border-t border-bms-border p-5 space-y-4">
                <p className="text-xs text-bms-muted leading-relaxed">{algo.howItWorks}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-bms-darker rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-bms-cyan uppercase tracking-wide mb-2">Key Ranking Signals</p>
                    <ul className="space-y-1">
                      {algo.keySignals.map((s, i) => (
                        <li key={i} className="text-xs text-bms-text flex items-start gap-1.5">
                          <span className="text-bms-cyan flex-shrink-0 mt-0.5">·</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-2">Boost Your Reach</p>
                    <ul className="space-y-1">
                      {algo.boostActions.map((a, i) => (
                        <li key={i} className="text-xs text-bms-text flex items-start gap-1.5">
                          <span className="text-emerald-400 flex-shrink-0">✓</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-2">What Kills Reach</p>
                    <ul className="space-y-1">
                      {algo.killActions.map((a, i) => (
                        <li key={i} className="text-xs text-bms-text flex items-start gap-1.5">
                          <span className="text-red-400 flex-shrink-0">✗</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {algo.secondChance && algo.secondChanceNote && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-2">
                    <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Second Chance Window</p>
                    <p className="text-xs text-bms-muted">{algo.secondChanceNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Advanced Tactics ─────────────────────────────────────────────────────────

function AdvancedTab({ search }: { search: string }) {
  const [view, setView] = useState<'viral' | 'ads' | 'repurpose' | 'influencer' | 'email' | 'hashtags' | 'storytelling'>('viral')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ['viral',       '🔥 Viral Triggers'],
          ['ads',         '💰 Ad Creative'],
          ['repurpose',   '♻️ Repurposing'],
          ['influencer',  '🌟 Influencers'],
          ['email',       '📧 Email Benchmarks'],
          ['hashtags',    '#️⃣ Hashtags'],
          ['storytelling','📖 Brand Story'],
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              view === v ? 'bg-bms-cyan/10 border-bms-cyan/30 text-bms-cyan' : 'bg-bms-card border-bms-border text-bms-muted hover:text-bms-text'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Viral Triggers */}
      {view === 'viral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VIRAL_TRIGGERS.filter(t => !search || t.trigger.toLowerCase().includes(search.toLowerCase())).map((item, i) => (
            <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-bms-text">{item.trigger}</p>
                  <p className="text-[10px] text-bms-cyan">{item.viralProbability}</p>
                </div>
              </div>
              <p className="text-xs text-bms-muted leading-relaxed">{item.why}</p>
              <ul className="space-y-1">
                {item.howToUse.map((h, j) => (
                  <li key={j} className="text-xs text-bms-text flex items-start gap-1.5">
                    <span className="text-bms-cyan flex-shrink-0">→</span>{h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Ad Creative */}
      {view === 'ads' && (
        <div className="space-y-4">
          {AD_CREATIVE_PRINCIPLES.map((p, i) => (
            <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{p.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-bms-text">{p.principle}</p>
                  <p className="text-xs text-bms-muted mt-1 leading-relaxed">{p.detail}</p>
                </div>
              </div>
              <ul className="space-y-1.5 pl-10">
                {p.tactics.map((t, j) => (
                  <li key={j} className="text-xs text-bms-text flex items-start gap-1.5">
                    <span className="text-bms-cyan flex-shrink-0">→</span>{t}
                  </li>
                ))}
              </ul>
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2 ml-10">
                <p className="text-[10px] text-emerald-400 font-semibold">{p.impact}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repurposing */}
      {view === 'repurpose' && (
        <div className="space-y-3">
          <div className="bg-bms-card border border-bms-border rounded-xl px-4 py-3">
            <p className="text-xs text-bms-muted">Create one piece of cornerstone content, then systematically turn it into 15–20+ assets for every platform. This is how top creators produce 50+ pieces of content per week from just 3–4 core pieces.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-bms-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bms-darker border-b border-bms-border">
                  {['Source Format', 'Derivative Content', 'Platform', 'Effort'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-bms-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONTENT_REPURPOSING.filter(r => !search || r.sourceFormat.toLowerCase().includes(search.toLowerCase())).map((row, i) => (
                  <tr key={i} className={cn('border-b border-bms-border/50', i % 2 === 0 ? 'bg-bms-card' : 'bg-bms-darker/30')}>
                    <td className="px-4 py-2.5 font-medium text-bms-text whitespace-nowrap">{row.icon} {row.sourceFormat}</td>
                    <td className="px-4 py-2.5 text-bms-muted">{row.derivative}</td>
                    <td className="px-4 py-2.5 text-bms-cyan">{row.platform}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium',
                        row.effort === 'Low' ? 'bg-emerald-500/10 text-emerald-400' : row.effort === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      )}>{row.effort}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Influencer Tiers */}
      {view === 'influencer' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INFLUENCER_TIERS.map((tier, i) => (
            <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{tier.emoji}</span>
                <div>
                  <p className="font-bold text-bms-text">{tier.tier}</p>
                  <p className="text-xs text-bms-muted">{tier.range}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-bms-darker rounded-xl p-2.5">
                  <p className="text-[9px] text-bms-muted uppercase">Avg Engagement</p>
                  <p className="text-sm font-bold text-bms-cyan">{tier.avgEngagement}</p>
                </div>
                <div className="bg-bms-darker rounded-xl p-2.5">
                  <p className="text-[9px] text-bms-muted uppercase">Cost per Post</p>
                  <p className="text-sm font-bold text-bms-text">{tier.avgCostPerPost}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-1">Best For</p>
                <div className="flex flex-wrap gap-1">
                  {tier.bestFor.map((b, j) => (
                    <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{b}</span>
                  ))}
                </div>
              </div>
              <div className="bg-bms-cyan/5 border border-bms-cyan/15 rounded-xl px-3 py-2">
                <p className="text-[10px] text-bms-cyan font-semibold mb-0.5">Pro Tip</p>
                <p className="text-xs text-bms-muted">{tier.tipToWork}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email Benchmarks */}
      {view === 'email' && (
        <div className="overflow-x-auto rounded-2xl border border-bms-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bms-darker border-b border-bms-border">
                {['Industry', 'Open Rate', 'CTR', 'Conversion', 'Best Day', 'Top Tip'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-bms-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EMAIL_BENCHMARKS.filter(b => !search || b.industry.toLowerCase().includes(search.toLowerCase())).map((row, i) => (
                <tr key={i} className={cn('border-b border-bms-border/50', i % 2 === 0 ? 'bg-bms-card' : 'bg-bms-darker/30')}>
                  <td className="px-4 py-3 font-semibold text-bms-text">{row.industry}</td>
                  <td className="px-4 py-3 font-bold text-bms-cyan">{row.avgOpenRate}</td>
                  <td className="px-4 py-3 text-bms-text">{row.avgCTR}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">{row.avgConversion}</td>
                  <td className="px-4 py-3 text-bms-muted">{row.bestSendDay}</td>
                  <td className="px-4 py-3 text-bms-muted max-w-xs">{row.topTip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hashtag Strategy */}
      {view === 'hashtags' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(HASHTAG_STRATEGY) as [string, typeof HASHTAG_STRATEGY[keyof typeof HASHTAG_STRATEGY]][])
            .filter(([platform]) => !search || platform.toLowerCase().includes(search.toLowerCase()))
            .map(([platform, data], i) => (
            <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-bms-text capitalize">{platform}</p>
              <div className="space-y-2">
                {[
                  { label: 'Ideal Count', value: data.idealCount },
                  { label: 'Mix Strategy', value: data.mix },
                  { label: 'Placement',   value: data.placement },
                  { label: 'Avoid',       value: data.avoid },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-bms-darker rounded-xl px-3 py-2">
                    <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-xs text-bms-text">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-bms-cyan/5 border border-bms-cyan/15 rounded-xl px-3 py-2">
                <p className="text-[10px] text-bms-cyan font-semibold mb-0.5">Pro Tip</p>
                <p className="text-xs text-bms-muted">{data.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storytelling Frameworks */}
      {view === 'storytelling' && (
        <div className="space-y-4">
          {BRAND_STORYTELLING.map((fw, i) => (
            <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-4">
              <p className="font-bold text-bms-text">{fw.name}</p>
              <div className="space-y-2">
                {fw.structure.map((step, j) => (
                  <div key={j} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-bms-purple/20 border border-bms-purple/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-bms-purple">{j + 1}</span>
                    </div>
                    <p className="text-xs text-bms-text">{step}</p>
                  </div>
                ))}
              </div>
              <div className="bg-bms-darker rounded-xl p-3">
                <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-1">Example</p>
                <p className="text-xs text-bms-muted italic">{fw.example}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {fw.bestFor.map((b, j) => (
                  <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{b}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Results Table ─────────────────────────────────────────────────────────────

function ResultsTab() {
  return (
    <div className="space-y-6">
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
                <td className="px-4 py-3"><Chip className={row.badge}>{row.level}</Chip></td>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: '30 Days', value: 'Foundation laid, algorithm learning your content', color: 'text-amber-400' },
          { label: '60 Days', value: 'Algorithm boost kicks in, reach expanding to non-followers', color: 'text-blue-400' },
          { label: '90 Days', value: 'Compounding effect — followers start bringing followers', color: 'text-emerald-400' },
        ].map((item, i) => (
          <div key={i} className="bg-bms-darker rounded-xl p-4">
            <p className={cn('font-bold text-sm mb-1', item.color)}>{item.label}</p>
            <p className="text-xs text-bms-muted">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Benchmarks ───────────────────────────────────────────────────────────────

function BenchmarksTab({ search }: { search: string }) {
  const filtered = useMemo(() =>
    INDUSTRY_BENCHMARKS.filter(b => !search || b.industry.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="space-y-4">
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
      <p className="text-xs text-bms-muted">* Benchmarks based on 2024–2025 industry data. Results vary by account age, content quality, and consistency.</p>
    </div>
  )
}

// ─── Skills ────────────────────────────────────────────────────────────────────

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
          Skills from <strong className="text-bms-text">coreyhaines31/marketingskills</strong> — AI-powered modules for every aspect of your marketing strategy.
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
              Platform algorithms, hook formulas, copywriting frameworks, industry benchmarks — everything a world-class marketer needs.
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
          placeholder="Search platforms, hooks, industries, frameworks..."
          className="w-full pl-10 pr-4 py-3 bg-bms-card border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors"
        />
      </div>

      {/* Tabs */}
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
      {activeTab === 'platforms'   && <PlatformsTab  search={search} />}
      {activeTab === 'industries'  && <IndustriesTab  search={search} />}
      {activeTab === 'trending'    && <TrendingTab    search={search} />}
      {activeTab === 'hooks'       && <HooksTab       search={search} />}
      {activeTab === 'algorithms'  && <AlgorithmsTab  search={search} />}
      {activeTab === 'advanced'    && <AdvancedTab    search={search} />}
      {activeTab === 'results'     && <ResultsTab />}
      {activeTab === 'benchmarks'  && <BenchmarksTab  search={search} />}
      {activeTab === 'skills'      && <SkillsTab      search={search} />}
    </div>
  )
}
