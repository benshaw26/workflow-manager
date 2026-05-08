'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film, CheckSquare, Square, ChevronRight, Folder, FolderSearch,
  RefreshCw, AlertTriangle, Home, Building2, Heart,
} from 'lucide-react'

// Call the local montage server directly — Vercel cannot access the user's filesystem
const LOCAL_SCAN_API = 'http://localhost:3001/api/montage/local/scan'

// ── Genre types ────────────────────────────────────────────────────────────────

export type Genre = 'property' | 'business' | 'care-homes'

export interface PropertyContext {
  genre: 'property'
  address: string
  propertyType: string
  listingPrice: string
  keyFeatures: string
  targetPlatform: string
}

export interface BusinessContext {
  genre: 'business'
  businessName: string
  industry: string
  targetAudience: string
  keyMessage: string
  tone: string
}

export interface CareHomesContext {
  genre: 'care-homes'
  facilityName: string
  careType: string
  keyHighlights: string
  tone: string
}

export type GenreContext = PropertyContext | BusinessContext | CareHomesContext

export function defaultGenreContext(genre: Genre): GenreContext {
  if (genre === 'property') return { genre: 'property', address: '', propertyType: 'House', listingPrice: '', keyFeatures: '', targetPlatform: 'Instagram Reel' }
  if (genre === 'business') return { genre: 'business', businessName: '', industry: '', targetAudience: '', keyMessage: '', tone: 'Professional' }
  return { genre: 'care-homes', facilityName: '', careType: 'Residential', keyHighlights: '', tone: 'Warm & Reassuring' }
}

// ── Clip types ─────────────────────────────────────────────────────────────────

interface Clip {
  name: string
  path: string
  size: number
  duration?: number
  width?: number
  height?: number
}

interface Props {
  selectedClips: string[]
  onSelectedClipsChange: (paths: string[]) => void
  onStartProcessing: (paths: string[]) => void
  rerunClipNames?: string[]
  onRerunDismiss?: () => void
  genreContext: GenreContext
  onGenreContextChange: (ctx: GenreContext) => void
}

function formatSize(b: number): string {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${b} B`
}

// ── Genre tab bar ──────────────────────────────────────────────────────────────

const GENRE_TABS: { id: Genre; label: string; Icon: React.ElementType }[] = [
  { id: 'property',   label: 'Property',   Icon: Home      },
  { id: 'business',   label: 'Business',   Icon: Building2 },
  { id: 'care-homes', label: 'Care Homes', Icon: Heart     },
]

function GenreTabs({ active, onChange }: { active: Genre; onChange: (g: Genre) => void }) {
  return (
    <div className="flex items-center gap-1">
      {GENRE_TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              isActive
                ? 'bg-bms-cyan/10 border-bms-cyan/30 text-bms-cyan'
                : 'bg-bms-darker border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-border/80'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {isActive && (
              <motion.div
                layoutId="genre-tab-underline"
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-bms-cyan"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Shared field helpers ───────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-bms-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'flex-1 bg-transparent text-[12px] text-bms-text focus:outline-none placeholder:text-bms-muted'
const wrapCls  = 'flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bms-darker border border-bms-border'
const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-bms-darker border border-bms-border text-[12px] text-bms-text focus:outline-none appearance-none'
const textareaCls = 'w-full px-3 py-2.5 rounded-xl bg-bms-darker border border-bms-border text-[12px] text-bms-text focus:outline-none placeholder:text-bms-muted resize-none'

// ── Genre-specific field panels ───────────────────────────────────────────────

function PropertyFields({ ctx, onChange }: { ctx: PropertyContext; onChange: (c: PropertyContext) => void }) {
  const set = <K extends keyof PropertyContext>(k: K, v: PropertyContext[K]) => onChange({ ...ctx, [k]: v })
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Property Address">
        <div className={wrapCls}>
          <input value={ctx.address} onChange={e => set('address', e.target.value)} placeholder="14 Maple Street, Manchester" className={inputCls} />
        </div>
      </Field>
      <Field label="Property Type">
        <select value={ctx.propertyType} onChange={e => set('propertyType', e.target.value)} className={selectCls}>
          {['House', 'Apartment', 'Commercial', 'Land', 'Other'].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Listing Price (optional)">
        <div className={wrapCls}>
          <input value={ctx.listingPrice} onChange={e => set('listingPrice', e.target.value)} placeholder="£350,000" className={inputCls} />
        </div>
      </Field>
      <Field label="Target Platform">
        <select value={ctx.targetPlatform} onChange={e => set('targetPlatform', e.target.value)} className={selectCls}>
          {['Instagram Reel', 'TikTok', 'YouTube Short'].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Key Features">
        <textarea value={ctx.keyFeatures} onChange={e => set('keyFeatures', e.target.value)} placeholder="3 bed, large garden, modern kitchen, off-road parking…" rows={3} className={textareaCls} />
      </Field>
    </div>
  )
}

function BusinessFields({ ctx, onChange }: { ctx: BusinessContext; onChange: (c: BusinessContext) => void }) {
  const set = <K extends keyof BusinessContext>(k: K, v: BusinessContext[K]) => onChange({ ...ctx, [k]: v })
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Business Name">
        <div className={wrapCls}>
          <input value={ctx.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Acme Services Ltd" className={inputCls} />
        </div>
      </Field>
      <Field label="Industry / Sector">
        <div className={wrapCls}>
          <input value={ctx.industry} onChange={e => set('industry', e.target.value)} placeholder="Construction, Hospitality…" className={inputCls} />
        </div>
      </Field>
      <Field label="Target Audience">
        <div className={wrapCls}>
          <input value={ctx.targetAudience} onChange={e => set('targetAudience', e.target.value)} placeholder="Local families, 30–50 age range" className={inputCls} />
        </div>
      </Field>
      <Field label="Tone">
        <select value={ctx.tone} onChange={e => set('tone', e.target.value)} className={selectCls}>
          {['Professional', 'Dynamic & Energetic', 'Friendly & Approachable'].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Key Message">
        <textarea value={ctx.keyMessage} onChange={e => set('keyMessage', e.target.value)} placeholder="Trusted local service since 2005, specialising in…" rows={3} className={textareaCls} />
      </Field>
    </div>
  )
}

function CareHomesFields({ ctx, onChange }: { ctx: CareHomesContext; onChange: (c: CareHomesContext) => void }) {
  const set = <K extends keyof CareHomesContext>(k: K, v: CareHomesContext[K]) => onChange({ ...ctx, [k]: v })
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Facility Name">
        <div className={wrapCls}>
          <input value={ctx.facilityName} onChange={e => set('facilityName', e.target.value)} placeholder="Sunrise Care Home" className={inputCls} />
        </div>
      </Field>
      <Field label="Care Type">
        <select value={ctx.careType} onChange={e => set('careType', e.target.value)} className={selectCls}>
          {['Residential', 'Dementia Care', 'Nursing', 'Supported Living', 'Day Care'].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Tone">
        <select value={ctx.tone} onChange={e => set('tone', e.target.value)} className={selectCls}>
          {['Warm & Reassuring', 'Professional', 'Family-Focused'].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Key Highlights">
        <textarea value={ctx.keyHighlights} onChange={e => set('keyHighlights', e.target.value)} placeholder="Award-winning staff, beautiful gardens, activities programme…" rows={3} className={textareaCls} />
      </Field>
    </div>
  )
}

// ── Clip grid ──────────────────────────────────────────────────────────────────

function ClipGrid({ clips, selectedClips, onToggle, onSelectAll }: {
  clips: Clip[]
  selectedClips: string[]
  onToggle: (p: string) => void
  onSelectAll: () => void
}) {
  if (clips.length === 0) return null
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-bms-muted">
          {clips.length} clip{clips.length !== 1 ? 's' : ''} · {selectedClips.length} selected
        </span>
        <button
          onClick={onSelectAll}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-bms-darker text-bms-cyan"
        >
          {selectedClips.length === clips.length ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          {selectedClips.length === clips.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {clips.map((clip, i) => {
            const selected = selectedClips.includes(clip.path)
            return (
              <motion.button
                key={clip.path}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
                onClick={() => onToggle(clip.path)}
                className={`relative flex flex-col rounded-xl overflow-hidden text-left transition-all border ${
                  selected
                    ? 'bg-bms-cyan/8 border-bms-cyan/60'
                    : 'bg-bms-darker border-bms-border hover:border-bms-border/80'
                }`}
              >
                <div className="w-full flex items-center justify-center bg-bms-darker" style={{ aspectRatio: '16/9' }}>
                  <Film className="w-5 h-5 text-bms-border" />
                </div>
                <div className={`absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center border ${
                  selected ? 'bg-bms-cyan border-transparent' : 'bg-black/50 border-white/30'
                }`}>
                  {selected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="p-2.5 flex flex-col gap-1">
                  <span className="text-xs font-medium text-bms-text truncate">{clip.name}</span>
                  <span className="text-[10px] font-mono text-bms-muted">{formatSize(clip.size)}</span>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MontageDropbox({
  selectedClips, onSelectedClipsChange, onStartProcessing,
  rerunClipNames, onRerunDismiss,
  genreContext, onGenreContextChange,
}: Props) {
  const [localPath, setLocalPath] = useState('C:\\Users\\')
  const [clips, setClips]         = useState<Clip[]>([])
  const [scanning, setScanning]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const rerunApplied              = useRef(false)

  useEffect(() => {
    if (!rerunClipNames?.length || !clips.length || rerunApplied.current) return
    const matching = clips.filter(c => rerunClipNames.includes(c.name)).map(c => c.path)
    if (matching.length > 0) { onSelectedClipsChange(matching); rerunApplied.current = true }
  }, [clips, rerunClipNames, onSelectedClipsChange])

  useEffect(() => { rerunApplied.current = false }, [rerunClipNames])

  const handleScan = useCallback(async () => {
    if (!localPath.trim()) return
    setScanning(true)
    setError(null)
    setClips([])
    onSelectedClipsChange([])
    try {
      const res = await fetch(LOCAL_SCAN_API + '?folder=' + encodeURIComponent(localPath.trim()))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scan failed')
      setClips(data.files ?? [])
      if ((data.files ?? []).length === 0) setError('No video files found in that folder.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan folder')
    } finally {
      setScanning(false)
    }
  }, [localPath, onSelectedClipsChange])

  const handleToggle = useCallback((path: string) => {
    onSelectedClipsChange(
      selectedClips.includes(path) ? selectedClips.filter(p => p !== path) : [...selectedClips, path]
    )
  }, [selectedClips, onSelectedClipsChange])

  const handleSelectAll = useCallback(() => {
    onSelectedClipsChange(selectedClips.length === clips.length ? [] : clips.map(c => c.path))
  }, [clips, selectedClips, onSelectedClipsChange])

  const handleGenreChange = useCallback((genre: Genre) => {
    onGenreContextChange(defaultGenreContext(genre))
  }, [onGenreContextChange])

  return (
    <div className="flex flex-col gap-6">

      {/* Genre selector */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-bms-muted uppercase tracking-wider">Video Genre</label>
        <GenreTabs active={genreContext.genre} onChange={handleGenreChange} />
      </div>

      {/* Genre-specific fields */}
      <AnimatePresence mode="wait">
        <motion.div
          key={genreContext.genre}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="p-4 rounded-xl bg-bms-darker border border-bms-border"
        >
          {genreContext.genre === 'property' && (
            <PropertyFields ctx={genreContext} onChange={onGenreContextChange} />
          )}
          {genreContext.genre === 'business' && (
            <BusinessFields ctx={genreContext} onChange={onGenreContextChange} />
          )}
          {genreContext.genre === 'care-homes' && (
            <CareHomesFields ctx={genreContext} onChange={onGenreContextChange} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Divider */}
      <div className="border-t border-bms-border" />

      {/* Folder path input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-bms-muted uppercase tracking-wider">Raw Footage Folder</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bms-darker border border-bms-border">
            <Folder className="w-3.5 h-3.5 text-bms-muted shrink-0" />
            <input
              value={localPath}
              onChange={e => setLocalPath(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleScan() }}
              placeholder="C:\Users\YourName\Videos\raw-footage"
              className="flex-1 bg-transparent text-[12px] text-bms-text font-mono focus:outline-none placeholder:text-bms-muted"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !localPath.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 bg-bms-cyan/15 text-bms-cyan border border-bms-cyan/30 hover:bg-bms-cyan/25"
          >
            {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderSearch className="w-3.5 h-3.5" />}
            {scanning ? 'Scanning…' : 'Scan'}
          </button>
        </div>
        <p className="text-[11px] text-bms-muted">Enter the full Windows path to your footage folder and click Scan.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-[12px] bg-red-500/8 border border-red-500/20 text-red-400">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Rerun banner */}
      {rerunClipNames && rerunClipNames.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[11px] bg-amber-400/6 border border-amber-400/20 text-amber-400">
          <span>Re-run: looking for {rerunClipNames.length} clip{rerunClipNames.length !== 1 ? 's' : ''} from previous session</span>
          <button onClick={onRerunDismiss} className="text-bms-muted hover:text-bms-text text-[10px]">Dismiss</button>
        </div>
      )}

      {/* Clip grid */}
      {clips.length > 0 ? (
        <ClipGrid clips={clips} selectedClips={selectedClips} onToggle={handleToggle} onSelectAll={handleSelectAll} />
      ) : !scanning && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Film className="w-9 h-9 text-bms-muted mb-3" />
          <p className="text-sm text-bms-muted mb-1">No clips loaded</p>
          <p className="text-xs text-bms-muted">Enter your footage folder path above and click Scan</p>
        </div>
      )}

      {/* Process button */}
      {clips.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-bms-border">
          <span className="text-xs text-bms-muted">{selectedClips.length} clip{selectedClips.length !== 1 ? 's' : ''} selected</span>
          <button
            onClick={() => onStartProcessing(selectedClips)}
            disabled={selectedClips.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-bms-cyan/15 text-bms-cyan border border-bms-cyan/30 hover:bg-bms-cyan/25"
          >
            Process Selected <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
