import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AUTOMATIONS } from '@/lib/constants'
import { subDays, startOfDay } from 'date-fns'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Must be logged in' }, { status: 401 })
  }

  const userId = session.user.id

  // Delete existing snapshots for this user
  await prisma.analyticsSnapshot.deleteMany({ where: { userId } })

  // Generate 30 days of realistic mock data
  const snapshots = Array.from({ length: 30 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 29 - i))
    const runs = Math.floor(Math.random() * 40) + 5
    const successful = Math.floor(runs * (0.85 + Math.random() * 0.13))
    const failed = runs - successful
    const items = Math.floor(runs * (3 + Math.random() * 5))

    return {
      userId,
      date,
      automationRuns: runs,
      itemsAnalyzed: items,
      successfulOutputs: successful,
      failedOutputs: failed,
      timeSavedMinutes: Math.floor(runs * (8 + Math.random() * 12)),
    }
  })

  await prisma.analyticsSnapshot.createMany({ data: snapshots })

  // Grant access to all automations
  for (const automation of AUTOMATIONS) {
    await prisma.userAutomation.upsert({
      where: { userId_automationId: { userId, automationId: automation.id } },
      update: {},
      create: { userId, automationId: automation.id, grantedBy: 'seed' },
    })
  }

  return NextResponse.json({
    success: true,
    message: `Seeded 30 days of mock analytics and granted all automations for ${session.user.email}`,
    count: snapshots.length,
  })
}
