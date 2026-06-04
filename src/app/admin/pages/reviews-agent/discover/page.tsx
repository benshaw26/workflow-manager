'use client'
import { useState } from 'react'
import { TARGET_CATEGORIES, UK_REGIONS } from '@/lib/reviews/constants'

interface Log { type: string; message: string }

export default function DiscoverPage() {
  const [categories, setCategories] = useState<string[]>(TARGET_CATEGORIES.slice(0, 5))
  const [regions, setRegions] = useState<string[]>(['Buckinghamshire'])
  const [radiusKm, setRadiusKm] = useState(8)
  const [scrape, setScrape] = useState(true)
  const [generate, setGenerate] = useState(true)
  const [limit, setLimit] = useState(20)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [summary, setSummary] = useState<{ qualified: number; processed: number } | null>(null)

  const toggle = <T,>(arr: T[], v: T) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  const run = async () => {
    setRunning(true); setLogs([]); setSummary(null)
    try {
      const res = await fetch('/api/reviews-agent/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories, locations: regions, radiusMeters: radiusKm * 1000, scrape, generateContent: generate, limit }) })
      const reader = res.body!.getReader(); const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const e = JSON.parse(line.slice(6)); setLogs(p => [...p.slice(-300), e]); if (e.type === 'complete') setSummary({ qualified: e.qualifiedCount, processed: e.processedCount }) } catch { /* skip */ }
        }
      }
    } catch (e) { setLogs(p => [...p, { type: 'error', message: String(e) }]) }
    finally { setRunning(false) }
  }

  const logColor = (t: string) => ({ lead: 'text-emerald-400', disqualified: 'text-bms-muted', error: 'text-red-400', complete: 'text-bms-cyan' })[t] || 'text-bms-muted'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <div className="bg-bms-card border border-bms-border rounded-xl p-5">
          <p className="text-xs font-black uppercase tracking-wider text-bms-muted mb-3">Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_CATEGORIES.map(cat => {
              const on = categories.includes(cat)
              return <button key={cat} onClick={() => setCategories(p => toggle(p, cat))} className={`px-2.5 py-1 rounded text-xs capitalize font-medium transition-colors border ${on ? 'bg-bms-cyan/10 border-bms-cyan/40 text-bms-cyan' : 'bg-bms-darker border-bms-border text-bms-muted hover:border-bms-border-light hover:text-bms-text'}`}>{cat}</button>
            })}
          </div>
        </div>

        <div className="bg-bms-card border border-bms-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase tracking-wider text-bms-muted">Regions</p>
            <div className="flex gap-3">
              <button onClick={() => setRegions(Object.keys(UK_REGIONS))} className="text-xs text-bms-cyan hover:underline">All</button>
              <button onClick={() => setRegions([])} className="text-xs text-bms-muted hover:underline">None</button>
            </div>
          </div>
          <div className="space-y-1.5">
            {Object.entries(UK_REGIONS).map(([region, locs]) => {
              const on = regions.includes(region)
              return (
                <label key={region} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${on ? 'bg-bms-cyan border-bms-cyan' : 'border-bms-border bg-bms-darker'}`} onClick={() => setRegions(p => toggle(p, region))}>
                      {on && <svg className="w-2.5 h-2.5 text-bms-dark" viewBox="0 0 12 12" fill="currentColor"><path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                    </div>
                    <span className={`text-sm ${on ? 'text-bms-text' : 'text-bms-muted'}`}>{region}</span>
                  </div>
                  <span className="text-xs text-bms-muted">{locs.length}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="bg-bms-card border border-bms-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-black uppercase tracking-wider text-bms-muted">Options</p>
          {[{ label: `Radius: ${radiusKm}km`, min: 2, max: 30, val: radiusKm, set: setRadiusKm }, { label: `Max leads: ${limit}`, min: 5, max: 200, step: 5, val: limit, set: setLimit }].map(({ label, min, max, val, set, step }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-bms-muted mb-1"><span>{label}</span></div>
              <input type="range" min={min} max={max} step={step || 1} value={val} onChange={e => set(Number(e.target.value))} className="w-full accent-bms-cyan" />
            </div>
          ))}
          {[{ label: 'Scrape websites', val: scrape, set: setScrape }, { label: 'Generate AI outreach', val: generate, set: setGenerate }].map(({ label, val, set }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="accent-bms-cyan" />
              <span className="text-sm text-bms-text">{label}</span>
            </label>
          ))}
        </div>

        <button onClick={run} disabled={running || categories.length === 0 || regions.length === 0} className="w-full py-3 bg-bms-cyan text-bms-dark text-sm font-bold rounded-xl hover:bg-bms-cyan-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {running ? 'Discovering...' : 'Run Discovery'}
        </button>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-bms-card border border-bms-border rounded-xl p-5 h-full min-h-[540px] flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <p className="text-xs font-black uppercase tracking-wider text-bms-muted">Activity Log</p>
            {summary && <span className="text-xs font-semibold text-bms-cyan">{summary.qualified} qualified / {summary.processed} checked</span>}
          </div>
          {logs.length === 0 && !running ? (
            <div className="flex-1 flex items-center justify-center text-bms-muted text-sm">Configure your search and click Run Discovery</div>
          ) : (
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className={`flex-shrink-0 w-24 ${logColor(log.type)}`}>[{log.type}]</span>
                  <span className={log.type === 'lead' ? 'text-bms-text' : 'text-bms-muted'}>{log.message}</span>
                </div>
              ))}
              {running && <div className="flex gap-2 mt-1"><span className="text-bms-cyan">●</span><span className="text-bms-muted">Scanning...</span></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
