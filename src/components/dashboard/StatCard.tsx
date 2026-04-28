'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  suffix?: string
  prefix?: string
  trend?: number
  icon: React.ReactNode
  color?: 'cyan' | 'purple'
}

export function StatCard({ title, value, suffix = '', prefix = '', trend, icon, color = 'cyan' }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const { count, start } = useCountUp(value, 1500)

  useEffect(() => {
    if (isInView) start()
  }, [isInView, start])

  const isPositive = trend !== undefined && trend >= 0

  return (
    <div
      ref={ref}
      className={cn(
        'bg-bms-card border border-bms-border rounded-xl p-6 transition-all duration-300',
        color === 'cyan' ? 'hover:border-bms-cyan/40 hover:shadow-card-hover' : 'hover:border-bms-purple/40 hover:shadow-purple-glow'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          color === 'cyan' ? 'bg-bms-cyan/10 text-bms-cyan' : 'bg-bms-purple/10 text-bms-purple-light'
        )}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold', isPositive ? 'text-emerald-400' : 'text-red-400')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-bms-text mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <p className="text-bms-muted text-sm">{title}</p>
    </div>
  )
}
