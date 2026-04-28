import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-bms-secret')
  if (!secret || secret !== process.env.BMS_CALLBACK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    userId: string
    automationId: string
    itemsAnalyzed: number
    successfulOutputs: number
    failedOutputs: number
    timeSavedMinutes: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, itemsAnalyzed, successfulOutputs, failedOutputs, timeSavedMinutes } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const today = startOfDay(new Date())

  const existing = await prisma.analyticsSnapshot.findFirst({
    where: { userId, date: today },
  })

  if (existing) {
    await prisma.analyticsSnapshot.update({
      where: { id: existing.id },
      data: {
        automationRuns:    { increment: 1 },
        itemsAnalyzed:     { increment: itemsAnalyzed ?? 0 },
        successfulOutputs: { increment: successfulOutputs ?? 0 },
        failedOutputs:     { increment: failedOutputs ?? 0 },
        timeSavedMinutes:  { increment: timeSavedMinutes ?? 0 },
      },
    })
  } else {
    await prisma.analyticsSnapshot.create({
      data: {
        userId,
        date: today,
        automationRuns: 1,
        itemsAnalyzed:     itemsAnalyzed ?? 0,
        successfulOutputs: successfulOutputs ?? 0,
        failedOutputs:     failedOutputs ?? 0,
        timeSavedMinutes:  timeSavedMinutes ?? 0,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
