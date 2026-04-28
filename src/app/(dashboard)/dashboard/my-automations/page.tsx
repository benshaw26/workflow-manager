import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AUTOMATIONS } from '@/lib/constants'
import { AutomationsGrid } from './AutomationsGrid'

export default async function MyAutomationsPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  // Only show automations this user has been granted access to
  const grantedRecords = await prisma.userAutomation.findMany({
    where: { userId },
    select: { automationId: true },
  })
  const grantedIds = new Set(grantedRecords.map((r) => r.automationId))
  const userAutomations = AUTOMATIONS.filter((a) => grantedIds.has(a.id))

  const snapshots = await prisma.analyticsSnapshot.findMany({ where: { userId } })

  const totals = snapshots.reduce(
    (acc, s) => ({
      runs:     acc.runs     + s.automationRuns,
      success:  acc.success  + s.successfulOutputs,
      failed:   acc.failed   + s.failedOutputs,
      timeMins: acc.timeMins + s.timeSavedMinutes,
    }),
    { runs: 0, success: 0, failed: 0, timeMins: 0 }
  )

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page header */}
      <div>
        <span className="inline-block px-3 py-1 rounded-full border border-bms-cyan/30 bg-bms-cyan/5 text-bms-cyan text-xs font-medium mb-3">
          Your Workspace
        </span>
        <h2 className="text-3xl font-bold text-bms-text">
          My{' '}
          <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
            Automations
          </span>
        </h2>
        <p className="text-bms-muted text-sm mt-1.5">
          Launch your automations, monitor performance, and track ROI — all in one place.
        </p>
      </div>

      <AutomationsGrid automations={userAutomations} totals={totals} />
    </div>
  )
}
