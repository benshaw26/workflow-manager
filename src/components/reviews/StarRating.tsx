export function StarRating({ rating }: { rating: number }) {
  const cls = rating >= 4.3 ? 'text-emerald-400' : rating >= 3.5 ? 'text-bms-amber' : 'text-red-400'
  return <span className={`inline-flex items-center gap-1 text-sm font-bold ${cls}`}>★ {rating.toFixed(1)}</span>
}
