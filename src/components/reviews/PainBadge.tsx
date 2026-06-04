export function PainBadge({ score }: { score: number }) {
  const [bg, text] = score >= 8 ? ['bg-red-500/15 border-red-500/30', 'text-red-400'] : score >= 6 ? ['bg-bms-amber/10 border-bms-amber/25', 'text-bms-amber'] : score >= 4 ? ['bg-bms-cyan/10 border-bms-cyan/20', 'text-bms-cyan'] : ['bg-bms-border/50 border-bms-border', 'text-bms-muted']
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${bg} ${text}`}>{score}</span>
}
