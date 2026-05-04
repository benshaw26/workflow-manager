'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clapperboard, Cloud, Video, Layers, BookOpen, Brain,
  AlertTriangle, Loader2, CheckCircle2, Database,
} from 'lucide-react'
import MontageDropbox from './_components/MontageDropbox'
import MontageReference from './_components/MontageReference'
import MontagePipeline from './_components/MontagePipeline'
import MontageReview from './_components/MontageReview'

const API          = '/api/montage-proxy/montage'
const PROCESS_API  = '/api/montage-proxy/montage/process'

type TabId = 'dropbox' | 'reference' | 'pipeline' | 'review' | 'knowledge' | 'learning'

interface TabDef {
  id: TabId
  label: string
  icon: React.ElementType
  accentClass: string
  accentHex: string
}

const TABS: TabDef[] = [
  { id: 'dropbox',   label: 'Dropbox',    icon: Cloud,     accentClass: 'text-blue-400',    accentHex: '#60a5fa' },
  { id: 'reference', label: 'References', icon: Video,     accentClass: 'text-bms-purple',  accentHex: '#7c3aed' },
  { id: 'pipeline',  label: 'Pipeline',   icon: Layers,    accentClass: 'text-bms-cyan',    accentHex: '#00d4ff' },
  { id: 'review',    label: 'Review',     icon: BookOpen,  accentClass: 'text-emerald-400', accentHex: '#10b981' },
  { id: 'knowledge', label: 'Knowledge',  icon: Database,  accentClass: 'text-purple-400',  accentHex: '#a855f7' },
  { id: 'learning',  label: 'AI Brain',   icon: Brain,     accentClass: 'text-amber-400',   accentHex: '#f59e0b' },
]

interface SseEvent {
  type: string
  stage?: number
  [key: string]: unknown
}

interface Reference {
  id: string
  filename: string
  file_path: string
  analysis_json: string
  created_at: number
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

interface ActiveSession {
  sessionId: string
  status: string
  stage: number
  stageLabel: string
  pauseReason: string | null
  clipCount: number
  acceptedCount: number
  sessionName: string | null
}

// Detect if running on cloud (Vercel) vs locally — evaluated client-side only
function getIsCloud(): boolean {
  if (typeof window === 'undefined') return false
  return !window.location.hostname.includes('localhost')
}

export default function MontageCreatorPage() {
  const [activeTab, setActiveTab]         = useState<TabId>('dropbox')
  const [selectedClips, setSelectedClips] = useState<string[]>([])
  const [references, setReferences]       = useState<Reference[]>([])
  const [montages, setMontages]           = useState<Montage[]>([])
  const [sessionId, setSessionId]         = useState<string | null>(null)
  const [sseEvents, setSseEvents]         = useState<SseEvent[]>([])
  const [isPaused, setIsPaused]           = useState(false)
  const [pauseReason, setPauseReason]     = useState<string | null>(null)
  const [isProcessing, setIsProcessing]   = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [rerunClipNames, setRerunClipNames] = useState<string[] | null>(null)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [isCloud, setIsCloud]             = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)

  // Determine cloud vs local on mount (client-side only)
  useEffect(() => {
    setIsCloud(getIsCloud())
  }, [])

  // Connect SSE when sessionId is set
  useEffect(() => {
    if (!sessionId) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(`${PROCESS_API}/sse/${sessionId}`)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as SseEvent
        if (data.type === 'connected') {
          setSseEvents([])
          return
        }
        setSseEvents((prev) => [...prev, data])

        if (data.type === 'paused') {
          setIsPaused(true)
          setPauseReason((data.reason as string) ?? null)
        } else if (data.type === 'resumed') {
          setIsPaused(false)
          setPauseReason(null)
        } else if (data.type === 'complete') {
          setIsProcessing(false)
          setIsPaused(false)
          setTimeout(() => {
            fetchMontages().then(() => setActiveTab('review'))
          }, 2000)
        } else if (data.type === 'error') {
          setIsProcessing(false)
          const msg = String(data.message ?? 'Pipeline error occurred')
          setError(msg === 'Session not found' ? null : msg)
          setSessionId(null)
          setSseEvents([])
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [sessionId])

  const fetchReferences = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('montage-references-v1') ?? '[]')
      setReferences(stored)
    } catch {
      setReferences([])
    }
  }, [])

  const fetchMontages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/montages`)
      if (!res.ok) return
      const data = await res.json()
      setMontages(data.montages ?? [])
    } catch {
      // silently fail
    }
  }, [])

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await fetch(`${PROCESS_API}/sessions`)
      if (!res.ok) return
      const data = await res.json()
      setActiveSessions(data.sessions ?? [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchReferences()
    fetchMontages()
    fetchActiveSessions()
  }, [fetchReferences, fetchMontages, fetchActiveSessions])

  // Poll active sessions every 4s when on the pipeline tab
  useEffect(() => {
    if (activeTab !== 'pipeline') return
    const id = setInterval(fetchActiveSessions, 4000)
    return () => clearInterval(id)
  }, [activeTab, fetchActiveSessions])

  // Clean up failed records whenever review tab is opened
  useEffect(() => {
    if (activeTab !== 'review') return
    const t = setTimeout(() => {
      fetch(`${PROCESS_API}/cleanup-failed`, { method: 'POST' })
        .then(() => fetchMontages())
        .catch(() => {})
    }, 3000)
    return () => clearTimeout(t)
  }, [activeTab, fetchMontages])

  // Poll montages every 5s while on the review tab
  useEffect(() => {
    if (activeTab !== 'review') return
    const id = setInterval(fetchMontages, 5000)
    return () => clearInterval(id)
  }, [activeTab, fetchMontages])

  const handleStartProcessing = useCallback(async (paths: string[]) => {
    if (paths.length === 0) return

    if (isCloud) {
      setError('Video rendering requires the Relay desktop app running on your computer. This feature is not available in the cloud version — open the app locally at localhost:3100 to use it.')
      return
    }

    if (references.length === 0) {
      setError('Please upload at least one reference video before processing clips.')
      setActiveTab('reference')
      return
    }

    setError(null)
    setIsProcessing(true)
    setSseEvents([])
    setIsPaused(false)
    setPauseReason(null)

    const localPaths   = paths.filter(p => /^[A-Za-z]:[/\\]/.test(p) || p.startsWith('\\\\'))
    const dropboxPaths = paths.filter(p => !localPaths.includes(p))
    const referenceIds = references.map(r => r.id)

    try {
      const res = await fetch(`${API}/process/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropboxPaths, localPaths, referenceIds }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const newSessionId = String(data.sessionId ?? data.session_id ?? '')
      if (!newSessionId) throw new Error('No session ID returned from server')

      setSessionId(newSessionId)
      setActiveTab('pipeline')
    } catch (err) {
      setIsProcessing(false)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('fetch') || msg.includes('502') || msg.includes('NetworkError')) {
        setError('Video rendering requires the Relay desktop engine to be running on your computer. Open a terminal and run: node jarvis-server.js — then try again.')
      } else {
        setError(`Failed to start processing: ${msg}`)
      }
    }
  }, [references, isCloud])

  const handleOverrideRejection = useCallback(async (clipName: string) => {
    if (!sessionId) return
    try {
      await fetch(`${PROCESS_API}/override-rejection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, clipFilename: clipName }),
      })
    } catch {
      // non-critical
    }
  }, [sessionId])

  const handleApproveCombination = useCallback(async (planId: string) => {
    if (!sessionId) return
    try {
      await fetch(`${PROCESS_API}/approve-combination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, planId }),
      })
      setIsPaused(false)
      setPauseReason(null)
    } catch {
      // non-critical
    }
  }, [sessionId])

  const handleSelectMusic = useCallback(async (track: {
    trackPath: string
    trackName: string
    bpm?: number
  }) => {
    if (!sessionId) return
    try {
      await fetch(`${PROCESS_API}/select-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ...track }),
      })
      setIsPaused(false)
      setPauseReason(null)
    } catch {
      // non-critical
    }
  }, [sessionId])

  const handleApproveMontage = useCallback(async (id: string) => {
    try {
      await fetch(`${API}/montages/${id}/approve`, { method: 'POST' })
      fetchMontages()
    } catch {
      // non-critical
    }
  }, [fetchMontages])

  const handleSubmitFeedback = useCallback(async (id: string, text: string) => {
    await fetch(`${API}/montages/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: text }),
    })
    fetchMontages()
  }, [fetchMontages])

  const handleRerun = useCallback((clipNames: string[]) => {
    setRerunClipNames(clipNames)
    setActiveTab('dropbox')
  }, [])

  const handleConnectSession = useCallback((id: string) => {
    setSseEvents([])
    setIsPaused(false)
    setPauseReason(null)
    setIsProcessing(true)
    setSessionId(id)
  }, [])

  const processingStatus = (() => {
    if (isPaused)    return { label: 'Paused — Action Required', colorClass: 'text-amber-400',   bgClass: 'bg-amber-400/10 border border-amber-400/25' }
    if (isProcessing) return { label: 'Processing…',            colorClass: 'text-bms-cyan',     bgClass: 'bg-bms-cyan/10 border border-bms-cyan/20' }
    if (sessionId && !isProcessing) return { label: 'Complete', colorClass: 'text-emerald-400',  bgClass: 'bg-emerald-400/10 border border-emerald-400/20' }
    return null
  })()

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-bms-cyan" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-bms-text">Montage Creator</h2>
            <p className="text-bms-muted text-xs mt-0.5">
              AI-powered video montage pipeline · 7 stages · Dropbox to Social
            </p>
          </div>
        </div>

        {processingStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${processingStatus.bgClass} ${processingStatus.colorClass}`}
          >
            {isPaused ? (
              <AlertTriangle className="w-3 h-3" />
            ) : isProcessing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {processingStatus.label}
          </motion.div>
        )}
      </motion.div>

      {/* Cloud deployment banner */}
      {isCloud && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-400/8 border border-amber-400/25 text-amber-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Desktop only:</strong> Video rendering requires the Relay desktop app running on your PC.
            You can upload clips and references here, but processing must be done locally at localhost:3100.
          </span>
        </div>
      )}

      {/* Paused Banner */}
      <AnimatePresence>
        {isPaused && pauseReason && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-400/8 border border-amber-400/25"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm font-medium text-amber-400">
              Pipeline paused:{' '}
              {pauseReason === 'awaiting_plan_approval'
                ? 'Select a combination plan in the Pipeline tab'
                : pauseReason === 'awaiting_music_selection'
                ? 'Select a music track in the Pipeline tab'
                : pauseReason}
            </p>
            {activeTab !== 'pipeline' && (
              <button
                onClick={() => setActiveTab('pipeline')}
                className="ml-auto text-xs px-3 py-1 rounded-lg font-medium bg-amber-400/15 text-amber-400 border border-amber-400/30 transition-colors hover:bg-amber-400/25"
              >
                Go to Pipeline
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/7 border border-red-500/25"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400 font-mono flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Row */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const showDot = tab.id === 'pipeline' && isPaused
          const showBadge = tab.id === 'review' && montages.length > 0

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                isActive
                  ? `bg-bms-cyan/10 border-bms-cyan/30 text-bms-cyan`
                  : 'bg-bms-card border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-border/80'
              }`}
            >
              <Icon className="w-[15px] h-[15px]" />
              {tab.label}

              {/* Active underline */}
              {isActive && (
                <motion.div
                  layoutId="montage-tab-underline"
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-bms-cyan"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Paused dot on pipeline */}
              {showDot && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}

              {/* Count badge on review */}
              {showBadge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center bg-bms-cyan/20 text-bms-cyan">
                  {montages.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-bms-card border border-bms-border rounded-xl p-5 min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'dropbox' && (
            <motion.div
              key="dropbox"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MontageDropbox
                selectedClips={selectedClips}
                onSelectedClipsChange={setSelectedClips}
                onStartProcessing={handleStartProcessing}
                hasReferences={references.length > 0}
                rerunClipNames={rerunClipNames ?? undefined}
                onRerunDismiss={() => setRerunClipNames(null)}
              />
            </motion.div>
          )}

          {activeTab === 'reference' && (
            <motion.div
              key="reference"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MontageReference
                references={references}
                onReferencesChanged={fetchReferences}
              />
            </motion.div>
          )}

          {activeTab === 'pipeline' && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Active sessions picker */}
              {activeSessions.filter(s => s.sessionId !== sessionId && s.status !== 'interrupted' && s.status !== 'error').length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold text-bms-muted uppercase tracking-wider">
                    {sessionId ? 'Other Active Sessions' : 'Active Sessions — click to monitor'}
                  </p>
                  <div className="flex flex-col gap-2">
                    {activeSessions
                      .filter(s => s.sessionId !== sessionId && s.status !== 'interrupted' && s.status !== 'error')
                      .map(s => {
                        const isDone    = s.status === 'complete'
                        const isPausedS = s.status === 'paused'
                        const colorCls  = isDone ? 'text-emerald-400' : isPausedS ? 'text-amber-400' : 'text-bms-cyan'
                        const bgCls     = isDone ? 'bg-emerald-400/6 border-emerald-400/20' : isPausedS ? 'bg-amber-400/6 border-amber-400/20' : 'bg-bms-cyan/6 border-bms-cyan/20'
                        return (
                          <button
                            key={s.sessionId}
                            onClick={() => handleConnectSession(s.sessionId)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90 border ${bgCls}`}
                          >
                            <div className="relative shrink-0">
                              <div className={`w-2.5 h-2.5 rounded-full ${colorCls.replace('text-', 'bg-')}`} />
                              {s.status === 'running' && (
                                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-40 ${colorCls.replace('text-', 'bg-')}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-semibold ${colorCls}`}>
                                  Stage {s.stage}/7 — {s.stageLabel}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize border ${bgCls} ${colorCls}`}>
                                  {s.status}
                                </span>
                                {isPausedS && s.pauseReason && (
                                  <span className="text-[10px] text-amber-400">{s.pauseReason.replace(/_/g, ' ')}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-bms-muted mt-0.5 font-mono truncate">
                                {s.sessionName ?? s.sessionId.slice(0, 8)}... · {s.clipCount} clip{s.clipCount !== 1 ? 's' : ''}
                                {s.acceptedCount > 0 ? ` · ${s.acceptedCount} accepted` : ''}
                              </p>
                            </div>
                            <span className="text-[11px] text-bms-muted shrink-0">Connect</span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              <MontagePipeline
                sessionId={sessionId}
                sseEvents={sseEvents}
                isPaused={isPaused}
                pauseReason={pauseReason}
                onOverrideRejection={handleOverrideRejection}
                onApproveCombination={handleApproveCombination}
                onSelectMusic={handleSelectMusic}
              />
            </motion.div>
          )}

          {activeTab === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MontageReview
                montages={montages}
                onApproveMontage={handleApproveMontage}
                onSubmitFeedback={handleSubmitFeedback}
                onMontagesRefresh={fetchMontages}
                onRerun={handleRerun}
              />
            </motion.div>
          )}

          {activeTab === 'knowledge' && (
            <motion.div
              key="knowledge"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-bms-darker border border-bms-border flex items-center justify-center">
                <Database className="w-6 h-6 text-bms-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-bms-text mb-1">Knowledge Base</p>
                <p className="text-xs text-bms-muted max-w-xs">
                  Available in the desktop app. The knowledge base stores learned editing rules from your past montage runs.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-bms-darker border border-bms-border flex items-center justify-center">
                <Brain className="w-6 h-6 text-bms-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-bms-text mb-1">AI Brain</p>
                <p className="text-xs text-bms-muted max-w-xs">
                  Available in the desktop app. AI learning insights and neural feedback loops are managed locally by the Relay engine.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
