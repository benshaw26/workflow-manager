import { Lightbulb, TrendingUp } from 'lucide-react'

interface Props {
  insights: string[]
}

export function InsightsPanel({ insights }: Props) {
  return (
    <div className="bg-bms-card border border-bms-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <h3 className="text-bms-text font-semibold">AI Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-bms-darker border border-bms-border">
            <TrendingUp className="w-4 h-4 text-bms-cyan flex-shrink-0 mt-0.5" />
            <p className="text-bms-muted text-sm leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
