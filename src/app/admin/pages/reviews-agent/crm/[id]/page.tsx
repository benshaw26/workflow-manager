'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { PainBadge } from '@/components/reviews/PainBadge'
import { StarRating } from '@/components/reviews/StarRating'

const STATUSES = ['NEW', 'QUALIFIED', 'CONTACTED', 'REPLIED', 'CALL_BOOKED', 'CLOSED_WON', 'CLOSED_LOST', 'DISQUALIFIED']
type Tab = 'overview' | 'email' | 'linkedin' | 'facebook' | 'outreach' | 'followups'

interface Lead { id: string; businessName: string; category: string; town: string | null; ownerFirstName: string | null; email: string | null; phone: string | null; website: string | null; googleMapsUrl: string | null; reviewCount: number; starRating: number; lastReviewDate: string | null; reviewsLast90Days: number; hasRepliedToReviews: boolean; nearestCompetitorName: string | null; nearestCompetitorReviewCount: number | null; painScore: number; status: string; notes: string | null; generatedEmail: string | null; generatedLinkedInNote: string | null; generatedLinkedInDm: string | null; generatedFbPost: string | null; OutreachEvent: Array<{ id: string; type: string; status: string; subject: string | null; body: string | null; createdAt: string; sentAt: string | null }>; FollowUp: Array<{ id: string; dueAt: string; type: string; notes: string | null; completed: boolean }> }

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lead, setLead] = useState<Lead | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [regen, setRegen] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/reviews-agent/leads/${id}`).then(r => r.json()).then(d => { setLead(d); setNotes(d.notes || '') })
  }, [id])

  const patch = async (data: Partial<Lead>) => {
    setSaving(true)
    const res = await fetch(`/api/reviews-agent/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setLead(await res.json()); setSaving(false)
  }

  const regenerate = async (type?: string) => {
    setRegen(true)
    const res = await fetch(`/api/reviews-agent/leads/${id}/regenerate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) })
    const d = await res.json(); setLead(prev => prev ? { ...prev, ...d } : prev); setRegen(false)
  }

  const sendEmail = async () => {
    if (!lead?.email || !lead?.generatedEmail) return
    setSending(true)
    const lines = lead.generatedEmail.split('\n')
    const subject = lines[0].replace('Subject: ', '')
    const body = lines.slice(2).join('\n')
    await fetch(`/api/reviews-agent/leads/${id}/outreach`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'EMAIL', subject, emailBody: body, sendNow: true }) })
    const refreshed = await fetch(`/api/reviews-agent/leads/${id}`).then(r => r.json())
    setLead(refreshed); setSending(false)
  }

  if (!lead) return <div className="py-16 text-center text-bms-muted text-sm">Loading...</div>

  const emailLines = lead.generatedEmail?.split('\n') || []
  const emailSubject = emailLines[0]?.replace('Subject: ', '') || ''
  const emailBody = emailLines.slice(2).join('\n')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'email', label: 'Email' },
    { id: 'linkedin', label: 'LinkedIn' }, { id: 'facebook', label: 'Facebook' },
    { id: 'outreach', label: `Outreach (${lead.OutreachEvent?.length || 0})` },
    { id: 'followups', label: `Follow-ups (${lead.FollowUp?.length || 0})` },
  ]

  const inputCls = 'w-full bg-bms-darker border border-bms-border text-bms-text rounded-lg px-3 py-2 text-sm outline-none focus:border-bms-cyan/50 transition-colors placeholder:text-bms-muted'
  const btnPrimary = 'px-3 py-1.5 bg-bms-cyan text-bms-dark text-xs font-bold rounded-lg hover:bg-bms-cyan-dark transition-colors disabled:opacity-40'
  const btnGhost = 'px-3 py-1.5 bg-bms-darker border border-bms-border text-bms-muted text-xs rounded-lg hover:border-bms-border-light hover:text-bms-text transition-colors'

  return (
    <div className="space-y-5 max-w-5xl">
      <Link href="/admin/pages/reviews-agent/crm" className="text-bms-muted hover:text-bms-text text-sm transition-colors">← Back to CRM</Link>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-bms-text">{lead.businessName}</h2>
          <p className="text-bms-muted text-sm capitalize mt-0.5">{lead.category}{lead.town && ` · ${lead.town}`}</p>
        </div>
        <div className="flex items-center gap-3">
          <PainBadge score={lead.painScore} />
          <select value={lead.status} onChange={e => patch({ status: e.target.value as Lead['status'] })} className="bg-bms-card border border-bms-border text-bms-text rounded-lg px-3 py-2 text-sm outline-none focus:border-bms-cyan/50">
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: 'Rating', v: <StarRating rating={lead.starRating} /> }, { label: 'Reviews', v: lead.reviewCount }, { label: 'Last 90 days', v: `+${lead.reviewsLast90Days}` }, { label: 'Has replied', v: lead.hasRepliedToReviews ? 'Yes' : 'No' }].map(s => (
          <div key={s.label} className="bg-bms-card border border-bms-border rounded-xl p-3">
            <div className="text-xs text-bms-muted mb-1">{s.label}</div>
            <div className="font-semibold text-bms-text">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-0 border-b border-bms-border">
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-bms-cyan text-bms-cyan' : 'border-transparent text-bms-muted hover:text-bms-text'}`}>{t.label}</button>)}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-bms-card border border-bms-border rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-bms-muted">Contact Details</h3>
            {[{ label: 'Owner', field: 'ownerFirstName', val: lead.ownerFirstName }, { label: 'Email', field: 'email', val: lead.email }, { label: 'Phone', field: 'phone', val: lead.phone }, { label: 'Website', field: 'website', val: lead.website }].map(({ label, field, val }) => (
              <div key={field}>
                <div className="text-xs text-bms-muted mb-1">{label}</div>
                <input defaultValue={val || ''} onBlur={e => { if (e.target.value !== (val || '')) patch({ [field]: e.target.value || null } as Partial<Lead>) }} className={inputCls} placeholder={`No ${label.toLowerCase()}`} />
              </div>
            ))}
            {lead.googleMapsUrl && <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/15 transition-colors">View on Google Maps ↗</a>}
          </div>

          <div className="bg-bms-card border border-bms-border rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-bms-muted">Competitor & Pain Score</h3>
            {lead.nearestCompetitorName ? (
              <div className="space-y-2">
                <div><div className="text-xs text-bms-muted">Nearest Competitor</div><div className="font-medium text-bms-text">{lead.nearestCompetitorName}</div></div>
                <div><div className="text-xs text-bms-muted">Their Reviews</div><div className="font-bold text-bms-amber">{lead.nearestCompetitorReviewCount}{lead.nearestCompetitorReviewCount && lead.nearestCompetitorReviewCount >= lead.reviewCount * 2 && <span className="ml-2 text-xs px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">{Math.round(lead.nearestCompetitorReviewCount / lead.reviewCount)}× more</span>}</div></div>
              </div>
            ) : <p className="text-bms-muted text-sm">No competitor data</p>}
            <div className="pt-3 border-t border-bms-border space-y-1.5 text-xs">
              {[{ label: 'Low review velocity', active: lead.reviewsLast90Days < 3, pts: '+3' }, { label: 'No review replies', active: !lead.hasRepliedToReviews, pts: '+2' }, { label: 'Rating 3.5–4.2', active: lead.starRating >= 3.5 && lead.starRating <= 4.2, pts: '+2' }, { label: 'Competitor 2×+ reviews', active: (lead.nearestCompetitorReviewCount || 0) >= lead.reviewCount * 2, pts: '+2' }, { label: 'Low total reviews (<40)', active: lead.reviewCount < 40, pts: '+1' }].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-bms-muted">{r.label}</span>
                  <span className={r.active ? 'text-emerald-400' : 'text-bms-muted'}>{r.active ? r.pts : '0'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-bms-card border border-bms-border rounded-xl p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-bms-muted mb-3">Notes</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes..." className={`${inputCls} resize-none`} />
            <button onClick={() => patch({ notes })} disabled={saving} className={`mt-2 ${btnPrimary}`}>{saving ? 'Saving...' : 'Save Notes'}</button>
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-bms-text">Personalised Email</h3>
            <div className="flex gap-2">
              <button onClick={() => regenerate()} disabled={regen} className={btnGhost}>{regen ? 'Regenerating...' : '↻ Regenerate'}</button>
              {lead.email && <button onClick={sendEmail} disabled={sending || !lead.generatedEmail} className={btnPrimary}>{sending ? 'Sending...' : 'Send via Brevo'}</button>}
              {lead.generatedEmail && <button onClick={() => navigator.clipboard.writeText(lead.generatedEmail!)} className={btnGhost}>Copy</button>}
            </div>
          </div>
          {lead.generatedEmail ? (
            <div className="bg-bms-card border border-bms-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-bms-border bg-bms-darker">
                <div className="text-xs text-bms-muted mb-1">Subject</div>
                <div className="text-sm font-semibold text-bms-text">{emailSubject}</div>
              </div>
              <pre className="p-5 text-sm text-bms-text leading-relaxed whitespace-pre-wrap font-sans">{emailBody}</pre>
            </div>
          ) : (
            <div className="bg-bms-card border border-bms-border rounded-xl p-8 text-center">
              <p className="text-bms-muted text-sm mb-3">No email generated yet.</p>
              <button onClick={() => regenerate()} className={btnPrimary}>Generate Email</button>
            </div>
          )}
          {!lead.email && <div className="text-xs p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">No email address found — add one in Overview to send.</div>}
        </div>
      )}

      {tab === 'linkedin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-bms-text">LinkedIn Outreach</h3>
            <button onClick={() => regenerate()} disabled={regen} className={btnGhost}>{regen ? 'Regenerating...' : '↻ Regenerate'}</button>
          </div>
          {lead.generatedLinkedInNote ? (
            <div className="space-y-4">
              {[{ title: 'CONNECTION REQUEST NOTE', content: lead.generatedLinkedInNote, max: '300 chars' }, { title: 'FOLLOW-UP DM (after connecting)', content: lead.generatedLinkedInDm, max: '100 words' }].map(({ title, content, max }) => content && (
                <div key={title} className="bg-bms-card border border-bms-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-bms-muted">{title}</span>
                    <button onClick={() => navigator.clipboard.writeText(content)} className={btnGhost}>Copy</button>
                  </div>
                  <p className="text-sm text-bms-text leading-relaxed">{content}</p>
                  <p className="text-xs text-bms-muted mt-1">{max}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bms-card border border-bms-border rounded-xl p-8 text-center">
              <p className="text-bms-muted text-sm mb-3">No LinkedIn content yet.</p>
              <button onClick={() => regenerate()} className={btnPrimary}>Generate Content</button>
            </div>
          )}
        </div>
      )}

      {tab === 'facebook' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-bms-text">Facebook Group Post</h3>
            <div className="flex gap-2">
              <button onClick={() => regenerate('facebook')} disabled={regen} className={btnGhost}>{regen ? 'Regenerating...' : '↻ Regenerate'}</button>
              {lead.generatedFbPost && <button onClick={() => navigator.clipboard.writeText(lead.generatedFbPost!)} className={btnGhost}>Copy</button>}
            </div>
          </div>
          {lead.generatedFbPost ? (
            <div className="bg-bms-card border border-bms-border rounded-xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-bms-muted mb-2">Post in local business Facebook groups</p>
              <p className="text-sm text-bms-text leading-relaxed">{lead.generatedFbPost}</p>
              <p className="text-xs text-bms-muted mt-2">{lead.generatedFbPost.split(' ').length} words</p>
            </div>
          ) : (
            <div className="bg-bms-card border border-bms-border rounded-xl p-8 text-center">
              <p className="text-bms-muted text-sm mb-3">No Facebook post yet.</p>
              <button onClick={() => regenerate('facebook')} className={btnPrimary}>Generate Post</button>
            </div>
          )}
        </div>
      )}

      {tab === 'outreach' && (
        <div className="space-y-3">
          {(lead.OutreachEvent || []).length === 0 ? (
            <div className="bg-bms-card border border-bms-border rounded-xl p-8 text-center text-bms-muted text-sm">No outreach yet. Send an email from the Email tab.</div>
          ) : (lead.OutreachEvent || []).map(ev => (
            <div key={ev.id} className="bg-bms-card border border-bms-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-bms-cyan">{ev.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${ev.status === 'SENT' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ev.status === 'FAILED' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-bms-darker border-bms-border text-bms-muted'}`}>{ev.status}</span>
                </div>
                <span className="text-xs text-bms-muted">{new Date(ev.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              {ev.subject && <p className="text-sm font-medium text-bms-text">{ev.subject}</p>}
              {ev.body && <p className="text-xs text-bms-muted truncate">{ev.body.slice(0, 100)}...</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'followups' && <FollowUpTab leadId={id} followUps={lead.FollowUp || []} onUpdate={fu => setLead(prev => prev ? { ...prev, FollowUp: fu } : prev)} />}
    </div>
  )
}

function FollowUpTab({ leadId, followUps, onUpdate }: { leadId: string; followUps: Array<{ id: string; dueAt: string; type: string; notes: string | null; completed: boolean }>; onUpdate: (fu: typeof followUps) => void }) {
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState(''); const [type, setType] = useState('call'); const [notes, setNotes] = useState('')

  const add = async () => {
    if (!date) return
    const res = await fetch(`/api/reviews-agent/leads/${leadId}/followups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dueAt: date, type, notes }) })
    onUpdate([...followUps, await res.json()]); setAdding(false); setDate(''); setNotes('')
  }

  const complete = async (fid: string) => {
    await fetch(`/api/reviews-agent/leads/${leadId}/followups`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ followUpId: fid, completed: true }) })
    onUpdate(followUps.map(f => f.id === fid ? { ...f, completed: true } : f))
  }

  const inputCls = 'bg-bms-darker border border-bms-border text-bms-text rounded-lg px-3 py-2 text-sm outline-none focus:border-bms-cyan/50 transition-colors'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-bms-text">Follow-ups</h3>
        <button onClick={() => setAdding(true)} className="px-3 py-1.5 bg-bms-cyan text-bms-dark text-xs font-bold rounded-lg hover:bg-bms-cyan-dark transition-colors">+ Schedule</button>
      </div>
      {adding && (
        <div className="bg-bms-card border border-bms-cyan/30 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
              {['call', 'email', 'linkedin', 'check-in'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="px-3 py-1.5 bg-bms-cyan text-bms-dark text-xs font-bold rounded-lg hover:bg-bms-cyan-dark transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-bms-muted text-xs hover:text-bms-text transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {followUps.length === 0 && !adding ? (
        <div className="bg-bms-card border border-bms-border rounded-xl p-8 text-center text-bms-muted text-sm">No follow-ups scheduled.</div>
      ) : followUps.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).map(fu => (
        <div key={fu.id} className={`flex items-center justify-between bg-bms-card border border-bms-border rounded-xl px-4 py-3 ${fu.completed ? 'opacity-40' : ''}`}>
          <div>
            <div className="text-sm font-medium text-bms-text capitalize">{fu.type}</div>
            <div className="text-xs text-bms-muted">Due: {new Date(fu.dueAt).toLocaleDateString('en-GB')}{fu.notes && ` · ${fu.notes}`}</div>
          </div>
          {!fu.completed && <button onClick={() => complete(fu.id)} className="text-xs px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/15 transition-colors">Mark Done</button>}
        </div>
      ))}
    </div>
  )
}
