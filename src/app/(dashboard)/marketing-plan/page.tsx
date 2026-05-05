'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Globe, ChevronDown, ChevronUp, Clock, Target,
  Zap, Calendar, CheckCircle2, Circle, Sparkles, Loader2,
  AlertTriangle, BarChart, Users, Hash, Palette, Megaphone,
  ArrowRight, BookOpen, X, Layers, BarChart2, Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLATFORMS, INDUSTRIES, TRENDING_2025, RESULTS_TABLE, INDUSTRY_BENCHMARKS, MARKETING_SKILLS } from '../knowledge-base/kb-data'
import SocialAuditTab from './_tabs/SocialAuditTab'
import type { SocialAuditData } from '@/app/api/automations/marketing-plan/social-audit/route'

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentPillar = { name: string; description: string; percentage: number; emoji: string }
type SocialMedia = {
  platform: string; status: string; handle: string; followers: string
  frequency: string; contentTypes: string[]; engagementLevel: string
  score: number; topThemes: string[]
}
type Competitor = { name: string; website: string; strongestPlatform: string; followers: string; contentStyle: string; gap: string }
type Recommendation = { platform: string; priority: string; rationale: string; postingFrequency: string; formats: string[] }
type AdStrategy = { platform: string; adTypes: string[]; objective: string; budgetPercent: number; audienceTargeting: string; creativeDirection: string; messagingAngles: string[] }
type CalendarEntry = { day: string; platform: string; format: string; pillar: string; contentType: string; idea: string }
type KPI = { platform: string; followerGrowth: string; engagementRate: string; contentOutput: string; adBenchmarks: string }

type PlanData = {
  brandSummary: string
  brand: {
    name: string; tagline: string; industry: string; niche: string
    targetAudience: string; toneOfVoice: string; colors: string[]
    pricingTier: string; usps: string[]; geographicFocus: string; products: string[]
  }
  socialMedia: SocialMedia[]
  competitors: Competitor[]
  assessment: {
    overallScore: number; scoreJustification: string; strongestChannel: string
    weakestChannel: string; brandConsistencyScore: number; seoPresence: string; paidAdvertising: string
  }
  recommendations: Recommendation[]
  contentStrategy: {
    tone: string; visualStyle: string; contentPillars: ContentPillar[]
    captionStyle: string
    hashtags: { niche: string[]; medium: string[]; broad: string[] }
    reelsStrategy: string; ugcOpportunities: string
  }
  adStrategy: AdStrategy[]
  contentCalendar: CalendarEntry[]
  quickWins: string[]
  growthRoadmap: {
    month1: { theme: string; focus: string; actions: string[] }
    month2: { theme: string; focus: string; actions: string[] }
    month3: { theme: string; focus: string; actions: string[] }
  }
  kpis: KPI[]
}

type HistoryRun = { id: string; websiteUrl: string; createdAt: string; plan: PlanData | null }

// ─── Constants ───────────────────────────────────────────────────────────────

const STAGES = [
  { n: 1, label: 'Researching Brand' },
  { n: 2, label: 'Analysing Social' },
  { n: 3, label: 'Competitors' },
  { n: 4, label: 'Generating Plan' },
]

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-br from-pink-500 to-purple-600',
  facebook: 'bg-blue-600',
  tiktok: 'bg-gray-900',
  youtube: 'bg-red-600',
  linkedin: 'bg-blue-700',
  twitter: 'bg-gray-800',
  pinterest: 'bg-red-500',
  threads: 'bg-gray-900',
  snapchat: 'bg-yellow-400',
  meta: 'bg-blue-600',
  google: 'bg-emerald-600',
  x: 'bg-gray-800',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', tiktok: 'TT', youtube: 'YT',
  linkedin: 'LI', twitter: 'X', pinterest: 'PIN', threads: 'TH',
  snapchat: 'SC', meta: 'M', google: 'G', x: 'X',
}

const PILLAR_BORDERS = ['border-bms-cyan/30', 'border-purple-500/30', 'border-emerald-500/30', 'border-amber-500/30', 'border-pink-500/30']

// ─── Helper components ────────────────────────────────────────────────────────

function PlatformBadge({ platform, size = 'md' }: { platform: string; size?: 'sm' | 'md' }) {
  const color = PLATFORM_COLORS[platform.toLowerCase()] ?? 'bg-bms-border'
  const label = PLATFORM_LABELS[platform.toLowerCase()] ?? platform.slice(0, 2).toUpperCase()
  const sz = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
  return (
    <span className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0', color, sz)}>
      {label}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full', {
      'bg-emerald-400': status === 'active',
      'bg-red-400': status === 'inactive',
      'bg-bms-muted': status === 'not_found',
    })} />
  )
}

function ScoreBar({ value, max = 10, color = 'bg-bms-cyan' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 bg-bms-border rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-bms-border/30 rounded-xl', className)} />
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap',
        active
          ? 'bg-bms-cyan/10 border-bms-cyan/30 text-bms-cyan'
          : 'bg-bms-card border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-border/80'
      )}
    >
      {label}
    </button>
  )
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', className)}>
      {children}
    </span>
  )
}

function PricingBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    budget: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'mid-market': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    premium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    luxury: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs border font-medium capitalize', map[tier] ?? 'bg-bms-border text-bms-muted border-bms-border')}>
      {tier}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    primary: 'bg-bms-cyan/10 text-bms-cyan border-bms-cyan/30',
    secondary: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    optional: 'bg-bms-border text-bms-muted border-bms-border',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs border font-medium capitalize', map[priority] ?? 'bg-bms-border text-bms-muted border-bms-border')}>
      {priority}
    </span>
  )
}

function ObjectiveBadge({ objective }: { objective: string }) {
  const map: Record<string, string> = {
    conversions: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    awareness: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    traffic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    leads: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs border font-medium capitalize', map[objective] ?? 'bg-bms-border text-bms-muted border-bms-border')}>
      {objective}
    </span>
  )
}

// ─── Skeleton loading state ───────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard className="h-48 md:col-span-3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-48" />
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ plan, url }: { plan: PlanData; url: string }) {
  let domain = ''
  try { domain = new URL(url).hostname } catch { domain = '' }

  const topRec = plan.recommendations?.[0]

  return (
    <div className="space-y-5">
      {/* Brand card */}
      <div className="bg-bms-card border border-bms-border rounded-2xl p-6">
        <div className="flex items-start gap-4">
          {domain && (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              className="w-12 h-12 rounded-xl border border-bms-border flex-shrink-0"
              alt="favicon"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-bms-text">{plan.brand?.name}</h2>
              {plan.brand?.pricingTier && <PricingBadge tier={plan.brand.pricingTier} />}
              {plan.brand?.industry && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-bms-border text-bms-muted">{plan.brand.industry}</span>
              )}
            </div>
            {plan.brand?.tagline && <p className="text-bms-muted text-sm mb-2">{plan.brand.tagline}</p>}
            {plan.brand?.colors && plan.brand.colors.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                {plan.brand.colors.map((c, i) => (
                  <span key={i} className="w-6 h-6 rounded-full border border-white/10 shadow-sm flex-shrink-0" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            )}
            {plan.brand?.usps && plan.brand.usps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {plan.brand.usps.map((u, i) => (
                  <Chip key={i} className="bg-bms-cyan/8 text-bms-cyan border border-bms-cyan/20">{u}</Chip>
                ))}
              </div>
            )}
          </div>
        </div>
        {plan.brandSummary && (
          <p className="text-sm text-bms-muted mt-3 leading-relaxed border-t border-bms-border pt-3">{plan.brandSummary}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-bms-muted">
          {plan.brand?.targetAudience && (
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.brand.targetAudience}</span>
          )}
          {plan.brand?.geographicFocus && (
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{plan.brand.geographicFocus}</span>
          )}
          {plan.brand?.toneOfVoice && (
            <span className="flex items-center gap-1"><Palette className="w-3 h-3" />{plan.brand.toneOfVoice}</span>
          )}
        </div>
      </div>

      {/* 3 score cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Digital presence */}
        <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
          <p className="text-xs text-bms-muted font-medium mb-2 flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5" />Digital Presence</p>
          <div className="flex items-end gap-1 mb-3">
            <span className="text-4xl font-bold text-bms-cyan">{plan.assessment?.overallScore ?? '–'}</span>
            <span className="text-bms-muted text-lg mb-0.5">/10</span>
          </div>
          <ScoreBar value={plan.assessment?.overallScore ?? 0} />
          {plan.assessment?.scoreJustification && (
            <p className="text-[11px] text-bms-muted mt-2 leading-relaxed">{plan.assessment.scoreJustification}</p>
          )}
        </div>

        {/* Brand consistency */}
        <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
          <p className="text-xs text-bms-muted font-medium mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Brand Consistency</p>
          <div className="flex items-end gap-1 mb-3">
            <span className="text-4xl font-bold text-purple-400">{plan.assessment?.brandConsistencyScore ?? '–'}</span>
            <span className="text-bms-muted text-lg mb-0.5">/10</span>
          </div>
          <ScoreBar value={plan.assessment?.brandConsistencyScore ?? 0} color="bg-purple-400" />
          <div className="flex flex-col gap-1 mt-3 text-[11px]">
            {plan.assessment?.strongestChannel && (
              <span className="text-emerald-400 flex items-center gap-1"><ArrowRight className="w-3 h-3" />Strongest: {plan.assessment.strongestChannel}</span>
            )}
            {plan.assessment?.weakestChannel && (
              <span className="text-red-400 flex items-center gap-1"><ArrowRight className="w-3 h-3" />Weakest: {plan.assessment.weakestChannel}</span>
            )}
          </div>
        </div>

        {/* Top opportunity */}
        <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
          <p className="text-xs text-bms-muted font-medium mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />Top Opportunity</p>
          {topRec ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <PlatformBadge platform={topRec.platform} />
                <span className="font-semibold text-bms-text capitalize">{topRec.platform}</span>
                <PriorityBadge priority={topRec.priority} />
              </div>
              <p className="text-[11px] text-bms-muted leading-relaxed">{topRec.rationale}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {topRec.formats?.map((f, i) => (
                  <Chip key={i} className="bg-bms-border text-bms-muted">{f}</Chip>
                ))}
              </div>
            </>
          ) : (
            <p className="text-bms-muted text-sm">No data</p>
          )}
        </div>
      </div>

      {/* Social media quick stats */}
      {plan.socialMedia && plan.socialMedia.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3">Social Media Presence</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {plan.socialMedia.map((sm, i) => (
              <div key={i} className="bg-bms-card border border-bms-border rounded-xl p-4 flex-shrink-0 w-44">
                <div className="flex items-center gap-2 mb-2">
                  <PlatformBadge platform={sm.platform} size="sm" />
                  <span className="font-medium text-xs text-bms-text capitalize">{sm.platform}</span>
                  <StatusDot status={sm.status} />
                </div>
                <p className="text-lg font-bold text-bms-text truncate">{sm.followers !== 'unknown' ? sm.followers : '–'}</p>
                <p className="text-[10px] text-bms-muted">{sm.followers === 'unknown' ? 'Not found' : 'followers'}</p>
                <div className="mt-2">
                  <Chip className={cn('', {
                    'bg-emerald-500/10 text-emerald-400': sm.engagementLevel === 'high',
                    'bg-amber-500/10 text-amber-400': sm.engagementLevel === 'medium',
                    'bg-red-500/10 text-red-400': sm.engagementLevel === 'low',
                    'bg-bms-border text-bms-muted': sm.engagementLevel === 'unknown',
                  })}>{sm.engagementLevel} eng.</Chip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Platforms ───────────────────────────────────────────────────────────

function PlatformsTab({ plan }: { plan: PlanData }) {
  return (
    <div className="space-y-8">
      {/* Current presence */}
      {plan.socialMedia && plan.socialMedia.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3">Current Presence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.socialMedia.map((sm, i) => {
              const colorClass = PLATFORM_COLORS[sm.platform.toLowerCase()] ?? 'bg-bms-border'
              return (
                <div key={i} className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
                  <div className={cn('h-2 w-full', colorClass)} />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={sm.platform} />
                        <span className="font-semibold text-bms-text capitalize text-sm">{sm.platform}</span>
                      </div>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', {
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': sm.status === 'active',
                        'bg-red-500/10 text-red-400 border-red-500/20': sm.status === 'inactive',
                        'bg-bms-border text-bms-muted border-bms-border': sm.status === 'not_found',
                      })}>{sm.status.replace('_', ' ')}</span>
                    </div>
                    {sm.handle && sm.handle !== 'unknown' && (
                      <p className="text-bms-muted text-xs">{sm.handle}</p>
                    )}
                    <div>
                      <p className="text-xl font-bold text-bms-text">{sm.followers !== 'unknown' ? sm.followers : '—'}</p>
                      <p className="text-[10px] text-bms-muted">followers</p>
                    </div>
                    {sm.frequency && sm.frequency !== 'unknown' && (
                      <div className="flex items-center gap-1 text-xs text-bms-muted">
                        <Clock className="w-3 h-3" />{sm.frequency}
                      </div>
                    )}
                    {sm.contentTypes && sm.contentTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sm.contentTypes.map((ct, j) => (
                          <Chip key={j} className="bg-bms-border text-bms-muted">{ct}</Chip>
                        ))}
                      </div>
                    )}
                    {sm.topThemes && sm.topThemes.length > 0 && (
                      <ul className="space-y-0.5">
                        {sm.topThemes.map((t, j) => (
                          <li key={j} className="text-[11px] text-bms-muted flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-bms-muted/50 flex-shrink-0" />{t}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-bms-muted mb-1">
                        <span>Score</span><span>{sm.score}/10</span>
                      </div>
                      <ScoreBar value={sm.score} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {plan.recommendations && plan.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3">Platform Recommendations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plan.recommendations.map((rec, i) => (
              <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={rec.platform} />
                  <span className="font-semibold text-bms-text capitalize">{rec.platform}</span>
                  <PriorityBadge priority={rec.priority} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-bms-cyan">{rec.postingFrequency}</p>
                  <p className="text-[10px] text-bms-muted">posting frequency</p>
                </div>
                {rec.formats && rec.formats.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rec.formats.map((f, j) => (
                      <Chip key={j} className="bg-bms-border text-bms-muted">{f}</Chip>
                    ))}
                  </div>
                )}
                <p className="text-xs text-bms-muted leading-relaxed">{rec.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {plan.competitors && plan.competitors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3">Competitor Analysis</h3>
          <div className="space-y-3">
            {plan.competitors.map((comp, i) => (
              <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-bms-text">{comp.name}</p>
                    <p className="text-xs text-bms-muted">{comp.website}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {comp.strongestPlatform && <PlatformBadge platform={comp.strongestPlatform} size="sm" />}
                    {comp.followers && <span className="text-sm font-medium text-bms-text">{comp.followers}</span>}
                  </div>
                </div>
                {comp.contentStyle && <p className="text-xs text-bms-muted mb-2">{comp.contentStyle}</p>}
                {comp.gap && (
                  <div className="flex items-start gap-2 bg-bms-cyan/5 border border-bms-cyan/15 rounded-xl px-3 py-2">
                    <Zap className="w-3.5 h-3.5 text-bms-cyan flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-bms-cyan">{comp.gap}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Content ─────────────────────────────────────────────────────────────

function ContentTab({ plan }: { plan: PlanData }) {
  const cs = plan.contentStrategy
  if (!cs) return <p className="text-bms-muted text-sm">No content strategy data.</p>

  const contentTypeIcon = (ct: string) => {
    if (ct === 'reel' || ct === 'video') return '▶'
    if (ct === 'story') return '○'
    return '▪'
  }

  return (
    <div className="space-y-8">
      {/* Content pillars */}
      {cs.contentPillars && cs.contentPillars.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3">Content Pillars</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cs.contentPillars.map((pillar, i) => (
              <div key={i} className={cn('bg-bms-card border rounded-2xl p-5 space-y-3', PILLAR_BORDERS[i % PILLAR_BORDERS.length])}>
                <div className="text-3xl">{pillar.emoji}</div>
                <div>
                  <p className="font-semibold text-bms-text">{pillar.name}</p>
                  <p className="text-xs text-bms-muted mt-1 leading-relaxed">{pillar.description}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-bms-muted">Share of content</span>
                    <span className="font-bold text-bms-cyan">{pillar.percentage}%</span>
                  </div>
                  <ScoreBar value={pillar.percentage} max={100} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hashtag strategy */}
      {cs.hashtags && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-1.5">
            <Hash className="w-4 h-4" />Hashtag Strategy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-bms-card border border-bms-border rounded-2xl p-4">
              <p className="text-xs font-semibold text-bms-muted mb-3 uppercase tracking-wide">Niche</p>
              <div className="flex flex-wrap gap-1.5">
                {(cs.hashtags.niche ?? []).map((tag, i) => (
                  <Chip key={i} className="bg-bms-cyan/10 text-bms-cyan border border-bms-cyan/20">{tag}</Chip>
                ))}
              </div>
            </div>
            <div className="bg-bms-card border border-bms-border rounded-2xl p-4">
              <p className="text-xs font-semibold text-bms-muted mb-3 uppercase tracking-wide">Medium</p>
              <div className="flex flex-wrap gap-1.5">
                {(cs.hashtags.medium ?? []).map((tag, i) => (
                  <Chip key={i} className="bg-purple-500/10 text-purple-400 border border-purple-500/20">{tag}</Chip>
                ))}
              </div>
            </div>
            <div className="bg-bms-card border border-bms-border rounded-2xl p-4">
              <p className="text-xs font-semibold text-bms-muted mb-3 uppercase tracking-wide">Broad</p>
              <div className="flex flex-wrap gap-1.5">
                {(cs.hashtags.broad ?? []).map((tag, i) => (
                  <Chip key={i} className="bg-bms-border text-bms-muted">{tag}</Chip>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content calendar */}
      {plan.contentCalendar && plan.contentCalendar.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />Weekly Content Calendar
          </h3>
          <div className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_90px_80px_1fr] text-[10px] font-semibold text-bms-muted uppercase tracking-wide px-4 py-2 border-b border-bms-border bg-bms-darker">
              <span>Day</span><span>Platform</span><span>Format</span><span>Type</span><span>Idea</span>
            </div>
            {plan.contentCalendar.map((entry, i) => (
              <div key={i} className={cn('grid grid-cols-[80px_1fr_90px_80px_1fr] items-center px-4 py-3 gap-2', i % 2 === 0 ? 'bg-bms-darker/40' : '')}>
                <span className="text-xs font-medium text-bms-text">{entry.day}</span>
                <div className="flex items-center gap-1.5">
                  <PlatformBadge platform={entry.platform} size="sm" />
                  <span className="text-xs text-bms-muted capitalize">{entry.platform}</span>
                </div>
                <Chip className="bg-bms-border text-bms-muted w-fit">{entry.format}</Chip>
                <span className="text-xs text-bms-muted">{contentTypeIcon(entry.contentType)} {entry.contentType}</span>
                <span className="text-xs text-bms-muted italic truncate">{entry.idea}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tone & visual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cs.tone && (
          <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-bms-muted mb-2 flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" />Tone & Voice</p>
            <p className="text-sm text-bms-text leading-relaxed">{cs.tone}</p>
          </div>
        )}
        {cs.visualStyle && (
          <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-bms-muted mb-2 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" />Visual Style</p>
            <p className="text-sm text-bms-text leading-relaxed">{cs.visualStyle}</p>
          </div>
        )}
        {cs.reelsStrategy && (
          <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-bms-muted mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />Reels Strategy</p>
            <p className="text-sm text-bms-text leading-relaxed">{cs.reelsStrategy}</p>
          </div>
        )}
        {cs.ugcOpportunities && (
          <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-bms-muted mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />UGC Opportunities</p>
            <p className="text-sm text-bms-text leading-relaxed">{cs.ugcOpportunities}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Ads ─────────────────────────────────────────────────────────────────

function AdsTab({ plan }: { plan: PlanData }) {
  if (!plan.adStrategy || plan.adStrategy.length === 0) {
    return (
      <div className="bg-bms-card border border-bms-border rounded-2xl p-8 text-center">
        <Megaphone className="w-8 h-8 mx-auto mb-3 text-bms-muted opacity-30" />
        <p className="text-sm text-bms-muted">No paid advertising recommended at this stage.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {plan.adStrategy.map((ad, i) => (
        <div key={i} className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
          <div className={cn('px-5 py-4 flex items-center justify-between flex-wrap gap-2', PLATFORM_COLORS[ad.platform.toLowerCase()] ?? 'bg-bms-border')}>
            <div className="flex items-center gap-3">
              <PlatformBadge platform={ad.platform} />
              <span className="font-semibold text-white capitalize text-base">{ad.platform} Ads</span>
            </div>
            <span className="text-2xl font-bold text-white">{ad.budgetPercent}% <span className="text-sm font-normal opacity-80">of budget</span></span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <ObjectiveBadge objective={ad.objective} />
              {ad.adTypes?.map((t, j) => (
                <Chip key={j} className="bg-bms-border text-bms-muted">{t}</Chip>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ad.audienceTargeting && (
                <div>
                  <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-1 flex items-center gap-1"><Users className="w-3 h-3" />Audience Targeting</p>
                  <p className="text-sm text-bms-text">{ad.audienceTargeting}</p>
                </div>
              )}
              {ad.creativeDirection && (
                <div>
                  <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-1 flex items-center gap-1"><Palette className="w-3 h-3" />Creative Direction</p>
                  <p className="text-sm text-bms-text">{ad.creativeDirection}</p>
                </div>
              )}
            </div>
            {ad.messagingAngles && ad.messagingAngles.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-2">Messaging Angles</p>
                <ol className="space-y-1">
                  {ad.messagingAngles.map((angle, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-bms-text">
                      <span className="w-5 h-5 rounded-full bg-bms-cyan/10 text-bms-cyan text-[10px] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{j + 1}</span>
                      {angle}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Growth ──────────────────────────────────────────────────────────────

function GrowthTab({ plan, quickWinsDone, setQuickWinsDone }: {
  plan: PlanData
  quickWinsDone: Set<number>
  setQuickWinsDone: React.Dispatch<React.SetStateAction<Set<number>>>
}) {
  const toggleWin = (i: number) => {
    setQuickWinsDone(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const roadmap = plan.growthRoadmap
  const months = roadmap ? [
    { key: 'month1', data: roadmap.month1, borderColor: 'border-bms-cyan/30', numColor: 'text-bms-cyan', bg: 'bg-bms-cyan/5' },
    { key: 'month2', data: roadmap.month2, borderColor: 'border-purple-500/30', numColor: 'text-purple-400', bg: 'bg-purple-500/5' },
    { key: 'month3', data: roadmap.month3, borderColor: 'border-emerald-500/30', numColor: 'text-emerald-400', bg: 'bg-emerald-500/5' },
  ] : []

  return (
    <div className="space-y-8">
      {/* Quick wins */}
      {plan.quickWins && plan.quickWins.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-bms-cyan" />Quick Wins — First 30 Days
          </h3>
          <div className="space-y-2">
            {plan.quickWins.map((win, i) => {
              const done = quickWinsDone.has(i)
              return (
                <button
                  key={i}
                  onClick={() => toggleWin(i)}
                  className={cn(
                    'w-full bg-bms-card border border-bms-border rounded-xl px-4 py-3 flex items-start gap-3 text-left transition-all hover:border-bms-cyan/30',
                    done && 'opacity-60'
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-bms-muted flex-shrink-0 mt-0.5" />
                  )}
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                    done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-bms-cyan/10 text-bms-cyan'
                  )}>{done ? '✓' : i + 1}</span>
                  <span className={cn('text-sm text-bms-text', done && 'line-through text-bms-muted')}>{win}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Growth roadmap */}
      {months.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />3-Month Growth Roadmap
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {months.map(({ key, data, borderColor, numColor, bg }) => (
              data && (
                <div key={key} className={cn('bg-bms-card border rounded-2xl p-5 space-y-3', borderColor)}>
                  <div className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', bg, numColor)}>
                    {key === 'month1' ? 'Month 1' : key === 'month2' ? 'Month 2' : 'Month 3'}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-bms-text">{data.theme}</p>
                    <p className="text-xs text-bms-muted italic mt-0.5">{data.focus}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {(data.actions ?? []).map((action, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-bms-muted">
                        <ArrowRight className={cn('w-3 h-3 flex-shrink-0 mt-0.5', numColor)} />{action}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      {plan.kpis && plan.kpis.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4" />Success Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plan.kpis.map((kpi, i) => (
              <div key={i} className="bg-bms-card border border-bms-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PlatformBadge platform={kpi.platform} />
                  <span className="font-semibold text-bms-text capitalize">{kpi.platform}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Follower Growth', value: kpi.followerGrowth },
                    { label: 'Engagement Rate', value: kpi.engagementRate },
                    { label: 'Content Output', value: kpi.contentOutput },
                    { label: 'Ad Benchmarks', value: kpi.adBenchmarks },
                  ].map(({ label, value }, j) => value && (
                    <div key={j} className="bg-bms-darker rounded-xl p-3">
                      <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm font-bold text-bms-text">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Results ─────────────────────────────────────────────────────────────

const INDUSTRY_GROWTH: Record<string, { conservative: number; realistic: number; optimistic: number }> = {
  'e-commerce':            { conservative: 150,  realistic: 500,  optimistic: 2000 },
  'saas':                  { conservative: 100,  realistic: 300,  optimistic: 800  },
  'hospitality':           { conservative: 200,  realistic: 700,  optimistic: 2500 },
  'restaurant':            { conservative: 200,  realistic: 700,  optimistic: 2500 },
  'real estate':           { conservative: 150,  realistic: 400,  optimistic: 1000 },
  'fitness':               { conservative: 300,  realistic: 900,  optimistic: 3500 },
  'wellness':              { conservative: 300,  realistic: 900,  optimistic: 3500 },
  'food':                  { conservative: 250,  realistic: 700,  optimistic: 2500 },
  'beauty':                { conservative: 400,  realistic: 1200, optimistic: 5000 },
  'fashion':               { conservative: 400,  realistic: 1200, optimistic: 5000 },
  'professional services': { conservative: 80,   realistic: 250,  optimistic: 600  },
  'construction':          { conservative: 80,   realistic: 200,  optimistic: 500  },
  'trades':                { conservative: 80,   realistic: 200,  optimistic: 500  },
  'healthcare':            { conservative: 60,   realistic: 180,  optimistic: 400  },
  'education':             { conservative: 150,  realistic: 400,  optimistic: 1200 },
  'technology':            { conservative: 100,  realistic: 300,  optimistic: 800  },
  'finance':               { conservative: 80,   realistic: 200,  optimistic: 500  },
}

// Platform-specific follower growth ranges by effort level
const PLATFORM_GROWTH: Record<string, {
  low: [number, number]; med: [number, number]; high: [number, number]
  leadsMed: [number, number]; engTarget: string; timeToResults: string
}> = {
  instagram:  { low: [100,300],  med: [300,1000],  high: [1000,4000],   leadsMed: [3,10],  engTarget: '2–5%',       timeToResults: '4–8 weeks' },
  tiktok:     { low: [200,700],  med: [700,3000],  high: [3000,15000],  leadsMed: [2,7],   engTarget: '5–15%',      timeToResults: '1–4 weeks' },
  linkedin:   { low: [50,150],   med: [150,500],   high: [500,1500],    leadsMed: [10,25], engTarget: '3–7%',       timeToResults: '6–12 weeks' },
  facebook:   { low: [30,100],   med: [100,400],   high: [400,1000],    leadsMed: [3,10],  engTarget: '1–3%',       timeToResults: '8–12 weeks' },
  youtube:    { low: [20,80],    med: [80,400],    high: [400,3000],    leadsMed: [5,18],  engTarget: '2–5% views', timeToResults: '8–16 weeks' },
  twitter:    { low: [50,200],   med: [200,800],   high: [800,4000],    leadsMed: [1,6],   engTarget: '0.5–2%',     timeToResults: '4–8 weeks' },
  x:          { low: [50,200],   med: [200,800],   high: [800,4000],    leadsMed: [1,6],   engTarget: '0.5–2%',     timeToResults: '4–8 weeks' },
  pinterest:  { low: [30,100],   med: [100,500],   high: [500,2000],    leadsMed: [2,8],   engTarget: 'High traffic',timeToResults: '12–24 weeks' },
  threads:    { low: [50,200],   med: [200,700],   high: [700,3000],    leadsMed: [1,5],   engTarget: '1–4%',       timeToResults: '4–8 weeks' },
  google:     { low: [0,0],      med: [0,0],       high: [0,0],         leadsMed: [8,25],  engTarget: 'N/A',        timeToResults: '4–8 weeks' },
}

// Pricing tier → avg revenue per converted lead
const PRICING_TO_LEAD_VALUE: Record<string, { label: string; min: number; max: number }> = {
  budget:      { label: 'Budget',     min: 25,   max: 80   },
  economy:     { label: 'Economy',    min: 25,   max: 80   },
  affordable:  { label: 'Affordable', min: 50,   max: 150  },
  'mid-range': { label: 'Mid-Range',  min: 150,  max: 600  },
  standard:    { label: 'Standard',   min: 150,  max: 600  },
  premium:     { label: 'Premium',    min: 600,  max: 2500 },
  luxury:      { label: 'Luxury',     min: 2000, max: 10000},
  enterprise:  { label: 'Enterprise', min: 1000, max: 8000 },
  b2b:         { label: 'B2B',        min: 500,  max: 4000 },
  saas:        { label: 'SaaS',       min: 200,  max: 2500 },
  high:        { label: 'High-End',   min: 600,  max: 2500 },
}

function getPlatformKey(platform: string): string {
  const p = (platform ?? '').toLowerCase().replace(/[^a-z]/g, '')
  if (p.includes('instagram')) return 'instagram'
  if (p.includes('tiktok')) return 'tiktok'
  if (p.includes('linkedin')) return 'linkedin'
  if (p.includes('facebook') || p.includes('meta')) return 'facebook'
  if (p.includes('youtube')) return 'youtube'
  if (p.includes('twitter') || p === 'x') return 'twitter'
  if (p.includes('pinterest')) return 'pinterest'
  if (p.includes('threads')) return 'threads'
  if (p.includes('google')) return 'google'
  return 'instagram'
}

function getLeadValue(pricingTier: string) {
  const tier = (pricingTier ?? '').toLowerCase()
  for (const [key, val] of Object.entries(PRICING_TO_LEAD_VALUE)) {
    if (tier.includes(key)) return val
  }
  return { label: 'Standard', min: 150, max: 600 }
}

function ResultsTab({ plan }: { plan: PlanData }) {
  const brand = plan.brand ?? {}
  const industryRaw = (brand.industry ?? '').toLowerCase()
  // Find best matching industry key
  const industryKey = Object.keys(INDUSTRY_GROWTH).find(k => industryRaw.includes(k)) ?? ''
  const growth = INDUSTRY_GROWTH[industryKey] ?? { conservative: 120, realistic: 350, optimistic: 900 }
  const leadValue = getLeadValue(brand.pricingTier ?? '')
  const recs = plan.recommendations ?? []
  const pillars = plan.contentStrategy?.contentPillars ?? []
  const kpis = plan.kpis ?? []
  const competitors = plan.competitors ?? []
  const roadmap = plan.growthRoadmap
  const currentScore = plan.assessment?.overallScore ?? 50
  const projectedScore = Math.min(95, currentScore + 32)

  // Total estimated monthly leads from medium effort across all recommended platforms
  const totalMedLeads = recs.reduce((sum, rec) => {
    const pg = PLATFORM_GROWTH[getPlatformKey(rec.platform)]
    return pg ? sum + (pg.leadsMed[0] + pg.leadsMed[1]) / 2 : sum + 5
  }, 0)

  const conservRevenue = Math.round((totalMedLeads * 0.05) * leadValue.min)
  const realisticRevenue = Math.round((totalMedLeads * 0.1) * ((leadValue.min + leadValue.max) / 2))
  const optimisticRevenue = Math.round((totalMedLeads * 0.2) * leadValue.max)

  return (
    <div className="space-y-8">

      {/* ── Brand snapshot header ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-bms-cyan/5 to-purple-500/5 border border-bms-cyan/20 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-bms-text">
              {brand.name ? `${brand.name} — Projected Results` : 'Your Brand — Projected Results'}
            </h2>
            <p className="text-sm text-bms-muted mt-1">
              {[brand.industry, brand.geographicFocus, brand.pricingTier && `${brand.pricingTier} pricing`].filter(Boolean).join(' · ')}
            </p>
            {brand.targetAudience && (
              <p className="text-xs text-bms-muted mt-1">
                Audience: <span className="text-bms-text">{brand.targetAudience}</span>
              </p>
            )}
            {brand.usps && brand.usps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {brand.usps.slice(0, 3).map((usp, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-bms-cyan/10 border border-bms-cyan/20 text-bms-cyan">{usp}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-bms-muted uppercase tracking-wide">Current Score</p>
            <p className="text-4xl font-black text-bms-text leading-none">{currentScore}<span className="text-sm font-normal text-bms-muted">/100</span></p>
            <p className="text-xs text-emerald-400 mt-1">→ Projected 90-day: <strong>{projectedScore}/100</strong></p>
          </div>
        </div>
        {/* Score bar */}
        <div className="mt-5">
          <div className="flex justify-between text-[10px] text-bms-muted mb-1.5">
            <span>Current ({currentScore}/100)</span>
            <span className="text-emerald-400">Target at 90 days ({projectedScore}/100)</span>
          </div>
          <div className="h-3 bg-bms-border rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-bms-cyan rounded-full"
              style={{ width: `${currentScore}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-emerald-400"
              style={{ left: `${projectedScore}%` }}
            />
          </div>
          {plan.assessment?.scoreJustification && (
            <p className="text-[10px] text-bms-muted mt-1.5">{plan.assessment.scoreJustification}</p>
          )}
        </div>
        {/* Strongest / weakest */}
        {(plan.assessment?.strongestChannel || plan.assessment?.weakestChannel) && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {plan.assessment.strongestChannel && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">
                <p className="text-[9px] text-emerald-400 uppercase tracking-wide mb-0.5">Strongest Channel Now</p>
                <p className="text-xs font-semibold text-bms-text">{plan.assessment.strongestChannel}</p>
              </div>
            )}
            {plan.assessment.weakestChannel && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                <p className="text-[9px] text-amber-400 uppercase tracking-wide mb-0.5">Biggest Opportunity</p>
                <p className="text-xs font-semibold text-bms-text">{plan.assessment.weakestChannel}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Platform-specific projections ─────────────────────────────────── */}
      {recs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-bms-cyan" />
            Platform Growth Projections — {brand.name || 'Your Brand'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recs.map((rec, i) => {
              const pgKey = getPlatformKey(rec.platform)
              const pg = PLATFORM_GROWTH[pgKey] ?? { low: [50,200], med: [200,700], high: [700,2500], leadsMed: [3,10], engTarget: '2–5%', timeToResults: '4–8 weeks' }
              const isTop = rec.priority?.toLowerCase().includes('high') || rec.priority?.toLowerCase().includes('primary') || i === 0
              return (
                <div key={i} className={cn('bg-bms-card border rounded-2xl p-5 space-y-4', isTop ? 'border-bms-cyan/30' : 'border-bms-border')}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-bms-text">{rec.platform}</p>
                      <p className="text-[10px] text-bms-muted mt-0.5">{rec.postingFrequency}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={cn(
                        'text-[9px] px-2 py-0.5 rounded-full font-semibold border',
                        isTop ? 'bg-bms-cyan/10 text-bms-cyan border-bms-cyan/30' : 'bg-bms-border text-bms-muted border-transparent'
                      )}>
                        {rec.priority}
                      </span>
                      <span className="text-[9px] text-bms-muted">Eng. target: {pg.engTarget}</span>
                    </div>
                  </div>

                  {/* Follower growth tiers */}
                  <div className="space-y-2">
                    {[
                      { label: 'Low effort', range: pg.low,  color: 'bg-blue-400',    tc: 'text-blue-400'    },
                      { label: 'Consistent', range: pg.med,  color: 'bg-bms-cyan',    tc: 'text-bms-cyan'    },
                      { label: 'Full commit', range: pg.high, color: 'bg-emerald-400', tc: 'text-emerald-400' },
                    ].map(tier => (
                      <div key={tier.label}>
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-bms-muted">{tier.label}</span>
                          <span className={cn('font-semibold', tier.tc)}>
                            +{tier.range[0].toLocaleString()}–{tier.range[1].toLocaleString()} followers/mo
                          </span>
                        </div>
                        <div className="h-1.5 bg-bms-border rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', tier.color)}
                            style={{ width: `${pg.high[1] > 0 ? (tier.range[1] / pg.high[1]) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-bms-darker rounded-xl p-2.5 text-center">
                      <p className="text-[9px] text-bms-muted uppercase tracking-wide">Leads/mo</p>
                      <p className="text-sm font-bold text-bms-cyan mt-0.5">{pg.leadsMed[0]}–{pg.leadsMed[1]}</p>
                      <p className="text-[9px] text-bms-muted">medium effort</p>
                    </div>
                    <div className="bg-bms-darker rounded-xl p-2.5 text-center">
                      <p className="text-[9px] text-bms-muted uppercase tracking-wide">First results</p>
                      <p className="text-xs font-bold text-bms-text mt-0.5">{pg.timeToResults}</p>
                    </div>
                    <div className="bg-bms-darker rounded-xl p-2.5 text-center">
                      <p className="text-[9px] text-bms-muted uppercase tracking-wide">Engagement</p>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">{pg.engTarget}</p>
                    </div>
                  </div>

                  {/* Rationale + formats */}
                  {rec.rationale && (
                    <p className="text-[10px] text-bms-muted leading-relaxed border-t border-bms-border pt-3">
                      {rec.rationale}
                    </p>
                  )}
                  {rec.formats && rec.formats.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.formats.slice(0, 4).map((f, j) => (
                        <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Revenue impact projection ──────────────────────────────────────── */}
      <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-1 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-purple-400" />
            Revenue Impact Projection — {brand.name || 'Your Brand'}
          </h3>
          <p className="text-[10px] text-bms-muted">
            Based on {leadValue.label} pricing (£{leadValue.min.toLocaleString()}–£{leadValue.max.toLocaleString()} avg client value)
            {recs.length > 0 && ` across ${recs.length} recommended platform${recs.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Revenue scenarios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { scenario: 'Conservative', desc: 'Low commitment · 5% lead-to-client rate', value: conservRevenue, color: 'text-blue-400',    border: 'border-blue-400/20',    bg: 'bg-blue-400/5'    },
            { scenario: 'Realistic',    desc: 'Consistent effort · 10% lead-to-client rate', value: realisticRevenue, color: 'text-bms-cyan',   border: 'border-bms-cyan/20',    bg: 'bg-bms-cyan/5'    },
            { scenario: 'Optimistic',   desc: 'Full commitment · 20% lead-to-client rate', value: optimisticRevenue, color: 'text-emerald-400', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5' },
          ].map(s => (
            <div key={s.scenario} className={cn('rounded-xl border p-4 space-y-1', s.border, s.bg)}>
              <p className={cn('text-xs font-semibold', s.color)}>{s.scenario}</p>
              <p className="text-2xl font-black text-bms-text">
                £{s.value.toLocaleString()}
                <span className="text-xs font-normal text-bms-muted">/mo</span>
              </p>
              <p className="text-[10px] text-bms-muted">{s.desc}</p>
              <p className={cn('text-xs font-semibold pt-1', s.color)}>
                £{(s.value * 12).toLocaleString()} projected/year
              </p>
            </div>
          ))}
        </div>

        {/* Paid ad ROI */}
        {plan.adStrategy && plan.adStrategy.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide mb-3">
              Paid Ad ROI — {plan.adStrategy.slice(0, 2).map(a => a.platform).join(' + ')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { budget: 500,  roas: [2, 4], leads: [8, 18],   label: 'Starter' },
                { budget: 1500, roas: [3, 6], leads: [25, 50],  label: 'Growth'  },
                { budget: 3000, roas: [4, 9], leads: [55, 110], label: 'Scale'   },
              ].map((s, i) => (
                <div key={i} className="bg-bms-darker rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-bms-cyan">£{s.budget.toLocaleString()}/mo</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{s.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-bms-muted uppercase">ROAS</p>
                      <p className="text-sm font-bold text-emerald-400">{s.roas[0]}–{s.roas[1]}×</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-bms-muted uppercase">Leads/mo</p>
                      <p className="text-sm font-bold text-bms-text">{s.leads[0]}–{s.leads[1]}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-emerald-400 font-medium pt-1 border-t border-bms-border">
                    Est. return: £{(s.budget * s.roas[1]).toLocaleString()}/mo revenue
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content pillar performance forecast ───────────────────────────── */}
      {pillars.length > 0 && (
        <div className="bg-bms-card border border-bms-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-bms-text mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-400" />
            Content Pillar Performance Forecast — {brand.name || 'Your Brand'}
          </h3>
          <div className="space-y-3">
            {pillars.map((pillar, i) => {
              const outcomeLabels = ['Saves & shares', 'Comments & DMs', 'Direct leads', 'Reach & discovery', 'Follower loyalty']
              const projectedResults = [
                '3–5× avg saves',
                '2× avg comment rate',
                '40–60% of inbound leads',
                '5–8× non-follower reach',
                'Highest repeat engagement',
              ]
              return (
                <div key={i} className="flex items-center gap-4 p-3 bg-bms-darker rounded-xl">
                  <div className="text-2xl w-9 text-center flex-shrink-0">{pillar.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-bms-text">{pillar.name}</p>
                      <span className="text-[10px] text-bms-muted">{pillar.percentage}% of mix</span>
                    </div>
                    <div className="h-1.5 bg-bms-border rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-bms-cyan to-bms-purple rounded-full"
                        style={{ width: `${pillar.percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-bms-muted leading-relaxed">{pillar.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] text-bms-muted">{outcomeLabels[i % outcomeLabels.length]}</p>
                    <p className="text-[10px] text-bms-cyan font-medium mt-0.5">{projectedResults[i % projectedResults.length]}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Competitive gap forecast ───────────────────────────────────────── */}
      {competitors.length > 0 && (
        <div className="bg-bms-card border border-bms-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-bms-text mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Competitive Gap — How Long to Close It
          </h3>
          <div className="space-y-3">
            {competitors.slice(0, 4).map((comp, i) => {
              const monthsToClose = [5, 8, 12, 16][i] ?? 12
              return (
                <div key={i} className="flex items-center gap-4 p-3 bg-bms-darker rounded-xl flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-bms-text">{comp.name}</p>
                    <p className="text-[10px] text-bms-muted mt-0.5">
                      {comp.strongestPlatform} · {comp.followers} followers
                    </p>
                    {comp.contentStyle && (
                      <p className="text-[10px] text-bms-muted mt-0.5">Style: {comp.contentStyle}</p>
                    )}
                    {comp.gap && (
                      <p className="text-[10px] text-amber-400 mt-0.5">Gap: {comp.gap}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] text-bms-muted uppercase tracking-wide">Est. to close gap</p>
                    <p className="text-sm font-bold text-bms-cyan">{monthsToClose} months</p>
                    <p className="text-[9px] text-emerald-400">with consistent execution</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-bms-muted mt-3">
            * Estimates based on recommended platforms + consistent posting. Faster with paid ads or viral content.
          </p>
        </div>
      )}

      {/* ── KPI targets ────────────────────────────────────────────────────── */}
      {kpis.length > 0 && (
        <div className="bg-bms-card border border-bms-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-bms-text mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-bms-cyan" />
            Your 90-Day KPI Targets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-bms-darker rounded-xl p-4">
                <p className="text-xs font-semibold text-bms-cyan mb-3">{kpi.platform}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Follower Growth', value: kpi.followerGrowth },
                    { label: 'Engagement Rate', value: kpi.engagementRate },
                    { label: 'Content Output',  value: kpi.contentOutput  },
                    { label: 'Ad Benchmarks',   value: kpi.adBenchmarks   },
                  ].filter(f => f.value).map(({ label, value }, j) => (
                    <div key={j}>
                      <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-xs font-semibold text-bms-text">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 90-day growth roadmap ──────────────────────────────────────────── */}
      {roadmap && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            {brand.name ? `${brand.name}'s 90-Day Growth Roadmap` : '90-Day Growth Roadmap'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { key: 'month1' as const, label: 'Month 1', data: roadmap.month1, color: 'border-bms-cyan/30',    tc: 'text-bms-cyan',    bg: 'bg-bms-cyan/5',    growthNote: `+${growth.conservative}–${Math.round(growth.conservative * 1.6)} followers · 1–5 leads` },
              { key: 'month2' as const, label: 'Month 2', data: roadmap.month2, color: 'border-purple-500/30', tc: 'text-purple-400',  bg: 'bg-purple-500/5',  growthNote: `+${Math.round(growth.realistic * 0.7)}–${growth.realistic} followers · 5–20 leads` },
              { key: 'month3' as const, label: 'Month 3', data: roadmap.month3, color: 'border-emerald-500/30',tc: 'text-emerald-400', bg: 'bg-emerald-500/5', growthNote: `+${growth.realistic}–${growth.optimistic} followers/mo · 20–60+ leads` },
            ]).map(m => m.data && (
              <div key={m.key} className={cn('bg-bms-card border rounded-2xl p-5 space-y-3', m.color)}>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', m.bg, m.tc)}>{m.label}</span>
                  <span className="text-xs font-semibold text-bms-text">{m.data.theme}</span>
                </div>
                <p className="text-[10px] text-bms-muted">{m.data.focus}</p>
                <ul className="space-y-1.5">
                  {(m.data.actions ?? []).map((action, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-bms-text">
                      <ArrowRight className={cn('w-3 h-3 flex-shrink-0 mt-0.5', m.tc)} />
                      {action}
                    </li>
                  ))}
                </ul>
                <div className={cn('rounded-xl px-3 py-2 border', m.color, m.bg)}>
                  <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-0.5">Expected by end of month</p>
                  <p className={cn('text-xs font-bold', m.tc)}>{m.growthNote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick wins ─────────────────────────────────────────────────────── */}
      {plan.quickWins && plan.quickWins.length > 0 && (
        <div className="bg-bms-card border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Wins — Do These First for Fastest Results
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plan.quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <span className="text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-xs text-bms-text">{win}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KB CTA ─────────────────────────────────────────────────────────── */}
      <div className="bg-bms-cyan/5 border border-bms-cyan/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-bms-text mb-1">Want to go deeper?</h3>
          <p className="text-sm text-bms-muted">
            The Knowledge Base has platform algorithm guides, copywriting frameworks, hook formulas, and industry benchmarks.
          </p>
        </div>
        <Link
          href="/knowledge-base"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bms-cyan text-bms-dark font-semibold text-sm hover:bg-bms-cyan/90 transition-colors whitespace-nowrap"
        >
          <BookOpen className="w-4 h-4" />
          Open Knowledge Base
        </Link>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MarketingPlanPage() {
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState(0)
  const [streaming, setStreaming] = useState(false)
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'platforms' | 'content' | 'ads' | 'growth' | 'results' | 'social-audit'>('overview')
  const [showKB, setShowKB] = useState(false)
  const [socialAudit, setSocialAudit] = useState<SocialAuditData | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [kbTab, setKbTab] = useState<'platforms' | 'industries' | 'trending' | 'results' | 'benchmarks' | 'skills'>('platforms')
  const [history, setHistory] = useState<HistoryRun[]>([])
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [quickWinsDone, setQuickWinsDone] = useState<Set<number>>(new Set())
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/automations/marketing-plan')
      if (res.ok) {
        const data = await res.json()
        setHistory((data.runs ?? []).slice(0, 10) as HistoryRun[])
      }
    } catch { /* ignore */ }
    setHistoryLoading(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function runPlan() {
    if (!url.trim() || streaming) return
    setStreaming(true)
    setDone(false)
    setPlanData(null)
    setStage(1)
    setError(null)
    setQuickWinsDone(new Set())
    setActiveTab('overview')

    const res = await fetch('/api/automations/marketing-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: url.trim() }),
    })

    if (!res.ok || !res.body) {
      setError('Failed to start analysis.')
      setStreaming(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done: rdDone, value } = await reader.read()
      if (rdDone) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))
          if (evt.type === 'stage') setStage(evt.stage)
          else if (evt.type === 'complete') {
            setPlanData(evt.data as PlanData)
            setDone(true)
            setStage(4)
            loadHistory()
          }
          else if (evt.type === 'error') setError(evt.message)
        } catch { /* ignore parse errors */ }
      }
    }
    setStreaming(false)
  }

  function relativeDate(iso: string) {
    const ms = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  async function runSocialAudit() {
    if (!url.trim() || auditLoading) return
    setAuditLoading(true)
    setSocialAudit(null)

    const res = await fetch('/api/automations/marketing-plan/social-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteUrl: url.trim(),
        brandName: planData?.brand?.name ?? undefined,
      }),
    })

    if (!res.ok || !res.body) {
      setAuditLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done: rdDone, value } = await reader.read()
      if (rdDone) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))
          if (evt.type === 'complete') {
            setSocialAudit(evt.data as SocialAuditData)
          }
        } catch { /* ignore */ }
      }
    }
    setAuditLoading(false)
  }

  const TABS: { id: 'overview' | 'platforms' | 'content' | 'ads' | 'growth' | 'results' | 'social-audit'; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'content', label: 'Content' },
    { id: 'ads', label: 'Ads' },
    { id: 'growth', label: 'Growth' },
    { id: 'results', label: '📈 Results' },
    { id: 'social-audit', label: '🔍 Social Audit' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-bms-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-bms-text">Marketing Plan Generator</h1>
            <p className="text-bms-muted text-sm mt-1">
              Deep 5-stage brand analysis · Powered by Claude + Web Research
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowKB(v => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all whitespace-nowrap',
            showKB
              ? 'bg-bms-cyan/10 border-bms-cyan/40 text-bms-cyan'
              : 'border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-cyan/30'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Knowledge Base
          {showKB ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Inline Knowledge Base Panel ── */}
      {showKB && (
        <div className="bg-bms-card border border-bms-cyan/20 rounded-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-bms-border bg-bms-darker/60">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-bms-cyan" />
              <span className="text-sm font-semibold text-bms-text">Marketing Knowledge Base</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/knowledge-base" className="text-xs text-bms-muted hover:text-bms-cyan transition-colors">
                Open full page →
              </Link>
              <button onClick={() => setShowKB(false)} className="text-bms-muted hover:text-bms-text transition-colors ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1.5 px-5 py-3 border-b border-bms-border overflow-x-auto">
            {([
              { id: 'platforms',  label: 'Platforms',   icon: Layers },
              { id: 'industries', label: 'Industries',  icon: TrendingUp },
              { id: 'trending',   label: "What's Working", icon: Zap },
              { id: 'results',    label: 'Results',     icon: BarChart2 },
              { id: 'benchmarks', label: 'Benchmarks',  icon: BarChart },
              { id: 'skills',     label: 'Skills',      icon: Wrench },
            ] as const).map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setKbTab(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
                    kbTab === t.id
                      ? 'bg-bms-cyan/10 border-bms-cyan/30 text-bms-cyan'
                      : 'bg-bms-darker border-bms-border text-bms-muted hover:text-bms-text'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {/* Platforms */}
            {kbTab === 'platforms' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PLATFORMS.map(p => (
                  <div key={p.id} className={cn('rounded-xl border p-4 space-y-2', p.badge.includes('pink') ? 'border-pink-500/20 bg-pink-500/5' : p.badge.includes('gray-5') ? 'border-gray-500/20 bg-gray-500/5' : p.badge.includes('blue-5') ? 'border-blue-500/20 bg-blue-500/5' : p.badge.includes('blue-4') ? 'border-blue-400/20 bg-blue-400/5' : p.badge.includes('red') ? 'border-red-500/20 bg-red-500/5' : p.badge.includes('gray-4') ? 'border-gray-400/20 bg-gray-400/5' : 'border-bms-border bg-bms-darker')}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-bms-text">{p.name}</p>
                        <p className="text-[10px] text-bms-muted">{p.postingFrequency}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-bms-cyan">{p.avgEngagementRate} avg engagement</p>
                    <ul className="space-y-1">
                      {p.whatWorkingNow.slice(0, 3).map((w, i) => (
                        <li key={i} className="text-[10px] text-bms-muted flex items-start gap-1.5">
                          <span className="text-bms-cyan flex-shrink-0">→</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Industries */}
            {kbTab === 'industries' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INDUSTRIES.map(ind => (
                  <div key={ind.id} className="rounded-xl border border-bms-border bg-bms-darker p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ind.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-bms-text">{ind.name}</p>
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {ind.topPlatforms.slice(0, 3).map((pl, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-bms-border text-bms-muted">{pl}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-bms-muted leading-relaxed">{ind.contentStyle}</p>
                    <p className="text-[10px] text-emerald-400 font-medium">{ind.expectedResults}</p>
                  </div>
                ))}
              </div>
            )}

            {/* What's Working */}
            {kbTab === 'trending' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRENDING_2025.map((item, i) => (
                  <div key={i} className={cn('rounded-xl border p-4 space-y-2', item.color)}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <p className="text-xs font-semibold text-bms-text">{item.title}</p>
                    </div>
                    <ul className="space-y-1">
                      {item.tactics.slice(0, 3).map((t, j) => (
                        <li key={j} className="text-[10px] text-bms-muted flex items-start gap-1.5">
                          <span className="text-bms-cyan flex-shrink-0">→</span>{t}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-bms-cyan font-medium">{item.roi}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {kbTab === 'results' && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-bms-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-bms-darker border-b border-bms-border">
                        {['Effort Level', 'Activity', 'Followers/Month', 'Engagement', 'Lead Gen', 'Time to Results'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-bms-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RESULTS_TABLE.map((row, i) => (
                        <tr key={i} className={cn('border-b border-bms-border/50', i % 2 === 0 ? 'bg-bms-card' : 'bg-bms-darker/30')}>
                          <td className="px-3 py-2">
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', row.badge)}>{row.level}</span>
                          </td>
                          <td className="px-3 py-2 text-bms-muted">{row.effort}</td>
                          <td className="px-3 py-2 font-semibold text-bms-cyan">{row.followersPerMonth}</td>
                          <td className="px-3 py-2 text-bms-text">{row.engagementRate}</td>
                          <td className="px-3 py-2 text-bms-text">{row.leadGen}</td>
                          <td className="px-3 py-2 font-medium text-emerald-400">{row.timeToResults}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-bms-muted">Based on consistent, strategic posting. Results compound over 90+ days.</p>
              </div>
            )}

            {/* Benchmarks */}
            {kbTab === 'benchmarks' && (
              <div className="overflow-x-auto rounded-xl border border-bms-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bms-darker border-b border-bms-border">
                      {['Industry', 'Avg Engagement', 'Follower Growth', 'Conversion Rate', 'Ad ROAS'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-bms-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {INDUSTRY_BENCHMARKS.map((row, i) => (
                      <tr key={i} className={cn('border-b border-bms-border/50', i % 2 === 0 ? 'bg-bms-card' : 'bg-bms-darker/30')}>
                        <td className="px-3 py-2 font-semibold text-bms-text">{row.industry}</td>
                        <td className="px-3 py-2 font-bold text-bms-cyan">{row.avgEngagement}</td>
                        <td className="px-3 py-2 text-bms-text">{row.followerGrowth}</td>
                        <td className="px-3 py-2 text-bms-text">{row.conversionRate}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-400">{row.adROAS}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Skills */}
            {kbTab === 'skills' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MARKETING_SKILLS.map(skill => (
                  <div key={skill.id} className="rounded-xl border border-bms-border bg-bms-darker p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{skill.icon}</span>
                        <p className="text-xs font-semibold text-bms-text">{skill.name}</p>
                      </div>
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium border', skill.categoryColor)}>{skill.category}</span>
                    </div>
                    <p className="text-[10px] text-bms-muted leading-relaxed">{skill.description}</p>
                    <p className="text-[9px] text-bms-cyan">{skill.whenToUse}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-4">
        <label className="block text-sm font-medium text-bms-text">Business Website URL</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bms-muted pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runPlan()}
              placeholder="https://example.com"
              disabled={streaming}
              className="w-full pl-10 pr-4 py-3 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors disabled:opacity-60"
            />
          </div>
          <button
            onClick={runPlan}
            disabled={streaming || !url.trim()}
            className="px-6 py-3 bg-bms-cyan text-bms-dark font-semibold text-sm rounded-xl hover:bg-bms-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
          >
            {streaming ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Analysing…</>
            ) : (
              <><Sparkles className="w-4 h-4" />Generate Plan</>
            )}
          </button>
        </div>

        {/* Stage indicators */}
        {stage > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {STAGES.map((s, i) => {
              const isActive = stage === s.n && streaming
              const isDone = stage > s.n || (stage === s.n && done)
              const isPending = stage < s.n
              return (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300',
                    isPending && 'border-bms-border text-bms-muted bg-bms-darker',
                    isActive && 'border-bms-cyan/40 text-bms-cyan bg-bms-cyan/10 animate-pulse',
                    isDone && 'border-emerald-500/25 text-emerald-400 bg-emerald-500/8',
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', {
                      'bg-bms-muted/40': isPending,
                      'bg-bms-cyan': isActive,
                      'bg-emerald-400': isDone,
                    })} />
                    {s.n}. {s.label}
                  </div>
                  {i < STAGES.length - 1 && <span className="text-bms-muted/40 text-xs">→</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/25 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Loading skeleton */}
      {streaming && !planData && <LoadingSkeleton />}

      {/* Dashboard output */}
      {done && planData && (
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <TabButton key={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && <OverviewTab plan={planData} url={url} />}
          {activeTab === 'platforms' && <PlatformsTab plan={planData} />}
          {activeTab === 'content' && <ContentTab plan={planData} />}
          {activeTab === 'ads' && <AdsTab plan={planData} />}
          {activeTab === 'growth' && (
            <GrowthTab plan={planData} quickWinsDone={quickWinsDone} setQuickWinsDone={setQuickWinsDone} />
          )}
          {activeTab === 'results' && <ResultsTab plan={planData} />}
          {activeTab === 'social-audit' && (
            <SocialAuditTab
              websiteUrl={url}
              brandName={planData?.brand?.name}
              auditData={socialAudit}
              loading={auditLoading}
              onRun={() => { runSocialAudit() }}
            />
          )}
        </div>
      )}

      {/* History */}
      {(history.length > 0 || historyLoading) && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-bms-text">
            Previous Analyses {!historyLoading && `(${history.length})`}
          </h2>

          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-bms-card border border-bms-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(run => {
                const isExpanded = expandedRunId === run.id
                return (
                  <div
                    key={run.id}
                    className={cn('bg-bms-card border rounded-xl overflow-hidden transition-colors', isExpanded ? 'border-bms-cyan/40' : 'border-bms-border')}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-8 h-8 rounded-lg bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-bms-cyan" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-bms-text truncate">{run.websiteUrl}</p>
                        <p className="text-xs text-bms-muted mt-0.5">{relativeDate(run.createdAt)}</p>
                      </div>
                      {run.plan && (
                        <button
                          onClick={() => {
                            setPlanData(run.plan as PlanData)
                            setDone(true)
                            setActiveTab('overview')
                            setUrl(run.websiteUrl)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bms-cyan/30 text-bms-cyan text-xs hover:bg-bms-cyan/10 transition-colors"
                        >
                          Load
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-cyan/30 text-xs transition-colors"
                      >
                        {isExpanded ? <><ChevronUp className="w-3 h-3" />Hide</> : <><ChevronDown className="w-3 h-3" />Preview</>}
                      </button>
                    </div>

                    {isExpanded && run.plan && (
                      <div className="border-t border-bms-border p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {run.plan.brand?.name && (
                            <div className="bg-bms-darker rounded-xl p-3">
                              <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">Brand</p>
                              <p className="text-xs font-semibold text-bms-text">{run.plan.brand.name}</p>
                            </div>
                          )}
                          {run.plan.assessment?.overallScore !== undefined && (
                            <div className="bg-bms-darker rounded-xl p-3">
                              <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">Score</p>
                              <p className="text-xs font-semibold text-bms-cyan">{run.plan.assessment.overallScore}/10</p>
                            </div>
                          )}
                          {run.plan.brand?.industry && (
                            <div className="bg-bms-darker rounded-xl p-3">
                              <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">Industry</p>
                              <p className="text-xs font-semibold text-bms-text">{run.plan.brand.industry}</p>
                            </div>
                          )}
                          {run.plan.assessment?.strongestChannel && (
                            <div className="bg-bms-darker rounded-xl p-3">
                              <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">Best Channel</p>
                              <p className="text-xs font-semibold text-emerald-400 capitalize">{run.plan.assessment.strongestChannel}</p>
                            </div>
                          )}
                        </div>
                        {run.plan.brandSummary && (
                          <p className="text-xs text-bms-muted mt-3 leading-relaxed">{run.plan.brandSummary}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
