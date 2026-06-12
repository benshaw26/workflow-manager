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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const pages = await prisma.userPage.findMany({
    where: { userId: params.id },
    select: { pageId: true },
  })

  return NextResponse.json(pages.map((p) => p.pageId))
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const { pageId } = await request.json() as { pageId: string }

  if (!pageId) {
    return NextResponse.json({ error: 'pageId required' }, { status: 400 })
  }

  await prisma.userPage.upsert({
    where: { userId_pageId: { userId: params.id, pageId } },
    create: { userId: params.id, pageId, grantedBy: session!.user.id },
    update: {},
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const { pageId } = await request.json() as { pageId: string }

  if (!pageId) {
    return NextResponse.json({ error: 'pageId required' }, { status: 400 })
  }

  try {
    await prisma.userPage.delete({
      where: { userId_pageId: { userId: params.id, pageId } },
    })
  } catch {
    // Already unassigned — treat as success
  }

  return NextResponse.json({ success: true })
}
