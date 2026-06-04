const S: Record<string, [string, string]> = {
  NEW:          ['bg-bms-cyan/10 border-bms-cyan/20', 'text-bms-cyan'],
  QUALIFIED:    ['bg-emerald-500/10 border-emerald-500/20', 'text-emerald-400'],
  CONTACTED:    ['bg-bms-amber/10 border-bms-amber/20', 'text-bms-amber'],
  REPLIED:      ['bg-cyan-500/10 border-cyan-500/20', 'text-cyan-300'],
  CALL_BOOKED:  ['bg-bms-purple/10 border-bms-purple/20', 'text-bms-purple'],
  CLOSED_WON:   ['bg-emerald-500/15 border-emerald-500/25', 'text-emerald-300'],
  CLOSED_LOST:  ['bg-red-500/10 border-red-500/20', 'text-red-400'],
  DISQUALIFIED: ['bg-bms-darker border-bms-border', 'text-bms-muted'],
}
const LABELS: Record<string, string> = { NEW: 'New', QUALIFIED: 'Qualified', CONTACTED: 'Contacted', REPLIED: 'Replied', CALL_BOOKED: 'Call Booked', CLOSED_WON: 'Won ✓', CLOSED_LOST: 'Lost', DISQUALIFIED: 'Disqualified' }

export function StatusBadge({ status }: { status: string }) {
  const [bg, text] = S[status] || S.NEW
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${bg} ${text}`}>{LABELS[status] || status}</span>
}
