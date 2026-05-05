'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film, CheckSquare, Square, ChevronRight, Folder, FolderSearch,
  RefreshCw, AlertTriangle,
} from 'lucide-react'

// Call the local montage server directly — Vercel cannot access the user's filesystem
const LOCAL_SCAN_API = 'http://localhost:3001/api/montage/local/scan'

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
  hasReferences: boolean
  rerunClipNames?: string[]
  onRerunDismiss?: () => void
}

function formatSize(b: number): string {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${b} B`
}

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

export default function MontageDropbox({
  selectedClips, onSelectedClipsChange, onStartProcessing,
  hasReferences, rerunClipNames, onRerunDismiss,
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

  return (
    <div className="flex flex-col gap-5">

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
            disabled={selectedClips.length === 0 || !hasReferences}
            title={!hasReferences ? 'Upload a reference video first' : ''}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-bms-cyan/15 text-bms-cyan border border-bms-cyan/30 hover:bg-bms-cyan/25"
          >
            Process Selected <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
