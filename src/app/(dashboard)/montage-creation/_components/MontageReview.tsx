'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, MessageSquare, RefreshCw, Film, Music, Clock,
  RotateCcw, ChevronDown, ChevronUp, AlertCircle, Brain, Download,
  ExternalLink, Lightbulb, Trophy, Zap, Clapperboard,
} from 'lucide-react'

// Direct browser-to-localhost — matches page.tsx design.
// The Vercel proxy cannot reach the user's local server, so we call it directly.
// The montage server has full CORS + Private-Network headers so the browser can reach it.
const MONTAGE_LOCAL = 'http://localhost:3001'
const API    = `${MONTAGE_LOCAL}/api/montage`
const STREAM = `${MONTAGE_LOCAL}/api/montage/file`

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(s: number): string {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

function parseClips(raw: string | string[] | unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (!raw || typeof raw !== 'string') return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p as string[] : [raw]
  } catch {
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }
}

function getScoreColor(score: number) {
  if (score >= 70) return { text: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' }
  if (score >= 50) return { text: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }
  return { text: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' }
}

function parseReviewJson(raw?: string): ReviewBreakdown | null {
  if (!raw) return null
  try { return JSON.parse(raw) as ReviewBreakdown } catch { return null }
}

const VARIANT_ACCENT: Record<string, { primary: string; bg: string; border: string; gradient: string; label: string; icon: string }> = {
  A: {
    primary: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
    gradient: 'linear-gradient(135deg,rgba(249,115,22,0.2),rgba(249,115,22,0.05))',
    label: '⚡ High Energy',
    icon: '⚡',
  },
  B: {
    primary: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
    gradient: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(124,58,237,0.05))',
    label: '🎬 Cinematic',
    icon: '🎬',
  },
}

// ─── Compact Montage Card ─────────────────────────────────────────────────────

interface CardProps {
  montage: Montage
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
  compact?: boolean
}

function MontageCard({
  montage, isChosen, showPreferButton, isPreferring, onPrefer,
  feedbackText, isFeedbackOpen, isReviewOpen, isSubmitting, insights,
  isInsightsOpen, isInsightsLoading,
  onToggleFeedback, onFeedbackChange, onSubmitFeedback, onToggleReview,
  onFetchInsights, onApproveMontage, onRerun, compact = false,
}: CardProps) {
  const score      = montage.reference_match_score
  const sc         = getScoreColor(score)
  const clips      = parseClips(montage.clips_used)
  const review     = parseReviewJson(montage.review_json)
  const isApproved = montage.status === 'ready_to_post'
  const vAccent    = montage.variant ? VARIANT_ACCENT[montage.variant] : undefined

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden bg-bms-card flex flex-col"
      style={{
        border: isChosen
          ? '2px solid rgba(16,185,129,0.55)'
          : vAccent
          ? `1px solid ${vAccent.border}`
          : '1px solid var(--bms-border,#1e293b)',
        boxShadow: isChosen ? '0 0 16px rgba(16,185,129,0.12)' : undefined,
      }}
    >
      {/* Variant badge bar */}
      {vAccent && (
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ background: vAccent.bg, borderBottom: `1px solid ${vAccent.border}` }}
        >
          <span className="text-[11px] font-bold" style={{ color: vAccent.primary }}>
            {vAccent.icon} Variant {montage.variant} — {montage.variant_name ?? vAccent.label}
          </span>
          {montage.variant_style && (
            <span className="text-[9px] text-bms-muted truncate ml-auto">{montage.variant_style}</span>
          )}
          {isChosen && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ml-auto">
              ✓ Winner
            </span>
          )}
        </div>
      )}

      {/* Main row: video + info */}
      <div className="flex gap-3 p-3">
        {/* Video thumbnail — fixed narrow width for compact layout */}
        <div className="relative shrink-0" style={{ width: compact ? 90 : 120 }}>
          <video
            src={`${STREAM}/${montage.id}`}
            crossOrigin="anonymous"
            controls
            preload="metadata"
            className="rounded-lg bg-bms-darker w-full"
            style={{ aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
          />
          {/* Score overlay */}
          <div
            className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
          >
            {Math.round(score)}%
          </div>
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Duration + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-bms-muted flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />{formatDuration(montage.duration)}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                color: isApproved ? '#10B981' : '#94a3b8',
                border: isApproved ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(100,116,139,0.2)',
              }}
            >
              {montage.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Music */}
          {montage.music_track && (
            <p className="text-[10px] text-bms-muted flex items-center gap-1 truncate">
              <Music className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span className="truncate">{montage.music_track}</span>
            </p>
          )}

          {/* Clips */}
          {clips.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {clips.slice(0, 4).map((c, i) => (
                <span key={i} className="text-[8px] px-1 py-0.5 rounded font-mono bg-bms-darker text-bms-muted border border-bms-border truncate max-w-[80px]" title={c}>
                  {c.replace(/\.(mov|mp4|avi|mkv)$/i, '')}
                </span>
              ))}
              {clips.length > 4 && <span className="text-[8px] text-bms-muted">+{clips.length - 4}</span>}
            </div>
          )}

          {/* Download + Open */}
          <div className="flex gap-1 mt-auto">
            <a
              href={`${STREAM}/${montage.id}`}
              download={`montage-${montage.id}.mp4`}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold bg-bms-darker border border-bms-border text-bms-muted hover:text-bms-text transition-colors"
            >
              <Download className="w-2 h-2" />DL
            </a>
            <a
              href={`${STREAM}/${montage.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold bg-bms-darker border border-bms-border text-bms-muted hover:text-bms-text transition-colors"
            >
              <ExternalLink className="w-2 h-2" />Open
            </a>
          </div>
        </div>
      </div>

      {/* Expandable sections */}
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        {/* AI Review */}
        {review && (
          <div className="rounded-lg overflow-hidden border border-indigo-500/20 bg-indigo-500/5">
            <button onClick={onToggleReview} className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold text-indigo-400 hover:bg-bms-darker/50 transition-colors">
              <span className="flex items-center gap-1"><Brain className="w-2.5 h-2.5" />AI Review {Math.round(review.overallScore)}%</span>
              {isReviewOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
            <AnimatePresence>
              {isReviewOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
                    {review.matchBreakdown && Object.entries(review.matchBreakdown).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[9px]">
                        <span className="text-bms-muted capitalize">{k.replace(/_/g, ' ')}</span>
                        <span style={{ color: typeof v === 'number' && v >= 70 ? '#10B981' : typeof v === 'number' && v >= 50 ? '#F59E0B' : '#EF4444' }} className="font-semibold">
                          {typeof v === 'number' ? `${Math.round(v)}%` : String(v)}
                        </span>
                      </div>
                    ))}
                    {review.corrections?.length > 0 && (
                      <div className="pt-1 border-t border-bms-border flex flex-col gap-1">
                        {review.corrections.map((c, i) => (
                          <div key={i} className="flex items-start gap-1 text-[9px] text-bms-muted">
                            <AlertCircle className="w-2 h-2 mt-0.5 shrink-0 text-amber-400" />
                            <span><span className="font-medium">{c.type.replace(/_/g, ' ')}: </span>{c.description}</span>
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

        {/* AI Learnings */}
        <div className="rounded-lg overflow-hidden border border-pink-500/20 bg-pink-500/4">
          <button onClick={onFetchInsights} className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold text-pink-400 hover:bg-bms-darker/50 transition-colors">
            <span className="flex items-center gap-1"><Lightbulb className="w-2.5 h-2.5" />AI Learnings</span>
            {isInsightsLoading ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : isInsightsOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>
          <AnimatePresence>
            {isInsightsOpen && insights && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
                  {(() => {
                    const rec = insights.insightRecord
                    const reviewSc = rec?.reviewScore ?? 0
                    const refSc = rec?.referenceMatchScore ?? insights.referenceDiff?.overallScore ?? 0
                    const notes = rec?.analysisNotes ?? insights.referenceDiff?.improvementDirection ?? ''
                    return (
                      <>
                        <div className="flex gap-2">
                          {[{ l: 'Review', v: reviewSc }, { l: 'Ref Match', v: refSc }].map(({ l, v }) => (
                            <div key={l} className="flex-1 flex flex-col items-center py-1.5 rounded-lg bg-bms-darker border border-bms-border">
                              <span className="text-[8px] text-bms-muted">{l}</span>
                              <span className="text-xs font-bold font-mono" style={{ color: v >= 70 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444' }}>{Math.round(v)}%</span>
                            </div>
                          ))}
                          <div className="flex-1 flex flex-col items-center py-1.5 rounded-lg bg-bms-darker border border-bms-border">
                            <span className="text-[8px] text-bms-muted">Rules Added</span>
                            <span className="text-xs font-bold font-mono text-pink-400">{insights.sessionRules.length}</span>
                          </div>
                        </div>
                        {notes && <p className="text-[9px] text-bms-muted leading-relaxed">{notes}</p>}
                        {insights.sessionRules.slice(0, 2).map((r, i) => (
                          <div key={i} className="px-2 py-1.5 rounded bg-pink-500/5 border border-pink-500/18 border-l-2" style={{ borderLeftColor: 'rgba(236,72,153,0.5)' }}>
                            <p className="text-[9px] text-bms-muted">{r.rule_text}</p>
                          </div>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          {!isApproved ? (
            <button onClick={onApproveMontage} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/18 transition-colors">
              <CheckCircle2 className="w-2.5 h-2.5" />Approve
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/8 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5" />Approved
            </div>
          )}
          <button onClick={onRerun} className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-bms-muted border border-bms-border hover:bg-bms-darker transition-colors">
            <RotateCcw className="w-2.5 h-2.5" />Re-run
          </button>
          <button onClick={onToggleFeedback} className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-bms-muted border border-bms-border hover:bg-bms-darker transition-colors">
            <MessageSquare className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Feedback input */}
        <AnimatePresence>
          {isFeedbackOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-col gap-1.5 pt-1">
                <textarea
                  value={feedbackText}
                  onChange={e => onFeedbackChange(e.target.value)}
                  placeholder="Describe what needs to change..."
                  rows={2}
                  className="w-full resize-none rounded-lg px-2.5 py-1.5 text-[10px] outline-none bg-bms-darker border border-bms-border text-bms-text placeholder:text-bms-muted focus:border-bms-cyan/50 transition-colors"
                />
                <button
                  onClick={onSubmitFeedback}
                  disabled={isSubmitting || !feedbackText.trim()}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-amber-500 text-white hover:bg-amber-500/90 disabled:opacity-40 transition-colors"
                >
                  {isSubmitting ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <XCircle className="w-2.5 h-2.5" />}
                  Submit feedback
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── A vs B Battle Picker ─────────────────────────────────────────────────────

function ABBattlePicker({
  batch, chosenId, isPreferring, onPick,
}: {
  batch: Montage[]
  chosenId: string | null
  isPreferring: boolean
  onPick: (m: Montage) => void
}) {
  const mA = batch.find(m => m.variant === 'A')
  const mB = batch.find(m => m.variant === 'B')
  if (!mA || !mB) return null
  if (chosenId) return null  // don't show if already chosen

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-bms-border bg-bms-darker"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-b border-bms-border">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-bold text-bms-text">Which is better? Select the winner — it shapes the next run</span>
      </div>
      <div className="grid grid-cols-2">
        {[mA, mB].map(m => {
          const va = VARIANT_ACCENT[m.variant!]
          return (
            <button
              key={m.id}
              onClick={() => onPick(m)}
              disabled={isPreferring}
              className="flex flex-col items-center gap-2 px-4 py-4 transition-all hover:opacity-90 disabled:opacity-50 group"
              style={{ background: va.gradient }}
            >
              <div className="text-2xl">{va.icon}</div>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: va.primary }}>Variant {m.variant}</p>
                <p className="text-xs font-semibold text-bms-text">{m.variant_name ?? va.label.replace(/^[^ ]+ /, '')}</p>
                <p className="text-[10px] text-bms-muted mt-0.5">{m.variant_style}</p>
              </div>
              <div
                className="mt-1 px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all group-hover:scale-105"
                style={{ background: va.bg, color: va.primary, border: `1px solid ${va.border}` }}
              >
                {isPreferring ? <><RefreshCw className="inline w-2.5 h-2.5 animate-spin mr-1" />Saving…</> : `✓ Pick ${m.variant}`}
              </div>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

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

  const pickWinner = async (montage: Montage) => {
    if (!montage.batch_id) return
    setPreferring(p => ({ ...p, [montage.batch_id!]: true }))
    try {
      const res = await fetch(`${API}/montages/${montage.id}/prefer`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPreferred(p => ({ ...p, [montage.batch_id!]: montage.id }))
    } catch (e) { console.error('Prefer failed:', e) }
    finally { setPreferring(p => ({ ...p, [montage.batch_id!]: false })) }
  }

  const fetchInsights = async (id: string) => {
    if (insights[id]) { setInsightsOpen(p => ({ ...p, [id]: !p[id] })); return }
    setInsightsLoading(p => ({ ...p, [id]: true }))
    setInsightsOpen(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`${API}/montages/${id}/insights`)
      if (res.ok) {
        const data = await res.json() as MontageInsights
        setInsights(p => ({ ...p, [id]: data }))
      }
    } catch (e) { console.error('Insights failed:', e) }
    finally { setInsightsLoading(p => ({ ...p, [id]: false })) }
  }

  const handleSubmitFeedback = async (id: string) => {
    const text = feedbackTexts[id]?.trim()
    if (!text) return
    setSubmitting(p => ({ ...p, [id]: true }))
    try {
      await onSubmitFeedback(id, text)
      setFeedbackTexts(p => ({ ...p, [id]: '' }))
      setFeedbackOpen(p => ({ ...p, [id]: false }))
    } finally {
      setSubmitting(p => ({ ...p, [id]: false }))
    }
  }

  const cardProps = (montage: Montage, isChosen: boolean, showPrefer: boolean, batchId?: string) => ({
    montage,
    isChosen,
    showPreferButton: showPrefer,
    isPreferring: batchId ? (preferring[batchId] ?? false) : false,
    onPrefer: () => pickWinner(montage),
    feedbackText: feedbackTexts[montage.id] ?? '',
    isFeedbackOpen: feedbackOpen[montage.id] ?? false,
    isReviewOpen: reviewOpen[montage.id] ?? false,
    isSubmitting: submitting[montage.id] ?? false,
    insights: insights[montage.id],
    isInsightsOpen: insightsOpen[montage.id] ?? false,
    isInsightsLoading: insightsLoading[montage.id] ?? false,
    onToggleFeedback: () => setFeedbackOpen(p => ({ ...p, [montage.id]: !p[montage.id] })),
    onFeedbackChange: (v: string) => setFeedbackTexts(p => ({ ...p, [montage.id]: v })),
    onSubmitFeedback: () => handleSubmitFeedback(montage.id),
    onToggleReview: () => setReviewOpen(p => ({ ...p, [montage.id]: !p[montage.id] })),
    onFetchInsights: () => fetchInsights(montage.id),
    onApproveMontage: () => onApproveMontage(montage.id),
    onRerun: () => onRerun(parseClips(montage.clips_used)),
  })

  if (montages.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-bms-text">Montage Review</h3>
            <p className="text-xs text-bms-muted mt-0.5">0 montages ready</p>
          </div>
          <button onClick={onMontagesRefresh} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-bms-darker transition-colors text-bms-muted">
            <RefreshCw className="w-3 h-3" />Refresh
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/8 border border-emerald-500/20">
            <Film className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm text-bms-muted">No montages yet — run the pipeline to generate your first pair</p>
        </div>
      </div>
    )
  }

  // Group into batches (A/B pairs) + singles
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-bms-text flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-bms-cyan" />Montage Review
          </h3>
          <p className="text-xs text-bms-muted mt-0.5">
            {montages.length} montage{montages.length !== 1 ? 's' : ''} · {batches.length} A/B run{batches.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={onMontagesRefresh} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-bms-darker transition-colors text-bms-muted border border-bms-border">
          <RefreshCw className="w-3 h-3" />Refresh
        </button>
      </div>

      {/* A/B Batch runs */}
      {batches.map((batch, gi) => {
        const batchId = batch[0].batch_id!
        const chosenId = preferred[batchId] ?? batch.find(m => m.preferred)?.id ?? null
        const chosenMontage = batch.find(m => m.id === chosenId)
        const runDate = new Date(batch[0].created_at * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

        return (
          <div key={`batch-${batchId}-${gi}`} className="flex flex-col gap-3">
            {/* Run header */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-bms-border" />
              <span className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide flex items-center gap-1.5 shrink-0">
                <Zap className="w-2.5 h-2.5 text-amber-400" />Run — {runDate}
              </span>
              <div className="h-px flex-1 bg-bms-border" />
            </div>

            {/* A vs B Battle Picker */}
            <ABBattlePicker
              batch={batch}
              chosenId={chosenId}
              isPreferring={preferring[batchId] ?? false}
              onPick={pickWinner}
            />

            {/* Winner banner */}
            {chosenId && chosenMontage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs bg-emerald-500/7 border border-emerald-500/22 text-emerald-400"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  <strong>Variant {chosenMontage.variant} — {chosenMontage.variant_name}</strong> selected as winner.
                  The next run will build on this style.
                </span>
              </motion.div>
            )}

            {/* Cards: A and B side by side (compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {batch.sort((a, b) => (a.variant ?? '').localeCompare(b.variant ?? '')).map(m => (
                <MontageCard
                  key={m.id}
                  {...cardProps(m, chosenId === m.id, false, batchId)}
                  compact
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Singles — compact multi-column grid */}
      {singles.length > 0 && (
        <div className="flex flex-col gap-3">
          {batches.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-bms-border" />
              <span className="text-[10px] font-semibold text-bms-muted uppercase tracking-wide shrink-0">Single Montages</span>
              <div className="h-px flex-1 bg-bms-border" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {singles.map(m => (
              <MontageCard key={m.id} {...cardProps(m, false, false)} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
