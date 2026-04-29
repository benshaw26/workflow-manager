'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { HOW_IT_WORKS } from '@/lib/constants'
import { staggerContainer, staggerItem } from '@/lib/animations'

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 bg-bms-darker" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-bms-purple/30 bg-bms-purple/5 text-bms-purple-light text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-bms-text mb-4">
            Simple Process.{' '}
            <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
              Real Results.
            </span>
          </h2>
          <p className="text-bms-muted text-lg max-w-2xl mx-auto">
            From first conversation to live results — a clear, collaborative process designed around your business goals.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          {/* Connecting lines (desktop) */}
          <div className="hidden lg:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-bms-cyan/30 via-bms-purple/30 to-bms-cyan/30" />

          {HOW_IT_WORKS.map((step, index) => (
            <motion.div
              key={step.step}
              variants={staggerItem}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-bms-cyan/20 to-bms-purple/20 border border-bms-border animate-pulse-slow" />
                <div className="absolute inset-2 rounded-full bg-bms-card border border-bms-border flex items-center justify-center">
                  <span className="text-3xl font-black bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
                    {step.step}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-bms-text mb-3">{step.title}</h3>
              <p className="text-bms-muted text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
