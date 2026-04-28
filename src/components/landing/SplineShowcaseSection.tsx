'use client'

import dynamic from 'next/dynamic'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Spotlight } from '@/components/ui/spotlight'
import { Cpu, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const SplineScene = dynamic(
  () => import('@/components/ui/splite').then((m) => m.SplineScene),
  { ssr: false, loading: () => null },
)

export function SplineShowcaseSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 bg-bms-darker overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-4"
        >
          <Cpu className="w-4 h-4 text-bms-cyan" />
          <span className="text-bms-cyan text-xs font-semibold uppercase tracking-[0.2em]">
            AI in Action
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-4xl lg:text-5xl font-black text-bms-text tracking-tight mb-4"
        >
          Intelligent systems,{' '}
          <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
            built for you.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-bms-muted text-lg max-w-xl mb-12"
        >
          Our automations don&apos;t just save time — they learn, adapt, and compound in value the longer they run.
        </motion.p>

        {/* Showcase card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.7 }}
        >
          <Card className="w-full h-[500px] bg-bms-darker/90 border-bms-border/80 relative overflow-hidden">
            <Spotlight size={350} className="from-bms-cyan/20 via-bms-cyan/10 to-transparent" />

            <div className="flex h-full">
              {/* Left — text content */}
              <div className="flex-1 p-8 lg:p-12 relative z-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-bms-cyan/20 bg-bms-cyan/5 mb-6 w-fit">
                  <Zap className="w-3 h-3 text-bms-cyan" />
                  <span className="text-[10px] font-semibold text-bms-cyan uppercase tracking-widest">
                    Interactive
                  </span>
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-bms-text leading-tight mb-4">
                  Future-proof<br />
                  <span className="bg-gradient-to-r from-bms-amber to-bms-cyan bg-clip-text text-transparent">
                    automation.
                  </span>
                </h3>

                <p className="text-bms-muted text-sm leading-relaxed mb-8 max-w-xs">
                  Drag to explore. Every system we build is designed to integrate seamlessly into your existing workflow — zero disruption, maximum output.
                </p>

                <Link
                  href="/automations"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-bms-cyan hover:text-bms-text transition-colors group"
                >
                  See our automations
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Right — 3D Spline scene (only load when section is visible) */}
              <div className="flex-1 relative">
                {isInView && (
                  <SplineScene
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
