'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, ChevronDown, ChevronUp, Film, Zap, Loader2 } from 'lucide-react'

const REFS_KEY = 'montage-references-v1'

interface Reference {
  id: string
  filename: string
  file_path: string
  analysis_json: string
  created_at: number
}

interface StoredReference extends Reference {}

interface AnalysisData {
  pacing?: string
  energyLevel?: string
  colorTone?: string
  musicMood?: string
  bpmRange?: string
  contentNiche?: string
  [key: string]: unknown
}

interface Props {
  references: Reference[]
  onReferencesChanged: () => void
}

const ANALYSIS_CHIP_KEYS: (keyof AnalysisData)[] = [
  'pacing', 'energyLevel', 'colorTone', 'musicMood', 'bpmRange', 'contentNiche',
]

const CHIP_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  pacing:       { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/25' },
  energyLevel:  { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/25'    },
  colorTone:    { bg: 'bg-bms-cyan/10',    text: 'text-bms-cyan',    border: 'border-bms-cyan/25'   },
  musicMood:    { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/25' },
  bpmRange:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25'},
  contentNiche: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/25'  },
}

function parseAnalysis(json: string): AnalysisData {
  try { return JSON.parse(json) as AnalysisData } catch { return {} }
}

function loadRefs(): StoredReference[] {
  try { return JSON.parse(localStorage.getItem(REFS_KEY) ?? '[]') as StoredReference[] } catch { return [] }
}

function saveRefs(refs: StoredReference[]) {
  try { localStorage.setItem(REFS_KEY, JSON.stringify(refs)) } catch {}
}

async function extractFrames(file: File, count = 4): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.preload = 'metadata'

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')!
      const frames: string[] = []
      let captured = 0

      const times = Array.from({ length: count }, (_, i) =>
        Math.min((duration / (count + 1)) * (i + 1), duration - 0.1)
      )

      const captureAt = (time: number) => { video.currentTime = time }

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, 640, 360)
        frames.push(canvas.toDataURL('image/jpeg', 0.7))
        captured++
        if (captured < times.length) {
          captureAt(times[captured])
        } else {
          URL.revokeObjectURL(url)
          resolve(frames)
        }
      }, { once: false })

      setTimeout(() => captureAt(times[0]), 100)
    })

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve([])
    })
  })
}

async function analyseFrames(frames: string[]): Promise<AnalysisData> {
  if (frames.length === 0) return {}
  try {
    const res = await fetch('/api/describe-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames, structured: true }),
    })
    if (!res.ok) return {}
    const { description } = (await res.json()) as { description: string }
    const lower = description.toLowerCase()
    const pacing       = lower.includes('fast') ? 'Fast' : lower.includes('slow') ? 'Slow' : 'Medium'
    const energyLevel  = lower.includes('high energy') || lower.includes('hype') ? 'High' :
                         lower.includes('chill') || lower.includes('calm') ? 'Low' : 'Medium'
    const colorTone    = lower.includes('warm') ? 'Warm' : lower.includes('cool') ? 'Cool' :
                         lower.includes('dark') ? 'Dark' : 'Neutral'
    const musicMood    = lower.includes('upbeat') || lower.includes('energetic') ? 'Upbeat' :
                         lower.includes('emotional') ? 'Emotional' :
                         lower.includes('chill') ? 'Chill' : 'Neutral'
    const contentNiche = lower.includes('music') ? 'Music' : lower.includes('fitness') ? 'Fitness' :
                         lower.includes('fashion') ? 'Fashion' : lower.includes('food') ? 'Food' :
                         lower.includes('comedy') ? 'Comedy' : 'Lifestyle'
    return { pacing, energyLevel, colorTone, musicMood, bpmRange: '100-140 BPM', contentNiche, description }
  } catch {
    return {}
  }
}

const blobStore: Map<string, string> = new Map()

export default function MontageReference({ references: _externalRefs, onReferencesChanged }: Props) {
  const [refs, setRefs]                     = useState<StoredReference[]>([])
  const [dragOver, setDragOver]             = useState(false)
  const [uploading, setUploading]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [expandedId, setExpandedId]         = useState<string | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const [, forceUpdate]                     = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setRefs(loadRefs()) }, [])

  useEffect(() => {
    onReferencesChanged()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs])

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file (MP4, MOV, AVI)')
      return
    }
    setUploading(true)
    setUploadProgress(10)
    setError(null)

    try {
      const objectUrl = URL.createObjectURL(file)
      setUploadProgress(20)

      const frames = await extractFrames(file, 4)
      setUploadProgress(50)

      const analysis = await analyseFrames(frames)
      setUploadProgress(90)

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
      blobStore.set(id, objectUrl)

      const newRef: StoredReference = {
        id,
        filename: file.name,
        file_path: '',
        analysis_json: JSON.stringify(analysis),
        created_at: Math.floor(Date.now() / 1000),
      }

      setRefs(prev => {
        const updated = [newRef, ...prev]
        saveRefs(updated)
        return updated
      })

      setUploadProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process video')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'))
    if (files.length > 0) processFile(files[0])
  }, [processFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [processFile])

  const handleDelete = useCallback((id: string) => {
    const url = blobStore.get(id)
    if (url) { URL.revokeObjectURL(url); blobStore.delete(id) }
    setRefs(prev => {
      const updated = prev.filter(r => r.id !== id)
      saveRefs(updated)
      return updated
    })
    forceUpdate(n => n + 1)
  }, [])

  return (
    <div className="flex flex-col gap-5">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[11px] text-bms-muted bg-indigo-500/6 border border-indigo-500/15">
        <Zap className="w-3 h-3 shrink-0 mt-0.5 text-indigo-400" />
        <span>Upload reference videos — Claude will analyse the style, pacing, and energy so the AI can match it when building your montage. Videos are stored in your browser.</span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center py-10 rounded-2xl cursor-pointer transition-all border-2 ${
          dragOver
            ? 'border-indigo-400 bg-indigo-500/6'
            : 'border-dashed border-indigo-500/30 bg-indigo-500/2 hover:border-indigo-500/50'
        }`}
      >
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-indigo-500/10 border border-indigo-500/20">
          {uploading
            ? <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            : <Upload className="w-6 h-6 text-indigo-400" />
          }
        </div>
        <p className="text-sm font-medium text-bms-text mb-1">
          {uploading ? `Analysing… ${uploadProgress}%` : 'Drag reference videos here or click to upload'}
        </p>
        <p className="text-xs text-bms-muted">MP4, MOV, AVI · Claude analyses style automatically</p>

        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden bg-bms-border"
            >
              <motion.div
                className="h-full rounded-b-2xl bg-gradient-to-r from-indigo-500 to-indigo-400"
                style={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 font-mono">{error}</p>
      )}

      {/* References Grid */}
      {refs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Film className="w-9 h-9 text-bms-muted mb-3" />
          <p className="text-sm text-bms-muted mb-1">No reference videos yet</p>
          <p className="text-xs text-bms-muted">Upload a reference to teach the AI your preferred style</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {refs.map((ref) => {
            const analysis  = parseAnalysis(ref.analysis_json)
            const expanded  = expandedId === ref.id
            const objectUrl = blobStore.get(ref.id)

            return (
              <motion.div
                key={ref.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl overflow-hidden bg-bms-card border border-bms-border"
              >
                {/* Video thumbnail / placeholder */}
                <div className="relative w-full bg-bms-darker" style={{ aspectRatio: '16/9' }}>
                  {objectUrl ? (
                    <video
                      src={objectUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 1 }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-bms-muted">
                      <Film className="w-7 h-7" />
                      <span className="text-[11px]">Re-upload to preview</span>
                    </div>
                  )}
                  {objectUrl && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500/90">
                        <svg width="14" height="16" viewBox="0 0 14 16" fill="white"><path d="M1 1L13 8L1 15V1Z" /></svg>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-bms-text truncate">{ref.filename}</span>
                      <span className="text-[11px] text-bms-muted">{new Date(ref.created_at * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setExpandedId(expanded ? null : ref.id)}
                        className="p-1.5 rounded-lg hover:bg-bms-darker transition-colors"
                        title="Toggle analysis"
                      >
                        {expanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-bms-muted" />
                          : <ChevronDown className="w-3.5 h-3.5 text-bms-muted" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(ref.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete reference"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ANALYSIS_CHIP_KEYS.map((key) => {
                      const val = analysis[key]
                      if (!val || typeof val !== 'string') return null
                      const cls = CHIP_CLASSES[key as string] ?? CHIP_CLASSES.pacing
                      return (
                        <span
                          key={key}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border ${cls.bg} ${cls.text} ${cls.border}`}
                        >
                          <Zap className="w-2 h-2" />{val}
                        </span>
                      )
                    })}
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 p-3 rounded-xl text-xs font-mono text-bms-muted bg-bms-darker border border-bms-border">
                          {Object.entries(analysis).filter(([k]) => k !== 'description').map(([k, v]) => (
                            <div key={k} className="flex gap-2 py-0.5">
                              <span className="text-bms-muted/60 shrink-0">{k}:</span>
                              <span className="text-bms-muted break-all">{String(v)}</span>
                            </div>
                          ))}
                          {analysis.description != null && (
                            <div className="mt-2 pt-2 border-t border-bms-border text-bms-muted/70 leading-relaxed">
                              {String(analysis.description as string)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
