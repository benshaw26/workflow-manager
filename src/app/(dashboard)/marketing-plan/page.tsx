'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Globe, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  { n: 1, label: 'Researching Brand' },
  { n: 2, label: 'Analysing Social' },
  { n: 3, label: 'Competitors' },
  { n: 4, label: 'Generating Plan' },
]

type HistoryRun = {
  id: string
  websiteUrl: string
  createdAt: string
  plan: string
}

export default function MarketingPlanPage() {
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState(0)
  const [streaming, setStreaming] = useState(false)
  const [plan, setPlan] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryRun[]>([])
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/automations/marketing-plan')
      if (res.ok) {
        const data = await res.json()
        setHistory((data.runs ?? []).slice(0, 10))
      }
    } catch { /* ignore */ }
    setHistoryLoading(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function runPlan() {
    if (!url.trim() || streaming) return
    setStreaming(true)
    setDone(false)
    setPlan('')
    setStage(1)
    setError(null)

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
          else if (evt.type === 'chunk') setPlan(prev => prev + evt.text)
          else if (evt.type === 'complete') { setDone(true); setStage(4); loadHistory() }
          else if (evt.type === 'error') setError(evt.message)
        } catch { /* ignore parse errors */ }
      }
    }
    setStreaming(false)
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(plan)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function relativeDate(iso: string) {
    const ms = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-bms-cyan" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-bms-text">Marketing Plan Generator</h1>
          <p className="text-bms-muted text-sm mt-1">
            Enter a business website URL to receive a comprehensive 5-stage marketing analysis and strategy.
          </p>
        </div>
      </div>

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
            className="px-6 py-3 bg-bms-cyan text-bms-dark font-semibold text-sm rounded-xl hover:bg-bms-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {streaming ? 'Analysing…' : 'Generate Plan'}
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
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isPending && 'bg-bms-muted/40',
                      isActive && 'bg-bms-cyan',
                      isDone && 'bg-emerald-400',
                    )} />
                    {s.n}. {s.label}
                  </div>
                  {i < STAGES.length - 1 && (
                    <span className="text-bms-muted/40 text-xs">→</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/25 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Plan output */}
      {(plan || streaming) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-bms-text">
              {done ? 'Marketing Plan' : 'Generating…'}
            </h2>
            {done && (
              <button
                onClick={copyPlan}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  copied
                    ? 'border-emerald-500/25 text-emerald-400 bg-emerald-500/8'
                    : 'border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-cyan/30'
                )}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className="bg-bms-darker border border-bms-border rounded-2xl p-6 font-mono text-sm text-bms-text whitespace-pre-wrap overflow-auto max-h-[70vh] leading-relaxed">
            {plan}
            {streaming && !done && (
              <span className="inline-block w-2 h-4 bg-bms-cyan ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-bms-text">Past Plans</h2>

        {historyLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-bms-card border border-bms-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-bms-card border border-bms-border rounded-xl p-8 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-bms-muted opacity-30" />
            <p className="text-sm text-bms-muted">No plans generated yet. Run your first analysis above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(run => {
              const isExpanded = expandedRunId === run.id
              return (
                <div
                  key={run.id}
                  className={cn(
                    'bg-bms-card border rounded-xl overflow-hidden transition-colors',
                    isExpanded ? 'border-bms-cyan/40' : 'border-bms-border'
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-8 h-8 rounded-lg bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-bms-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-bms-text truncate">{run.websiteUrl}</p>
                      <p className="text-xs text-bms-muted mt-0.5">{relativeDate(run.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-cyan/30 text-xs transition-colors"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3 h-3" /> Hide</>
                      ) : (
                        <><ChevronDown className="w-3 h-3" /> View</>
                      )}
                    </button>
                  </div>

                  {/* Expanded plan */}
                  {isExpanded && (
                    <div className="border-t border-bms-border">
                      <div className="p-5 bg-bms-darker font-mono text-xs text-bms-text whitespace-pre-wrap overflow-auto max-h-[60vh] leading-relaxed">
                        {run.plan}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
