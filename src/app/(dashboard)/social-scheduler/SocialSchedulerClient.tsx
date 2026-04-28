'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, ImageIcon, Sparkles, Calendar, Copy, Check,
  Loader2, Share2, Linkedin, Twitter, Instagram,
  ChevronRight, ChevronLeft, AlertCircle, Clock,
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface BrandProfile {
  brandName: string
  tone: string
  personality: string
  targetAudience: string
  keyThemes: string[]
  contentStyle: string
  colorMood: string
}

interface GeneratedPost {
  platform: string
  content: string
  hashtags: string[]
  charCount: number
}

interface ScheduledPost extends GeneratedPost {
  scheduledAt: Date | null
  saved: boolean
}

const PLATFORM_LIMITS: Record<string, number> = {
  linkedin: 1300,
  x: 280,
  instagram: 2200,
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  linkedin:  <Linkedin className="w-4 h-4" />,
  x:         <Twitter className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin:  'from-blue-600 to-blue-700',
  x:         'from-slate-700 to-slate-800',
  instagram: 'from-pink-600 to-purple-600',
}

export function SocialSchedulerClient({ userName }: { userName: string }) {
  const [step, setStep] = useState(1)

  // Step 1 — Brand analysis
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [pastedImage, setPastedImage] = useState<{ base64: string; mediaType: string; preview: string } | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Step 2 — Generate
  const [topic, setTopic] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['linkedin', 'x', 'instagram'])
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  // Step 3 — Preview & schedule
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  // ── Image handling ──────────────────────────────────────────────
  const processImageFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const [header, base64] = dataUrl.split(',')
      const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
      setPastedImage({ base64, mediaType, preview: dataUrl })
    }
    reader.readAsDataURL(file)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        processImageFile(item.getAsFile()!)
        break
      }
    }
  }, [processImageFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) processImageFile(file)
  }, [processImageFile])

  // ── Brand analysis ──────────────────────────────────────────────
  const analyzeWebsite = async () => {
    if (!url && !pastedImage) return
    setAnalyzing(true)
    setAnalyzeError('')
    try {
      const res = await fetch('/api/automations/social/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url || undefined,
          imageBase64: pastedImage?.base64,
          imageMediaType: pastedImage?.mediaType,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setAnalyzeError(data.error); return }
      setBrandProfile(data.brandProfile)
    } catch {
      setAnalyzeError('Network error — please try again')
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Generate posts ──────────────────────────────────────────────
  const generatePosts = async () => {
    if (!brandProfile || !topic || !platforms.length) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/automations/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandProfile,
          topic,
          platforms,
          imageBase64: pastedImage?.base64,
          imageMediaType: pastedImage?.mediaType,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setGenerateError(data.error); return }
      setScheduledPosts(
        data.posts.map((p: GeneratedPost) => ({ ...p, scheduledAt: null, saved: false }))
      )
      setStep(3)
    } catch {
      setGenerateError('Network error — please try again')
    } finally {
      setGenerating(false)
    }
  }

  // ── Copy ────────────────────────────────────────────────────────
  const copyPost = (platform: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(platform)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Schedule ────────────────────────────────────────────────────
  const savePost = async (post: ScheduledPost) => {
    if (!post.scheduledAt) return
    setSaving(post.platform)
    try {
      const res = await fetch('/api/automations/social/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: post.platform,
          content: post.content,
          hashtags: post.hashtags,
          scheduledAt: post.scheduledAt.toISOString(),
        }),
      })
      if (res.ok) {
        setScheduledPosts((prev) =>
          prev.map((p) => p.platform === post.platform ? { ...p, saved: true } : p)
        )
      }
    } finally {
      setSaving(null)
    }
  }

  const updateContent = (platform: string, content: string) => {
    setScheduledPosts((prev) =>
      prev.map((p) => p.platform === platform ? { ...p, content, charCount: content.length } : p)
    )
  }

  const setDate = (platform: string, date: Date | undefined) => {
    setScheduledPosts((prev) =>
      prev.map((p) => p.platform === platform ? { ...p, scheduledAt: date ?? null } : p)
    )
    setCalendarOpen(null)
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-bms-cyan/10 border border-bms-cyan/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-bms-cyan" />
          </div>
          <span className="text-bms-cyan text-xs font-semibold uppercase tracking-widest">Social Media Scheduler</span>
        </div>
        <h2 className="text-3xl font-bold text-bms-text">
          Hey {userName.split(' ')[0]}, let&apos;s create some{' '}
          <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
            on-brand content
          </span>
        </h2>
        <p className="text-bms-muted text-sm mt-1.5">
          Analyse a brand, generate platform-optimised posts, and schedule them — all with AI.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <button
              onClick={() => s < step && setStep(s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                s === step
                  ? 'bg-bms-cyan text-bms-dark'
                  : s < step
                  ? 'bg-bms-cyan/20 text-bms-cyan cursor-pointer hover:bg-bms-cyan/30'
                  : 'bg-bms-border text-bms-muted cursor-default'
              }`}
            >
              {s}. {s === 1 ? 'Brand Analysis' : s === 2 ? 'Generate Posts' : 'Preview & Schedule'}
            </button>
            {s < 3 && <ChevronRight className="w-4 h-4 text-bms-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Brand Analysis ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* URL input */}
              <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-bms-cyan" />
                  <h3 className="text-bms-text font-semibold">Analyse a Website</h3>
                </div>
                <p className="text-bms-muted text-sm">Enter a company URL and we&apos;ll extract their brand personality automatically.</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 bg-bms-darker border border-bms-border rounded-xl px-4 py-2.5 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan transition-all"
                  />
                </div>
              </div>

              {/* Image paste/drop */}
              <div
                ref={dropRef}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="bg-bms-card border border-bms-border border-dashed rounded-2xl p-6 space-y-4 cursor-text focus-within:border-bms-cyan/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-bms-purple" />
                  <h3 className="text-bms-text font-semibold">Paste or Drop an Image</h3>
                </div>
                <p className="text-bms-muted text-sm">Paste a logo, screenshot, or brand visual and we&apos;ll analyse the style.</p>
                {pastedImage ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pastedImage.preview} alt="Pasted" className="w-full h-32 object-contain rounded-xl bg-bms-darker" />
                    <button
                      onClick={() => setPastedImage(null)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
                    >✕</button>
                  </div>
                ) : (
                  <div className="h-20 rounded-xl bg-bms-darker border border-bms-border flex items-center justify-center text-bms-muted text-sm">
                    <span>Ctrl+V to paste · or drag and drop here</span>
                  </div>
                )}
              </div>
            </div>

            {analyzeError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {analyzeError}
              </div>
            )}

            <button
              onClick={analyzeWebsite}
              disabled={analyzing || (!url && !pastedImage)}
              className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-6 py-3 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors"
            >
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</> : <><Sparkles className="w-4 h-4" /> Analyse Brand</>}
            </button>

            {/* Brand profile result */}
            {brandProfile && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bms-card border border-bms-cyan/30 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-bms-text font-bold text-lg">{brandProfile.brandName}</h3>
                  <span className="px-3 py-1 bg-bms-cyan/10 border border-bms-cyan/20 rounded-full text-bms-cyan text-xs font-semibold">Brand Profile Ready</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'Tone', value: brandProfile.tone },
                    { label: 'Audience', value: brandProfile.targetAudience },
                    { label: 'Content Style', value: brandProfile.contentStyle },
                    { label: 'Color Mood', value: brandProfile.colorMood },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-bms-darker rounded-xl p-3">
                      <p className="text-bms-muted text-[10px] uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-bms-text text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-bms-muted text-[10px] uppercase tracking-wide mb-2">Key Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {brandProfile.keyThemes.map((t) => (
                      <span key={t} className="px-2.5 py-1 bg-bms-purple/10 border border-bms-purple/20 rounded-full text-bms-purple text-xs">{t}</span>
                    ))}
                  </div>
                </div>
                <p className="text-bms-muted text-sm italic">&ldquo;{brandProfile.personality}&rdquo;</p>
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-5 py-2.5 rounded-xl hover:bg-bms-cyan-dark transition-colors"
                >
                  Generate Posts <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── STEP 2: Generate Posts ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-5">
              <h3 className="text-bms-text font-semibold">What do you want to post about?</h3>

              <div>
                <label className="text-bms-muted text-xs uppercase tracking-wide mb-2 block">Topic / Brief</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. We just launched a new product feature that helps teams collaborate in real time..."
                  rows={3}
                  className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-3 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan resize-none transition-all"
                />
              </div>

              <div>
                <label className="text-bms-muted text-xs uppercase tracking-wide mb-2 block">Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {['linkedin', 'x', 'instagram'].map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setPlatforms((prev) =>
                          prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                        )
                      }
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        platforms.includes(p)
                          ? 'bg-bms-cyan/10 border-bms-cyan text-bms-cyan'
                          : 'bg-bms-darker border-bms-border text-bms-muted hover:border-bms-muted'
                      }`}
                    >
                      {PLATFORM_ICONS[p]}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {pastedImage && (
                <div className="flex items-center gap-3 bg-bms-purple/5 border border-bms-purple/20 rounded-xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pastedImage.preview} alt="" className="w-12 h-12 object-cover rounded-lg" />
                  <p className="text-bms-muted text-sm">Your image will be used to inspire the generated content.</p>
                </div>
              )}

              {generateError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
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
                onClick={generatePosts}
                disabled={generating || !topic || !platforms.length}
                className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-6 py-2.5 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors"
              >
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Posts</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Preview & Schedule ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-bms-text font-semibold">Your generated posts</h3>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs text-bms-muted hover:text-bms-cyan transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>

            {scheduledPosts.map((post) => {
              const limit = PLATFORM_LIMITS[post.platform]
              const over = post.content.length > limit
              return (
                <div key={post.platform} className="bg-bms-card border border-bms-border rounded-2xl p-6 space-y-4">
                  {/* Platform header */}
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${PLATFORM_COLORS[post.platform]} text-white text-xs font-semibold`}>
                      {PLATFORM_ICONS[post.platform]}
                      {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                    </div>
                    {post.saved && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" /> Scheduled
                      </span>
                    )}
                  </div>

                  {/* Editable content */}
                  <textarea
                    value={post.content}
                    onChange={(e) => updateContent(post.platform, e.target.value)}
                    rows={5}
                    className="w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-3 text-sm text-bms-text focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan resize-none transition-all"
                  />
                  <div className={`text-xs text-right ${over ? 'text-red-400 font-semibold' : 'text-bms-muted'}`}>
                    {post.content.length} / {limit}
                    {over && ' — over limit'}
                  </div>

                  {/* Schedule + actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <button
                        onClick={() => setCalendarOpen(calendarOpen === post.platform ? null : post.platform)}
                        className="inline-flex items-center gap-2 bg-bms-darker border border-bms-border text-bms-muted hover:border-bms-muted px-4 py-2 rounded-xl text-sm transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        {post.scheduledAt ? post.scheduledAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pick a date'}
                      </button>
                      {calendarOpen === post.platform && (
                        <div className="absolute top-full mt-2 z-50 bg-bms-card border border-bms-border rounded-2xl shadow-xl p-2">
                          <DayPicker
                            mode="single"
                            selected={post.scheduledAt ?? undefined}
                            onSelect={(d) => setDate(post.platform, d)}
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

                    <button
                      onClick={() => copyPost(post.platform, post.content)}
                      className="inline-flex items-center gap-2 bg-bms-darker border border-bms-border text-bms-muted hover:border-bms-muted px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      {copiedId === post.platform ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                    </button>

                    <button
                      onClick={() => savePost(post)}
                      disabled={!post.scheduledAt || post.saved || saving === post.platform}
                      className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold px-4 py-2 rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 transition-colors text-sm ml-auto"
                    >
                      {saving === post.platform ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : post.saved ? (
                        <><Check className="w-4 h-4" /> Saved</>
                      ) : (
                        <><Clock className="w-4 h-4" /> Schedule</>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
