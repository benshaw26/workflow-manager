import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { StatCard } from '@/components/dashboard/StatCard'
import { AutomationRunsChart } from '@/components/dashboard/AutomationRunsChart'
import { OutputSuccessChart } from '@/components/dashboard/OutputSuccessChart'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Zap, Target, CheckCircle2, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { SeedButton } from './SeedButton'
import type { AnalyticsData } from '@/types'

async function getAnalytics(userId: string): Promise<AnalyticsData> {
  // In production, use absolute URL or direct DB call
  // For simplicity here we replicate the analytics logic inline
  const { prisma } = await import('@/lib/prisma')
  const { subDays, format, startOfDay } = await import('date-fns')

  const thirtyDaysAgo = subDays(new Date(), 30)
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: { userId, date: { gte: startOfDay(thirtyDaysAgo) } },
    orderBy: { date: 'asc' },
  })

  const seriesMap = new Map<string, { runs: number; success: number; failed: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM dd')
    seriesMap.set(d, { runs: 0, success: 0, failed: 0 })
  }
  for (const s of snapshots) {
    const key = format(new Date(s.date), 'MMM dd')
    seriesMap.set(key, { runs: s.automationRuns, success: s.successfulOutputs, failed: s.failedOutputs })
  }

  const series = Array.from(seriesMap.entries()).map(([date, vals]) => ({ date, ...vals }))
  const totals = snapshots.reduce(
    (acc, s) => ({
      automationRuns: acc.automationRuns + s.automationRuns,
      itemsAnalyzed: acc.itemsAnalyzed + s.itemsAnalyzed,
      successfulOutputs: acc.successfulOutputs + s.successfulOutputs,
      failedOutputs: acc.failedOutputs + s.failedOutputs,
      timeSavedHours: acc.timeSavedHours + s.timeSavedMinutes / 60,
    }),
    { automationRuns: 0, itemsAnalyzed: 0, successfulOutputs: 0, failedOutputs: 0, timeSavedHours: 0 }
  )
  totals.timeSavedHours = Math.round(totals.timeSavedHours * 10) / 10

  const insights: string[] = []
  if (totals.automationRuns > 0) {
    const successRate = Math.round((totals.successfulOutputs / totals.automationRuns) * 100)
    insights.push(`Your automations achieved a ${successRate}% success rate over the last 30 days.`)
    const peak = series.reduce((max, s) => (s.runs > max.runs ? s : max), series[0])
    if (peak?.runs > 0) insights.push(`Peak performance day: ${peak.date} with ${peak.runs} runs.`)
    if (totals.itemsAnalyzed > 0) insights.push(`${totals.itemsAnalyzed.toLocaleString()} items analysed, saving ~${totals.timeSavedHours} hours of manual work.`)
    const recentRuns = series.slice(-7).reduce((a, s) => a + s.runs, 0)
    const prevRuns = series.slice(-14, -7).reduce((a, s) => a + s.runs, 0)
    if (prevRuns > 0) {
      const change = Math.round(((recentRuns - prevRuns) / prevRuns) * 100)
      insights.push(change >= 0
        ? `Automation volume up ${change}% this week vs last week — great momentum!`
        : `Volume down ${Math.abs(change)}% this week. Consider scheduling more runs.`)
    }
  } else {
    insights.push('No automation runs yet. Seed demo data or go live to see insights here!')
    insights.push('Once active, your dashboard will show real-time trends and performance analytics.')
  }

  return { totals, series, insights }
}

async function getRecentActivity(userId: string) {
  const { prisma } = await import('@/lib/prisma')
  const runs = await prisma.analyticsSnapshot.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 10,
  })
  // Mock recent activity items from snapshots
  return runs.map((r) => ({
    id: r.id,
    type: 'PROPERTY_ANALYSIS',
    status: r.successfulOutputs > 0 ? 'SUCCESS' : 'FAILED',
    createdAt: r.date.toISOString(),
  }))
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Admins have their own panel
  if (session?.user?.role === 'ADMIN') {
    redirect('/admin')
  }

  const userId = session!.user.id

  const [analytics, activity] = await Promise.all([
    getAnalytics(userId),
    getRecentActivity(userId),
  ])

  const hasData = analytics.totals.automationRuns > 0

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-bms-text">
            Welcome back, {session?.user?.name?.split(' ')[0] ?? 'Client'} 👋
          </h2>
          <p className="text-bms-muted text-sm mt-1">Here&apos;s your automation performance overview</p>
        </div>
        {!hasData && <SeedButton />}
      </div>

      {!hasData && (
        <div className="bg-bms-cyan/5 border border-bms-cyan/20 rounded-xl p-4 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-bms-cyan flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-bms-text text-sm font-medium">No data yet — load demo analytics</p>
            <p className="text-bms-muted text-xs mt-1">
              Click &quot;Load Demo Data&quot; to populate 30 days of mock analytics, or{' '}
              <Link href="/booking" className="text-bms-cyan hover:underline">book a demo</Link>{' '}
              to get your real automations running.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Automation Runs"
          value={analytics.totals.automationRuns}
          trend={12}
          icon={<Zap className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Items Analysed"
          value={analytics.totals.itemsAnalyzed}
          trend={8}
          icon={<Target className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Successful Outputs"
          value={analytics.totals.successfulOutputs}
          trend={5}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Hours Saved"
          value={analytics.totals.timeSavedHours}
          suffix="h"
          trend={15}
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AutomationRunsChart data={analytics.series} />
        </div>
        <div>
          <OutputSuccessChart totals={analytics.totals} />
        </div>
      </div>

      {/* Insights + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightsPanel insights={analytics.insights} />
        <ActivityFeed items={activity} />
      </div>
    </div>
  )
}
