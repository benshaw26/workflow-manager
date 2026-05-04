'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mail, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp,
  Wifi, WifiOff, RefreshCw, LogOut, Receipt,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────── */

interface StepEvent {
  type: string
  stepId?: string
  label?: string
  content?: string
  duration?: string
  error?: string
  summary?: string
}

type StepStatus = 'pending' | 'active' | 'complete' | 'error'

interface Step {
  id: string
  label: string
  description: string
  status: StepStatus
  outputs: string[]
  duration?: string
  expanded: boolean
}

interface GoogleStatus {
  connected: boolean
  expired?: boolean
  email?: string
  name?: string
  picture?: string
}

/* ── Step definitions ───────────────────────────────────────────────────── */

const STEP_DEFS: { id: string; label: string; description: string }[] = [
  { id: 's1', label: 'Authenticate',      description: 'Verify OAuth2 token & Gmail API access' },
  { id: 's2', label: 'Scan Inbox',        description: 'Search for Uber & RingGo receipts' },
  { id: 's3', label: 'Filter Duplicates', description: 'Skip already-forwarded message IDs' },
  { id: 's4', label: 'Forward Emails',    description: 'Forward each receipt preserving subject & body' },
  { id: 's5', label: 'Log & Report',      description: 'Write run log and summarise results' },
]

const LOOKBACK_OPTIONS = [
  { value: '1',    label: '1 hour' },
  { value: '6',    label: '6 hours' },
  { value: '12',   label: '12 hours' },
  { value: '24',   label: '24 hours (default)' },
  { value: '48',   label: '48 hours' },
  { value: '72',   label: '72 hours' },
  { value: '168',  label: '7 days' },
  { value: '336',  label: '14 days' },
  { value: '720',  label: '30 days' },
  { value: '2160', label: '90 days' },
]

/* ── Helpers ────────────────────────────────────────────────────────────── */

function initSteps(): Step[] {
  return STEP_DEFS.map((s) => ({
    ...s,
    status: 'pending',
    outputs: [],
    expanded: false,
  }))
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
          checked ? 'bg-bms-cyan' : 'bg-bms-border'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-bms-text text-sm">{label}</span>
    </label>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────── */

export default function ReceiptForwarderPage() {
  // Google connection state
  const [gStatus, setGStatus] = useState<GoogleStatus>({ connected: false })
  const [gLoading, setGLoading] = useState(true)
  const [gConnecting, setGConnecting] = useState(false)
  const [gDisconnecting, setGDisconnecting] = useState(false)

  // Form state
  const [forwardTo, setForwardTo]               = useState('')
  const [lookbackHours, setLookbackHours]       = useState('24')
  const [maxForward, setMaxForward]             = useState('10')
  const [unlimited, setUnlimited]               = useState(false)
  const [filterUber, setFilterUber]             = useState(true)
  const [filterRingo, setFilterRingo]           = useState(true)
  const [filterForwardedFrom, setFilterForwardedFrom] = useState('')
  const [whatsappTo, setWhatsappTo]             = useState('')
  const [filterFrom, setFilterFrom]             = useState('')
  const [filterSubject, setFilterSubject]       = useState('')
  const [filterHasWords, setFilterHasWords]     = useState('')

  // Run state
  const [running, setRunning]           = useState(false)
  const [steps, setSteps]               = useState<Step[]>(initSteps())
  const [outcome, setOutcome]           = useState<string | null>(null)
  const [runError, setRunError]         = useState<string | null>(null)
  const [runSummary, setRunSummary]     = useState<string | null>(null)
  const [validationErr, setValidationErr] = useState('')

  const abortRef = useRef<AbortController | null>(null)

  /* ── Google status check ─────────────────────────────────────────────── */

  const fetchGStatus = useCallback(async () => {
    setGLoading(true)
    try {
      const res = await fetch('/api/auth/google/status?purpose=receipt')
      if (res.ok) setGStatus(await res.json() as GoogleStatus)
    } catch { /* ignore */ }
    setGLoading(false)
  }, [])

  useEffect(() => {
    fetchGStatus()
  }, [fetchGStatus])

  // Handle redirect back from OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('receipt_connected') === '1') {
      fetchGStatus()
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('receipt_error')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [fetchGStatus])

  /* ── Connect Google ─────────────────────────────────────────────────── */

  async function handleConnect() {
    setGConnecting(true)
    try {
      // Read API keys from localStorage
      let clientId = ''
      let clientSecret = ''
      try {
        const stored = localStorage.getItem('bms-api-keys')
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, string>
          clientId     = parsed.google_client_id     ?? ''
          clientSecret = parsed.google_client_secret ?? ''
        }
      } catch { /* ignore */ }

      if (!clientId || !clientSecret) {
        alert('Google Client ID and Client Secret not found. Please add them in your API Keys settings.')
        setGConnecting(false)
        return
      }

      const res = await fetch('/api/auth/google/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, purpose: 'receipt' }),
      })
      const json = await res.json() as { url?: string; error?: string }
      if (json.url) {
        window.location.href = json.url
      } else {
        alert(json.error ?? 'Failed to initiate Google OAuth')
      }
    } catch (err) {
      alert(String(err))
    }
    setGConnecting(false)
  }

  async function handleDisconnect() {
    setGDisconnecting(true)
    try {
      await fetch('/api/auth/google/disconnect?purpose=receipt', { method: 'POST' })
      setGStatus({ connected: false })
    } catch { /* ignore */ }
    setGDisconnecting(false)
  }

  /* ── Run automation ─────────────────────────────────────────────────── */

  function resetRun() {
    setSteps(initSteps())
    setOutcome(null)
    setRunError(null)
    setRunSummary(null)
  }

  async function handleRun() {
    if (!forwardTo.trim()) {
      setValidationErr('Forward Receipts To address is required.')
      return
    }
    setValidationErr('')
    resetRun()
    setRunning(true)

    abortRef.current = new AbortController()

    try {
      const body: Record<string, string> = {
        forwardTo:           forwardTo.trim(),
        lookbackHours,
        maxForward:          unlimited ? 'unlimited' : maxForward,
        filterUber:          String(filterUber),
        filterRingo:         String(filterRingo),
        filterForwardedFrom: filterForwardedFrom.trim(),
        whatsappTo:          whatsappTo.trim(),
        filterFrom:          filterFrom.trim(),
        filterSubject:       filterSubject.trim(),
        filterHasWords:      filterHasWords.trim(),
      }

      const res = await fetch('/api/automations/receipt-forwarder', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => 'Unknown error')
        setRunError(text)
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''

        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data:')) continue
          try {
            const ev = JSON.parse(line.slice(5).trim()) as StepEvent
            handleEvent(ev)
          } catch { /* ignore malformed */ }
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setRunError(String(err))
      }
    }

    setRunning(false)
  }

  function handleEvent(ev: StepEvent) {
    setSteps((prev) => {
      const next = prev.map((s) => ({ ...s }))

      if (ev.type === 'step_start' && ev.stepId) {
        const idx = next.findIndex((s) => s.id === ev.stepId)
        if (idx >= 0) {
          next[idx].status = 'active'
          next[idx].expanded = true
        }
      } else if (ev.type === 'step_output' && ev.stepId && ev.content) {
        const idx = next.findIndex((s) => s.id === ev.stepId)
        if (idx >= 0) next[idx].outputs.push(ev.content!)
      } else if (ev.type === 'step_complete' && ev.stepId) {
        const idx = next.findIndex((s) => s.id === ev.stepId)
        if (idx >= 0) {
          next[idx].status = 'complete'
          next[idx].duration = ev.duration
        }
      } else if (ev.type === 'step_error' && ev.stepId) {
        const idx = next.findIndex((s) => s.id === ev.stepId)
        if (idx >= 0) {
          next[idx].status = 'error'
          if (ev.error) next[idx].outputs.push(`Error: ${ev.error}`)
        }
      }

      return next
    })

    if (ev.type === 'workflow_outcome' && ev.content) {
      setOutcome(ev.content)
    }
    if (ev.type === 'workflow_complete' && ev.summary) {
      setRunSummary(ev.summary)
    }
    if (ev.type === 'workflow_error' && ev.error) {
      setRunError(ev.error)
    }
  }

  /* ── Step status icon ───────────────────────────────────────────────── */

  function StepIcon({ status }: { status: StepStatus }) {
    if (status === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
    if (status === 'error')    return <XCircle      className="w-4 h-4 text-red-400 flex-shrink-0" />
    if (status === 'active')   return <Loader2      className="w-4 h-4 text-bms-cyan animate-spin flex-shrink-0" />
    return <div className="w-4 h-4 rounded-full border-2 border-bms-border flex-shrink-0" />
  }

  const isConnected = gStatus.connected && !gStatus.expired

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-bms-cyan" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-bms-text">Receipt Forwarder</h1>
          <p className="text-bms-muted text-sm">Scan Gmail for Uber and RingGo receipts and forward them to your expenses address.</p>
        </div>
      </div>

      {/* Google connection banner */}
      <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
        isConnected
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {gLoading ? (
            <Loader2 className="w-5 h-5 text-bms-muted animate-spin flex-shrink-0" />
          ) : isConnected ? (
            <Wifi className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0" />
          )}
          <div className="min-w-0">
            {gLoading ? (
              <p className="text-bms-muted text-sm">Checking Google connection…</p>
            ) : isConnected ? (
              <>
                <p className="text-emerald-400 text-sm font-medium">Gmail connected</p>
                <p className="text-bms-muted text-xs truncate">{gStatus.email}</p>
              </>
            ) : gStatus.connected && gStatus.expired ? (
              <>
                <p className="text-amber-400 text-sm font-medium">Session expired — reconnect to continue</p>
                <p className="text-bms-muted text-xs">{gStatus.email}</p>
              </>
            ) : (
              <p className="text-amber-400 text-sm font-medium">Gmail not connected — connect to run this automation</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConnected ? (
            <>
              <button
                onClick={handleConnect}
                disabled={gConnecting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bms-card border border-bms-border text-bms-muted text-xs hover:text-bms-text hover:border-bms-cyan/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Switch account
              </button>
              <button
                onClick={handleDisconnect}
                disabled={gDisconnecting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bms-card border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={gConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bms-cyan text-bms-dark text-sm font-semibold hover:bg-bms-cyan/90 transition-colors disabled:opacity-50"
            >
              {gConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Connect Gmail
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-5">
        <h2 className="text-bms-text font-semibold text-base">Configuration</h2>

        {/* Forward to */}
        <div>
          <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
            Forward Receipts To <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={forwardTo}
            onChange={(e) => { setForwardTo(e.target.value); setValidationErr('') }}
            placeholder="expenses@company.com"
            className="w-full px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors"
          />
          {validationErr && (
            <p className="text-red-400 text-xs mt-1">{validationErr}</p>
          )}
        </div>

        {/* Lookback + max forward */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
              Scan Window
            </label>
            <select
              value={lookbackHours}
              onChange={(e) => setLookbackHours(e.target.value)}
              className="w-full px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors appearance-none cursor-pointer"
            >
              {LOOKBACK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
              Max Emails to Forward
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={unlimited ? '' : maxForward}
                disabled={unlimited}
                onChange={(e) => setMaxForward(e.target.value)}
                placeholder={unlimited ? 'Unlimited' : '10'}
                className="flex-1 px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setUnlimited(!unlimited)}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex-shrink-0 ${
                  unlimited
                    ? 'bg-bms-cyan/20 border-bms-cyan/40 text-bms-cyan'
                    : 'bg-bms-darker border-bms-border text-bms-muted hover:border-bms-cyan/30 hover:text-bms-text'
                }`}
              >
                Unlimited
              </button>
            </div>
          </div>
        </div>

        {/* Filter toggles */}
        <div>
          <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-2">
            Receipt Filters
          </label>
          <div className="flex flex-wrap gap-6">
            <Toggle checked={filterUber}  onChange={setFilterUber}  label="Uber receipts" />
            <Toggle checked={filterRingo} onChange={setFilterRingo} label="RingGo receipts" />
          </div>
        </div>

        {/* Advanced fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
              Filter Forwarded From (email)
            </label>
            <input
              type="text"
              value={filterForwardedFrom}
              onChange={(e) => setFilterForwardedFrom(e.target.value)}
              placeholder="forwarder@example.com"
              className="w-full px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
              WhatsApp Notification To
            </label>
            <input
              type="text"
              value={whatsappTo}
              onChange={(e) => setWhatsappTo(e.target.value)}
              placeholder="+447911123456"
              className="w-full px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
            Custom From Addresses (one per line or comma-separated)
          </label>
          <textarea
            rows={2}
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            placeholder="receipts@company.com"
            className="w-full px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
            Custom Subject Keywords (one per line or comma-separated)
          </label>
          <textarea
            rows={2}
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            placeholder="Receipt, Invoice"
            className="w-full px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-bms-muted text-xs font-medium uppercase tracking-wider mb-1.5">
            Must Contain Words (one per line or comma-separated)
          </label>
          <textarea
            rows={2}
            value={filterHasWords}
            onChange={(e) => setFilterHasWords(e.target.value)}
            placeholder="trip receipt"
            className="w-full px-3 py-2 bg-bms-darker border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors resize-none"
          />
        </div>

        {/* Run button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-6 py-2.5 bg-bms-cyan text-bms-dark text-sm font-semibold rounded-xl hover:bg-bms-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {running ? 'Running…' : 'Run Automation'}
          </button>
          {(runSummary || runError) && !running && (
            <button
              onClick={resetRun}
              className="px-4 py-2.5 border border-bms-border rounded-xl text-bms-muted text-sm hover:text-bms-text hover:border-bms-cyan/30 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Pipeline */}
      {steps.some((s) => s.status !== 'pending') && (
        <div className="bg-bms-card border border-bms-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-bms-border">
            <h2 className="text-bms-text font-semibold text-base">Pipeline</h2>
          </div>
          <div className="divide-y divide-bms-border">
            {steps.map((step, idx) => (
              <div key={step.id}>
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-bms-darker/50 transition-colors text-left"
                  onClick={() =>
                    setSteps((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, expanded: !s.expanded } : s))
                    )
                  }
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <StepIcon status={step.status} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-bms-muted font-mono">0{idx + 1}</span>
                        <span className={`text-sm font-medium ${
                          step.status === 'complete' ? 'text-emerald-400'
                          : step.status === 'error'  ? 'text-red-400'
                          : step.status === 'active' ? 'text-bms-cyan'
                          : 'text-bms-muted'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      <p className="text-xs text-bms-muted truncate">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {step.duration && (
                      <div className="flex items-center gap-1 text-xs text-bms-muted">
                        <Clock className="w-3 h-3" />
                        {step.duration}
                      </div>
                    )}
                    {step.outputs.length > 0 && (
                      step.expanded
                        ? <ChevronUp className="w-4 h-4 text-bms-muted" />
                        : <ChevronDown className="w-4 h-4 text-bms-muted" />
                    )}
                  </div>
                </button>

                {step.expanded && step.outputs.length > 0 && (
                  <div className="px-6 pb-4 space-y-2">
                    {step.outputs.map((out, oi) => (
                      <div
                        key={oi}
                        className="bg-bms-darker rounded-xl p-3 border border-bms-border/50"
                      >
                        <pre className="text-xs text-bms-muted whitespace-pre-wrap break-words font-mono leading-relaxed">
                          {out}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {runSummary && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-400 font-semibold text-sm">Run complete</p>
            <p className="text-bms-text text-sm mt-1">{runSummary}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {runError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Run failed</p>
            <p className="text-bms-text text-sm mt-1 whitespace-pre-wrap">{runError}</p>
          </div>
        </div>
      )}

      {/* Outcome details */}
      {outcome && (
        <div className="bg-bms-card border border-bms-border rounded-2xl p-6">
          <h2 className="text-bms-text font-semibold text-base mb-4">Outcome</h2>
          <pre className="text-xs text-bms-muted whitespace-pre-wrap break-words font-mono leading-relaxed">
            {outcome}
          </pre>
        </div>
      )}
    </div>
  )
}
