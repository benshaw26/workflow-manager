export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { reviewsDb } from '@/lib/reviews/supabase'

async function getStats() {
  try {
    const [{ count: total }, { count: qualified }, { count: contacted }, { count: won }] = await Promise.all([
      reviewsDb.from('Lead').select('*', { count: 'exact', head: true }),
      reviewsDb.from('Lead').select('*', { count: 'exact', head: true }).eq('status', 'QUALIFIED'),
      reviewsDb.from('Lead').select('*', { count: 'exact', head: true }).eq('status', 'CONTACTED'),
      reviewsDb.from('Lead').select('*', { count: 'exact', head: true }).eq('status', 'CLOSED_WON'),
    ])
    const { data: topLeads } = await reviewsDb.from('Lead').select('id,businessName,painScore,category,town,starRating,reviewCount,status').neq('status', 'DISQUALIFIED').order('painScore', { ascending: false }).limit(6)
    const { data: recent } = await reviewsDb.from('Lead').select('id,businessName,category,town,painScore,status,createdAt').neq('status', 'DISQUALIFIED').order('createdAt', { ascending: false }).limit(6)
    return { total: total ?? 0, qualified: qualified ?? 0, contacted: contacted ?? 0, won: won ?? 0, topLeads: topLeads ?? [], recent: recent ?? [] }
  } catch { return { total: 0, qualified: 0, contacted: 0, won: 0, topLeads: [], recent: [] } }
}

const STATUS_LABEL: Record<string, string> = { NEW: 'New', QUALIFIED: 'Qualified', CONTACTED: 'Contacted', REPLIED: 'Replied', CALL_BOOKED: 'Call Booked', CLOSED_WON: 'Won', CLOSED_LOST: 'Lost', DISQUALIFIED: 'Disqualified' }
const STATUS_COLOR: Record<string, string> = { QUALIFIED: 'text-emerald-400', CONTACTED: 'text-bms-amber', CALL_BOOKED: 'text-bms-purple', CLOSED_WON: 'text-emerald-300', NEW: 'text-bms-cyan' }

export default async function ReviewsOverviewPage() {
  const s = await getStats()

  const cards = [
    { label: 'Total Leads', value: s.total, color: 'text-bms-cyan' },
    { label: 'Qualified', value: s.qualified, color: 'text-emerald-400' },
    { label: 'Contacted', value: s.contacted, color: 'text-bms-amber' },
    { label: 'Won', value: s.won, color: 'text-emerald-300' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-bms-card border border-bms-border rounded-xl p-5">
            <div className={`text-4xl font-black font-mono mb-1 ${c.color}`}>{c.value}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-bms-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-bms-card border border-bms-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-bms-text uppercase tracking-wider">Hottest Leads</h3>
            <Link href="/admin/pages/reviews-agent/crm" className="text-xs font-semibold text-bms-cyan hover:text-bms-cyan-dark transition-colors">View all →</Link>
          </div>
          {s.topLeads.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-bms-muted text-sm mb-2">No leads yet.</p>
              <Link href="/admin/pages/reviews-agent/discover" className="text-sm font-semibold text-bms-cyan hover:underline">Run discovery →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {s.topLeads.map((lead: Record<string, unknown>) => (
                <Link key={lead.id as string} href={`/admin/pages/reviews-agent/crm/${lead.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bms-darker hover:bg-bms-card-hover transition-colors">
                  <div>
                    <div className="text-sm font-medium text-bms-text">{lead.businessName as string}</div>
                    <div className="text-xs text-bms-muted capitalize">{lead.category as string} · {lead.town as string}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-bms-amber">★ {(lead.starRating as number).toFixed(1)}</span>
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-bms-cyan/10 border border-bms-cyan/20 text-bms-cyan text-xs font-bold">{lead.painScore as number}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-bms-card border border-bms-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-bms-text uppercase tracking-wider">Recent Leads</h3>
            <Link href="/admin/pages/reviews-agent/discover" className="text-xs font-semibold text-bms-cyan hover:text-bms-cyan-dark transition-colors">Discover more →</Link>
          </div>
          {s.recent.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-bms-muted text-sm mb-2">No leads yet.</p>
              <Link href="/admin/pages/reviews-agent/discover" className="text-sm font-semibold text-bms-cyan hover:underline">Start discovering →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {s.recent.map((lead: Record<string, unknown>) => (
                <Link key={lead.id as string} href={`/admin/pages/reviews-agent/crm/${lead.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bms-darker hover:bg-bms-card-hover transition-colors">
                  <div>
                    <div className="text-sm font-medium text-bms-text">{lead.businessName as string}</div>
                    <div className="text-xs text-bms-muted capitalize">{lead.category as string} · {lead.town as string}</div>
                  </div>
                  <span className={`text-xs font-semibold ${STATUS_COLOR[lead.status as string] || 'text-bms-muted'}`}>{STATUS_LABEL[lead.status as string] || lead.status as string}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-bms-card border border-bms-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-bms-text uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/pages/reviews-agent/discover" className="px-4 py-2 bg-bms-cyan text-bms-dark text-sm font-bold rounded-lg hover:bg-bms-cyan-dark transition-colors">+ Discover Leads</Link>
          <Link href="/admin/pages/reviews-agent/crm?status=QUALIFIED" className="px-4 py-2 bg-bms-darker border border-bms-border text-bms-text text-sm font-medium rounded-lg hover:border-bms-cyan/30 transition-colors">Qualified Leads</Link>
          <Link href="/admin/pages/reviews-agent/crm?status=CONTACTED" className="px-4 py-2 bg-bms-darker border border-bms-border text-bms-text text-sm font-medium rounded-lg hover:border-bms-cyan/30 transition-colors">Follow Up</Link>
        </div>
      </div>
    </div>
  )
}
