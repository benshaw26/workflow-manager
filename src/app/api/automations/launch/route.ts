import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const SHARED_SECRET = process.env.SHARED_JWT_SECRET || 'bms-shared-secret-change-in-production'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { automationId } = await request.json()

  // Verify the user has access to this automation
  const access = await prisma.userAutomation.findUnique({
    where: {
      userId_automationId: {
        userId: session.user.id,
        automationId,
      },
    },
  })

  if (!access) {
    return NextResponse.json({ error: 'You do not have access to this automation.' }, { status: 403 })
  }

  const token = jwt.sign(
    {
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
    SHARED_SECRET,
    { expiresIn: '24h' }
  )

  return NextResponse.json({ token })
}
