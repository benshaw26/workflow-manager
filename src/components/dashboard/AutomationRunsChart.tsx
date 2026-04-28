'use client'

import { memo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { AnalyticsSeries } from '@/types'

interface Props {
  data: AnalyticsSeries[]
}

export const AutomationRunsChart = memo(function AutomationRunsChart({ data }: Props) {
  return (
    <div className="bg-bms-card border border-bms-border rounded-xl p-6">
      <h3 className="text-bms-text font-semibold mb-6">Automation Runs — Last 30 Days</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="gradRuns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3e" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f0f2a',
              border: '1px solid #1a1a3e',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e2e8f0',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
          />
          <Area
            type="monotone"
            dataKey="runs"
            name="Total Runs"
            stroke="#00d4ff"
            strokeWidth={2}
            fill="url(#gradRuns)"
          />
          <Area
            type="monotone"
            dataKey="success"
            name="Successful"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradSuccess)"
          />
          <Area
            type="monotone"
            dataKey="failed"
            name="Failed"
            stroke="#ef4444"
            strokeWidth={1.5}
            fill="url(#gradFailed)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
