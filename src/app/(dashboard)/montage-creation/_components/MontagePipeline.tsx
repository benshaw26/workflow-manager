'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter, FileText, Scissors, Grid, Music, Video, Eye, Brain,
  CheckCircle2, XCircle, AlertTriangle, Zap, ChevronDown, ChevronUp, Loader2,
  FolderOpen, Search, Sparkles,
} from 'lucide-react'

const PROCESS_API = '/api/montage-proxy/montage/process'

interface SseEvent {
  type: string
  stage?: number
  [key: string]: unknown
}

interface Props {
  sessionId: string | null
  sseEvents: SseEvent[]
  isPaused: boolean
  pauseReason: string | null
  onOverrideRejection: (clipName: string) => void
  onApproveCombination: (planId: string) => void
  onSelectMusic: (track: { trackPath: string; trackName: string; bpm?: number }) => void
}

type StageStatus = 'pending' | 'active' | 'complete' | 'error'

const STAGE_DEFS = [
  { id: 1, label: 'Filter',     sublabel: 'Score & select clips',         icon: Filter,   accentHex: '#f97316' },
  { id: 2, label: 'Transcribe', sublabel: 'Analyse clip content',         icon: FileText, accentHex: '#7c3aed' },
  { id: 3, label: 'Trim',       sublabel: 'Find best segments',           icon: Scissors, accentHex: '#3b82f6' },
  { id: 4, label: 'Plan',       sublabel: 'Generate combinations',        icon: Grid,     accentHex: '#f59e0b' },
  { id: 5, label: 'Music',      sublabel: 'Select soundtrack',            icon: Music,    accentHex: '#10b981' },
  { id: 6, label: 'Render',     sublabel: 'Assemble final video',         icon: Video,    accentHex: '#00d4ff' },
  { id: 7, label: 'Review',     sublabel: 'AI quality check',             icon: Eye,      accentHex: '#a855f7' },
  { id: 8, label: 'Learn',      sublabel: 'Compare refs & update brain',  icon: Brain,    accentHex: '#ec4899' },
]

export default function MontagePipeline({
  sessionId, sseEvents, isPaused, pauseReason,
  onOverrideRejection, onApproveCombination, onSelectMusic,
}: Props) {
  const [stageStatuses, setStageStatuses]     = useState<Record<number, StageStatus>>({})
  const [currentStage, setCurrentStage]       = useState(0)
  const [expandedStages, setExpandedStages]   = useState<Set<number>>(new Set())

  const [clipProgress, setClipProgress]       = useState<Record<string, SseEvent>>({})
  const [transcriptions, setTranscriptions]   = useState<Record<string, string>>({})
  const [trimData, setTrimData]               = useState<Record<string, SseEvent>>({})
  const [plans, setPlans]                     = useState<SseEvent[]>([])
  const [approvedPlanId, setApprovedPlanId]   = useState<string | null>(null)
  const [dualVariants, setDualVariants]       = useState<SseEvent | null>(null)
  const [musicTracks, setMusicTracks]         = useState<SseEvent[]>([])
  const [selectedTrackName, setSelectedTrackName] = useState<string | null>(null)
  const [renderPct, setRenderPct]             = useState(0)
  const [renderOp, setRenderOp]               = useState<string | null>(null)
  const [renderPctA, setRenderPctA]           = useState(0)
  const [renderPctB, setRenderPctB]           = useState(0)
  const [renderOpA, setRenderOpA]             = useState<string | null>(null)
  const [renderOpB, setRenderOpB]             = useState<string | null>(null)
  const [reviewLoops, setReviewLoops]         = useState<SseEvent[]>([])
  const [learningInsights, setLearningInsights] = useState<SseEvent[]>([])
  const [learningComplete, setLearningComplete] = useState<SseEvent | null>(null)
  const [isComplete, setIsComplete]           = useState(false)
  const [showLog, setShowLog]                 = useState(false)

  useEffect(() => {
    const newStatuses: Record<number, StageStatus> = {}
    let latestActive = 0
    const newClips: Record<string, SseEvent> = {}
    const newTranscriptions: Record<string, string> = {}
    const newTrimData: Record<string, SseEvent> = {}
    const newPlans: SseEvent[] = []
    let newApprovedId: string | null = null
    let newDualVariants: SseEvent | null = null
    const newMusic: SseEvent[] = []
    let newSelectedTrack: string | null = null
    let newRenderPct = 0, newRenderOp: string | null = null
    let newRenderPctA = 0, newRenderPctB = 0
    let newRenderOpA: string | null = null, newRenderOpB: string | null = null
    const newReviews: SseEvent[] = []
    const newInsights: SseEvent[] = []
    let newLearningComplete: SseEvent | null = null
    let complete = false

    for (const ev of sseEvents) {
      const stage = ev.stage as number | undefined

      if (ev.type === 'stage_start' && stage) {
        newStatuses[stage] = 'active'
        latestActive = Math.max(latestActive, stage)
      } else if (ev.type === 'stage_complete' && stage) {
        newStatuses[stage] = 'complete'
        if (stage === 4) newApprovedId = String((ev as SseEvent & { approvedPlanId?: string }).approvedPlanId ?? '')
        if (stage === 5) newSelectedTrack = String((ev as SseEvent & { selectedTrack?: string }).selectedTrack ?? '')
      } else if (ev.type === 'error' && stage) {
        newStatuses[stage] = 'error'
      } else if (ev.type === 'clip_progress') {
        const name = String(ev.clipName ?? '')
        if (!name) continue
        if (stage === 1) newClips[name] = ev
        else if (stage === 2) newTranscriptions[name] = String(ev.transcription ?? '')
        else if (stage === 3) newTrimData[name] = ev
      } else if (ev.type === 'plans_ready') {
        const rawPlans = ev.plans as SseEvent[] | undefined
        if (Array.isArray(rawPlans)) newPlans.push(...rawPlans)
      } else if (ev.type === 'dual_variants_planned') {
        newDualVariants = ev
      } else if (ev.type === 'music_options') {
        const rawTracks = ev.tracks as SseEvent[] | undefined
        if (Array.isArray(rawTracks)) newMusic.push(...rawTracks)
      } else if (ev.type === 'music_auto_selected') {
        newSelectedTrack = String(ev.trackName ?? '')
        newMusic.push(ev)
      } else if (ev.type === 'render_progress') {
        const variantTag = ev.variant as string | undefined
        const pct = Math.round(Number(ev.percent ?? ev.pct ?? 0))
        const op = ev.operation ? String(ev.operation) : null
        if (variantTag === 'A') { newRenderPctA = pct; newRenderOpA = op }
        else if (variantTag === 'B') { newRenderPctB = pct; newRenderOpB = op }
        else { newRenderPct = pct; newRenderOp = op }
        newRenderPct = Math.max(newRenderPctA, newRenderPctB, newRenderPct)
      } else if (ev.type === 'review_loop') {
        newReviews.push(ev)
      } else if (ev.type === 'learning_insight') {
        newInsights.push(ev)
      } else if (ev.type === 'stage_complete' && stage === 8) {
        newLearningComplete = ev
      } else if (ev.type === 'complete') {
        complete = true
        for (const s of STAGE_DEFS) {
          if (!newStatuses[s.id] || newStatuses[s.id] === 'active') newStatuses[s.id] = 'complete'
        }
      }
    }

    const activeEntry = Object.entries(newStatuses).find(([, v]) => v === 'active')
    if (activeEntry) latestActive = parseInt(activeEntry[0])

    setStageStatuses(newStatuses)
    setCurrentStage(latestActive)
    setClipProgress(newClips)
    setTranscriptions(newTranscriptions)
    setTrimData(newTrimData)
    setPlans(newPlans)
    if (newApprovedId) setApprovedPlanId(newApprovedId)
    if (newDualVariants) setDualVariants(newDualVariants)
    setMusicTracks(newMusic)
    if (newSelectedTrack) setSelectedTrackName(newSelectedTrack)
    setRenderPct(newRenderPct)
    setRenderOp(newRenderOp)
    setRenderPctA(newRenderPctA)
    setRenderPctB(newRenderPctB)
    setRenderOpA(newRenderOpA)
    setRenderOpB(newRenderOpB)
    setReviewLoops(newReviews)
    if (newInsights.length) setLearningInsights(newInsights)
    if (newLearningComplete) setLearningComplete(newLearningComplete)
    setIsComplete(complete)

    if (latestActive > 0) setExpandedStages((prev) => new Set(Array.from(prev).concat(latestActive)))
  }, [sseEvents])

  const toggleExpand = (id: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const getStageSummary = (id: number): string => {
    switch (id) {
      case 1: {
        const a = Object.values(clipProgress).filter((e) => e.passed).length
        const r = Object.values(clipProgress).filter((e) => !e.passed).length
        return `${a} accepted · ${r} rejected`
      }
      case 2: return `${Object.keys(transcriptions).length} clips analysed`
      case 3: return `${Object.keys(trimData).length} clips trimmed`
      case 4: return dualVariants ? '2 variants planned — High Energy & Cinematic' : approvedPlanId ? 'Plan approved' : `${plans.length} plans generated`
      case 5: return selectedTrackName ? `"${selectedTrackName}"` : 'Track selected'
      case 6: return renderPct >= 100 ? 'Render complete' : `${renderPct}%`
      case 7: {
        const loopA = reviewLoops.find(l => (l as SseEvent & { variant?: string }).variant === 'A')
        const loopB = reviewLoops.find(l => (l as SseEvent & { variant?: string }).variant === 'B')
        if (loopA && loopB) return `A: ${Math.round(Number(loopA.score ?? 0))}% · B: ${Math.round(Number(loopB.score ?? 0))}%`
        const last = reviewLoops[reviewLoops.length - 1]
        return last ? `Score: ${Math.round(Number(last.score ?? 0))}%` : 'Review complete'
      }
      case 8: {
        if (learningComplete) {
          const n = Number((learningComplete as SseEvent & { newRulesAdded?: number }).newRulesAdded ?? 0)
          const s = Number((learningComplete as SseEvent & { referenceMatchScore?: number }).referenceMatchScore ?? 0)
          return `${n} new rule${n !== 1 ? 's' : ''} · ref match ${Math.round(s)}%`
        }
        return 'Brain updated'
      }
      default: return ''
    }
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-bms-cyan/8 border border-bms-cyan/20">
          <Video className="w-6 h-6 text-bms-cyan" />
        </div>
        <p className="text-sm text-bms-muted max-w-xs">Select clips and click Begin Processing to start the pipeline</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Sticky stage tracker */}
      <div className="sticky top-0 z-20 px-4 py-3 rounded-2xl bg-bms-darker/90 backdrop-blur-sm border border-bms-border">
        <div className="flex items-center gap-0">
          {STAGE_DEFS.map((stage, idx) => {
            const status  = stageStatuses[stage.id] ?? 'pending'
            const active  = status === 'active'
            const done    = status === 'complete'
            const err     = status === 'error'
            const color   = done ? '#10b981' : err ? '#ef4444' : active ? stage.accentHex : '#374151'
            const Icon    = stage.icon
            return (
              <React.Fragment key={stage.id}>
                <button onClick={() => toggleExpand(stage.id)} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 52 }}>
                  <div className="relative">
                    {active && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${color}`, borderRadius: '50%' }}
                        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                    )}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center relative z-10"
                      style={{
                        background: active ? `${color}20` : done ? 'rgba(16,185,129,0.15)' : err ? 'rgba(239,68,68,0.1)' : 'rgba(55,65,81,0.6)',
                        border: `2px solid ${color}`,
                        boxShadow: active ? `0 0 12px ${color}50` : 'none',
                      }}
                    >
                      {done   ? <CheckCircle2 className="w-3 h-3" style={{ color }} /> :
                       active ? <Loader2 className="w-3 h-3 animate-spin" style={{ color }} /> :
                       err    ? <XCircle className="w-3 h-3" style={{ color }} /> :
                                <Icon className="w-3 h-3" style={{ color }} />}
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold tracking-wide" style={{ color: active || done ? color : '#4b5563' }}>
                    {stage.label}
                  </span>
                </button>
                {idx < STAGE_DEFS.length - 1 && (
                  <div className="flex-1 relative mx-0.5" style={{ height: 2, marginBottom: 14 }}>
                    <div className="w-full h-full rounded-full bg-bms-border" />
                    {done && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: 'linear-gradient(90deg,#10b981,#10b98160)' }}
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-bms-muted">
            {isComplete ? '✓ All stages complete' : currentStage > 0 ? `Stage ${currentStage} of 8 — ${STAGE_DEFS.find((s) => s.id === currentStage)?.label}` : 'Starting…'}
          </span>
          <span className="text-[10px] font-mono text-bms-muted/60">
            {Object.values(stageStatuses).filter((s) => s === 'complete').length}/8
          </span>
        </div>
      </div>

      {/* Paused banner */}
      <AnimatePresence>
        {isPaused && pauseReason && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-400/8 border border-amber-400/35"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm font-medium text-amber-400">
              {pauseReason === 'awaiting_plan_approval' ? 'Action required — select a combination plan below to continue' :
               pauseReason === 'awaiting_music_selection' ? 'Action required — select a music track below to continue' :
               'Pipeline paused — action required'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage cards */}
      <div className="flex flex-col gap-2.5">
        {STAGE_DEFS.map((stage) => {
          const status  = stageStatuses[stage.id] ?? 'pending'
          const active  = status === 'active'
          const done    = status === 'complete'
          const err     = status === 'error'
          const pending = status === 'pending'
          const expanded = expandedStages.has(stage.id)
          const hasContent = active || done || err
          const color   = done ? '#10b981' : err ? '#ef4444' : active ? stage.accentHex : '#374151'
          const Icon    = stage.icon

          return (
            <motion.div
              key={stage.id}
              layout
              className="rounded-2xl overflow-hidden"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${stage.accentHex}07, rgba(255,255,255,0.01))`
                  : done ? 'rgba(16,185,129,0.025)' : 'rgba(255,255,255,0.018)',
                border: `1px solid ${active ? `${stage.accentHex}38` : done ? 'rgba(16,185,129,0.18)' : err ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.055)'}`,
                borderLeft: `3px solid ${color}`,
                opacity: pending ? 0.4 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {/* Header */}
              <button
                onClick={() => hasContent && toggleExpand(stage.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ cursor: hasContent ? 'pointer' : 'default' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: pending ? 'rgba(55,65,81,0.3)' : `${color}15`,
                    border: `1px solid ${pending ? 'rgba(55,65,81,0.4)' : `${color}28`}`,
                  }}
                >
                  {done   ? <CheckCircle2 className="w-3 h-3" style={{ color }} /> :
                   active ? <Loader2 className="w-3 h-3 animate-spin" style={{ color }} /> :
                   err    ? <XCircle className="w-3 h-3" style={{ color }} /> :
                            <Icon className="w-3 h-3" style={{ color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono" style={{ color: pending ? '#4b5563' : color }}>
                      {String(stage.id).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-bms-text">{stage.label}</span>
                    {active && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest"
                        style={{ background: `${stage.accentHex}18`, color: stage.accentHex, border: `1px solid ${stage.accentHex}30` }}
                      >
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5 truncate text-bms-muted" style={{ color: pending ? '#374151' : undefined }}>
                    {done ? getStageSummary(stage.id) : stage.sublabel}
                  </p>
                </div>
                {hasContent && (expanded
                  ? <ChevronUp className="w-3 h-3 text-bms-muted shrink-0" />
                  : <ChevronDown className="w-3 h-3 text-bms-muted shrink-0" />
                )}
              </button>

              {/* Inline render bar for stage 6 */}
              {stage.id === 6 && (active || done) && (
                <div className="px-4 pb-3 -mt-1">
                  <div className="h-1.5 rounded-full overflow-hidden bg-bms-border">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#00d4ff,#3b82f6)' }}
                      animate={{ width: `${renderPct}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-bms-muted">{renderOp ?? 'Rendering…'}</span>
                    <span className="text-[9px] font-mono text-bms-cyan">{renderPct}%</span>
                  </div>
                </div>
              )}

              {/* Expandable body */}
              <AnimatePresence initial={false}>
                {expanded && hasContent && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0.5 border-t border-bms-border/50">
                      <StageBody
                        stageId={stage.id}
                        clipProgress={clipProgress}
                        transcriptions={transcriptions}
                        trimData={trimData}
                        plans={plans}
                        dualVariants={dualVariants}
                        musicTracks={musicTracks}
                        renderPct={renderPct}
                        renderOp={renderOp}
                        renderPctA={renderPctA}
                        renderPctB={renderPctB}
                        renderOpA={renderOpA}
                        renderOpB={renderOpB}
                        reviewLoops={reviewLoops}
                        learningInsights={learningInsights}
                        learningComplete={learningComplete}
                        onOverrideRejection={onOverrideRejection}
                        onApproveCombination={(id) => { setApprovedPlanId(id); onApproveCombination(id) }}
                        onSelectMusic={(t) => { setSelectedTrackName(t.trackName); onSelectMusic(t) }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Event log */}
      {sseEvents.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-bms-border">
          <button
            onClick={() => setShowLog((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-bms-muted hover:bg-bms-darker transition-colors bg-bms-card"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-2.5 h-2.5" />
              <span>Event Log ({sseEvents.length})</span>
            </div>
            {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showLog && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="max-h-40 overflow-y-auto p-3 flex flex-col gap-1 font-mono text-[10px] bg-bms-darker">
                  {[...sseEvents].reverse().map((ev, i) => (
                    <div key={i} className="flex gap-2 text-bms-muted">
                      <span className="text-indigo-400">[{ev.type}]</span>
                      <span className="break-all">{JSON.stringify(ev).slice(0, 120)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ── Stage body content ────────────────────────────────────────────────────────

interface BodyProps {
  stageId: number
  clipProgress: Record<string, SseEvent>
  transcriptions: Record<string, string>
  trimData: Record<string, SseEvent>
  plans: SseEvent[]
  dualVariants: SseEvent | null
  musicTracks: SseEvent[]
  renderPct: number
  renderOp: string | null
  renderPctA: number
  renderPctB: number
  renderOpA: string | null
  renderOpB: string | null
  reviewLoops: SseEvent[]
  learningInsights: SseEvent[]
  learningComplete: SseEvent | null
  onOverrideRejection: (name: string) => void
  onApproveCombination: (id: string) => void
  onSelectMusic: (t: { trackPath: string; trackName: string; bpm?: number }) => void
}

function StageBody({
  stageId, clipProgress, transcriptions, trimData, plans, dualVariants,
  musicTracks, renderPct, renderOp, renderPctA, renderPctB, renderOpA, renderOpB,
  reviewLoops, learningInsights, learningComplete,
  onOverrideRejection, onApproveCombination, onSelectMusic,
}: BodyProps) {

  if (stageId === 1) {
    const clips    = Object.values(clipProgress)
    const accepted = clips.filter((c) => c.passed)
    const rejected = clips.filter((c) => !c.passed)
    if (!clips.length) return <p className="text-xs text-bms-muted pt-2">Waiting for clips…</p>
    return (
      <div className="grid grid-cols-2 gap-3 pt-3">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-bms-text">Accepted ({accepted.length})</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {accepted.map((ev, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/16">
                <p className="text-[11px] font-medium text-bms-text truncate mb-1.5">{String(ev.clipName ?? '')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-bms-border">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Number(ev.score ?? 0))}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">{Math.round(Number(ev.score ?? 0))}</span>
                </div>
                {ev.reason != null && <p className="text-[9px] text-bms-muted mt-1 truncate">{String(ev.reason)}</p>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-2.5 h-2.5 text-red-400" />
            <span className="text-[11px] font-semibold text-bms-text">Rejected ({rejected.length})</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {rejected.map((ev, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/16">
                <p className="text-[11px] font-medium text-bms-text truncate mb-1">{String(ev.clipName ?? '')}</p>
                {ev.reason != null && <p className="text-[9px] text-bms-muted mb-2">{String(ev.reason)}</p>}
                <button
                  onClick={() => onOverrideRejection(String(ev.clipName ?? ''))}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/22"
                >
                  Override
                </button>
              </div>
            ))}
            {!rejected.length && <p className="text-[11px] text-bms-muted text-center py-3">None rejected</p>}
          </div>
        </div>
      </div>
    )
  }

  if (stageId === 2) {
    const entries = Object.entries(transcriptions)
    if (!entries.length) return <p className="text-xs text-bms-muted pt-2">Analysing clips…</p>
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-3">
        {entries.map(([name, summary]) => (
          <div key={name} className="p-3 rounded-xl bg-bms-purple/5 border border-bms-purple/16">
            <p className="text-[11px] font-semibold text-bms-text truncate mb-1">{name}</p>
            <p className="text-[10px] text-bms-muted line-clamp-2">{summary || 'Transcribed'}</p>
          </div>
        ))}
      </div>
    )
  }

  if (stageId === 3) {
    const entries = Object.entries(trimData)
    if (!entries.length) return <p className="text-xs text-bms-muted pt-2">Trimming clips…</p>
    return (
      <div className="flex flex-col gap-2 pt-3">
        {entries.map(([name, ev]) => {
          const dur    = Number(ev.originalDuration ?? ev.duration ?? 30)
          const inPt   = Number(ev.inPoint ?? 0)
          const outPt  = Number(ev.outPoint ?? dur)
          const startPct = (inPt / dur) * 100
          const keptPct  = ((outPt - inPt) / dur) * 100
          return (
            <div key={name} className="p-3 rounded-xl bg-blue-500/4 border border-blue-500/16">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-bms-text truncate">{name}</span>
                <span className="text-[10px] font-mono text-bms-muted shrink-0">{(outPt - inPt).toFixed(1)}s</span>
              </div>
              <div className="relative h-3 rounded-lg overflow-hidden bg-bms-border">
                {startPct > 0 && <div className="absolute top-0 left-0 h-full bg-red-500/30" style={{ width: `${startPct}%` }} />}
                <div className="absolute top-0 h-full bg-blue-500/65" style={{ left: `${startPct}%`, width: `${keptPct}%` }} />
                <div className="absolute top-0 right-0 h-full bg-red-500/30" style={{ width: `${100 - startPct - keptPct}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[9px] font-mono text-bms-muted">
                <span>0s</span><span>{dur.toFixed(1)}s</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (stageId === 4) {
    if (dualVariants) {
      interface VariantPlan {
        id: string; name: string; style: string
        clips: string[]
        hook?: string
        clipContributions?: Array<{ clip: string; contribution: string }>
        ending?: string
        rationale?: string
      }
      const variants = (dualVariants.variants as VariantPlan[]) ?? []
      const accentA = '#f97316'; const accentB = '#7c3aed'

      return (
        <div className="flex flex-col gap-4 pt-3">
          <div className="flex items-center gap-2 text-[10px] text-bms-muted">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>2 plans built from full clip transcriptions — rendering automatically</span>
          </div>

          {variants.map((v) => {
            const accent = v.id === 'A' ? accentA : accentB
            const contributions = v.clipContributions ?? v.clips.map(c => ({ clip: c, contribution: '' }))
            return (
              <div key={v.id} className="flex flex-col gap-0 rounded-2xl overflow-hidden" style={{ border: `1px solid ${accent}28`, borderLeft: `3px solid ${accent}` }}>
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: `${accent}09` }}>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}35` }}>
                    VARIANT {v.id}
                  </span>
                  <span className="text-sm font-bold text-bms-text">{v.name}</span>
                  <span className="text-[10px] text-bms-muted ml-auto">{v.clips.length} clips</span>
                </div>

                <div className="flex flex-col gap-0 divide-y divide-bms-border/50">
                  {v.hook && (
                    <div className="px-4 py-3 flex gap-3" style={{ background: `${accent}05` }}>
                      <div className="flex flex-col gap-0.5 shrink-0 items-center">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: accent, color: '#fff' }}>⚡</div>
                        <div className="w-px flex-1" style={{ background: `${accent}25`, minHeight: 8 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Hook</p>
                        <p className="text-[11px] text-bms-text leading-relaxed">{v.hook}</p>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 flex flex-col gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accent }}>Sequence</p>
                    {contributions.map((cc, ci) => (
                      <div key={ci} className="flex items-start gap-3">
                        <div className="flex flex-col gap-0.5 shrink-0 items-center">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}35` }}>
                            {ci + 1}
                          </div>
                          {ci < contributions.length - 1 && <div className="w-px flex-1" style={{ background: `${accent}25`, minHeight: 12 }} />}
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <p className="text-[10px] font-semibold text-bms-text truncate mb-0.5">
                            {cc.clip || v.clips[ci] || `Clip ${ci + 1}`}
                          </p>
                          {cc.contribution && <p className="text-[10px] text-bms-muted leading-snug">{cc.contribution}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {v.ending && (
                    <div className="px-4 py-3 flex gap-3" style={{ background: `${accent}04` }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>✓</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Ending</p>
                        <p className="text-[11px] text-bms-text leading-relaxed">{v.ending}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (!plans.length) return <p className="text-xs text-bms-muted pt-2">Generating plans…</p>
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
        {plans.map((plan, i) => {
          const planId = String(plan.id ?? plan.planId ?? i)
          const rawClips = plan.clipSegments as { filename: string }[] | undefined
          const clips: string[] = Array.isArray(plan.clips) ? (plan.clips as string[]) : rawClips?.map((s) => s.filename) ?? []
          const confidence = Number(plan.predictedMatchScore ?? plan.confidence ?? plan.score ?? 0)
          const rationale  = String(plan.rationale ?? plan.reason ?? '')
          const cc = confidence >= 70 ? '#10b981' : confidence >= 50 ? '#f59e0b' : '#ef4444'
          return (
            <div key={planId} className="p-4 rounded-xl flex flex-col gap-3 bg-amber-500/4 border border-amber-500/18">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-bms-text">Plan {i + 1}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono" style={{ background: `${cc}18`, color: cc, border: `1px solid ${cc}28` }}>{Math.round(confidence)}%</span>
              </div>
              {clips.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {clips.map((c, ci) => (
                    <span key={ci} className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-amber-500/9 text-amber-400 border border-amber-500/18">
                      {ci + 1}. {typeof c === 'string' ? c : (c as { filename?: string }).filename ?? ''}
                    </span>
                  ))}
                </div>
              )}
              {rationale && <p className="text-[10px] text-bms-muted leading-relaxed">{rationale}</p>}
              <button
                onClick={() => onApproveCombination(planId)}
                className="w-full py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.08))', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.38)' }}
              >
                Approve this plan
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  if (stageId === 5) {
    const autoTrack = musicTracks.find(t => (t as SseEvent & { type: string }).type === 'music_auto_selected')
    if (autoTrack) {
      const suit = Math.round(Number(autoTrack.suitabilityScore ?? 1) * 100)
      return (
        <div className="flex flex-col gap-3 pt-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/6 border border-emerald-500/22">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/12 border border-emerald-500/20">
              <Music className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-bms-text truncate">{String(autoTrack.trackName ?? '')}</p>
              <p className="text-[10px] text-bms-muted mt-0.5">{String(autoTrack.reason ?? 'Best mood match from library')}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AUTO-MATCHED {suit}%
                </span>
                {autoTrack.startOffset !== undefined && (
                  <span className="text-[9px] text-bms-muted">starts at {Math.round(Number(autoTrack.startOffset))}s into track</span>
                )}
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <p className="text-[10px] text-bms-muted">Music auto-selected from your library — pipeline continuing automatically.</p>
        </div>
      )
    }
    return <MusicPicker musicTracks={musicTracks} onSelectMusic={onSelectMusic} />
  }

  if (stageId === 6) {
    if (renderPctA > 0 || renderPctB > 0) {
      return (
        <div className="flex flex-col gap-4 pt-3">
          {[
            { label: 'Variant A — High Energy', pct: renderPctA, op: renderOpA, accent: '#f97316' },
            { label: 'Variant B — Cinematic',   pct: renderPctB, op: renderOpB, accent: '#7c3aed' },
          ].map(({ label, pct, op, accent }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-bms-text">{label}</span>
                <span className="text-sm font-bold font-mono" style={{ color: accent }}>{pct}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-bms-border">
                <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${accent},${accent}80)` }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
              </div>
              {op && <p className="text-[10px] text-bms-muted">{op}</p>}
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-3 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-bms-text">Rendering Montage</span>
          <span className="text-xl font-bold font-mono text-bms-cyan">{renderPct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-bms-border">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#00d4ff,#3b82f6)' }} animate={{ width: `${renderPct}%` }} transition={{ duration: 0.4 }} />
        </div>
        {renderOp && <p className="text-[11px] text-bms-muted">{renderOp}</p>}
      </div>
    )
  }

  if (stageId === 7) {
    if (!reviewLoops.length) return <p className="text-xs text-bms-muted pt-2">Running AI review…</p>
    const loopA = reviewLoops.find(l => (l as SseEvent & { variant?: string }).variant === 'A')
    const loopB = reviewLoops.find(l => (l as SseEvent & { variant?: string }).variant === 'B')
    const isDual = !!(loopA && loopB)
    const loopsToShow = isDual ? [loopA, loopB] : reviewLoops
    return (
      <div className="flex flex-col gap-2 pt-3">
        {isDual && (
          <p className="text-[10px] text-bms-muted flex items-center gap-1.5">
            <Eye className="w-2.5 h-2.5 text-purple-400" />
            Both variants reviewed — go to Results to compare and choose your preferred style
          </p>
        )}
        {loopsToShow.map((loop, i) => {
          const score = Number(loop.score ?? 0)
          const sc = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
          const corrections = Array.isArray(loop.corrections) ? loop.corrections as string[] : []
          const variantTag  = (loop as SseEvent & { variant?: string }).variant
          const variantAccent = variantTag === 'A' ? '#f97316' : variantTag === 'B' ? '#7c3aed' : '#a855f7'
          return (
            <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.04)', border: `1px solid ${variantAccent}28` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-bms-text">
                  {variantTag ? `Variant ${variantTag} — ${variantTag === 'A' ? 'High Energy' : 'Cinematic'}` : `Review ${i + 1}`}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg font-mono" style={{ color: sc, background: `${sc}16`, border: `1px solid ${sc}28` }}>
                  {Math.round(score)}%
                </span>
              </div>
              {corrections.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {corrections.slice(0, 3).map((c, ci) => (
                    <li key={ci} className="text-[10px] text-bms-muted flex items-start gap-1.5">
                      <span style={{ color: variantAccent }}>→</span>
                      {typeof c === 'string' ? c : JSON.stringify(c)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (stageId === 8) {
    const isRunning = !learningComplete
    const n = Number((learningComplete as (SseEvent & { newRulesAdded?: number }) | null)?.newRulesAdded ?? 0)
    const refScore = Number((learningComplete as (SseEvent & { referenceMatchScore?: number }) | null)?.referenceMatchScore ?? 0)
    const notes = String((learningComplete as (SseEvent & { analysisNotes?: string }) | null)?.analysisNotes ?? '')

    return (
      <div className="flex flex-col gap-3 pt-3">
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-bms-muted">
            <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
            Comparing output to reference clips…
          </div>
        )}

        {notes && (
          <div className="p-3 rounded-xl text-[11px] text-bms-muted leading-relaxed bg-pink-500/4 border border-pink-500/16">
            <p className="text-[10px] font-semibold mb-1 text-pink-400">Visual Analysis</p>
            {notes}
          </div>
        )}

        {learningInsights.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-pink-400" />
              {n} new rule{n !== 1 ? 's' : ''} added to knowledge base
            </p>
            {learningInsights.map((ins, i) => (
              <div key={i} className="p-3 rounded-xl bg-pink-500/4 border border-pink-500/18" style={{ borderLeft: '3px solid rgba(236,72,153,0.6)' }}>
                <p className="text-xs font-semibold text-bms-text mb-0.5">{String(ins.title ?? '')}</p>
                <p className="text-[10px] text-bms-muted leading-relaxed">{String(ins.content ?? '')}</p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {(Array.isArray(ins.tags) ? ins.tags as string[] : []).map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {learningComplete && n === 0 && (
          <p className="text-[11px] text-bms-muted">All existing rules already cover the gaps found — no duplicates added.</p>
        )}

        {learningComplete && refScore > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-bms-muted">Reference match score:</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: refScore >= 70 ? '#10b981' : refScore >= 50 ? '#f59e0b' : '#ef4444' }}>
              {Math.round(refScore)}%
            </span>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ── Music Picker ─────────────────────────────────────────────────────────────

function MusicPicker({
  musicTracks,
  onSelectMusic,
}: {
  musicTracks: SseEvent[]
  onSelectMusic: (t: { trackPath: string; trackName: string; bpm?: number }) => void
}) {
  const [folder, setFolder]       = useState('')
  const [localFiles, setLocalFiles] = useState<{ name: string; path: string; size: number }[]>([])
  const [scanning, setScanning]   = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [manualPath, setManualPath] = useState('')
  const [tab, setTab]             = useState<'browse' | 'ai'>('browse')

  const scanFolder = useCallback(async () => {
    if (!folder.trim()) return
    setScanning(true)
    setScanError(null)
    setLocalFiles([])
    try {
      const res = await fetch(`${PROCESS_API}/scan-music?folder=${encodeURIComponent(folder.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scan failed')
      setLocalFiles(data.files ?? [])
      if ((data.files ?? []).length === 0) setScanError('No audio files found in that folder.')
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }, [folder])

  const useManualPath = () => {
    const p = manualPath.trim()
    if (!p) return
    const name = p.split(/[\\/]/).pop() ?? p
    onSelectMusic({ trackPath: p, trackName: name })
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-bms-darker border border-bms-border">
        {(['browse', 'ai'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              tab === t
                ? 'bg-emerald-500/16 text-emerald-400 border border-emerald-500/30'
                : 'text-bms-muted hover:text-bms-text'
            }`}
          >
            {t === 'browse' ? 'My Music' : 'AI Suggestions'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-bms-muted uppercase tracking-wider flex items-center gap-1">
              <FolderOpen className="w-2.5 h-2.5" /> Scan a folder for audio files
            </label>
            <div className="flex gap-2">
              <input
                value={folder}
                onChange={e => setFolder(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scanFolder()}
                placeholder="e.g. C:\Users\Me\Music"
                className="flex-1 px-3 py-2 rounded-xl text-xs text-bms-text bg-bms-darker border border-bms-border focus:outline-none focus:border-bms-cyan/50"
              />
              <button
                onClick={scanFolder}
                disabled={scanning || !folder.trim()}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-40 bg-emerald-500/14 text-emerald-400 border border-emerald-500/28"
              >
                {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Scan
              </button>
            </div>
            {scanError && (
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> {scanError}
              </p>
            )}
          </div>

          {localFiles.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              <p className="text-[10px] font-semibold text-bms-muted uppercase tracking-wider">{localFiles.length} files found</p>
              {localFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl group bg-emerald-500/3 border border-emerald-500/12">
                  <Music className="w-3 h-3 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-bms-text truncate">{f.name}</p>
                    <p className="text-[9px] text-bms-muted truncate">{f.path}</p>
                  </div>
                  <button
                    onClick={() => onSelectMusic({ trackPath: f.path, trackName: f.name.replace(/\.[^.]+$/, '') })}
                    className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/18 text-emerald-400 border border-emerald-500/32"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5 pt-1 border-t border-bms-border">
            <label className="text-[10px] font-semibold text-bms-muted uppercase tracking-wider">Or paste a file path directly</label>
            <div className="flex gap-2">
              <input
                value={manualPath}
                onChange={e => setManualPath(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && useManualPath()}
                placeholder="C:\Music\my-track.mp3"
                className="flex-1 px-3 py-2 rounded-xl text-xs text-bms-text bg-bms-darker border border-bms-border focus:outline-none focus:border-bms-cyan/50"
              />
              <button
                onClick={useManualPath}
                disabled={!manualPath.trim()}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 bg-emerald-500/14 text-emerald-400 border border-emerald-500/28"
              >
                Use
              </button>
            </div>
          </div>

          <button
            onClick={() => onSelectMusic({ trackPath: '', trackName: 'No music — keep original audio' })}
            className="text-[11px] text-bms-muted hover:text-bms-text transition-colors text-left py-1"
          >
            Skip — keep original clip audio only
          </button>
        </div>
      )}

      {tab === 'ai' && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-bms-muted">AI-suggested styles based on your clips. Pair them with a real file from the Browse tab for audio output.</p>
          {!musicTracks.length && <p className="text-xs text-bms-muted">Fetching suggestions…</p>}
          {musicTracks.map((track, i) => {
            const trackPath = String(track.trackPath ?? track.path ?? '')
            const trackName = String(track.trackName ?? track.title ?? track.name ?? `Track ${i + 1}`)
            const bpm = track.bpm !== undefined ? Number(track.bpm) : undefined
            const suit = Number(track.suitabilityScore ?? track.suitability ?? track.score ?? 0)
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/4 border border-emerald-500/16">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 border border-emerald-500/18">
                  <Music className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-bms-text truncate">{trackName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {bpm !== undefined && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/8 text-emerald-400">{bpm} BPM</span>}
                    {suit > 0 && (
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="flex-1 h-1 rounded-full bg-bms-border">
                          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round(suit * 100)}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400">{Math.round(suit * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onSelectMusic({ trackPath, trackName, bpm })}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity bg-emerald-500/14 text-emerald-400 border border-emerald-500/28"
                >
                  Select
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
