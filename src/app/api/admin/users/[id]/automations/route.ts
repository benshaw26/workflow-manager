import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function adminGuard(session: Session | null) {
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

// GET — list assigned automation IDs for a user
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const automations = await prisma.userAutomation.findMany({
    where: { userId: params.id },
    select: { automationId: true },
  })

  return NextResponse.json(automations.map((a) => a.automationId))
}

// POST — assign automation { automationId }
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const { automationId } = await request.json() as { automationId: string }

  if (!automationId) {
    return NextResponse.json({ error: 'automationId required' }, { status: 400 })
  }

  await prisma.userAutomation.upsert({
    where: { userId_automationId: { userId: params.id, automationId } },
    create: { userId: params.id, automationId, grantedBy: session!.user.id },
    update: {},
  })

  return NextResponse.json({ success: true })
}

// DELETE — unassign automation { automationId } in body
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const { automationId } = await request.json() as { automationId: string }

  if (!automationId) {
    return NextResponse.json({ error: 'automationId required' }, { status: 400 })
  }

  try {
    await prisma.userAutomation.delete({
      where: { userId_automationId: { userId: params.id, automationId } },
    })
  } catch {
    // Already unassigned — treat as success
  }

  return NextResponse.json({ success: true })
}
