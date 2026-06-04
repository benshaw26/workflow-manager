'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { PainBadge } from '@/components/reviews/PainBadge'
import { StatusBadge } from '@/components/reviews/StatusBadge'
import { StarRating } from '@/components/reviews/StarRating'

const STATUSES = ['', 'NEW', 'QUALIFIED', 'CONTACTED', 'REPLIED', 'CALL_BOOKED', 'CLOSED_WON', 'CLOSED_LOST', 'DISQUALIFIED']

interface Lead { id: string; businessName: string; category: string; town: string; ownerFirstName: string | null; email: string | null; phone: string | null; reviewCount: number; starRating: number; reviewsLast90Days: number; painScore: number; status: string; createdAt: string }

function CrmTable() {
  const sp = useSearchParams(); const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(sp.get('status') || '')
  const [sortBy, setSortBy] = useState('painScore'); const [page, setPage] = useState(1)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), sortBy, sortDir: 'desc' })
    if (status) p.set('status', status); if (search) p.set('search', search)
    const res = await fetch(`/api/reviews-agent/leads?${p}`).catch(() => null)
    if (res?.ok) { const d = await res.json(); setLeads(d.leads || []); setTotal(d.total || 0) } else { setLeads([]); setTotal(0) }
    setLoading(false)
  }, [page, sortBy, status, search])

  useEffect(() => { fetch_() }, [fetch_])

  const totalPages = Math.ceil(total / 25)
  const inputCls = 'bg-bms-card border border-bms-border text-bms-text rounded-lg px-3 py-2 text-sm outline-none focus:border-bms-cyan/50 transition-colors'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-bms-muted text-sm">{total} leads total</p>
        <Link href="/admin/pages/reviews-agent/discover" className="px-4 py-2 bg-bms-cyan text-bms-dark text-sm font-bold rounded-lg hover:bg-bms-cyan-dark transition-colors">+ Discover More</Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search leads..." className={`${inputCls} w-56`} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className={inputCls}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={inputCls}>
          <option value="painScore">Pain Score</option>
          <option value="createdAt">Date Added</option>
          <option value="reviewCount">Reviews</option>
          <option value="starRating">Rating</option>
        </select>
      </div>

      <div className="rounded-xl overflow-hidden border border-bms-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bms-card border-b border-bms-border">
              {['Business', 'Category', 'Location', 'Rating', 'Reviews', 'Pain', 'Status', 'Contact'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-bms-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-bms-muted bg-bms-darker">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-bms-muted bg-bms-darker">No leads found. <Link href="/admin/pages/reviews-agent/discover" className="text-bms-cyan hover:underline">Run discovery →</Link></td></tr>
            ) : leads.map((lead, i) => (
              <tr key={lead.id} onClick={() => router.push(`/admin/pages/reviews-agent/crm/${lead.id}`)} className={`border-b border-bms-border cursor-pointer hover:bg-bms-card-hover transition-colors ${i % 2 === 0 ? 'bg-bms-darker' : 'bg-bms-dark'}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-bms-text">{lead.businessName}</div>
                  {lead.ownerFirstName && <div className="text-xs text-bms-muted">{lead.ownerFirstName}</div>}
                </td>
                <td className="px-4 py-3 text-bms-muted capitalize text-xs">{lead.category}</td>
                <td className="px-4 py-3 text-bms-muted text-xs">{lead.town}</td>
                <td className="px-4 py-3"><StarRating rating={lead.starRating} /></td>
                <td className="px-4 py-3 text-bms-text font-mono">{lead.reviewCount}{lead.reviewsLast90Days > 0 && <span className="text-xs text-emerald-400 ml-1">+{lead.reviewsLast90Days}</span>}</td>
                <td className="px-4 py-3"><PainBadge score={lead.painScore} /></td>
                <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {lead.email && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">✉</span>}
                    {lead.phone && <span className="text-xs px-2 py-0.5 rounded-full bg-bms-amber/10 border border-bms-amber/20 text-bms-amber">✆</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-bms-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-bms-card border border-bms-border text-bms-text text-sm rounded-lg disabled:opacity-30 hover:border-bms-border-light transition-colors">← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-bms-card border border-bms-border text-bms-text text-sm rounded-lg disabled:opacity-30 hover:border-bms-border-light transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CrmPage() {
  return <Suspense fallback={<div className="py-12 text-center text-bms-muted text-sm">Loading...</div>}><CrmTable /></Suspense>
}
