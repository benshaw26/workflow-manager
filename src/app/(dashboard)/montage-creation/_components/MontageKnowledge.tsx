'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Brain, Zap, TrendingUp, Trash2, Plus, RefreshCw, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface KbEntry {
  id: string
  title: string
  content: string
  tags?: string[]
  created_at?: number
  auto_learned?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts?: number): string {
  if (!ts) return ''
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const KB_URL = 'http://localhost:3001/api/montage/kb'

// ─── Seed entries ─────────────────────────────────────────────────────────────

const SEED_ENTRIES = [
  { title: 'HARD RULE — Low Energy Static Shot', content: 'Reject any clip that is mostly static with no movement, camera motion, or subject action. Fast-paced montages require visible dynamism in every shot.', tags: ['hard-rule', 'clip-selection'] },
  { title: 'HARD RULE — Poor Exposure or Focus', content: 'Reject clips that are severely overexposed, underexposed, or out of focus in more than 50% of the frame. Technical quality is non-negotiable.', tags: ['hard-rule', 'quality'] },
  { title: 'HARD RULE — Shaky Unstabilised Handheld', content: 'Reject clips with excessive camera shake that is distracting and not intentional creative choice. Smooth or deliberately stylised motion only.', tags: ['hard-rule', 'camera'] },
  { title: 'Hook — Use First 3 Seconds Rule', content: 'Every montage must establish its energy hook in the first 3 seconds. Lead with the most visually dynamic clip. Viewers decide to stay or scroll in 3 seconds.', tags: ['hook', 'pacing'] },
  { title: 'Content Structure — 60s Short-Form Rhythm', content: 'Hook 0-3s (visual grab) → Energy Build 3-20s (fast cuts) → Peak Moment 20-45s (best clips) → Resolution 45-55s (payoff) → CTA 55-60s.', tags: ['structure', 'short-form'] },
  { title: 'Engagement — Saves Signal Viral Potential', content: 'Saves are the strongest virality signal — weighted 4× on X, 2× on TikTok. Design montages worth rewatching.', tags: ['engagement', 'virality'] },
  { title: 'Platform — TikTok/Reels Energy Standard', content: 'Minimum 1 cut per 3 seconds, visible motion in 80%+ of clips, audio-visual sync on beats, 9:16 format with safe zones top/bottom 15%.', tags: ['platform', 'tiktok'] },
  { title: 'Hook Formula — Pattern Interrupt Opening', content: 'Start with something unexpected: unusual angle, jump cut mid-action, or colour contrast that breaks the scroll pattern.', tags: ['hook', 'pattern-interrupt'] },
  { title: 'Music — Background Audio Principles', content: 'Background music at 15% volume when voice present. For pure visual montages: 40-60%. Sync cuts to BPM beats.', tags: ['music', 'audio'] },
  { title: 'Outlier Detection — Z-Score Standard', content: 'An outlier video performs at mean + 2.0 standard deviations above average engagement. Judge by outperformance, not raw view count.', tags: ['analytics', 'outlier'] },
]

// ─── Static hook data ─────────────────────────────────────────────────────────

const HOOK_TECHNIQUES = [
  { key: 'pattern-interrupt', desc: 'Breaks expected patterns — surprises viewer before they can scroll' },
  { key: 'question', desc: 'Opens with engaging question that demands an answer' },
  { key: 'bold-claim', desc: 'Makes surprising or counterintuitive statement up front' },
  { key: 'story-tease', desc: 'Hints at compelling narrative — "I almost lost everything"' },
  { key: 'visual-shock', desc: 'Striking visual in first frame — contrast, colour, action' },
  { key: 'curiosity-gap', desc: 'Creates information gap — "The one thing nobody tells you"' },
  { key: 'direct-address', desc: 'Speaks directly to viewer pain point' },
  { key: 'controversial-take', desc: 'Polarising opinion that triggers comment responses' },
  { key: 'relatable-pain', desc: 'Targets common struggle the audience lives daily' },
  { key: 'transformation-preview', desc: 'Shows before/after — the outcome before the story' },
]

const CONTENT_FORMATS = [
  'problem-solution', 'listicle', 'story', 'tutorial',
  'before-after', 'day-in-life', 'reaction', 'transformation', 'hot-take', 'tool-demo',
]

interface PlatformStats {
  name: string
  color: string
  border: string
  bg: string
  metrics: { label: string; small: string; mid: string; large: string }[]
}

const PLATFORMS: PlatformStats[] = [
  {
    name: 'TikTok', color: 'text-gray-100', border: 'border-white/15', bg: 'bg-white/4',
    metrics: [
      { label: 'Views',     small: '1K – 10K',   mid: '10K – 500K',    large: '500K+' },
      { label: 'Followers', small: '0 – 5K',     mid: '5K – 100K',     large: '100K+' },
      { label: 'Likes',     small: '50 – 500',   mid: '500 – 25K',     large: '25K+' },
      { label: 'Comments',  small: '5 – 50',     mid: '50 – 2K',       large: '2K+' },
    ],
  },
  {
    name: 'Instagram', color: 'text-pink-400', border: 'border-pink-500/25', bg: 'bg-pink-500/5',
    metrics: [
      { label: 'Views',     small: '500 – 5K',   mid: '5K – 100K',     large: '100K+' },
      { label: 'Followers', small: '0 – 2K',     mid: '2K – 50K',      large: '50K+' },
      { label: 'Likes',     small: '30 – 300',   mid: '300 – 10K',     large: '10K+' },
      { label: 'Comments',  small: '2 – 30',     mid: '30 – 1K',       large: '1K+' },
    ],
  },
  {
    name: 'X / Twitter', color: 'text-sky-400', border: 'border-sky-500/25', bg: 'bg-sky-500/5',
    metrics: [
      { label: 'Views',     small: '200 – 2K',   mid: '2K – 50K',      large: '50K+' },
      { label: 'Followers', small: '0 – 1K',     mid: '1K – 20K',      large: '20K+' },
      { label: 'Likes',     small: '5 – 100',    mid: '100 – 3K',      large: '3K+' },
      { label: 'Comments',  small: '1 – 20',     mid: '20 – 500',      large: '500+' },
    ],
  },
  {
    name: 'YouTube Shorts', color: 'text-red-400', border: 'border-red-500/25', bg: 'bg-red-500/5',
    metrics: [
      { label: 'Views',     small: '500 – 5K',   mid: '5K – 200K',     large: '200K+' },
      { label: 'Followers', small: '0 – 1K',     mid: '1K – 50K',      large: '50K+' },
      { label: 'Likes',     small: '20 – 200',   mid: '200 – 8K',      large: '8K+' },
      { label: 'Comments',  small: '2 – 30',     mid: '30 – 800',      large: '800+' },
    ],
  },
]

// View:Like ratio quality tiers (likes ÷ views × 100 = %)
const RATIO_TIERS = [
  { label: 'Poor',      range: '< 1%',    color: 'text-red-400',    bar: 'bg-red-500',    width: '15%',  desc: 'Content likely shown to wrong audience or lacks appeal.' },
  { label: 'Average',   range: '1 – 3%',  color: 'text-amber-400',  bar: 'bg-amber-400',  width: '40%',  desc: 'Typical for most creators. Room to improve hooks and pacing.' },
  { label: 'Good',      range: '3 – 6%',  color: 'text-lime-400',   bar: 'bg-lime-400',   width: '65%',  desc: 'Strong resonance. Algorithm will push this to broader audiences.' },
  { label: 'Excellent', range: '6 – 10%', color: 'text-bms-cyan',   bar: 'bg-bms-cyan',   width: '85%',  desc: 'Viral-tier. Indicates high emotional impact and shareability.' },
  { label: 'Elite',     range: '> 10%',   color: 'text-purple-400', bar: 'bg-purple-400', width: '100%', desc: 'Top 1% content. Near-universal approval within audience.' },
]

const ASSEMBLY_ROWS = [
  ['Target length', '60 seconds (short-form social)'],
  ['Background music', '15% volume (voice present) / 40-60% (visual only)'],
  ['Frame rate', '30 fps, AAC 192k audio'],
  ['Format', '9:16 vertical (1080×1920) — TikTok / Reels / Shorts'],
  ['Clip gap', '0.5s between clips for rhythm'],
  ['Sequencing', 'Low → medium → high → peak → resolution energy arc'],
]

type InnerTab = 'rules' | 'frameworks' | 'science'

const INNER_TABS: { id: InnerTab; label: string; icon: React.ElementType }[] = [
  { id: 'rules',      label: 'Active Rules',       icon: Brain      },
  { id: 'frameworks', label: 'Hook Frameworks',    icon: Zap        },
  { id: 'science',    label: 'Engagement Science', icon: TrendingUp },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function MontageKnowledge() {
  const [tab, setTab]           = useState<InnerTab>('rules')
  const [entries, setEntries]   = useState<KbEntry[]>([])
  const [loading, setLoading]   = useState(false)
  const [seeding, setSeeding]   = useState(false)
  const [seeded, setSeeded]     = useState(false)
  const [addOpen, setAddOpen]   = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody]   = useState('')
  const [newTags, setNewTags]   = useState('')
  const [saving, setSaving]     = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(KB_URL, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json() as { entries?: KbEntry[] }
        setEntries(Array.isArray(data.entries) ? data.entries : [])
      }
    } catch {
      // server may be offline
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEntries()
    const id = setInterval(() => { void fetchEntries() }, 30_000)
    return () => clearInterval(id)
  }, [fetchEntries])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${KB_URL}/${id}`, { method: 'DELETE' })
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch { /* ignore */ }
  }, [])

  const seedKb = useCallback(async () => {
    setSeeding(true)
    try {
      await Promise.all(
        SEED_ENTRIES.map(entry =>
          fetch(KB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          })
        )
      )
      setSeeded(true)
      await fetchEntries()
      setTimeout(() => setSeeded(false), 4000)
    } catch { /* ignore */ }
    setSeeding(false)
  }, [fetchEntries])

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setSaving(true)
    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await fetch(KB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), content: newBody.trim(), tags }),
      })
      if (res.ok) {
        setNewTitle(''); setNewBody(''); setNewTags(''); setAddOpen(false)
        await fetchEntries()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }, [newTitle, newBody, newTags, fetchEntries])

  const hardRules  = entries.filter(e => e.title?.startsWith('HARD RULE'))
  const guidelines = entries.filter(e => !e.title?.startsWith('HARD RULE'))

  return (
    <div className="flex flex-col gap-4">

      {/* Inner tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-bms-darker border border-bms-border">
        {INNER_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-bms-card text-bms-text border border-bms-border'
                : 'text-bms-muted hover:text-bms-text'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Active Rules ── */}
      {tab === 'rules' && (
        <div className="flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-bms-muted" />
              <span className="text-sm font-semibold text-bms-text">Knowledge Base</span>
              {entries.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-bms-darker border border-bms-border text-bms-muted">{entries.length}</span>
              )}
            </div>
            <button onClick={() => void fetchEntries()} disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-bms-muted hover:text-bms-text border border-bms-border transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Entries */}
          {loading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-12 gap-2 text-bms-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <Brain className="w-8 h-8 text-bms-muted" />
              <p className="text-sm text-bms-muted">No rules yet — click Seed Framework Knowledge below</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {hardRules.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400/70">Hard Rules</span>
                  {hardRules.map(e => (
                    <RuleCard key={e.id} entry={e} onDelete={handleDelete} />
                  ))}
                </div>
              )}
              {guidelines.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/70">Guidelines</span>
                  {guidelines.map(e => (
                    <RuleCard key={e.id} entry={e} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seed button */}
          <button onClick={() => void seedKb()} disabled={seeding}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-bms-cyan/10 border border-bms-cyan/25 text-bms-cyan hover:bg-bms-cyan/15 transition-colors disabled:opacity-50">
            {seeding ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Seeding…</>
             : seeded  ? <><CheckCircle2 className="w-3.5 h-3.5" />Seeded ✓</>
             :           <><Zap className="w-3.5 h-3.5" />Seed Framework Knowledge</>}
          </button>

          {/* Add Rule */}
          <div className="rounded-xl border border-bms-border overflow-hidden">
            <button onClick={() => setAddOpen(v => !v)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-bms-text hover:bg-bms-darker transition-colors">
              <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-bms-cyan" />Add Rule</span>
              {addOpen ? <ChevronUp className="w-3.5 h-3.5 text-bms-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-bms-muted" />}
            </button>
            {addOpen && (
              <div className="flex flex-col gap-3 px-4 pb-4 pt-3 border-t border-bms-border">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder='Title (prefix "HARD RULE —" for hard rules)'
                  className="w-full bg-bms-darker border border-bms-border rounded-lg px-3 py-2 text-sm text-bms-text placeholder:text-bms-muted outline-none focus:border-bms-cyan/50 transition-colors" />
                <textarea value={newBody} onChange={e => setNewBody(e.target.value)}
                  placeholder="Rule content…" rows={3}
                  className="w-full bg-bms-darker border border-bms-border rounded-lg px-3 py-2 text-sm text-bms-text placeholder:text-bms-muted outline-none focus:border-bms-cyan/50 transition-colors resize-none" />
                <input value={newTags} onChange={e => setNewTags(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="w-full bg-bms-darker border border-bms-border rounded-lg px-3 py-2 text-sm text-bms-text placeholder:text-bms-muted outline-none focus:border-bms-cyan/50 transition-colors" />
                <button onClick={() => void handleAdd()} disabled={saving || !newTitle.trim() || !newBody.trim()}
                  className="self-end flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-bms-border text-bms-text hover:border-bms-cyan/40 transition-colors disabled:opacity-40">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Rule
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Hook Frameworks ── */}
      {tab === 'frameworks' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-bms-cyan" />
              <span className="text-sm font-semibold text-bms-text">Hook Techniques</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HOOK_TECHNIQUES.map(({ key, desc }) => (
                <div key={key} className="rounded-xl border border-bms-border bg-bms-card p-3 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-bms-cyan font-mono">{key}</span>
                  <p className="text-xs text-bms-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bms-text">Content Structure — 60s Timeline</span>
            <div className="rounded-xl border border-bms-border bg-bms-card p-4 flex flex-col gap-3">
              <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
                <div className="flex items-center justify-center text-[9px] font-bold text-bms-dark bg-bms-cyan/70" style={{ width: '5%' }}>H</div>
                <div className="flex items-center justify-center text-[9px] font-bold text-white bg-purple-500/70" style={{ width: '7%' }}>P</div>
                <div className="flex items-center justify-center text-[9px] font-bold text-white bg-indigo-500/70" style={{ width: '63%' }}>Value</div>
                <div className="flex items-center justify-center text-[9px] font-bold text-bms-dark bg-amber-400/70" style={{ width: '25%' }}>CTA</div>
              </div>
              <div className="flex justify-between text-[10px] text-bms-muted">
                <span>0s</span><span>3s Hook</span><span>7s Problem</span><span>45s Value</span><span>60s CTA</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bms-text">Content Formats</span>
            <div className="flex flex-wrap gap-2">
              {CONTENT_FORMATS.map(fmt => (
                <span key={fmt} className="text-[11px] px-2.5 py-1 rounded-lg border border-bms-border text-bms-muted font-mono">{fmt}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Engagement Science ── */}
      {tab === 'science' && (
        <div className="flex flex-col gap-6">

          {/* View:Like Ratio Guide */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-bms-cyan" />
              <span className="text-sm font-semibold text-bms-text">View : Like Ratio Quality</span>
              <span className="text-[10px] text-bms-muted">(likes ÷ views × 100)</span>
            </div>
            <div className="flex flex-col gap-2">
              {RATIO_TIERS.map(tier => (
                <div key={tier.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold w-16 ${tier.color}`}>{tier.label}</span>
                      <span className="text-bms-muted font-mono text-[11px]">{tier.range}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bms-darker overflow-hidden">
                    <div className={`h-full rounded-full ${tier.bar}`} style={{ width: tier.width }} />
                  </div>
                  <p className="text-[11px] text-bms-muted leading-relaxed">{tier.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Breakdowns */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-bms-text">Platform Benchmarks</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLATFORMS.map(p => (
                <div key={p.name} className={`rounded-xl border p-3 flex flex-col gap-3 ${p.border} ${p.bg}`}>
                  <span className={`text-xs font-bold ${p.color}`}>{p.name}</span>
                  <div className="rounded-lg overflow-hidden border border-bms-border">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-bms-border">
                          <th className="text-left py-1.5 px-2 text-bms-muted font-medium">Metric</th>
                          <th className="text-right py-1.5 px-2 text-bms-muted font-medium">Small</th>
                          <th className="text-right py-1.5 px-2 text-bms-muted font-medium">Mid</th>
                          <th className="text-right py-1.5 px-2 text-bms-muted font-medium">Large</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.metrics.map(m => (
                          <tr key={m.label} className="border-b border-bms-border last:border-0">
                            <td className="py-1.5 px-2 text-bms-text font-medium whitespace-nowrap">{m.label}</td>
                            <td className="py-1.5 px-2 text-right text-bms-muted font-mono whitespace-nowrap">{m.small}</td>
                            <td className="py-1.5 px-2 text-right text-bms-muted font-mono whitespace-nowrap">{m.mid}</td>
                            <td className="py-1.5 px-2 text-right text-bms-muted font-mono whitespace-nowrap">{m.large}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-bms-muted">Small = early/niche creator · Mid = growing account · Large = established audience</p>
          </div>

          {/* Video Assembly Principles */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bms-text">Video Assembly Principles</span>
            <div className="rounded-xl border border-bms-border bg-bms-card p-3">
              <table className="w-full text-xs">
                <tbody>
                  {ASSEMBLY_ROWS.map(([label, value]) => (
                    <tr key={label} className="border-b border-bms-border last:border-0">
                      <td className="py-1.5 pr-3 text-bms-muted font-medium whitespace-nowrap">{label}</td>
                      <td className="py-1.5 text-bms-text">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Rule card sub-component ──────────────────────────────────────────────────

function RuleCard({ entry, onDelete }: { entry: KbEntry; onDelete: (id: string) => void }) {
  const isHard = Boolean(entry.title?.startsWith('HARD RULE'))
  const isAI   = Boolean(entry.auto_learned)
  const tags   = Array.isArray(entry.tags) ? entry.tags : []

  const accent = isHard
    ? { text: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/20', label: 'Hard Rule' }
    : isAI
    ? { text: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/20', label: 'AI Learned' }
    : { text: 'text-purple-400', bg: 'bg-purple-500/8', border: 'border-purple-500/20', label: 'Guideline' }

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${accent.bg} ${accent.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border self-start ${accent.text} ${accent.border}`}
            style={{ background: 'transparent' }}>
            {accent.label}
          </span>
          <span className="text-sm font-medium text-bms-text leading-snug">{entry.title ?? ''}</span>
        </div>
        <button onClick={() => onDelete(entry.id)}
          className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/15 transition-colors" title="Delete">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
      <p className="text-xs text-bms-muted leading-relaxed">{entry.content ?? ''}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {tags.map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-bms-darker border border-bms-border text-bms-muted font-mono">{t}</span>
          ))}
        </div>
        <span className="text-[10px] text-bms-muted shrink-0">{timeAgo(entry.created_at)}</span>
      </div>
    </div>
  )
}
