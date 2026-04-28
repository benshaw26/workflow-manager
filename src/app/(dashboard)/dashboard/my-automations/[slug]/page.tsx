import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AUTOMATIONS } from '@/lib/constants'
import { notFound } from 'next/navigation'
import { format, subDays, startOfDay } from 'date-fns'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/StatCard'
import { AutomationRunsChart } from '@/components/dashboard/AutomationRunsChart'
import { OutputSuccessChart } from '@/components/dashboard/OutputSuccessChart'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import {
  Building2, FileText, PenTool, MessageSquare, Mail, Inbox,
  Zap, Target, CheckCircle2, Clock, ArrowLeft,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  Building2:    <Building2 className="w-5 h-5" />,
  FileText:     <FileText className="w-5 h-5" />,
  PenTool:      <PenTool className="w-5 h-5" />,
  MessageSquare:<MessageSquare className="w-5 h-5" />,
  Mail:         <Mail className="w-5 h-5" />,
  Inbox:        <Inbox className="w-5 h-5" />,
}

const WEIGHTS: Record<string, number> = {
  'property-analysis': 0.30,
  'invoice-creation':  0.15,
  'content-creation':  0.20,
  'ai-chatbot':        0.18,
  'email-marketing':   0.10,
  'email-response':    0.07,
}

export default async function AutomationDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const automation = AUTOMATIONS.find((a) => a.id === params.slug)
  if (!automation) notFound()

  const session = await getServerSession(authOptions)
  const userId = session!.user.id
  const w = WEIGHTS[automation.id] ?? 0.1

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'asc' },
  })

  const seriesMap = new Map<string, { runs: number; success: number; failed: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM dd')
    seriesMap.set(d, { runs: 0, success: 0, failed: 0 })
  }
  for (const s of snapshots) {
    const key = format(new Date(s.date), 'MMM dd')
    seriesMap.set(key, {
      runs:    Math.round(s.automationRuns * w),
      success: Math.round(s.successfulOutputs * w),
      failed:  Math.round(s.failedOutputs * w),
    })
  }
  const series = Array.from(seriesMap.entries()).map(([date, vals]) => ({ date, ...vals }))

  const totals = snapshots.reduce(
    (acc, s) => ({
      automationRuns:    acc.automationRuns    + Math.round(s.automationRuns * w),
      itemsAnalyzed:     acc.itemsAnalyzed     + Math.round(s.itemsAnalyzed * w),
      successfulOutputs: acc.successfulOutputs + Math.round(s.successfulOutputs * w),
      failedOutputs:     acc.failedOutputs     + Math.round(s.failedOutputs * w),
      timeSavedHours:    acc.timeSavedHours    + (s.timeSavedMinutes * w) / 60,
    }),
    { automationRuns: 0, itemsAnalyzed: 0, successfulOutputs: 0, failedOutputs: 0, timeSavedHours: 0 }
  )
  totals.timeSavedHours = Math.round(totals.timeSavedHours * 10) / 10

  const insights: string[] = []
  if (totals.automationRuns > 0) {
    const rate = Math.round((totals.successfulOutputs / totals.automationRuns) * 100)
    insights.push(`${automation.title} achieved a ${rate}% success rate over the last 30 days.`)
    const peak = series.reduce((max, s) => (s.runs > max.runs ? s : max), series[0])
    if (peak?.runs > 0) insights.push(`Peak day: ${peak.date} with ${peak.runs} runs.`)
    if (totals.itemsAnalyzed > 0)
      insights.push(`${totals.itemsAnalyzed.toLocaleString()} items processed, saving ~${totals.timeSavedHours}h of manual work.`)
    const recent = series.slice(-7).reduce((a, s) => a + s.runs, 0)
    const prev   = series.slice(-14, -7).reduce((a, s) => a + s.runs, 0)
    if (prev > 0) {
      const change = Math.round(((recent - prev) / prev) * 100)
      insights.push(change >= 0
        ? `Volume up ${change}% this week — great momentum!`
        : `Volume down ${Math.abs(change)}% this week vs last.`)
    }
  } else {
    insights.push('No runs yet for this automation. Load demo data from the Dashboard to see analytics.')
  }

  const accentColor = automation.color === 'cyan' ? 'text-bms-cyan' : 'text-bms-purple'
  const accentBg    = automation.color === 'cyan' ? 'bg-bms-cyan/10' : 'bg-bms-purple/10'

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <Link
          href="/dashboard/my-automations"
          className="inline-flex items-center gap-1.5 text-bms-muted hover:text-bms-text text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          My Automations
        </Link>

        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBg} ${accentColor}`}>
            {ICON_MAP[automation.icon]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-bms-text">{automation.title}</h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Active</span>
              </span>
            </div>
            <p className="text-bms-muted text-sm mt-0.5">{automation.tagline}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Runs"
          value={totals.automationRuns}
          trend={12}
          icon={<Zap className="w-5 h-5" />}
          color={automation.color === 'cyan' ? 'cyan' : 'purple'}
        />
        <StatCard
          title="Items Processed"
          value={totals.itemsAnalyzed}
          trend={8}
          icon={<Target className="w-5 h-5" />}
          color={automation.color === 'cyan' ? 'purple' : 'cyan'}
        />
        <StatCard
          title="Successful Outputs"
          value={totals.successfulOutputs}
          trend={5}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color={automation.color === 'cyan' ? 'cyan' : 'purple'}
        />
        <StatCard
          title="Hours Saved"
          value={totals.timeSavedHours}
          suffix="h"
          trend={15}
          icon={<Clock className="w-5 h-5" />}
          color={automation.color === 'cyan' ? 'purple' : 'cyan'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AutomationRunsChart data={series} />
        </div>
        <div>
          <OutputSuccessChart totals={totals} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightsPanel insights={insights} />
        <div className="bg-bms-card border border-bms-border rounded-xl p-6">
          <h3 className="text-bms-text font-semibold mb-3 text-sm uppercase tracking-wide">About this Automation</h3>
          <p className="text-bms-muted text-sm leading-relaxed mb-4">{automation.description}</p>
          <ul className="space-y-2">
            {automation.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-bms-muted">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
