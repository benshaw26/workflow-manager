'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Building2, FileText, PenTool, MessageSquare, Mail, Inbox, Share2, UserCircle, Clapperboard, Receipt, TrendingUp, ArrowRight } from 'lucide-react'
import { AUTOMATIONS } from '@/lib/constants'
import { staggerContainer, staggerItem } from '@/lib/animations'

const iconMap: Record<string, React.ElementType> = {
  Building2, FileText, PenTool, MessageSquare, Mail, Inbox, Share2, UserCircle, Clapperboard, Receipt, TrendingUp,
}

export function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 bg-bms-dark" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-bms-cyan/30 bg-bms-cyan/5 text-bms-cyan text-sm font-medium mb-4">
            Our Services
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-bms-text mb-4">
            AI Automations Built{' '}
            <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
              for Your Business
            </span>
          </h2>
          <p className="text-bms-muted text-lg max-w-2xl mx-auto">
            Every automation is custom-built for your workflows. No off-the-shelf templates — just intelligent systems that work exactly how your business does.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {AUTOMATIONS.map((automation) => {
            const Icon = iconMap[automation.icon] ?? Building2
            return (
              <motion.div
                key={automation.id}
                variants={staggerItem}
                className="group bg-bms-card border border-bms-border rounded-xl p-6 hover:border-bms-cyan/40 hover:shadow-card-hover transition-all duration-300 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  automation.color === 'cyan'
                    ? 'bg-bms-cyan/10 border border-bms-cyan/20'
                    : 'bg-bms-purple/10 border border-bms-purple/20'
                }`}>
                  <Icon className={`w-6 h-6 ${automation.color === 'cyan' ? 'text-bms-cyan' : 'text-bms-purple-light'}`} />
                </div>
                <h3 className="text-lg font-semibold text-bms-text mb-2 group-hover:text-bms-cyan transition-colors duration-300">
                  {automation.title}
                </h3>
                <p className="text-bms-muted text-sm leading-relaxed mb-4">
                  {automation.tagline}
                </p>
                <Link
                  href="/automations"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-bms-cyan hover:gap-2 transition-all duration-200"
                >
                  Learn more <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12"
        >
          <Link href="/automations">
            <button className="inline-flex items-center gap-2 px-8 py-3 border border-bms-border text-bms-muted hover:text-bms-cyan hover:border-bms-cyan rounded-lg text-sm font-medium transition-all duration-200">
              View all automations <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
