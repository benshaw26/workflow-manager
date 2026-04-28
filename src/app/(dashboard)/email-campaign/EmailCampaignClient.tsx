'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Sparkles, Loader2, ChevronRight, ChevronLeft,
  Copy, Check, Clock, Calendar, AlertCircle, Users,
  Lightbulb, Send, FileText, Search, Globe, X,
  FolderOpen, Plus, Trash2,
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface GeneratedCampaign {
  subjectA: string
  subjectB: string
  previewText: string
  body: string
  sendTime: string
  personalisationTips: string[]
}

interface SavedCampaign {
  id: string
  campaignName: string
  fromName: string
  audience: string
  subjectA: string
  subjectB: string
  body: string
  tone: string
  sendTime: string
  scheduledAt: string | null
  status: string
  createdAt: string
}

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Polished and business-focused' },
  { id: 'friendly',     label: 'Friendly',     desc: 'Warm, approachable, conversational' },
  { id: 'urgent',       label: 'Urgent',        desc: 'Time-sensitive, action-driving' },
  { id: 'educational',  label: 'Educational',   desc: 'Informative and value-led' },
]

export function EmailCampaignClient({ userName }: { userName: string }) {
  const [view, setView]   = useState<'new' | 'history'>('new')
  const [step, setStep]   = useState(1)

  // Saved campaigns
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/automations/email/save')
      if (res.ok) {
        const data = await res.json()
        setSavedCampaigns(data.campaigns)
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadCampaign = (c: SavedCampaign) => {
    setCampaignName(c.campaignName)
    setFromName(c.fromName)
    setAudience(c.audience)
    setTone(c.tone)
    setCampaign({ subjectA: c.subjectA, subjectB: c.subjectB, previewText: '', body: c.body, sendTime: c.sendTime, personalisationTips: [] })
    setEditedBody(c.body)
    setSaved(false)
    setSendResult(null)
    setView('new')
    setStep(3)
  }

  const deleteCampaign = async (id: string) => {
    await fetch(`/api/automations/email/save?id=${id}`, { method: 'DELETE' })
    setSavedCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  // Step 1 fields
  const [campaignName, setCampaignName] = useState('')
  const [fromName, setFromName]         = useState('')
  const [audience, setAudience]         = useState('')
  const [tone, setTone]                 = useState('professional')
  const [topic, setTopic]               = useState('')

  // Step 2 generate
  const [generating, setGenerating]     = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [campaign, setCampaign]         = useState<GeneratedCampaign | null>(null)

  // Step 3 schedule + send
  const [editedBody, setEditedBody]     = useState('')
  const [selectedSubject, setSelectedSubject] = useState<'A' | 'B'>('A')
  const [scheduledAt, setScheduledAt]   = useState<Date | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [copied, setCopied]             = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [recipientsRaw, setRecipientsRaw] = useState('')
  const [sending, setSending]           = useState(false)
  const [sendResult, setSendResult]     = useState<{ sent: number; failed: number } | null>(null)
  const [sendError, setSendError]       = useState('')
  // AI scan
  const [recipientTab, setRecipientTab] = useState<'paste' | 'scan'>('paste')
  const [scanInput, setScanInput]       = useState('')
  const [scanning, setScanning]         = useState(false)
  const [scanError, setScanError]       = useState('')
  const [scannedContacts, setScannedContacts] = useState<{ email: string; name: string | null; role: string | null; confidence: string; selected: boolean }[]>([])
  const [scanSummary, setScanSummary]   = useState('')

  const generate = async () => {
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/automations/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignName, fromName, audience, tone, topic }),
      })
      const data = await res.json()
      if (!res.ok) { setGenerateError(data.error); return }
      setCampaign(data.campaign)
      setEditedBody(data.campaign.body)
      setStep(3)
    } catch {
      setGenerateError('Network error — please try again')
    } finally {
      setGenerating(false)
    }
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const parseRecipients = () => {
    const pasted = recipientsRaw
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    const fromScan = scannedContacts.filter((c) => c.selected).map((c) => c.email)
    return [...new Set([...pasted, ...fromScan])]
  }

  const scanForEmails = async () => {
    setScanning(true)
    setScanError('')
    setScannedContacts([])
    setScanSummary('')
    try {
      const isUrl = scanInput.startsWith('http')
      const res = await fetch('/api/automations/email/find-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl ? { url: scanInput } : { text: scanInput }),
      })
      const data = await res.json()
      if (!res.ok) { setScanError(data.error); return }
      setScannedContacts(data.emails.map((c: { email: string; name: string | null; role: string | null; confidence: string }) => ({ ...c, selected: true })))
      setScanSummary(data.summary)
    } catch {
      setScanError('Network error — please try again')
    } finally {
      setScanning(false)
    }
  }

  const toggleContact = (email: string) =>
    setScannedContacts((prev) => prev.map((c) => c.email === email ? { ...c, selected: !c.selected } : c))

  const sendNow = async () => {
    if (!campaign) return
    const recipients = parseRecipients()
    if (!recipients.length) { setSendError('Add at least one valid email address'); return }
    setSending(true)
    setSendError('')
    try {
      const subject = selectedSubject === 'A' ? campaign.subjectA : campaign.subjectB
      const res = await fetch('/api/automations/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, subject, body: editedBody, fromName, previewText: campaign.previewText }),
      })
      const data = await res.json()
      if (!res.ok) { setSendError(data.error); return }
      setSendResult({ sent: data.sent, failed: data.failed })
    } catch {
      setSendError('Network error — please try again')
    } finally {
      setSending(false)
    }
  }

  const saveCampaign = async () => {
    if (!campaign) return
    setSaving(true)
    try {
      await fetch('/api/automations/email/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          fromName,
          audience,
          subjectA: campaign.subjectA,
          subjectB: campaign.subjectB,
          body: editedBody,
          tone,
          sendTime: campaign.sendTime,
          scheduledAt: scheduledAt?.toISOString(),
        }),
      })
      setSaved(true)
      fetchCampaigns()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-bms-cyan" />
          </div>
          <span className="text-bms-cyan text-xs font-semibold uppercase tracking-widest">Email Marketing</span>
        </div>
        <h2 className="text-3xl font-bold text-bms-text">
          Hey {userName.split(' ')[0]}, let&apos;s build your{' '}
          <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
            email campaign
          </span>
        </h2>
        <p className="text-bms-muted text-sm mt-1.5">
          AI-personalised subject lines, optimised send times, and A/B testing — ready in seconds.
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('new')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
            view === 'new' ? 'bg-bms-cyan text-bms-dark border-bms-cyan' : 'bg-bms-darker border-bms-border text-bms-muted hover:border-bms-muted'
          }`}
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
        <button
          onClick={() => { setView('history'); fetchCampaigns() }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
            view === 'history' ? 'bg-bms-cyan text-bms-dark border-bms-cyan' : 'bg-bms-darker border-bms-border text-bms-muted hover:border-bms-muted'
          }`}
        >
          <FolderOpen className="w-4 h-4" /> Previous Campaigns
          {savedCampaigns.length > 0 && (
            <span className="bg-bms-cyan/20 text-bms-cyan text-xs px-1.5 py-0.5 rounded-full">{savedCampaigns.length}</span>
          )}
        </button>
      </div>

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div className="space-y-3">
          {loadingHistory && (
            <div className="flex items-center gap-2 text-bms-muted text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns...
            </div>
          )}
          {!loadingHistory && savedCampaigns.length === 0 && (
            <div className="bg-bms-card border border-bms-border rounded-2xl p-12 text-center">
              <Mail className="w-10 h-10 text-bms-muted mx-auto mb-3" />
              <p className="text-bms-text font-semibold">No campaigns yet</p>
              <p className="text-bms-muted text-sm mt-1">Create and save your first campaign to see it here.</p>
            </div>
          )}
          {savedCampaigns.map((c) => (
            <div key={c.id} className="bg-bms-card border border-bms-border rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-bms-cyan/30 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-bms-text font-semibold truncate">{c.campaignName || 'Untitled Campaign'}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    c.status === 'SCHEDULED' ? 'bg-bms-cyan/10 text-bms-cyan border border-bms-cyan/20'
                    : c.status === 'SENT'     ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-bms-border text-bms-muted border border-bms-border'
                  }`}>{c.status}</span>
                </div>
                <p className="text-bms-muted text-xs truncate mb-2">{c.subjectA}</p>
                <div className="flex items-center gap-3 text-[10px] text-bms-muted">
                  <span>To: {c.audience.slice(0, 40)}{c.audience.length > 40 ? '...' : ''}</span>
                  <span>·</span>
                  <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => loadCampaign(c)}
                  className="inline-flex items-center gap-1.5 bg-bms-cyan text-bms-dark font-semibold text-xs px-3 py-2 rounded-lg hover:bg-bms-cyan-dark transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Open & Send
                </button>
                <button
                  onClick={() => deleteCampaign(c.id)}
                  className="p-2 rounded-lg text-bms-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'new' && <>
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[
          { n: 1, label: 'Campaign Setup' },
          { n: 2, label: 'Generate' },
          { n: 3, label: 'Preview & Schedule' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-3">
            <button
              onClick={() => n < step && setStep(n)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                n === step
                  ? 'bg-bms-cyan text-bms-dark'
                  : n < step
                  ? 'bg-bms-cyan/20 text-bms-cyan cursor-pointer hover:bg-bms-cyan/30'
                  : 'bg-bms-border text-bms-muted cursor-default'
              }`}
            >
              {n}. {label}
            </button>
            {i < 2 && <ChevronRight className="w-4 h-4 text-bms-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Campaign Setup ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-bms-muted text-xs uppercase tracking-wide mb-2 block">Campaign Name</label>
                  <input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. March Product Launch"
                    className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-2.5 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan transition-all"
                  />
                </div>
                <div>
                  <label className="text-bms-muted text-xs uppercase tracking-wide mb-2 block">From Name</label>
                  <input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g. Sarah at BMS"
                    className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-2.5 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-bms-muted text-xs uppercase tracking-wide mb-2 block flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Target Audience
                </label>
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Small business owners who signed up in the last 30 days but haven't converted"
                  className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-2.5 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan transition-all"
                />
              </div>

              <div>
                <label className="text-bms-muted text-xs uppercase tracking-wide mb-2 block flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Campaign Topic / Goal
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Re-engage cold leads by showcasing our new AI automation feature and offering a free 14-day trial..."
                  rows={3}
                  className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-3 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan resize-none transition-all"
                />
              </div>

              <div>
                <label className="text-bms-muted text-xs uppercase tracking-wide mb-3 block">Tone</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tone === t.id
                          ? 'bg-bms-cyan/10 border-bms-cyan text-bms-cyan'
                          : 'bg-bms-darker border-bms-border text-bms-muted hover:border-bms-muted'
                      }`}
                    >
                      <p className="text-sm font-semibold">{t.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!audience || !topic}
              className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-6 py-3 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: Generate ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="bg-bms-card border border-bms-border rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-bms-cyan" />
              </div>
              <div>
                <h3 className="text-bms-text font-bold text-lg">Ready to generate</h3>
                <p className="text-bms-muted text-sm mt-1 max-w-md mx-auto">
                  Claude will write your full email, two subject line variants for A/B testing, and recommend the optimal send time.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs text-bms-muted">
                {['Email body', 'A/B subjects', 'Send time'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 bg-bms-darker rounded-lg px-3 py-2">
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {generateError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {generateError}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 bg-bms-darker border border-bms-border text-bms-muted px-5 py-2.5 rounded-xl hover:border-bms-muted transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={generate}
                disabled={generating}
                className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-6 py-2.5 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  : <><Sparkles className="w-4 h-4" /> Generate Campaign</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Preview & Schedule ── */}
        {step === 3 && campaign && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* A/B Subject lines */}
            <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-bms-text font-semibold">A/B Subject Lines</h3>
                <span className="text-bms-muted text-xs">Click to select the winning variant</span>
              </div>
              <div className="space-y-3">
                {(['A', 'B'] as const).map((variant) => {
                  const subject = variant === 'A' ? campaign.subjectA : campaign.subjectB
                  const isSelected = selectedSubject === variant
                  return (
                    <button
                      key={variant}
                      onClick={() => setSelectedSubject(variant)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-bms-cyan/10 border-bms-cyan'
                          : 'bg-bms-darker border-bms-border hover:border-bms-muted'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                        isSelected ? 'bg-bms-cyan text-bms-dark border-bms-cyan' : 'border-bms-border text-bms-muted'
                      }`}>{variant}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isSelected ? 'text-bms-text' : 'text-bms-muted'}`}>{subject}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyText(subject, `subject-${variant}`) }}
                        className="text-bms-muted hover:text-bms-cyan transition-colors"
                      >
                        {copied === `subject-${variant}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </button>
                  )
                })}
              </div>

              {/* Preview text */}
              <div className="bg-bms-darker rounded-xl p-3 border border-bms-border">
                <p className="text-bms-muted text-[10px] uppercase tracking-wide mb-1">Preview Text (inbox snippet)</p>
                <p className="text-bms-text text-sm">{campaign.previewText}</p>
              </div>
            </div>

            {/* Email body */}
            <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-bms-text font-semibold">Email Body</h3>
                <button
                  onClick={() => copyText(editedBody, 'body')}
                  className="inline-flex items-center gap-1.5 text-xs text-bms-muted hover:text-bms-cyan transition-colors"
                >
                  {copied === 'body' ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={14}
                className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-3 text-sm text-bms-text focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan resize-none transition-all font-mono leading-relaxed"
              />
            </div>

            {/* Personalisation tips */}
            <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-bms-amber" />
                <h3 className="text-bms-text font-semibold">Personalisation Tips</h3>
              </div>
              <ul className="space-y-2">
                {campaign.personalisationTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-bms-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-bms-cyan mt-1.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended send time */}
            <div className="flex items-center gap-3 bg-bms-cyan/5 border border-bms-cyan/20 rounded-xl p-4">
              <Clock className="w-4 h-4 text-bms-cyan flex-shrink-0" />
              <div>
                <p className="text-bms-text text-sm font-medium">Recommended send time</p>
                <p className="text-bms-cyan text-sm">{campaign.sendTime}</p>
              </div>
            </div>

            {/* Recipients + Send Now */}
            <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-4">
              <h3 className="text-bms-text font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-bms-cyan" /> Recipients
              </h3>

              {/* Tabs */}
              <div className="flex gap-1 bg-bms-darker rounded-xl p-1 w-fit">
                {([
                  { id: 'paste', label: 'Paste Emails', icon: <Mail className="w-3.5 h-3.5" /> },
                  { id: 'scan',  label: 'Find with AI', icon: <Search className="w-3.5 h-3.5" /> },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRecipientTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      recipientTab === tab.id
                        ? 'bg-bms-cyan text-bms-dark'
                        : 'text-bms-muted hover:text-bms-text'
                    }`}
                  >
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              {recipientTab === 'paste' && (
                <div className="space-y-2">
                  <p className="text-bms-muted text-sm">Paste email addresses separated by commas, semicolons, or new lines.</p>
                  <textarea
                    value={recipientsRaw}
                    onChange={(e) => setRecipientsRaw(e.target.value)}
                    placeholder="john@example.com, sarah@company.com&#10;mike@business.com"
                    rows={4}
                    className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-3 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan resize-none transition-all font-mono"
                  />
                </div>
              )}

              {recipientTab === 'scan' && (
                <div className="space-y-3">
                  <p className="text-bms-muted text-sm">
                    Paste a website URL or any text (contact pages, LinkedIn profiles, directories) and Claude will find and infer email addresses automatically.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bms-muted" />
                      <input
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder="https://company.com/team  or paste contact text..."
                        className="w-full bg-bms-darker border border-bms-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan transition-all"
                      />
                    </div>
                    <button
                      onClick={scanForEmails}
                      disabled={scanning || !scanInput}
                      className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-4 py-2.5 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors text-sm whitespace-nowrap"
                    >
                      {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</> : <><Search className="w-4 h-4" /> Scan</>}
                    </button>
                  </div>

                  {scanError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{scanError}
                    </div>
                  )}

                  {scannedContacts.length > 0 && (
                    <div className="space-y-2">
                      {scanSummary && <p className="text-bms-muted text-xs">{scanSummary}</p>}
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {scannedContacts.map((c) => (
                          <button
                            key={c.email}
                            onClick={() => toggleContact(c.email)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              c.selected
                                ? 'bg-bms-cyan/10 border-bms-cyan/40'
                                : 'bg-bms-darker border-bms-border opacity-50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${c.selected ? 'bg-bms-cyan border-bms-cyan' : 'border-bms-border'}`}>
                              {c.selected && <Check className="w-3 h-3 text-bms-dark" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-bms-text text-sm font-medium truncate">{c.email}</p>
                              {(c.name || c.role) && (
                                <p className="text-bms-muted text-xs truncate">{[c.name, c.role].filter(Boolean).join(' · ')}</p>
                              )}
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              c.confidence === 'found'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {c.confidence}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setScannedContacts([])}
                        className="inline-flex items-center gap-1 text-xs text-bms-muted hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" /> Clear results
                      </button>
                    </div>
                  )}
                </div>
              )}

              {parseRecipients().length > 0 && (
                <p className="text-bms-muted text-xs font-medium">
                  {parseRecipients().length} recipient{parseRecipients().length !== 1 ? 's' : ''} ready to send
                </p>
              )}

              {sendError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{sendError}
                </div>
              )}

              {sendResult && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-400 text-sm font-medium">
                    {sendResult.sent} email{sendResult.sent !== 1 ? 's' : ''} sent successfully
                    {sendResult.failed > 0 && `, ${sendResult.failed} failed`}
                  </p>
                </div>
              )}

              <button
                onClick={sendNow}
                disabled={sending || parseRecipients().length === 0 || !!sendResult}
                className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-6 py-2.5 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors"
              >
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : sendResult
                  ? <><Check className="w-4 h-4" /> Sent</>
                  : <><Send className="w-4 h-4" /> Send Now</>}
              </button>
            </div>

            {/* Schedule */}
            <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-4">
              <h3 className="text-bms-text font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-bms-cyan" /> Schedule Campaign
              </h3>
              <div className="relative">
                <button
                  onClick={() => setCalendarOpen(!calendarOpen)}
                  className="inline-flex items-center gap-2 bg-bms-darker border border-bms-border text-bms-muted hover:border-bms-muted px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  {scheduledAt
                    ? scheduledAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Pick a send date'}
                </button>
                {calendarOpen && (
                  <div className="absolute top-full mt-2 z-50 bg-bms-card border border-bms-border rounded-2xl shadow-xl p-2">
                    <DayPicker
                      mode="single"
                      selected={scheduledAt ?? undefined}
                      onSelect={(d) => { setScheduledAt(d ?? null); setCalendarOpen(false) }}
                      disabled={{ before: new Date() }}
                      classNames={{
                        root: 'text-bms-text text-sm',
                        day_selected: '!bg-bms-cyan !text-bms-dark rounded-lg',
                        day_today: 'font-bold text-bms-cyan',
                        nav_button: 'text-bms-muted hover:text-bms-text',
                        caption: 'text-bms-text font-semibold mb-2',
                        head_cell: 'text-bms-muted text-xs',
                        cell: 'p-0.5',
                        day: 'w-8 h-8 rounded-lg hover:bg-bms-darker transition-colors',
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 bg-bms-darker border border-bms-border text-bms-muted px-5 py-2.5 rounded-xl hover:border-bms-muted transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Start Over
                </button>
                <button
                  onClick={saveCampaign}
                  disabled={saving || saved}
                  className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-6 py-2.5 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : saved
                    ? <><Check className="w-4 h-4" /> Saved</>
                    : <><Send className="w-4 h-4" /> {scheduledAt ? 'Schedule Campaign' : 'Save as Draft'}</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </> }
    </div>
  )
}
