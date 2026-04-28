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

// PATCH — toggle isActive (or update fields)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const { id } = params

  // Prevent deactivating yourself
  if (id === session!.user.id) {
    return NextResponse.json({ error: 'You cannot modify your own account' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { isActive } = body as { isActive?: boolean }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive boolean required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true, name: true, username: true, email: true,
        role: true, isActive: true, createdAt: true,
        userAutomations: { select: { automationId: true } },
      },
    })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}

// DELETE — remove user
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const { id } = params

  if (id === session!.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
