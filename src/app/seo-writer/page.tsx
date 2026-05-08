'use client'

import { useState, useEffect, useCallback, KeyboardEvent, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  FileText, X, Copy, Check, Loader2, ChevronDown, ChevronUp,
  Sparkles, Tag, Clock, Globe, Hash, Users, AlignLeft,
  Instagram, Linkedin, Share2, Video, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetaData {
  title: string
  metaDescription: string
  slug: string
  estimatedReadTime: string
}

interface KeywordCluster {
  primary: string
  related: string[]
  searchIntent: string
}

interface ArticleSection {
  h2: string
  h3s: string[]
  contentBrief: string
  wordTarget: number
}

interface ArticleData {
  h1: string
  introduction: string
  sections: ArticleSection[]
  conclusion: string
  internalLinkSuggestions: string[]
  cta: string
}

interface SocialRepurpose {
  instagramCaption: string
  linkedinPost: string
  xThread: string[]
  tiktokHook: string
}

interface SeoResult {
  jobId: string
  meta: MetaData
  keywordClusters: KeywordCluster[]
  article: ArticleData
  fullArticleText: string
  socialRepurpose: SocialRepurpose
}

interface SavedArticle {
  id: string
  topic: string
  targetKeyword: string
  createdAt: string
  meta: MetaData
  fullArticleText: string
  socialRepurpose: SocialRepurpose
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INTENT_STYLES: Record<string, string> = {
  informational: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  commercial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  transactional: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  navigational: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return { copied, copy }
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copied, copy } = useCopy(text)
  return (
    <button
      onClick={() => void copy()}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
        copied
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-bms-card border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-border-light',
        className,
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function TagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[42px] px-3 py-2 bg-bms-darker border border-bms-border rounded-xl focus-within:border-bms-cyan/50 transition-colors">
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-bms-cyan/10 text-bms-cyan border border-bms-cyan/20"
        >
          {tag}
          <button onClick={() => onChange(tags.filter(t => t !== tag))}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={tags.length ? '' : 'Type and press Enter…'}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-bms-text placeholder:text-bms-muted outline-none"
      />
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
        checked ? 'bg-bms-cyan' : 'bg-bms-border',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

function SectionCard({ open, title, children, onToggle }: {
  open: boolean
  title: React.ReactNode
  children: React.ReactNode
  onToggle: () => void
}) {
  return (
    <div className="bg-bms-card border border-bms-border rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-5 text-left"
        onClick={onToggle}
      >
        <span className="text-bms-text font-semibold text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-bms-muted" /> : <ChevronDown className="w-4 h-4 text-bms-muted" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const LS_KEY = 'bms-seo-articles-v1'

export default function SeoWriterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bms-dark flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-bms-cyan animate-spin" />
        </div>
      }
    >
      <SeoWriterInner />
    </Suspense>
  )
}

function loadSaved(): SavedArticle[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as SavedArticle[]
  } catch {
    return []
  }
}

function saveToDB(articles: SavedArticle[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(articles.slice(-20)))
}

function SeoWriterInner() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  // Form state
  const [topic, setTopic] = useState(searchParams.get('topic') ?? '')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([])
  const [audience, setAudience] = useState('')
  const [wordCount, setWordCount] = useState(1000)
  const [includeSocial, setIncludeSocial] = useState(true)

  // App state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SeoResult | null>(null)
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])

  // Section expand state
  const [openMeta, setOpenMeta] = useState(true)
  const [openClusters, setOpenClusters] = useState(true)
  const [openOutline, setOpenOutline] = useState(false)
  const [openArticle, setOpenArticle] = useState(true)
  const [openSocial, setOpenSocial] = useState(true)

  useEffect(() => {
    setSavedArticles(loadSaved())
    // update topic if query param changes
    const t = searchParams.get('topic')
    if (t) setTopic(t)
  }, [searchParams])

  const generate = useCallback(async () => {
    if (!topic.trim() || !targetKeyword.trim()) {
      setError('Topic and target keyword are required.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/agents/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: session?.user?.id ?? '',
          topic,
          targetKeyword,
          secondaryKeywords,
          audience,
          wordCount,
          includeSocialRepurpose: includeSocial,
        }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        throw new Error(body.error ?? 'Generation failed')
      }

      const data = (await res.json()) as SeoResult
      setResult(data)

      // Save to localStorage
      const article: SavedArticle = {
        id: data.jobId,
        topic,
        targetKeyword,
        createdAt: new Date().toISOString(),
        meta: data.meta,
        fullArticleText: data.fullArticleText,
        socialRepurpose: data.socialRepurpose,
      }
      const updated = [article, ...savedArticles].slice(0, 20)
      setSavedArticles(updated)
      saveToDB(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [topic, targetKeyword, secondaryKeywords, audience, wordCount, includeSocial, session, savedArticles])

  const inputCls =
    'w-full bg-bms-darker border border-bms-border rounded-xl px-4 py-2.5 text-sm text-bms-text placeholder:text-bms-muted focus:outline-none focus:border-bms-cyan/50 transition-colors'

  const labelCls = 'block text-bms-muted text-xs font-medium mb-1.5 uppercase tracking-wide'

  return (
    <div className="min-h-screen bg-bms-dark">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bms-cyan/10 flex items-center justify-center text-bms-cyan">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-bms-text">SEO Writer</h1>
            <p className="text-bms-muted text-sm">
              AI-generated, fully optimised blog posts with social repurposing
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-bms-card border border-bms-border rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Topic */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                <AlignLeft className="w-3 h-3 inline mr-1" />Topic
              </label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. How to invest in UK property in 2025"
                className={inputCls}
              />
            </div>

            {/* Target keyword */}
            <div>
              <label className={labelCls}>
                <Globe className="w-3 h-3 inline mr-1" />Target Keyword
              </label>
              <input
                value={targetKeyword}
                onChange={e => setTargetKeyword(e.target.value)}
                placeholder="e.g. UK property investment"
                className={inputCls}
              />
            </div>

            {/* Audience */}
            <div>
              <label className={labelCls}>
                <Users className="w-3 h-3 inline mr-1" />Target Audience
              </label>
              <input
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. First-time buyers aged 25-40"
                className={inputCls}
              />
            </div>

            {/* Secondary keywords */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                <Tag className="w-3 h-3 inline mr-1" />Secondary Keywords
                <span className="ml-1 normal-case text-bms-muted/60 font-normal">— type and press Enter</span>
              </label>
              <TagInput tags={secondaryKeywords} onChange={setSecondaryKeywords} />
            </div>

            {/* Word count */}
            <div>
              <label className={labelCls}>
                <Hash className="w-3 h-3 inline mr-1" />Word Count — {wordCount.toLocaleString()}
              </label>
              <input
                type="range"
                min={500}
                max={3000}
                step={100}
                value={wordCount}
                onChange={e => setWordCount(Number(e.target.value))}
                className="w-full accent-bms-cyan"
              />
              <div className="flex justify-between text-bms-muted text-[10px] mt-1">
                <span>500</span>
                <span>3,000</span>
              </div>
            </div>

            {/* Social repurpose toggle */}
            <div className="flex items-center justify-between bg-bms-darker border border-bms-border rounded-xl px-4 py-3">
              <div>
                <p className="text-bms-text text-sm font-medium">Social Repurposing</p>
                <p className="text-bms-muted text-xs mt-0.5">Generate IG, LinkedIn, X &amp; TikTok content</p>
              </div>
              <Toggle checked={includeSocial} onChange={setIncludeSocial} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={() => void generate()}
            disabled={loading || !topic.trim() || !targetKeyword.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-bms-cyan text-bms-dark font-semibold text-sm hover:bg-bms-cyan-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating article…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Article
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <h2 className="text-bms-text font-semibold text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              Article Generated
            </h2>

            {/* Meta card */}
            <SectionCard
              open={openMeta}
              onToggle={() => setOpenMeta(o => !o)}
              title={
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-bms-cyan" />
                  Meta &amp; SEO
                </span>
              }
            >
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-1">Title Tag</p>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-bms-text text-sm font-medium">{result.meta.title}</p>
                    <CopyButton text={result.meta.title} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-1">Meta Description</p>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-bms-muted text-sm">{result.meta.metaDescription}</p>
                    <CopyButton text={result.meta.metaDescription} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-0.5">Slug</p>
                    <code className="text-bms-cyan text-xs bg-bms-cyan/5 px-2 py-0.5 rounded">
                      /{result.meta.slug}
                    </code>
                  </div>
                  <div>
                    <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-0.5">Read Time</p>
                    <span className="text-bms-text text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-bms-muted" />
                      {result.meta.estimatedReadTime}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Keyword clusters */}
            <SectionCard
              open={openClusters}
              onToggle={() => setOpenClusters(o => !o)}
              title={
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-bms-purple" />
                  Keyword Clusters
                </span>
              }
            >
              <div className="space-y-3">
                {result.keywordClusters.map((cluster, i) => (
                  <div key={i} className="p-3 rounded-lg bg-bms-darker border border-bms-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-bms-text text-sm font-medium">{cluster.primary}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize',
                          INTENT_STYLES[cluster.searchIntent] ?? 'bg-bms-border text-bms-muted border-bms-border',
                        )}
                      >
                        {cluster.searchIntent}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.related.map((kw, j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 rounded-full text-xs bg-bms-border/60 text-bms-muted border border-bms-border"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Article outline */}
            <SectionCard
              open={openOutline}
              onToggle={() => setOpenOutline(o => !o)}
              title={
                <span className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-bms-muted" />
                  Article Outline
                </span>
              }
            >
              <div className="space-y-3">
                <div>
                  <p className="text-bms-muted text-[10px] uppercase tracking-wide mb-1">H1</p>
                  <p className="text-bms-text text-sm font-semibold">{result.article.h1}</p>
                </div>
                <p className="text-bms-muted text-sm italic">{result.article.introduction}</p>
                {result.article.sections.map((sec, i) => (
                  <div key={i} className="pl-3 border-l-2 border-bms-border">
                    <p className="text-bms-text text-sm font-medium">{sec.h2}</p>
                    {sec.h3s.map((h3, j) => (
                      <p key={j} className="text-bms-muted text-xs pl-3 mt-1">↳ {h3}</p>
                    ))}
                    <p className="text-bms-muted text-xs mt-1">{sec.contentBrief}</p>
                  </div>
                ))}
                {result.article.internalLinkSuggestions.length > 0 && (
                  <div>
                    <p className="text-bms-muted text-[10px] uppercase tracking-wide mb-1">Internal Link Suggestions</p>
                    <ul className="space-y-1">
                      {result.article.internalLinkSuggestions.map((link, i) => (
                        <li key={i} className="text-bms-cyan text-xs">→ {link}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.article.cta && (
                  <div className="p-3 rounded-lg bg-bms-cyan/5 border border-bms-cyan/20">
                    <p className="text-[10px] text-bms-cyan uppercase tracking-wide mb-1">CTA</p>
                    <p className="text-bms-text text-sm">{result.article.cta}</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Full article */}
            <SectionCard
              open={openArticle}
              onToggle={() => setOpenArticle(o => !o)}
              title={
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Full Article
                </span>
              }
            >
              <div>
                <div className="flex justify-end mb-2">
                  <CopyButton text={result.fullArticleText} />
                </div>
                <div className="bg-bms-darker border border-bms-border rounded-xl p-4 max-h-96 overflow-y-auto">
                  <pre className="text-bms-muted text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {result.fullArticleText}
                  </pre>
                </div>
              </div>
            </SectionCard>

            {/* Social repurpose */}
            {includeSocial && result.socialRepurpose && (
              <SectionCard
                open={openSocial}
                onToggle={() => setOpenSocial(o => !o)}
                title={
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-bms-purple" />
                    Social Repurposing
                  </span>
                }
              >
                <div className="space-y-4">
                  {result.socialRepurpose.instagramCaption && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-pink-400 text-xs font-medium">
                          <Instagram className="w-3.5 h-3.5" />Instagram Caption
                        </span>
                        <CopyButton text={result.socialRepurpose.instagramCaption} />
                      </div>
                      <p className="text-bms-muted text-sm bg-bms-darker border border-bms-border rounded-lg p-3">
                        {result.socialRepurpose.instagramCaption}
                      </p>
                    </div>
                  )}

                  {result.socialRepurpose.linkedinPost && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
                          <Linkedin className="w-3.5 h-3.5" />LinkedIn Post
                        </span>
                        <CopyButton text={result.socialRepurpose.linkedinPost} />
                      </div>
                      <p className="text-bms-muted text-sm bg-bms-darker border border-bms-border rounded-lg p-3 whitespace-pre-line">
                        {result.socialRepurpose.linkedinPost}
                      </p>
                    </div>
                  )}

                  {result.socialRepurpose.xThread.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                          <Share2 className="w-3.5 h-3.5" />X Thread
                        </span>
                        <CopyButton text={result.socialRepurpose.xThread.join('\n\n')} />
                      </div>
                      <div className="space-y-2">
                        {result.socialRepurpose.xThread.map((tweet, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-bms-border text-bms-muted text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-bms-muted text-sm bg-bms-darker border border-bms-border rounded-lg p-2.5 flex-1">
                              {tweet}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.socialRepurpose.tiktokHook && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium">
                          <Video className="w-3.5 h-3.5" />TikTok Hook
                        </span>
                        <CopyButton text={result.socialRepurpose.tiktokHook} />
                      </div>
                      <p className="text-bms-text text-sm font-semibold bg-bms-darker border border-bms-cyan/20 rounded-lg p-3">
                        {result.socialRepurpose.tiktokHook}
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* Previous articles */}
        {savedArticles.length > 0 && (
          <div>
            <h2 className="text-bms-text font-semibold text-sm uppercase tracking-wide mb-3">
              Previous Articles
            </h2>
            <div className="space-y-2">
              {savedArticles.map(article => (
                <div
                  key={article.id}
                  className="bg-bms-card border border-bms-border rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-bms-text text-sm font-medium truncate">{article.topic}</p>
                    <p className="text-bms-muted text-xs mt-0.5">
                      {article.targetKeyword} ·{' '}
                      {new Date(article.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-bms-muted text-xs mt-1 truncate">{article.meta.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CopyButton text={article.fullArticleText} />
                    <button
                      onClick={() => {
                        const updated = savedArticles.filter(a => a.id !== article.id)
                        setSavedArticles(updated)
                        saveToDB(updated)
                      }}
                      className="p-1.5 rounded-lg text-bms-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
