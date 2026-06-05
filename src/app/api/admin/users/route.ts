import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

function adminGuard(session: Session | null) {
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      userAutomations: { select: { automationId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

const createSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be 32 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens — no spaces'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const guard = adminGuard(session)
  if (guard) return guard

  try {
    const body = await request.json()
    const { username, email, password, name } = createSchema.parse(body)

    const lowerEmail    = email.toLowerCase()
    const lowerUsername = username.toLowerCase()

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: lowerEmail }, { username: lowerUsername }] },
    })

    if (existing) {
      const field = existing.email === lowerEmail ? 'email' : 'username'
      return NextResponse.json(
        { error: `A user with this ${field} already exists` },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name:     name ?? null,
        username: lowerUsername,
        email:    lowerEmail,
        password: hashed,
        role:     'CLIENT',
        isActive: true,
      },
      select: {
        id: true, name: true, username: true, email: true,
        role: true, isActive: true, createdAt: true,
        userAutomations: { select: { automationId: true } },
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('[ADMIN CREATE USER]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
