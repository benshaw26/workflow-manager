'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, MessageSquare, RefreshCw, Film, Music, Clock,
  RotateCcw, ChevronDown, ChevronUp, AlertCircle, Brain, Download,
  ExternalLink, Lightbulb,
} from 'lucide-react'

const API    = '/api/montage-proxy/montage'
const STREAM = '/api/montage-proxy/montage/file'

interface ReviewBreakdown {
  overallScore: number
  passesReview: boolean
  matchBreakdown: Record<string, number | string>
  corrections: Array<{ type: string; description: string; autoFixable?: boolean }>
}

interface Montage {
  id: string
  session_id: string
  file_path: string
  reference_match_score: number
  clips_used: string | string[]
  music_track: string
  duration: number
  status: string
  review_json?: string
  created_at: number
  batch_id?: string
  variant?: 'A' | 'B'
  variant_name?: string
  variant_style?: string
  variant_rationale?: string
  preferred?: boolean
}

interface Props {
  montages: Montage[]
  onApproveMontage: (id: string) => void
  onSubmitFeedback: (id: string, text: string) => void
  onMontagesRefresh: () => void
  onRerun: (clipNames: string[]) => void
}

interface InsightRecord {
  runNumber?: number
  reviewScore?: number
  referenceMatchScore?: number
  analysisNotes?: string
  newRulesAdded?: number
  refsUsed?: string[]
}

interface MontageInsights {
  referenceDiff: {
    overallScore: number
    matchBreakdown: Record<string, { score: number; target: string; notes: string }>
    improvements: string[]
    improvementDirection: string
    corrections: Array<{ type: string; description: string; priority: string }>
  } | null
  feedbackInsights: Array<{ feedback_text: string; insights: { newRules: Array<{ rule_text: string }> } | null }>
  sessionRules: Array<{ id: string; rule_text: string; source: string; weight: number }>
  insightRecord: InsightRecord | null
  summary: { totalFeedback: number; appliedFeedback: number; matchScore: number; rulesLearned: number }
}

function formatDuration(s: number): string {
  const mins = Math.floor(s / 60)
  const secs = Math.floor(s % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function parseClips(raw: string | string[] | unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (!raw || typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as string[]
    return [raw]
  } catch {
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
}

function getScoreStyle(score: number): { bg: string; color: string; border: string } {
  if (score >= 70) return { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.3)' }
  if (score >= 50) return { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' }
  return { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' }
}

function getStatusStyle(status: string): { bg: string; color: string; border: string } {
  if (status === 'ready_to_post') return { bg: 'rgba(16,185,129,0.1)',  color: '#10B981', border: 'rgba(16,185,129,0.25)' }
  if (status === 'not_ready')     return { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)' }
  if (status === 'in_review')     return { bg: 'rgba(0,212,255,0.1)',   color: '#00d4ff', border: 'rgba(0,212,255,0.25)' }
  return { bg: 'rgba(99,102,241,0.1)', color: '#6366F1', border: 'rgba(99,102,241,0.25)' }
}

function parseReviewJson(raw?: string): ReviewBreakdown | null {
  if (!raw) return null
  try { return JSON.parse(raw) as ReviewBreakdown } catch { return null }
}

export default function MontageReview({ montages, onApproveMontage, onSubmitFeedback, onMontagesRefresh, onRerun }: Props) {
  const [feedbackTexts, setFeedbackTexts]   = useState<Record<string, string>>({})
  const [feedbackOpen, setFeedbackOpen]     = useState<Record<string, boolean>>({})
  const [reviewOpen, setReviewOpen]         = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting]         = useState<Record<string, boolean>>({})
  const [insights, setInsights]             = useState<Record<string, MontageInsights>>({})
  const [insightsOpen, setInsightsOpen]     = useState<Record<string, boolean>>({})
  const [insightsLoading, setInsightsLoading] = useState<Record<string, boolean>>({})
  const [preferring, setPreferring]         = useState<Record<string, boolean>>({})
  const [preferred, setPreferred]           = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    montages.forEach(m => { if (m.batch_id && m.preferred) init[m.batch_id] = m.id })
    return init
  })

  const preferMontage = async (montage: Montage) => {
    if (!montage.batch_id) return
    setPreferring(p => ({ ...p, [montage.batch_id!]: true }))
    try {
      const res = await fetch(`${API}/montages/${montage.id}/prefer`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPreferred(p => ({ ...p, [montage.batch_id!]: montage.id }))
    } catch (e) {
      console.error('Failed to save preference:', e)
    } finally {
      setPreferring(p => ({ ...p, [montage.batch_id!]: false }))
    }
  }

  const fetchInsights = async (id: string) => {
    if (insights[id]) {
      setInsightsOpen(p => ({ ...p, [id]: !p[id] }))
      return
    }
    setInsightsLoading(p => ({ ...p, [id]: true }))
    setInsightsOpen(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`${API}/montages/${id}/insights`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setInsights(p => ({ ...p, [id]: data }))
    } catch (e) {
      console.error('Failed to fetch insights:', e)
    } finally {
      setInsightsLoading(p => ({ ...p, [id]: false }))
    }
  }

  const handleSubmitFeedback = async (id: string) => {
    const text = feedbackTexts[id]?.trim()
    if (!text) return
    setSubmitting((prev) => ({ ...prev, [id]: true }))
    try {
      await onSubmitFeedback(id, text)
      setFeedbackTexts((prev) => ({ ...prev, [id]: '' }))
      setFeedbackOpen((prev) => ({ ...prev, [id]: false }))
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-bms-text">Montage Review</h3>
          <p className="text-xs text-bms-muted mt-0.5">
            {montages.length} montage{montages.length !== 1 ? 's' : ''} ready for review
          </p>
        </div>
        <button
          onClick={onMontagesRefresh}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-bms-darker transition-colors text-bms-muted"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {montages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/8 border border-emerald-500/20">
            <Film className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm text-bms-muted">No montages ready for review yet</p>
          <p className="text-xs text-bms-muted max-w-xs">
            Run the pipeline to generate montages, then come back here to approve or request changes
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {(() => {
            // Group by batch_id
            const batches: Montage[][] = []
            const batchMap: Record<string, number> = {}
            const singles: Montage[] = []
            for (const m of montages) {
              if (m.batch_id) {
                if (batchMap[m.batch_id] === undefined) { batchMap[m.batch_id] = batches.length; batches.push([]) }
                batches[batchMap[m.batch_id]].push(m)
              } else {
                singles.push(m)
              }
            }
            const groups: Array<{ type: 'batch'; items: Montage[] } | { type: 'single'; item: Montage }> = [
              ...batches.map(items => ({ type: 'batch' as const, items })),
              ...singles.map(item => ({ type: 'single' as const, item })),
            ]

            return groups.map((group, gi) => {
              if (group.type === 'batch') {
                const batch = group.items
                const batchId = batch[0].batch_id!
                const chosenId = preferred[batchId] ?? batch.find(m => m.preferred)?.id ?? null
                const isPreferring = preferring[batchId] ?? false

                return (
                  <div key={`batch-${batchId}`} className="flex flex-col gap-3">
                    {/* Batch header */}
                    <div className="flex items-center gap-3 px-1">
                      <div className="h-px flex-1 bg-bms-border" />
                      <span className="text-[10px] font-semibold text-bms-muted uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-2.5 h-2.5" /> A/B Variants — {new Date(batch[0].created_at * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="h-px flex-1 bg-bms-border" />
                    </div>

                    {chosenId && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs bg-emerald-500/7 border border-emerald-500/22 text-emerald-400"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Style saved — <strong>{batch.find(m => m.id === chosenId)?.variant_name}</strong> selected.
                          The next run will produce something similar to this style.
                        </span>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {batch.sort((a, b) => (a.variant ?? '').localeCompare(b.variant ?? '')).map((montage) => {
                        const isChosen = chosenId === montage.id
                        const accentColor = montage.variant === 'A' ? '#f97316' : '#7c3aed'
                        return (
                          <MontageCard
                            key={montage.id}
                            montage={montage}
                            accentColor={accentColor}
                            isChosen={isChosen}
                            showPreferButton={!chosenId}
                            isPreferring={isPreferring}
                            onPrefer={() => preferMontage(montage)}
                            feedbackText={feedbackTexts[montage.id] ?? ''}
                            isFeedbackOpen={feedbackOpen[montage.id] ?? false}
                            isReviewOpen={reviewOpen[montage.id] ?? false}
                            isSubmitting={submitting[montage.id] ?? false}
                            insights={insights[montage.id]}
                            isInsightsOpen={insightsOpen[montage.id] ?? false}
                            isInsightsLoading={insightsLoading[montage.id] ?? false}
                            onToggleFeedback={() => setFeedbackOpen(p => ({ ...p, [montage.id]: !p[montage.id] }))}
                            onFeedbackChange={(v) => setFeedbackTexts(p => ({ ...p, [montage.id]: v }))}
                            onSubmitFeedback={() => handleSubmitFeedback(montage.id)}
                            onToggleReview={() => setReviewOpen(p => ({ ...p, [montage.id]: !p[montage.id] }))}
                            onFetchInsights={() => fetchInsights(montage.id)}
                            onApproveMontage={() => onApproveMontage(montage.id)}
                            onRerun={() => onRerun(parseClips(montage.clips_used))}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              }

              const montage = group.item
              return (
                <div key={`single-${montage.id}`} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MontageCard
                    montage={montage}
                    accentColor={undefined}
                    isChosen={false}
                    showPreferButton={false}
                    isPreferring={false}
                    onPrefer={() => {}}
                    feedbackText={feedbackTexts[montage.id] ?? ''}
                    isFeedbackOpen={feedbackOpen[montage.id] ?? false}
                    isReviewOpen={reviewOpen[montage.id] ?? false}
                    isSubmitting={submitting[montage.id] ?? false}
                    insights={insights[montage.id]}
                    isInsightsOpen={insightsOpen[montage.id] ?? false}
                    isInsightsLoading={insightsLoading[montage.id] ?? false}
                    onToggleFeedback={() => setFeedbackOpen(p => ({ ...p, [montage.id]: !p[montage.id] }))}
                    onFeedbackChange={(v) => setFeedbackTexts(p => ({ ...p, [montage.id]: v }))}
                    onSubmitFeedback={() => handleSubmitFeedback(montage.id)}
                    onToggleReview={() => setReviewOpen(p => ({ ...p, [montage.id]: !p[montage.id] }))}
                    onFetchInsights={() => fetchInsights(montage.id)}
                    onApproveMontage={() => onApproveMontage(montage.id)}
                    onRerun={() => onRerun(parseClips(montage.clips_used))}
                  />
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}

// ── MontageCard ───────────────────────────────────────────────────────────────
interface CardProps {
  montage: Montage
  accentColor?: string
  isChosen: boolean
  showPreferButton: boolean
  isPreferring: boolean
  onPrefer: () => void
  feedbackText: string
  isFeedbackOpen: boolean
  isReviewOpen: boolean
  isSubmitting: boolean
  insights?: MontageInsights
  isInsightsOpen: boolean
  isInsightsLoading: boolean
  onToggleFeedback: () => void
  onFeedbackChange: (v: string) => void
  onSubmitFeedback: () => void
  onToggleReview: () => void
  onFetchInsights: () => void
  onApproveMontage: () => void
  onRerun: () => void
}

function MontageCard({
  montage, accentColor, isChosen, showPreferButton, isPreferring, onPrefer,
  feedbackText, isFeedbackOpen, isReviewOpen, isSubmitting, insights,
  isInsightsOpen, isInsightsLoading,
  onToggleFeedback, onFeedbackChange, onSubmitFeedback, onToggleReview,
  onFetchInsights, onApproveMontage, onRerun,
}: CardProps) {
  const score       = montage.reference_match_score
  const scoreStyle  = getScoreStyle(score)
  const statusStyle = getStatusStyle(montage.status)
  const clips       = parseClips(montage.clips_used)
  const isReadyToPost = montage.status === 'ready_to_post'
  const review      = parseReviewJson(montage.review_json)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden flex flex-col bg-bms-card"
      style={{
        border: isChosen
          ? '2px solid rgba(16,185,129,0.6)'
          : accentColor
          ? `1px solid ${accentColor}30`
          : '1px solid var(--bms-border, #1e293b)',
        boxShadow: isChosen ? '0 0 20px rgba(16,185,129,0.15)' : undefined,
      }}
    >
      {/* Variant label bar */}
      {montage.variant && (
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ background: `${accentColor ?? '#64748b'}12`, borderBottom: `1px solid ${accentColor ?? '#64748b'}20` }}
        >
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}>
            VARIANT {montage.variant}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: accentColor }}>{montage.variant_name}</span>
          {montage.variant_style && <span className="text-[10px] text-bms-muted truncate ml-auto">{montage.variant_style}</span>}
          {isChosen && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Chosen
            </span>
          )}
        </div>
      )}

      {/* Video */}
      <div className="relative">
        <video
          src={`${STREAM}/${montage.id}`}
          controls
          preload="metadata"
          className="w-full bg-bms-darker"
          style={{ aspectRatio: '9/16', objectFit: 'cover' }}
        />
        {/* Score badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold"
          style={{ background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}` }}
        >
          {Math.round(score)}% Match
        </div>
        {/* Download / open buttons */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <a
            href={`${STREAM}/${montage.id}`}
            download={`montage-${montage.id}.mp4`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm transition-opacity hover:opacity-90 bg-black/60 text-slate-100 border border-white/15"
          >
            <Download className="w-2.5 h-2.5" />
            Download
          </a>
          <a
            href={`${STREAM}/${montage.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm transition-opacity hover:opacity-90 bg-black/60 text-slate-100 border border-white/15"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            Open
          </a>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-bms-muted">
            <Clock className="w-2.5 h-2.5" />
            <span>{formatDuration(montage.duration)}</span>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-md font-medium"
            style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
          >
            {montage.status.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-bms-muted ml-auto">{formatDate(montage.created_at)}</span>
        </div>

        {/* Music */}
        {montage.music_track && (
          <div className="flex items-center gap-1.5 text-xs text-bms-muted">
            <Music className="w-2.5 h-2.5 text-emerald-400" />
            <span className="truncate">{montage.music_track}</span>
          </div>
        )}

        {/* Clips used */}
        {clips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clips.map((clip, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-bms-darker text-bms-muted border border-bms-border">
                {clip}
              </span>
            ))}
          </div>
        )}

        {/* AI Review Breakdown */}
        {review && (
          <div className="rounded-xl overflow-hidden border border-indigo-500/20 bg-indigo-500/5">
            <button
              onClick={onToggleReview}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors hover:bg-bms-darker/50 text-indigo-400"
            >
              <span className="flex items-center gap-1.5">
                <Brain className="w-2.5 h-2.5" />
                AI Review — {Math.round(review.overallScore)}% match
                {review.passesReview ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/15 text-emerald-400">Passed</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-500/12 text-red-400">Needs work</span>
                )}
              </span>
              {isReviewOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {isReviewOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 flex flex-col gap-2">
                    {review.matchBreakdown && Object.keys(review.matchBreakdown).length > 0 && (
                      <div className="flex flex-col gap-1">
                        {Object.entries(review.matchBreakdown).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between text-[10px]">
                            <span className="text-bms-muted capitalize">{key.replace(/_/g, ' ')}</span>
                            <span
                              className="font-semibold"
                              style={{ color: typeof val === 'number' && val >= 70 ? '#10B981' : typeof val === 'number' && val >= 50 ? '#F59E0B' : '#EF4444' }}
                            >
                              {typeof val === 'number' ? `${Math.round(val)}%` : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {review.corrections && review.corrections.length > 0 && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-bms-border">
                        <p className="text-[10px] text-bms-muted font-medium">Suggestions</p>
                        {review.corrections.map((c, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-bms-muted">
                            <AlertCircle className="w-2 h-2 mt-0.5 shrink-0 text-amber-400" />
                            <span><span className="font-medium capitalize">{c.type.replace(/_/g, ' ')}: </span>{c.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* AI Learnings Panel */}
        <div className="rounded-xl overflow-hidden border border-pink-500/20 bg-pink-500/4">
          <button
            onClick={onFetchInsights}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors hover:bg-bms-darker/50 text-pink-400"
          >
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-2.5 h-2.5" />
              What the AI Learned This Run
            </span>
            {isInsightsLoading ? (
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            ) : isInsightsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {isInsightsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 flex flex-col gap-3">
                  {isInsightsLoading && (
                    <p className="text-[10px] text-bms-muted flex items-center gap-1.5 py-1">
                      <RefreshCw className="w-2 h-2 animate-spin" /> Loading learning data…
                    </p>
                  )}

                  {!insights && !isInsightsLoading && (
                    <p className="text-[10px] text-bms-muted py-1">
                      No learning data yet for this run. Run the pipeline to generate insights.
                    </p>
                  )}

                  {insights && (() => {
                    const ins = insights
                    const rec: InsightRecord | null = ins.insightRecord
                    const refScore  = rec?.referenceMatchScore ?? ins.referenceDiff?.overallScore ?? 0
                    const reviewSc  = rec?.reviewScore ?? 0
                    const notes     = rec?.analysisNotes ?? ins.referenceDiff?.improvementDirection ?? ''
                    const rulesAdded = rec?.newRulesAdded ?? ins.sessionRules.length
                    const refsUsed  = rec?.refsUsed ?? []

                    return (
                      <>
                        {/* Score row */}
                        <div className="flex gap-3 pt-1">
                          {[
                            { label: 'Review',     val: reviewSc },
                            { label: 'Ref match',  val: refScore },
                            { label: 'Rules added', val: rulesAdded, noPercent: true },
                          ].map(({ label, val, noPercent }) => {
                            const c = noPercent ? '#ec4899' : val >= 70 ? '#10b981' : val >= 50 ? '#f59e0b' : '#ef4444'
                            return (
                              <div key={label} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg bg-bms-darker border border-bms-border">
                                <span className="text-[10px] text-bms-muted">{label}</span>
                                <span className="text-sm font-bold font-mono" style={{ color: c }}>
                                  {noPercent ? val : `${Math.round(val)}%`}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        {notes && (
                          <div className="px-2.5 py-2 rounded-lg text-[10px] leading-relaxed text-bms-muted bg-pink-500/6 border border-pink-500/15">
                            <p className="text-[9px] font-semibold uppercase tracking-wider mb-1 text-pink-400">
                              Visual analysis vs references{refsUsed.length > 0 ? ` (${refsUsed.length} ref clip${refsUsed.length !== 1 ? 's' : ''} compared)` : ''}
                            </p>
                            {notes}
                          </div>
                        )}

                        {ins.sessionRules.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-bms-border">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-pink-400">
                              {ins.sessionRules.length} new rule{ins.sessionRules.length !== 1 ? 's' : ''} added to knowledge base
                            </p>
                            {ins.sessionRules.map((rule, i) => (
                              <div key={i} className="px-2.5 py-2 rounded-lg bg-pink-500/5 border border-pink-500/18" style={{ borderLeft: '3px solid rgba(236,72,153,0.5)' }}>
                                <p className="text-[10px] text-bms-muted leading-snug">{rule.rule_text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {ins.sessionRules.length === 0 && !isInsightsLoading && (
                          <p className="text-[10px] text-bms-muted pt-2 border-t border-bms-border">
                            No new rules added this run — all observations were already covered by existing knowledge base rules.
                          </p>
                        )}

                        {ins.feedbackInsights.length > 0 && (
                          <div className="flex flex-col gap-1 pt-2 border-t border-bms-border">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-bms-muted">Your feedback</p>
                            {ins.feedbackInsights.map((f, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10px]">
                                <MessageSquare className="w-2 h-2 mt-0.5 shrink-0 text-violet-400" />
                                <span className="text-bms-muted">{f.feedback_text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-bms-border">

          {/* Choose this style (A/B mode) */}
          {showPreferButton && !isChosen && (
            <button
              onClick={onPrefer}
              disabled={isPreferring}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg,${accentColor ?? '#10b981'}28,${accentColor ?? '#10b981'}10)`,
                color: accentColor ?? '#10b981',
                border: `1px solid ${accentColor ?? '#10b981'}45`,
              }}
            >
              {isPreferring ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {isPreferring ? 'Saving…' : 'This style is better — use this next run'}
            </button>
          )}

          {isChosen && (
            <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Style saved — next run will match this
            </div>
          )}

          {/* Approve */}
          {!isReadyToPost && (
            <button
              onClick={onApproveMontage}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-colors bg-emerald-500/12 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="w-3 h-3" />
              Approve for Posting
            </button>
          )}
          {isReadyToPost && (
            <div className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold bg-emerald-500/8 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Approved
            </div>
          )}

          {/* Re-run */}
          <button
            onClick={onRerun}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-bms-darker text-bms-muted border border-bms-border"
          >
            <RotateCcw className="w-3 h-3" />
            Re-run with same clips
          </button>

          {/* Feedback toggle */}
          <button
            onClick={onToggleFeedback}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-bms-darker text-bms-muted border border-bms-border"
          >
            <MessageSquare className="w-3 h-3" />
            {isFeedbackOpen ? 'Cancel feedback' : 'Request changes'}
          </button>

          {/* Feedback input */}
          <AnimatePresence>
            {isFeedbackOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pt-1">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => onFeedbackChange(e.target.value)}
                    placeholder="Describe what needs to change..."
                    rows={3}
                    className="w-full resize-none rounded-xl px-3 py-2 text-xs outline-none transition-colors bg-bms-darker border border-bms-border text-bms-text placeholder:text-bms-muted focus:border-bms-cyan/50"
                  />
                  <button
                    onClick={onSubmitFeedback}
                    disabled={isSubmitting || !feedbackText.trim()}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 bg-amber-500 text-white hover:bg-amber-500/90"
                  >
                    {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                    Submit feedback
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
