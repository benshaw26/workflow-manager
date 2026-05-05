'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Brain, Zap, TrendingUp, Trash2, Plus, RefreshCw, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, BookOpen, Database,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface KbEntry {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: number   // unix epoch seconds
  auto_learned: boolean
}

interface Props {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const KB_URL = 'http://localhost:3001/api/montage/kb'

// ─── Seed data ───────────────────────────────────────────────────────────────

const SEED_ENTRIES = [
  { title: 'HARD RULE — Low Energy Static Shot', content: 'Reject any clip that is mostly static with no movement, camera motion, or subject action. Fast-paced montages require visible dynamism in every shot.', tags: ['hard-rule', 'clip-selection'] },
  { title: 'HARD RULE — Poor Exposure or Focus', content: 'Reject clips that are severely overexposed, underexposed, or out of focus in more than 50% of the frame. Technical quality is non-negotiable.', tags: ['hard-rule', 'quality'] },
  { title: 'HARD RULE — Shaky Unstabilised Handheld', content: 'Reject clips with excessive camera shake that is distracting and not intentional creative choice. Smooth or deliberately stylised motion only.', tags: ['hard-rule', 'camera'] },
  { title: 'Hook — Use First 3 Seconds Rule', content: 'Every montage must establish its energy hook in the first 3 seconds. Lead with the most visually dynamic clip — movement, colour contrast, or action. Viewers decide to stay or scroll in 3 seconds.', tags: ['hook', 'pacing'] },
  { title: 'Content Structure — 60s Short-Form Rhythm', content: 'Follow the proven short-form structure: Hook 0-3s (visual grab), Energy Build 3-20s (fast cuts), Peak Moment 20-45s (best clips), Resolution 45-55s (payoff), CTA 55-60s (call to action or brand close).', tags: ['structure', 'short-form'] },
  { title: 'Engagement — Saves Signal Viral Potential', content: 'On TikTok and Instagram, saves (bookmarks) are the strongest virality signal — weighted 4× on X, 2× on TikTok. Content that gets saved gets pushed to more feeds. Design montages worth rewatching.', tags: ['engagement', 'virality'] },
  { title: 'Platform — TikTok/Reels Energy Standard', content: 'TikTok and Instagram Reels require: minimum 1 cut per 3 seconds, visible subject motion in 80%+ of clips, audio-visual sync on beats, 9:16 format with safe zones for UI overlays at top/bottom 15%.', tags: ['platform', 'tiktok', 'reels'] },
  { title: 'Hook Formula — Pattern Interrupt Opening', content: 'Start with something the viewer does NOT expect: an unusual angle, a jump cut mid-action, or a colour/contrast that breaks the scroll pattern. This technique from head-of-content analysis is the top hook type across all platforms.', tags: ['hook', 'pattern-interrupt'] },
  { title: 'Music — Background Audio Principles', content: 'Background music at 15% volume when voice/narration present. For pure visual montages: 40-60% volume, sync cuts to BPM beats. Use lofi/electronic for calm brand, trap/EDM for energy, cinematic for premium feel.', tags: ['music', 'audio'] },
  { title: 'Outlier Detection — Use Z-Score Standard', content: 'An outlier video performs at mean + 2.0 standard deviations above average engagement for its channel/niche. Don\'t judge by raw view count — judge by how much it outperforms expectations. Surface surprising performers.', tags: ['analytics', 'outlier'] },
]

// ─── Static framework data ───────────────────────────────────────────────────

const HOOK_TECHNIQUES = [
  { key: 'pattern-interrupt', desc: 'Breaks expected patterns — surprises viewer before they can scroll' },
  { key: 'question', desc: 'Opens with engaging question that demands an answer' },
  { key: 'bold-claim', desc: 'Makes surprising/counterintuitive statement up front' },
  { key: 'story-tease', desc: 'Hints at compelling narrative — "I almost lost everything…"' },
  { key: 'visual-shock', desc: 'Striking visual in first frame — contrast, colour, action' },
  { key: 'curiosity-gap', desc: 'Creates information gap — "The one thing nobody tells you…"' },
  { key: 'direct-address', desc: 'Speaks to exact viewer pain — "If you\'re a [X] struggling with [Y]…"' },
  { key: 'controversial-take', desc: 'Polarising opinion that triggers comment responses' },
  { key: 'relatable-pain', desc: 'Targets common struggle the audience lives daily' },
  { key: 'transformation-preview', desc: 'Shows before/after — the outcome before the story' },
]

const CONTENT_FORMATS = [
  'problem-solution', 'listicle', 'story', 'tutorial',
  'before-after', 'day-in-life', 'reaction', 'transformation', 'hot-take', 'tool-demo',
]

const PLATFORMS = [
  {
    name: 'X / Twitter',
    color: 'sky',
    formula: 'score = likes×1 + retweets×2 + replies×3 + quotes×2 + bookmarks×4',
    insight: 'Bookmarks = highest intent signal. Replies signal conversation. Retweets/Quotes signal amplification.',
  },
  {
    name: 'Instagram',
    color: 'pink',
    formula: 'score = likes + (3×comments) + (0.1×video_views)',
    insight: 'Comments signal active engagement — 3× weight vs passive likes.',
  },
  {
    name: 'TikTok',
    color: 'neutral',
    formula: 'score = likes + (3×comments) + (2×shares) + (2×saves) + (0.05×views)',
    insight: 'Shares + Saves = virality signals. Views alone are misleading.',
  },
  {
    name: 'YouTube',
    color: 'red',
    formula: 'score = zScore × recency_boost (5%/day decay, min 0.3×)',
    insight: 'z-score = how much a video outperforms its channel average. Surfaces underdog channels.',
  },
]

const platformBorder: Record<string, string> = {
  sky: 'border-sky-500/25',
  pink: 'border-pink-500/25',
  neutral: 'border-white/10',
  red: 'border-red-500/25',
}
const platformText: Record<string, string> = {
  sky: 'text-sky-400',
  pink: 'text-pink-400',
  neutral: 'text-gray-300',
  red: 'text-red-400',
}
const platformBg: Record<string, string> = {
  sky: 'bg-sky-500/8',
  pink: 'bg-pink-500/8',
  neutral: 'bg-white/4',
  red: 'bg-red-500/8',
}

// ─── Inner tab definition ─────────────────────────────────────────────────────

type InnerTab = 'rules' | 'frameworks' | 'science'

const INNER_TABS: { id: InnerTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'rules', label: 'Active Rules', Icon: Brain },
  { id: 'frameworks', label: 'Hook Frameworks', Icon: Zap },
  { id: 'science', label: 'Engagement Science', Icon: TrendingUp },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagChip({ tag }: { tag: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-bms-darker border border-bms-border text-bms-muted font-mono">
      {tag}
    </span>
  )
}

function EntryCard({ entry, onDelete }: { entry: KbEntry; onDelete: (id: string) => void }) {
  const isHard = entry.title.startsWith('HARD RULE')
  const isAI = entry.auto_learned

  const accent = isHard
    ? { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Hard Rule' }
    : isAI
    ? { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'AI Learned' }
    : { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Guideline' }

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${accent.bg} ${accent.border}`}
      style={{ opacity: 1, transform: 'translateY(0)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${accent.bg} ${accent.text} ${accent.border}`}>
              {accent.label}
            </span>
            {isAI && <Zap className="w-3 h-3 text-amber-400" />}
          </div>
          <span className="text-sm font-medium text-bms-text leading-snug">{entry.title}</span>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/15 transition-colors"
          title="Delete entry"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>

      <p className="text-xs text-bms-muted leading-relaxed">{entry.content}</p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((t) => <TagChip key={t} tag={t} />)}
        </div>
        <span className="text-[10px] text-bms-muted shrink-0">{timeAgo(entry.created_at)}</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MontageKnowledge({}: Props) {
  const [innerTab, setInnerTab] = useState<InnerTab>('rules')

  // Active Rules state
  const [entries, setEntries]       = useState<KbEntry[]>([])
  const [loading, setLoading]       = useState(false)
  const [seeding, setSeeding]       = useState(false)
  const [seeded, setSeeded]         = useState(false)
  const [addOpen, setAddOpen]       = useState(false)
  const [newTitle, setNewTitle]     = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags]       = useState('')
  const [saving, setSaving]         = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(KB_URL)
      if (!res.ok) return
      const data = await res.json() as { entries: KbEntry[] }
      setEntries(data.entries ?? [])
    } catch {
      // server may not be running
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
    const id = setInterval(fetchEntries, 30_000)
    return () => clearInterval(id)
  }, [fetchEntries])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${KB_URL}/${id}`, { method: 'DELETE' })
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {}
  }, [])

  const seedKb = useCallback(async () => {
    setSeeding(true)
    try {
      await Promise.all(
        SEED_ENTRIES.map((entry) =>
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
    } catch {}
    setSeeding(false)
  }, [fetchEntries])

  const handleAddEntry = useCallback(async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setSaving(true)
    try {
      const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch(KB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim(), tags }),
      })
      if (res.ok) {
        setNewTitle('')
        setNewContent('')
        setNewTags('')
        setAddOpen(false)
        await fetchEntries()
      }
    } catch {}
    setSaving(false)
  }, [newTitle, newContent, newTags, fetchEntries])

  const hardRules  = entries.filter((e) => e.title.startsWith('HARD RULE'))
  const guidelines = entries.filter((e) => !e.title.startsWith('HARD RULE'))

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Inner tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-bms-darker border border-bms-border w-full">
        {INNER_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setInnerTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
              innerTab === id
                ? 'bg-bms-card text-bms-text border border-bms-border shadow-sm'
                : 'text-bms-muted hover:text-bms-text'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Active Rules ── */}
      {innerTab === 'rules' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-bms-muted" />
              <span className="text-sm font-semibold text-bms-text">Knowledge Base</span>
              {entries.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-bms-darker border border-bms-border text-bms-muted">
                  {entries.length}
                </span>
              )}
            </div>
            <button
              onClick={fetchEntries}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-bms-muted hover:text-bms-text hover:bg-bms-darker transition-all border border-bms-border"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Entries */}
          {loading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-10 gap-2 text-bms-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading knowledge base…</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <Brain className="w-8 h-8 text-bms-muted" />
              <p className="text-sm text-bms-muted">No rules yet — seed the knowledge base below</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {hardRules.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400/70 px-0.5">Hard Rules</span>
                  {hardRules.map((e) => <EntryCard key={e.id} entry={e} onDelete={handleDelete} />)}
                </div>
              )}
              {guidelines.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/70 px-0.5">Guidelines</span>
                  {guidelines.map((e) => <EntryCard key={e.id} entry={e} onDelete={handleDelete} />)}
                </div>
              )}
            </div>
          )}

          {/* Seed button */}
          <button
            onClick={seedKb}
            disabled={seeding}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-bms-cyan/10 border border-bms-cyan/25 text-bms-cyan hover:bg-bms-cyan/15 transition-all disabled:opacity-50"
          >
            {seeding ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Seeding…</>
            ) : seeded ? (
              <><CheckCircle2 className="w-3.5 h-3.5" />Seeded ✓</>
            ) : (
              <><Zap className="w-3.5 h-3.5" />Seed Framework Knowledge</>
            )}
          </button>

          {/* Add Rule form */}
          <div className="rounded-xl border border-bms-border bg-bms-card overflow-hidden">
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-bms-text hover:bg-bms-darker transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-bms-cyan" />
                Add Rule
              </div>
              {addOpen ? <ChevronUp className="w-3.5 h-3.5 text-bms-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-bms-muted" />}
            </button>

            {addOpen && (
              <div className="flex flex-col gap-3 px-4 pb-4 border-t border-bms-border pt-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder='Title (start with "HARD RULE —" for hard rules)'
                  className="w-full bg-bms-darker border border-bms-border rounded-lg px-3 py-2 text-sm text-bms-text placeholder:text-bms-muted outline-none focus:border-bms-cyan/50 transition-colors"
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Rule content…"
                  rows={3}
                  className="w-full bg-bms-darker border border-bms-border rounded-lg px-3 py-2 text-sm text-bms-text placeholder:text-bms-muted outline-none focus:border-bms-cyan/50 transition-colors resize-none"
                />
                <input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="w-full bg-bms-darker border border-bms-border rounded-lg px-3 py-2 text-sm text-bms-text placeholder:text-bms-muted outline-none focus:border-bms-cyan/50 transition-colors"
                />
                <button
                  onClick={handleAddEntry}
                  disabled={saving || !newTitle.trim() || !newContent.trim()}
                  className="self-end flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-bms-purple/20 border border-bms-purple/30 text-purple-300 hover:bg-bms-purple/30 transition-all disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Rule
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: Hook Frameworks ── */}
      {innerTab === 'frameworks' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          {/* Hook techniques */}
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

          {/* Content Structure Timeline */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bms-text">Content Structure — 60s Timeline</span>
            <div className="rounded-xl border border-bms-border bg-bms-card p-4 flex flex-col gap-3">
              <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
                <div className="bg-bms-cyan/70 flex items-center justify-center text-[10px] font-bold text-bms-dark" style={{ width: '5%' }}>H</div>
                <div className="bg-purple-500/70 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '7%' }}>P</div>
                <div className="bg-indigo-500/70 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '63%' }}>Value</div>
                <div className="bg-amber-500/70 flex items-center justify-center text-[10px] font-bold text-bms-dark" style={{ width: '25%' }}>CTA</div>
              </div>
              <div className="flex justify-between text-[10px] text-bms-muted">
                <span>0s</span>
                <span>3s Hook</span>
                <span>7s Problem</span>
                <span>45s Value</span>
                <span>60s CTA</span>
              </div>
            </div>
          </div>

          {/* Content Formats */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bms-text">Content Formats</span>
            <div className="flex flex-wrap gap-2">
              {CONTENT_FORMATS.map((fmt) => (
                <span
                  key={fmt}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-bms-purple/25 bg-bms-purple/10 text-purple-300 font-mono"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Engagement Science ── */}
      {innerTab === 'science' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          {/* Platform cards */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-bms-cyan" />
              <span className="text-sm font-semibold text-bms-text">Platform Scoring Formulas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLATFORMS.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-xl border p-3 flex flex-col gap-2 ${platformBg[p.color]} ${platformBorder[p.color]}`}
                >
                  <span className={`text-xs font-bold ${platformText[p.color]}`}>{p.name}</span>
                  <code className="text-[10px] font-mono text-bms-muted bg-bms-darker border border-bms-border rounded-lg px-2 py-1.5 leading-relaxed block break-all">
                    {p.formula}
                  </code>
                  <p className="text-[11px] text-bms-muted leading-relaxed">{p.insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Outlier detection */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 flex flex-col gap-1">
            <span className="text-xs font-semibold text-amber-400">Outlier Detection</span>
            <code className="text-[10px] font-mono text-bms-muted">engagement_rate &gt; mean + (2.0 × std_dev)</code>
            <p className="text-[11px] text-bms-muted leading-relaxed">
              X-sourced emerging ideas have highest opportunity: appear before other platforms, bookmark signal predicts viral spread.
            </p>
          </div>

          {/* Video Assembly Principles */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bms-text">Video Assembly Principles</span>
            <div className="rounded-xl border border-bms-border bg-bms-card p-3">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-bms-border">
                  {[
                    ['Target length', '60 seconds (short-form social)'],
                    ['Background music', '15% volume (voice present), 40-60% (visual only)'],
                    ['Frame rate', '30 fps'],
                    ['Audio', 'AAC 192k'],
                    ['Format', '9:16 vertical (1080×1920) — TikTok / Reels / Shorts'],
                    ['Clip gap', '0.5s between clips for rhythm'],
                    ['Comment sorting', 'Score descending (upvotes = quality signal)'],
                  ].map(([label, value]) => (
                    <tr key={label}>
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
