'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

const STATS = [
  { value: '< 7', unit: 'days', desc: 'to go live' },
  { value: '10×', unit: 'output', desc: 'with same team size' },
  { value: '0', unit: 'code', desc: 'required from you' },
]

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section className="py-32 bg-bms-dark overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden border border-bms-border"
        >
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-bms-card via-bms-darker to-bms-card" />
          <div className="absolute inset-0 bg-gradient-to-tr from-bms-cyan/5 via-transparent to-bms-purple/8" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-bms-cyan/40 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-bms-purple/30 to-transparent" />

          {/* Large background text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="text-[20vw] font-black text-bms-text/[0.015] leading-none tracking-tighter">
              BMS
            </span>
          </div>

          <div className="relative z-10 px-8 py-20 lg:py-28 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-bms-cyan text-sm font-semibold uppercase tracking-[0.2em] mb-6"
            >
              Ready when you are
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl lg:text-7xl font-black leading-[0.95] tracking-tight text-bms-text mb-6"
            >
              Stop doing
              <br />
              <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
                it manually.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-bms-muted text-lg max-w-xl mx-auto mb-12"
            >
              Book a free 30-minute call. We&apos;ll identify your biggest automation opportunities and show you exactly how fast we can deploy them.
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-8 mb-14"
            >
              {STATS.map((s) => (
                <div key={s.desc} className="text-center">
                  <p className="text-3xl font-black text-bms-text">
                    {s.value} <span className="text-bms-cyan">{s.unit}</span>
                  </p>
                  <p className="text-bms-muted text-xs font-medium mt-0.5">{s.desc}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/booking">
                <LiquidButton size="xl" className="border border-bms-cyan/40 text-bms-cyan font-bold tracking-wide">
                  Book Your Free Demo <ArrowRight className="inline w-4 h-4 ml-1" />
                </LiquidButton>
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold text-bms-muted hover:text-bms-text transition-colors"
              >
                Already a client? Sign in →
              </Link>
            </motion.div>

            <p className="text-bms-muted/50 text-xs mt-8 tracking-wide">
              No commitment · 30 minutes · Results delivered in days
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
