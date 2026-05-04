'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import {
  Building2, FileText, PenTool, MessageSquare, Mail, Inbox, Share2, UserCircle, Clapperboard, Receipt,
  TrendingUp, CheckCircle2, Clock, ArrowRight, Lock,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { LaunchButton } from './LaunchButton'
import { staggerContainer, staggerItem } from '@/lib/animations'
import type { Automation } from '@/types'

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, FileText, PenTool, MessageSquare, Mail, Inbox, Share2, UserCircle, Clapperboard, Receipt,
}

const WEIGHTS: Record<string, number> = {
  'property-analysis':     0.28,
  'invoice-creation':      0.14,
  'content-creation':      0.18,
  'ai-chatbot':            0.16,
  'email-marketing':       0.09,
  'email-response':        0.06,
  'social-media-scheduler': 0.09,
}

interface Totals {
  runs: number
  success: number
  failed: number
  timeMins: number
}

interface Props {
  automations: Automation[]
  totals: Totals
}

export function AutomationsGrid({ automations, totals }: Props) {
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true })
  const gridInView = useInView(gridRef, { once: true, margin: '-50px' })

  if (automations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-bms-card border border-bms-border rounded-2xl p-16 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-bms-border flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-bms-muted" />
        </div>
        <h3 className="text-bms-text font-bold text-xl mb-2">No automations yet</h3>
        <p className="text-bms-muted text-sm mb-6 max-w-sm mx-auto">
          You don&apos;t have access to any automations yet. Book a demo to get your first automation running.
        </p>
        <Link
          href="/booking"
          className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold text-sm px-6 py-3 rounded-xl hover:bg-bms-cyan-dark transition-colors"
        >
          Book a Free Demo <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary stat cards */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 16 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Runs"
          value={totals.runs}
          trend={12}
          icon={<TrendingUp className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Successful"
          value={totals.success}
          trend={8}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Hours Saved"
          value={Math.round(totals.timeMins / 60 * 10) / 10}
          suffix="h"
          trend={15}
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Failed"
          value={totals.failed}
          icon={<Building2 className="w-5 h-5" />}
          color="purple"
        />
      </motion.div>

      {totals.runs === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-bms-cyan/5 border border-bms-cyan/20 rounded-xl p-4 text-sm text-bms-muted"
        >
          No analytics data yet — go to{' '}
          <Link href="/dashboard" className="text-bms-cyan hover:underline font-medium">Dashboard</Link>{' '}
          and load demo data, or launch an automation to start recording real runs.
        </motion.div>
      )}

      {/* Automation cards grid */}
      <motion.div
        ref={gridRef}
        variants={staggerContainer}
        initial="hidden"
        animate={gridInView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {automations.map((automation) => {
          const w = WEIGHTS[automation.id] ?? 0.1
          const runs    = Math.round(totals.runs * w)
          const success = Math.round(totals.success * w)
          const failed  = Math.round(totals.failed * w)
          const hours   = Math.round((totals.timeMins * w) / 60 * 10) / 10
          const rate    = runs > 0 ? Math.round((success / runs) * 100) : 0
          const Icon    = ICON_MAP[automation.icon] ?? Building2

          return (
            <motion.div
              key={automation.id}
              variants={staggerItem}
              className="group bg-bms-card border border-bms-border rounded-2xl p-6 flex flex-col gap-5 hover:border-bms-cyan/40 hover:shadow-card-hover transition-all duration-300"
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  automation.color === 'cyan'
                    ? 'bg-bms-cyan/10 border-bms-cyan/20 text-bms-cyan'
                    : 'bg-bms-purple/10 border-bms-purple/20 text-bms-purple'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Active</span>
                </div>
              </div>

              {/* Title + tagline */}
              <div>
                <h3 className="text-bms-text font-bold text-base mb-1 group-hover:text-bms-cyan transition-colors duration-300">
                  {automation.title}
                </h3>
                <p className="text-bms-muted text-xs leading-relaxed line-clamp-2">{automation.tagline}</p>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Runs', value: runs.toLocaleString(), color: 'text-bms-cyan' },
                  { label: 'Success', value: `${rate}%`, color: 'text-emerald-400' },
                  { label: 'Saved', value: `${hours}h`, color: 'text-bms-purple' },
                  { label: 'Failed', value: failed.toLocaleString(), color: 'text-red-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-bms-darker rounded-xl p-3 border border-bms-border/50">
                    <p className="text-[10px] text-bms-muted uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-bms-border">
                {automation.launchUrl ? (
                  <LaunchButton automationId={automation.id} launchUrl={automation.launchUrl} />
                ) : (
                  <span className="text-bms-muted text-xs italic">No app configured</span>
                )}
                <Link
                  href={`/dashboard/my-automations/${automation.id}`}
                  className="inline-flex items-center gap-1 text-xs text-bms-muted hover:text-bms-cyan transition-colors group/link"
                >
                  Analytics
                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
