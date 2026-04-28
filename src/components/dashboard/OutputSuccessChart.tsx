'use client'

import { memo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { AnalyticsTotals } from '@/types'

interface Props {
  totals: AnalyticsTotals
}

export const OutputSuccessChart = memo(function OutputSuccessChart({ totals }: Props) {
  const data = [
    { name: 'Successful', value: totals.successfulOutputs, color: '#10b981' },
    { name: 'Failed', value: totals.failedOutputs, color: '#ef4444' },
  ]

  const successRate =
    totals.successfulOutputs + totals.failedOutputs > 0
      ? Math.round((totals.successfulOutputs / (totals.successfulOutputs + totals.failedOutputs)) * 100)
      : 0

  return (
    <div className="bg-bms-card border border-bms-border rounded-xl p-6">
      <h3 className="text-bms-text font-semibold mb-2">Output Success Rate</h3>
      <p className="text-bms-muted text-sm mb-6">Success vs failures (all-time)</p>

      <div className="flex items-center justify-center">
        <div className="relative">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f2a',
                  border: '1px solid #1a1a3e',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#e2e8f0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-bms-text">{successRate}%</span>
            <span className="text-bms-muted text-xs">success</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-bms-muted text-xs">{d.name}: {d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
