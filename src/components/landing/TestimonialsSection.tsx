'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star } from 'lucide-react'
import { TESTIMONIALS } from '@/lib/constants'
import { staggerContainer, staggerItem } from '@/lib/animations'

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 bg-bms-dark" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-bms-cyan/30 bg-bms-cyan/5 text-bms-cyan text-sm font-medium mb-4">
            Client Results
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-bms-text mb-4">
            Businesses That{' '}
            <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
              Trust BMS Services
            </span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="bg-bms-card border border-bms-border rounded-xl p-6 hover:border-bms-cyan/30 hover:shadow-card-hover transition-all duration-300 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-bms-muted text-sm leading-relaxed flex-1 mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-bms-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bms-cyan to-bms-purple flex items-center justify-center text-bms-dark font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-bms-text font-semibold text-sm">{t.name}</p>
                  <p className="text-bms-muted text-xs">{t.role} · {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
