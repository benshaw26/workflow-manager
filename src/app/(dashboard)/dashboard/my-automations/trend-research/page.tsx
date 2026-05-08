'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, TrendingUp, AlertTriangle,
  Zap, Shield, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContentOpportunity {
  opportunity: string
  platforms: string[]
  urgency: 'low' | 'medium' | 'high'
  brief: string
}

interface TrendsData {
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

// ─── Constants ───────────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<string, string> = {
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const URGENCY_ICON: Record<string, React.ReactNode> = {
  high: <AlertTriangle className="w-3 h-3" />,
  medium: <Clock className="w-3 h-3" />,
  low: <Zap className="w-3 h-3" />,
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'from-gray-900 to-gray-800 border-gray-700',
  instagram: 'from-pink-950 to-purple-950 border-pink-800/40',
  linkedin: 'from-blue-950 to-blue-900 border-blue-800/40',
  x: 'from-zinc-900 to-zinc-800 border-zinc-700',
  youtube: 'from-red-950 to-red-900 border-red-800/40',
}

const PLATFORM_ACCENT: Record<string, string> = {
  tiktok: 'text-cyan-400',
  instagram: 'text-pink-400',
  linkedin: 'text-blue-400',
  x: 'text-zinc-300',
  youtube: 'text-red-400',
}

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X / Twitter',
  youtube: 'YouTube',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-bms-border/60 text-bms-muted border border-bms-border">
      {text}
    </span>
  )
}

function PlatformCard({
  platform,
  data,
}: {
  platform: string
  data: Record<string, string[]>
}) {
  const [open, setOpen] = useState(true)
  const gradient = PLATFORM_COLORS[platform] ?? 'from-bms-card to-bms-card-hover border-bms-border'
  const accent = PLATFORM_ACCENT[platform] ?? 'text-bms-cyan'
  const label = PLATFORM_LABEL[platform] ?? platform

  const sections = Object.entries(data)

  return (
    <div className={cn('rounded-xl border bg-gradient-to-br p-4', gradient)}>
      <button
        className="flex items-center justify-between w-full"
        onClick={() => setOpen(o => !o)}
      >
        <span className={cn('font-semibold text-sm', accent)}>{label}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-bms-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-bms-muted" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {sections.map(([key, items]) => (
            <div key={key}>
              <p className="text-bms-muted text-[10px] uppercase tracking-wider mb-1.5 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                  <TagPill key={i} text={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-bms-border bg-bms-card p-4 space-y-3 animate-pulse">
      <div className="h-4 w-24 bg-bms-border rounded" />
      <div className="h-3 w-full bg-bms-border/60 rounded" />
      <div className="flex gap-1.5 flex-wrap">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-6 w-20 bg-bms-border/40 rounded-full" />
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrendResearchPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = useCallback(async (force = false) => {
    if (force) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agents/trends', {
        method: force ? 'POST' : 'GET',
      })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        throw new Error(body.error ?? 'Failed to fetch trends')
      }
      const data = (await res.json()) as TrendsData
      setTrends(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchTrends()
  }, [fetchTrends])

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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-bms-purple/10 text-bms-purple">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-bms-text">Trend Research</h2>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">
                    Live
                  </span>
                </span>
                {trends?.date && (
                  <span className="text-[10px] text-bms-muted">
                    {trends.date}
                  </span>
                )}
              </div>
              <p className="text-bms-muted text-sm mt-0.5">
                Daily AI trend research — monitors viral formats, content opportunities and platform
                algorithm shifts across TikTok, Instagram, LinkedIn, X and YouTube
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => void fetchTrends(true)}
              disabled={refreshing || loading}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-bms-border bg-bms-card text-bms-muted hover:text-bms-text hover:border-bms-border-light text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              {refreshing ? 'Regenerating…' : 'Force Refresh'}
              <Shield className="w-3 h-3 text-bms-cyan" />
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !trends && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>
          <div className="animate-pulse h-32 rounded-xl bg-bms-card border border-bms-border" />
        </div>
      )}

      {trends && (
        <>
          {/* Platform trend cards */}
          <div>
            <h3 className="text-bms-text font-semibold text-sm uppercase tracking-wide mb-3">
              Platform Trends
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(trends.platformTrends).map(([platform, data]) => (
                <PlatformCard
                  key={platform}
                  platform={platform}
                  data={data as Record<string, string[]>}
                />
              ))}
            </div>
          </div>

          {/* Universal themes */}
          {trends.universalThemes.length > 0 && (
            <div className="bg-bms-card border border-bms-border rounded-xl p-5">
              <h3 className="text-bms-text font-semibold text-sm uppercase tracking-wide mb-3">
                Universal Themes This Week
              </h3>
              <div className="flex flex-wrap gap-2">
                {trends.universalThemes.map((theme, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-bms-purple/10 text-bms-purple border border-bms-purple/20"
                  >
                    <Zap className="w-3 h-3" />
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content opportunities */}
          {trends.contentOpportunities.length > 0 && (
            <div>
              <h3 className="text-bms-text font-semibold text-sm uppercase tracking-wide mb-3">
                Content Opportunities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trends.contentOpportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="bg-bms-card border border-bms-border rounded-xl p-4 hover:border-bms-border-light transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-bms-text text-sm font-semibold leading-snug">
                        {opp.opportunity}
                      </h4>
                      <span
                        className={cn(
                          'flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize',
                          URGENCY_STYLES[opp.urgency] ?? URGENCY_STYLES.low,
                        )}
                      >
                        {URGENCY_ICON[opp.urgency]}
                        {opp.urgency}
                      </span>
                    </div>
                    <p className="text-bms-muted text-xs leading-relaxed mb-3">{opp.brief}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {opp.platforms.map(p => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded text-[9px] bg-bms-border text-bms-muted uppercase tracking-wide"
                        >
                          {p}
                        </span>
                      ))}
                      <Link
                        href={`/seo-writer?topic=${encodeURIComponent(opp.opportunity)}`}
                        className="ml-auto text-[10px] text-bms-cyan hover:underline flex items-center gap-0.5"
                      >
                        Write SEO article →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avoid this week */}
          {trends.avoidThisWeek.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-rose-300 font-semibold text-sm uppercase tracking-wide">
                  Avoid This Week
                </h3>
              </div>
              <ul className="space-y-2">
                {trends.avoidThisWeek.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-rose-200/70">
                    <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
