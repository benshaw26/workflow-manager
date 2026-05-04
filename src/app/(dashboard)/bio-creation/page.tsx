'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, CheckCircle2, Clock, AlertCircle, Copy, Check,
  ChevronRight, Play, RefreshCw, UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type VideoStatus = 'pending' | 'generating' | 'done' | 'error'

interface VideoEntry {
  id: string
  name: string
  objectUrl: string
  thumbnailBase64: string | null
  thumbnailUrl: string | null
  status: VideoStatus
  mainCaption: string
  firstComment: string
  error: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractThumbnail(file: File): Promise<{ base64: string; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = objectUrl
    video.currentTime = 3

    const capture = () => {
      const canvas = document.createElement('canvas')
      const w = video.videoWidth || 640
      const h = video.videoHeight || 360
      // Downscale to keep payload small
      const scale = Math.min(1, 640 / w)
      canvas.width  = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('canvas'))
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      const base64  = dataUrl.split(',')[1]
      resolve({ base64, objectUrl })
    }

    video.onseeked       = capture
    video.onloadeddata   = () => { if (video.currentTime >= 3) capture() }
    video.onerror        = () => resolve({ base64: '', objectUrl }) // allow no-thumb
    video.onloadedmetadata = () => {
      if (video.duration < 3) { video.currentTime = 0 } else { video.currentTime = 3 }
    }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VideoStatus }) {
  const map = {
    pending:    { label: 'Pending',    icon: Clock,         cls: 'text-bms-muted bg-bms-darker border-bms-border' },
    generating: { label: 'Generating', icon: RefreshCw,     cls: 'text-bms-cyan  bg-bms-cyan/10 border-bms-cyan/30' },
    done:       { label: 'Done',       icon: CheckCircle2,  cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    error:      { label: 'Error',      icon: AlertCircle,   cls: 'text-red-400   bg-red-400/10  border-red-400/20' },
  }
  const { label, icon: Icon, cls } = map[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium', cls)}>
      <Icon className={cn('w-3 h-3', status === 'generating' && 'animate-spin')} />
      {label}
    </span>
  )
}

function InstagramBio({ mainCaption, firstComment }: { mainCaption: string; firstComment: string }) {
  const [copiedMain, setCopiedMain]    = useState(false)
  const [copiedComment, setCopiedComment] = useState(false)

  const copy = async (text: string, which: 'main' | 'comment') => {
    await navigator.clipboard.writeText(text)
    if (which === 'main') { setCopiedMain(true);    setTimeout(() => setCopiedMain(false),    2000) }
    else                  { setCopiedComment(true); setTimeout(() => setCopiedComment(false), 2000) }
  }

  return (
    <div className="space-y-3">
      {/* Main caption */}
      <div className="bg-bms-darker border border-bms-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-bms-border">
          <span className="text-[11px] font-semibold text-bms-muted uppercase tracking-wide">Caption</span>
          <button
            onClick={() => copy(mainCaption, 'main')}
            className="flex items-center gap-1 text-[11px] text-bms-muted hover:text-bms-cyan transition-colors"
          >
            {copiedMain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copiedMain ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 text-sm text-bms-text whitespace-pre-wrap font-sans leading-relaxed">
          {mainCaption}
        </pre>
      </div>

      {/* First comment */}
      {firstComment && (
        <div className="bg-bms-darker border border-bms-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-bms-border">
            <span className="text-[11px] font-semibold text-bms-muted uppercase tracking-wide">First Comment (hashtags)</span>
            <button
              onClick={() => copy(firstComment, 'comment')}
              className="flex items-center gap-1 text-[11px] text-bms-muted hover:text-bms-cyan transition-colors"
            >
              {copiedComment ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedComment ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-sm text-bms-muted whitespace-pre-wrap font-sans leading-relaxed">
            {firstComment}
          </pre>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BioCreationPage() {
  const [tab, setTab]           = useState<'import' | 'results'>('import')
  const [artistName, setArtistName] = useState('')
  const [videos, setVideos]     = useState<VideoEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [bioContext, setBioContext] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedVideo = videos.find((v) => v.id === selectedId) ?? null

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) return

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const entry: VideoEntry = {
      id, name: file.name, objectUrl: '', thumbnailBase64: null,
      thumbnailUrl: null, status: 'pending',
      mainCaption: '', firstComment: '', error: '',
    }
    setVideos((prev) => [...prev, entry])

    try {
      const { base64, objectUrl } = await extractThumbnail(file)
      const thumbnailUrl = base64 ? `data:image/jpeg;base64,${base64}` : null
      setVideos((prev) =>
        prev.map((v) => v.id === id ? { ...v, objectUrl, thumbnailBase64: base64 || null, thumbnailUrl } : v)
      )
    } catch {
      // Continue without thumbnail
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    Array.from(e.dataTransfer.files).forEach(handleFile)
  }, [handleFile])

  // ── Generate bio ────────────────────────────────────────────────────────────
  const generate = async (videoId: string) => {
    const video = videos.find((v) => v.id === videoId)
    if (!video || video.status === 'generating') return
    if (!artistName.trim()) { alert('Please enter an artist name first.'); return }

    setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, status: 'generating', error: '' } : v))

    try {
      const res = await fetch('/api/automations/bio-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: artistName.trim(),
          bioContext:  bioContext.trim() || undefined,
          videoName:   video.name,
          thumbnailBase64: video.thumbnailBase64 ?? undefined,
        }),
      })

      const data = await res.json() as { mainCaption?: string; firstComment?: string; error?: string }

      if (!res.ok || data.error) {
        setVideos((prev) => prev.map((v) => v.id === videoId
          ? { ...v, status: 'error', error: data.error ?? 'Unknown error' } : v))
        return
      }

      setVideos((prev) => prev.map((v) => v.id === videoId
        ? { ...v, status: 'done', mainCaption: data.mainCaption ?? '', firstComment: data.firstComment ?? '' }
        : v))
      setSelectedId(videoId)
      setTab('results')
    } catch {
      setVideos((prev) => prev.map((v) => v.id === videoId
        ? { ...v, status: 'error', error: 'Network error. Please try again.' } : v))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl space-y-6">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bms-cyan/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-bms-cyan" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-bms-text">Bio Creation</h2>
            <p className="text-bms-muted text-xs">AI-crafted Instagram captions from your videos</p>
          </div>
        </div>

        {/* Import / Results toggle */}
        <div className="flex items-center gap-1 bg-bms-darker border border-bms-border rounded-lg p-1">
          {(['import', 'results'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize',
                tab === t
                  ? 'bg-bms-cyan text-bms-dark font-semibold shadow'
                  : 'text-bms-muted hover:text-bms-text'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── IMPORT TAB ─────────────────────────────────────────────────────── */}
        {tab === 'import' && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Top row: Upload + Artist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Upload box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200',
                  dragging
                    ? 'border-bms-cyan bg-bms-cyan/5'
                    : 'border-bms-border bg-bms-card hover:border-bms-cyan/50 hover:bg-bms-card/80'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-bms-cyan/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-bms-cyan" />
                </div>
                <div className="text-center">
                  <p className="text-bms-text font-medium text-sm">Drop a video here</p>
                  <p className="text-bms-muted text-xs mt-0.5">or click to browse — one at a time</p>
                </div>
                <p className="text-bms-muted text-[11px]">MP4 · MOV · AVI · MKV · WebM</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
                />
              </div>

              {/* Artist name */}
              <div className="bg-bms-card border border-bms-border rounded-xl p-6 flex flex-col justify-center gap-4">
                <div>
                  <label className="block text-xs font-semibold text-bms-muted uppercase tracking-wide mb-2">
                    Artist Name
                  </label>
                  <input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="e.g. Zayn, Central Cee, Stormzy…"
                    className="w-full bg-bms-darker border border-bms-border rounded-lg px-4 py-2.5 text-sm text-bms-text placeholder:text-bms-muted/60 focus:outline-none focus:border-bms-cyan transition-colors"
                  />
                  <p className="text-bms-muted text-[11px] mt-1.5">
                    Used across all videos in this session
                  </p>
                </div>
              </div>
            </div>

            {/* Video list */}
            {videos.length > 0 && (
              <div className="bg-bms-card border border-bms-border rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-bms-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-bms-text">{videos.length} video{videos.length !== 1 ? 's' : ''} imported</span>
                  <span className="text-xs text-bms-muted">{videos.filter((v) => v.status === 'done').length} bios generated</span>
                </div>

                <div className="divide-y divide-bms-border">
                  {videos.map((video) => (
                    <div key={video.id} className="flex items-center gap-4 px-5 py-4 hover:bg-bms-darker/40 transition-colors">
                      {/* Thumbnail */}
                      <div className="w-16 h-10 rounded-lg bg-bms-darker border border-bms-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {video.thumbnailUrl
                          ? <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          : <Play className="w-4 h-4 text-bms-muted" />
                        }
                      </div>

                      {/* Name + status */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-bms-text truncate">{video.name}</p>
                        {video.error && <p className="text-xs text-red-400 mt-0.5">{video.error}</p>}
                      </div>

                      <StatusBadge status={video.status} />

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {video.status === 'done' && (
                          <button
                            onClick={() => { setSelectedId(video.id); setTab('results') }}
                            className="flex items-center gap-1 text-xs text-bms-cyan hover:text-bms-cyan/80 transition-colors"
                          >
                            View <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => generate(video.id)}
                          disabled={video.status === 'generating'}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            video.status === 'generating'
                              ? 'bg-bms-darker text-bms-muted cursor-not-allowed'
                              : video.status === 'done'
                              ? 'bg-bms-darker border border-bms-border text-bms-muted hover:text-bms-cyan hover:border-bms-cyan/40'
                              : 'bg-bms-cyan text-bms-dark hover:bg-bms-cyan/90'
                          )}
                        >
                          {video.status === 'generating' ? 'Generating…'
                           : video.status === 'done' ? 'Regenerate'
                           : 'Generate Bio'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videos.length === 0 && (
              <div className="bg-bms-card border border-bms-border rounded-xl p-10 text-center">
                <Play className="w-8 h-8 text-bms-muted mx-auto mb-3 opacity-40" />
                <p className="text-bms-muted text-sm">No videos imported yet — upload one above to get started</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── RESULTS TAB ────────────────────────────────────────────────────── */}
        {tab === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {videos.filter((v) => v.status === 'done').length === 0 ? (
              <div className="bg-bms-card border border-bms-border rounded-xl p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-bms-muted mx-auto mb-3 opacity-30" />
                <p className="text-bms-text font-medium mb-1">No bios generated yet</p>
                <p className="text-bms-muted text-sm">Switch to Import, upload a video, and click Generate Bio.</p>
                <button onClick={() => setTab('import')} className="mt-4 px-4 py-2 bg-bms-cyan text-bms-dark text-sm font-semibold rounded-lg hover:bg-bms-cyan/90 transition-colors">
                  Go to Import
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Sidebar: video list */}
                <div className="bg-bms-card border border-bms-border rounded-xl overflow-hidden h-fit">
                  <div className="px-4 py-3 border-b border-bms-border">
                    <p className="text-xs font-semibold text-bms-muted uppercase tracking-wide">Videos</p>
                  </div>
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => video.status === 'done' && setSelectedId(video.id)}
                      disabled={video.status !== 'done'}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 border-b border-bms-border last:border-b-0 text-left transition-colors',
                        selectedId === video.id ? 'bg-bms-cyan/10 border-l-2 border-l-bms-cyan' : 'hover:bg-bms-darker/40',
                        video.status !== 'done' && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <div className="w-10 h-7 rounded bg-bms-darker border border-bms-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {video.thumbnailUrl
                          ? <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          : <Play className="w-3 h-3 text-bms-muted" />
                        }
                      </div>
                      <p className="text-xs text-bms-text truncate flex-1">{video.name}</p>
                      <StatusBadge status={video.status} />
                    </button>
                  ))}
                </div>

                {/* Main: video preview + bio */}
                <div className="lg:col-span-3 space-y-5">
                  {selectedVideo ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Video preview */}
                        <div className="bg-bms-card border border-bms-border rounded-xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-bms-border">
                            <p className="text-xs font-semibold text-bms-muted uppercase tracking-wide">Video Preview</p>
                          </div>
                          <div className="p-4">
                            {selectedVideo.objectUrl ? (
                              <video
                                src={selectedVideo.objectUrl}
                                controls
                                className="w-full rounded-lg aspect-video bg-bms-darker"
                              />
                            ) : (
                              <div className="w-full aspect-video bg-bms-darker rounded-lg flex items-center justify-center">
                                <Play className="w-8 h-8 text-bms-muted opacity-40" />
                              </div>
                            )}
                            <p className="text-bms-muted text-xs mt-2 truncate">{selectedVideo.name}</p>
                          </div>
                        </div>

                        {/* Bio context */}
                        <div className="bg-bms-card border border-bms-border rounded-xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-bms-border">
                            <p className="text-xs font-semibold text-bms-muted uppercase tracking-wide">Bio Context</p>
                          </div>
                          <div className="p-4 space-y-3">
                            <p className="text-bms-muted text-xs">
                              Describe what this post is about — give the AI direction for the caption.
                            </p>
                            <textarea
                              value={bioContext}
                              onChange={(e) => setBioContext(e.target.value)}
                              placeholder="e.g. Announcing Zayn's arrival 2026, new single drop, behind the scenes at Glastonbury…"
                              rows={4}
                              className="w-full bg-bms-darker border border-bms-border rounded-lg px-3 py-2.5 text-sm text-bms-text placeholder:text-bms-muted/60 focus:outline-none focus:border-bms-cyan transition-colors resize-none"
                            />
                            <button
                              onClick={() => generate(selectedVideo.id)}
                              disabled={selectedVideo.status === 'generating'}
                              className={cn(
                                'w-full py-2.5 rounded-lg text-sm font-semibold transition-all',
                                selectedVideo.status === 'generating'
                                  ? 'bg-bms-darker text-bms-muted cursor-not-allowed'
                                  : 'bg-bms-cyan text-bms-dark hover:bg-bms-cyan/90'
                              )}
                            >
                              {selectedVideo.status === 'generating' ? (
                                <span className="flex items-center justify-center gap-2">
                                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating…
                                </span>
                              ) : 'Regenerate Bio'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Generated bio */}
                      {selectedVideo.status === 'done' && (
                        <div className="bg-bms-card border border-bms-border rounded-xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-bms-border flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <p className="text-sm font-semibold text-bms-text">Generated Instagram Bio</p>
                          </div>
                          <div className="p-4">
                            <InstagramBio
                              mainCaption={selectedVideo.mainCaption}
                              firstComment={selectedVideo.firstComment}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-bms-card border border-bms-border rounded-xl p-10 text-center">
                      <p className="text-bms-muted text-sm">Select a video from the list to view its bio</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
