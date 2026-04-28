import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, format, startOfDay } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const thirtyDaysAgo = subDays(new Date(), 30)

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      userId,
      date: { gte: startOfDay(thirtyDaysAgo) },
    },
    orderBy: { date: 'asc' },
  })

  // Build 30-day series (fill gaps with 0)
  const seriesMap = new Map<string, { runs: number; success: number; failed: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM dd')
    seriesMap.set(d, { runs: 0, success: 0, failed: 0 })
  }

  for (const s of snapshots) {
    const key = format(new Date(s.date), 'MMM dd')
    seriesMap.set(key, {
      runs: s.automationRuns,
      success: s.successfulOutputs,
      failed: s.failedOutputs,
    })
  }

  const series = Array.from(seriesMap.entries()).map(([date, vals]) => ({
    date,
    ...vals,
  }))

  // Compute totals
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

  // Generate insights
  const insights: string[] = []
  if (totals.automationRuns > 0) {
    const successRate = Math.round((totals.successfulOutputs / totals.automationRuns) * 100)
    insights.push(`Your automations achieved a ${successRate}% success rate over the last 30 days.`)

    // Find peak day
    const peakEntry = series.reduce((max, s) => (s.runs > max.runs ? s : max), series[0])
    if (peakEntry && peakEntry.runs > 0) {
      insights.push(`Peak performance day: ${peakEntry.date} with ${peakEntry.runs} automation runs.`)
    }

    if (totals.itemsAnalyzed > 0) {
      insights.push(`${totals.itemsAnalyzed.toLocaleString()} items analysed — saving your team an estimated ${totals.timeSavedHours} hours of manual work.`)
    }

    const recentSeries = series.slice(-7)
    const recentRuns = recentSeries.reduce((a, s) => a + s.runs, 0)
    const prevSeries = series.slice(-14, -7)
    const prevRuns = prevSeries.reduce((a, s) => a + s.runs, 0)
    if (prevRuns > 0) {
      const change = Math.round(((recentRuns - prevRuns) / prevRuns) * 100)
      if (change > 0) {
        insights.push(`Automation volume is up ${change}% this week compared to last week — great momentum!`)
      } else if (change < 0) {
        insights.push(`Automation volume is down ${Math.abs(change)}% this week. Consider scheduling more runs.`)
      }
    }
  } else {
    insights.push('No automation runs yet. Book a demo to get started with your first automation!')
    insights.push('Once live, your dashboard will show run counts, success rates, and trend insights here.')
  }

  const response = NextResponse.json({ totals, series, insights })
  response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
  return response
}
