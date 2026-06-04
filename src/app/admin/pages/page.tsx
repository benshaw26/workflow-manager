'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Star, BarChart2, Mail, ArrowRight } from 'lucide-react'

const PAGES = [
  {
    id: 'reviews-agent',
    title: 'Google Reviews Agent',
    tagline: 'Find and close leads for the Google Reviews Manager product.',
    description:
      'Discovers qualified local UK businesses, scores them by pain, scrapes owner contact details, and writes personalised cold emails, LinkedIn DMs, and Facebook posts — all in one dashboard.',
    icon: Star,
    color: 'cyan',
    href: '/admin/pages/reviews-agent',
    stats: [
      { label: 'Qualification filters', value: '6' },
      { label: 'UK regions covered', value: '11' },
      { label: 'Outreach channels', value: '3' },
    ],
    tags: ['Lead Gen', 'AI Outreach', 'CRM'],
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    tagline: 'Live overview of client activity and platform usage.',
    description: 'View client logins, automation launches, booking volume, and engagement trends across all BMS Services products.',
    icon: BarChart2,
    color: 'purple',
    href: '/dashboard',
    stats: [],
    tags: ['Internal', 'Clients'],
  },
]

export default function AdminPagesPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-bms-text flex items-center gap-2">
          <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-bms-cyan/10 border border-bms-cyan/20">
            <svg className="w-4 h-4 text-bms-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          Pages
        </h2>
        <p className="text-bms-muted text-sm mt-1">
          Internal tools and dashboards for BMS Services operations.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PAGES.map((page, i) => {
          const Icon = page.icon
          const isCyan = page.color === 'cyan'

          return (
            <motion.a
              key={page.id}
              href={page.href}
              target={page.href.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -3 }}
              className="group block bg-bms-card border border-bms-border rounded-xl p-6 hover:border-bms-cyan/40 hover:shadow-[0_0_24px_rgba(6,182,212,0.08)] transition-all duration-300 cursor-pointer"
            >
              {/* Icon + tags row */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCyan
                    ? 'bg-bms-cyan/10 border border-bms-cyan/20'
                    : 'bg-bms-purple/10 border border-bms-purple/20'
                }`}>
                  <Icon className={`w-5 h-5 ${isCyan ? 'text-bms-cyan' : 'text-bms-purple'}`} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {page.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full border border-bms-border text-bms-muted bg-bms-darker"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-bms-text mb-1.5 group-hover:text-bms-cyan transition-colors duration-300 flex items-center gap-2">
                {page.title}
                {page.href.startsWith('http') && (
                  <ExternalLink className="w-3.5 h-3.5 text-bms-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </h3>
              <p className="text-bms-muted text-sm leading-relaxed mb-4">{page.tagline}</p>

              {/* Stats row */}
              {page.stats.length > 0 && (
                <div className="flex gap-4 mb-4 pt-3 border-t border-bms-border">
                  {page.stats.map((s) => (
                    <div key={s.label}>
                      <div className={`text-xl font-bold font-mono ${isCyan ? 'text-bms-cyan' : 'text-bms-purple'}`}>
                        {s.value}
                      </div>
                      <div className="text-xs text-bms-muted">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-bms-cyan group-hover:gap-2 transition-all duration-200">
                Open {page.href.startsWith('http') ? 'app' : 'page'}
                <ArrowRight className="w-3 h-3" />
              </span>
            </motion.a>
          )
        })}
      </div>

      {/* Empty slot hint */}
      <div className="border border-dashed border-bms-border rounded-xl p-6 text-center text-bms-muted">
        <Mail className="w-6 h-6 mx-auto mb-2 opacity-30" />
        <p className="text-sm">More internal tools will appear here as BMS Services grows.</p>
      </div>
    </div>
  )
}
