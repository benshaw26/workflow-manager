'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'
import { STATS } from '@/lib/constants'

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const { count, start } = useCountUp(value, 2000)

  useEffect(() => {
    if (isInView) start()
  }, [isInView, start])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center p-6"
    >
      <div className="text-4xl lg:text-5xl font-bold mb-2">
        <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
          {count.toLocaleString()}{suffix}
        </span>
      </div>
      <p className="text-bms-muted text-sm font-medium">{label}</p>
    </motion.div>
  )
}

export function StatsSection() {
  return (
    <section className="py-16 bg-bms-darker border-y border-bms-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-x divide-bms-border">
          {STATS.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
