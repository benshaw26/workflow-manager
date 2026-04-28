'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AutomationCard } from '@/components/automations/AutomationCard'
import { AutomationModal } from '@/components/automations/AutomationModal'
import { AUTOMATIONS } from '@/lib/constants'
import type { Automation } from '@/types'

const CATEGORIES = ['All', 'Analysis', 'Finance', 'Marketing', 'Support']

export default function PublicAutomationsPage() {
  const [selected, setSelected] = useState<Automation | null>(null)
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? AUTOMATIONS : AUTOMATIONS.filter((a) => a.category === filter)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bms-dark pt-24 pb-16">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-bms-cyan/3 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-bms-purple/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-bms-cyan/30 bg-bms-cyan/5 text-bms-cyan text-sm font-medium mb-4">
              Our Services
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-bms-text mb-4">
              AI Automations That{' '}
              <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
                Transform Businesses
              </span>
            </h1>
            <p className="text-bms-muted text-lg max-w-2xl mx-auto">
              Every automation is custom-built for your workflows. Click any card to see full details, benefits, and use cases.
            </p>
          </motion.div>

          {/* Filter tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  filter === cat
                    ? 'bg-bms-cyan text-bms-dark border-bms-cyan font-bold'
                    : 'border-bms-border text-bms-muted hover:border-bms-cyan/40 hover:text-bms-cyan'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((automation, i) => (
              <motion.div
                key={automation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <AutomationCard
                  automation={automation as Automation}
                  onClick={setSelected}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />
      <AutomationModal automation={selected} onClose={() => setSelected(null)} />
    </>
  )
}
