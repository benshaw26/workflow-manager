'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle,
  Zap, Users, BarChart, Clock, RefreshCw, ChevronDown, ChevronUp,
  ExternalLink, Loader2, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialAuditData, SocialProfile } from '@/app/api/automations/marketing-plan/social-audit/route'

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-600',
  tiktok: 'from-gray-800 to-gray-900',
  facebook: 'from-blue-600 to-blue-700',
  youtube: 'from-red-500 to-red-700',
  linkedin: 'from-blue-700 to-blue-800',
  twitter: 'from-gray-700 to-gray-900',
  pinterest: 'from-red-500 to-red-600',
}

const PLATFORM_EMOJIS: Record<string, string> = {
  instagram: '📸',
  tiktok: '🎵',
  facebook: '📘',
  youtube: '▶️',
  linkedin: '💼',
  twitter: '🐦',
  pinterest: '📌',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  inactive: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  not_found: 'bg-bms-border text-bms-muted border-bms-border',
}

// ─── Helper components ────────────────────────────────────────────────────────

function HealthBar({ score }: { score: number }) {
  const color =
    score >= 7 ? 'bg-emerald-400' :
    score >= 4 ? 'bg-amber-400' :
    'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-bms-border rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className={cn('text-xs font-bold tabular-nums', color.replace('bg-', 'text-'))}>{score}/10</span>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const { bg, text, label } =
    score >= 7 ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Healthy' } :
    score >= 4 ? { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Needs Work' } :
    { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Critical' }

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', bg, text,
      score >= 7 ? 'border-emerald-500/25' : score >= 4 ? 'border-amber-500/25' : 'border-red-500/25')}>
      {score >= 7 ? <TrendingUp className="w-2.5 h-2.5" /> : score >= 4 ? <Minus className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {label}
    </span>
  )
}

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard({ profile }: { profile: SocialProfile }) {
  const [expanded, setExpanded] = useState(false)
  const gradient = PLATFORM_COLORS[profile.platform.toLowerCase()] ?? 'from-bms-border to-bms-border'
  const emoji = PLATFORM_EMOJIS[profile.platform.toLowerCase()] ?? '🌐'
  const isActive = profile.status === 'active'

  return (
    <div className={cn(
      'bg-bms-card border rounded-2xl overflow-hidden transition-all',
      isActive ? 'border-bms-border hover:border-bms-cyan/30' : 'border-bms-border opacity-75'
    )}>
      {/* Top bar gradient */}
      <div className={cn('h-1 bg-gradient-to-r', gradient)} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br flex-shrink-0', gradient)}>
              {emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-bms-text capitalize">{profile.platform}</h3>
                {profile.verified && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">✓ Verified</span>
                )}
              </div>
              {profile.handle && profile.handle !== 'unknown' && (
                <p className="text-[11px] text-bms-muted">{profile.handle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ScoreBadge score={profile.healthScore} />
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize', STATUS_COLORS[profile.status] ?? STATUS_COLORS.not_found)}>
              {profile.status === 'not_found' ? 'Not Found' : profile.status}
            </span>
          </div>
        </div>

        {/* Health bar */}
        <div className="mb-4">
          <HealthBar score={profile.healthScore} />
        </div>

        {isActive ? (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {profile.followers && profile.followers !== 'unknown' && (
                <div className="bg-bms-darker rounded-xl p-3 text-center">
                  <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">Followers</p>
                  <p className="text-sm font-bold text-bms-text">{profile.followers}</p>
                </div>
              )}
              {profile.estimatedEngagementRate && profile.estimatedEngagementRate !== 'unknown' && (
                <div className="bg-bms-darker rounded-xl p-3 text-center">
                  <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">Engagement</p>
                  <p className="text-sm font-bold text-bms-cyan">{profile.estimatedEngagementRate}</p>
                </div>
              )}
              {profile.postingFrequency && profile.postingFrequency !== 'unknown' && (
                <div className="bg-bms-darker rounded-xl p-3 text-center">
                  <p className="text-[9px] text-bms-muted uppercase tracking-wide mb-1">Frequency</p>
                  <p className="text-sm font-bold text-bms-text">{profile.postingFrequency}</p>
                </div>
              )}
            </div>

            {/* Going well */}
            {profile.goingWell && profile.goingWell.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> What's Going Well
                </p>
                <ul className="space-y-1">
                  {profile.goingWell.map((item, i) => (
                    <li key={i} className="text-[11px] text-bms-muted flex items-start gap-1.5">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {profile.improvements && profile.improvements.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Needs Improvement
                </p>
                <ul className="space-y-1">
                  {profile.improvements.map((item, i) => (
                    <li key={i} className="text-[11px] text-bms-muted flex items-start gap-1.5">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">!</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick win */}
            {profile.quickWin && (
              <div className="bg-bms-cyan/5 border border-bms-cyan/20 rounded-xl p-3 mb-3">
                <p className="text-[10px] font-semibold text-bms-cyan mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Quick Win
                </p>
                <p className="text-[11px] text-bms-text">{profile.quickWin}</p>
              </div>
            )}

            {/* Expanded details */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-[10px] text-bms-muted hover:text-bms-text transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Less detail' : 'More detail'}
            </button>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-bms-border space-y-3">
                {/* Benchmark comparison */}
                {profile.vsIndustryBenchmark && (
                  <div>
                    <p className="text-[10px] font-semibold text-bms-text mb-2">vs. Industry Benchmark</p>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(profile.vsIndustryBenchmark).filter(([k]) => k !== 'benchmarkNote').map(([key, val]) => (
                        <div key={key} className="flex gap-2 text-[10px]">
                          <span className="text-bms-muted capitalize w-20 flex-shrink-0">{key}:</span>
                          <span className="text-bms-text">{val as string}</span>
                        </div>
                      ))}
                      {profile.vsIndustryBenchmark.benchmarkNote && (
                        <p className="text-[10px] text-bms-muted italic mt-1">{profile.vsIndustryBenchmark.benchmarkNote}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Content themes */}
                {profile.contentThemes && profile.contentThemes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-bms-text mb-1">Content Themes</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.contentThemes.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-bms-border text-bms-muted text-[9px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional metrics */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {profile.posts && profile.posts !== 'unknown' && (
                    <div><span className="text-bms-muted">Posts: </span><span className="text-bms-text">{profile.posts}</span></div>
                  )}
                  {profile.following && profile.following !== 'unknown' && (
                    <div><span className="text-bms-muted">Following: </span><span className="text-bms-text">{profile.following}</span></div>
                  )}
                  {profile.avgLikesPerPost && profile.avgLikesPerPost !== 'unknown' && (
                    <div><span className="text-bms-muted">Avg Likes: </span><span className="text-bms-text">{profile.avgLikesPerPost}</span></div>
                  )}
                  {profile.lastPostedEstimate && profile.lastPostedEstimate !== 'unknown' && (
                    <div><span className="text-bms-muted">Last Post: </span><span className="text-bms-text">{profile.lastPostedEstimate}</span></div>
                  )}
                </div>

                {profile.bio && profile.bio !== 'unknown' && (
                  <div>
                    <p className="text-[10px] font-semibold text-bms-text mb-1">Bio</p>
                    <p className="text-[10px] text-bms-muted italic">"{profile.bio}"</p>
                  </div>
                )}

                {profile.profileUrl && (
                  <a
                    href={profile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-bms-cyan hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />View Profile
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-bms-muted">
            {profile.status === 'inactive'
              ? 'Profile exists but appears inactive or has very low activity.'
              : 'No active profile found on this platform. Consider establishing a presence.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SocialAuditTabProps {
  websiteUrl: string
  brandName?: string
  auditData: SocialAuditData | null
  loading: boolean
  onRun: () => void
}

export default function SocialAuditTab({ websiteUrl, brandName, auditData, loading, onRun }: SocialAuditTabProps) {
  const activeProfiles = auditData?.profiles?.filter(p => p.status === 'active') ?? []
  const allProfiles = auditData?.profiles ?? []
  const effortColors: Record<string, string> = {
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    High: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const impactColors: Record<string, string> = {
    High: 'bg-bms-cyan/10 text-bms-cyan border-bms-cyan/20',
    Medium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Low: 'bg-bms-border text-bms-muted border-bms-border',
  }

  if (!auditData && !loading) {
    return (
      <div className="bg-bms-card border border-bms-border rounded-2xl p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center mx-auto">
          <BarChart className="w-7 h-7 text-bms-cyan" />
        </div>
        <div>
          <h3 className="text-base font-bold text-bms-text mb-1">Live Social Media Audit</h3>
          <p className="text-sm text-bms-muted max-w-sm mx-auto">
            Scan real follower counts, engagement rates, posting frequency and get personalised recommendations for every platform.
          </p>
        </div>
        <button
          onClick={onRun}
          disabled={!websiteUrl}
          className="inline-flex items-center gap-2 px-6 py-3 bg-bms-cyan text-bms-dark font-semibold text-sm rounded-xl hover:bg-bms-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          Run Social Audit
        </button>
        {!websiteUrl && <p className="text-xs text-bms-muted">Generate a marketing plan first to enable the audit.</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-bms-card border border-bms-cyan/20 rounded-2xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-bms-cyan animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-bms-text">Scanning live social media profiles…</p>
          <p className="text-xs text-bms-muted mt-1">Searching across Instagram, TikTok, Facebook, YouTube, LinkedIn, Twitter &amp; Pinterest</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-bms-card border border-bms-border rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall health header */}
      <div className="bg-bms-card border border-bms-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-bms-text">Social Media Audit</h2>
              {auditData?.brandName && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-bms-border text-bms-muted">{auditData.brandName}</span>
              )}
            </div>
            {auditData?.scannedAt && (
              <p className="text-[11px] text-bms-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Scanned {new Date(auditData.scannedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-bms-cyan">{auditData?.overallHealthScore ?? 0}</div>
              <div className="text-[10px] text-bms-muted">Overall Score</div>
            </div>
            <button
              onClick={onRun}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-cyan/30 text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />Re-scan
            </button>
          </div>
        </div>

        {/* Overall health bar */}
        <div className="mb-4">
          <HealthBar score={auditData?.overallHealthScore ?? 0} />
        </div>

        {/* Summary */}
        {auditData?.overallSummary && (
          <p className="text-sm text-bms-muted leading-relaxed mb-3">{auditData.overallSummary}</p>
        )}

        {/* Top priority */}
        {auditData?.topPriority && (
          <div className="bg-bms-cyan/5 border border-bms-cyan/20 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-bms-cyan mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Top Priority Action
            </p>
            <p className="text-sm text-bms-text">{auditData.topPriority}</p>
          </div>
        )}

        {/* Active platforms quick summary */}
        {activeProfiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-bms-border">
            {activeProfiles.map(p => (
              <div key={p.platform} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-bms-darker border border-bms-border">
                <span className="text-sm">{PLATFORM_EMOJIS[p.platform.toLowerCase()] ?? '🌐'}</span>
                <span className="text-xs font-medium text-bms-text capitalize">{p.platform}</span>
                {p.followers && p.followers !== 'unknown' && (
                  <span className="text-[10px] text-bms-cyan">{p.followers}</span>
                )}
                <span className={cn('w-1.5 h-1.5 rounded-full', p.healthScore >= 7 ? 'bg-emerald-400' : p.healthScore >= 4 ? 'bg-amber-400' : 'bg-red-400')} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile cards */}
      {allProfiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-bms-cyan" />
            Platform-by-Platform Analysis
            <span className="text-[10px] text-bms-muted font-normal">({activeProfiles.length} active of {allProfiles.length} scanned)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allProfiles.map(p => (
              <ProfileCard key={p.platform} profile={p} />
            ))}
          </div>
        </div>
      )}

      {/* Cross-platform insights */}
      {auditData?.crossPlatformInsights && auditData.crossPlatformInsights.length > 0 && (
        <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-bms-text mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Cross-Platform Insights
          </h3>
          <ul className="space-y-2">
            {auditData.crossPlatformInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-bms-muted">
                <span className="text-purple-400 flex-shrink-0 mt-0.5">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prioritised action plan */}
      {auditData?.prioritisedActions && auditData.prioritisedActions.length > 0 && (
        <div className="bg-bms-card border border-bms-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-bms-text mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-bms-cyan" />
            Prioritised Action Plan
          </h3>
          <div className="space-y-3">
            {auditData.prioritisedActions.map((action, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-bms-darker border border-bms-border">
                <div className="w-7 h-7 rounded-full bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-bms-cyan">
                  {action.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-bms-text capitalize">{action.platform}</span>
                    {action.impact && (
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', impactColors[action.impact] ?? impactColors.Medium)}>
                        {action.impact} Impact
                      </span>
                    )}
                    {action.effort && (
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', effortColors[action.effort] ?? effortColors.Medium)}>
                        {action.effort} Effort
                      </span>
                    )}
                    {action.timeframe && (
                      <span className="text-[9px] text-bms-muted flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{action.timeframe}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-bms-text">{action.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
