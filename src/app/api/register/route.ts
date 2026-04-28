import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be 32 characters or fewer')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, _ and -'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, email, password } = schema.parse(body)

    const lowerEmail = email.toLowerCase()
    const lowerUsername = username.toLowerCase()

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerEmail },
          { username: lowerUsername },
        ],
      },
    })

    if (existing) {
      if (existing.email === lowerEmail) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'That username is already taken' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        username: lowerUsername,
        email: lowerEmail,
        password: hashedPassword,
        role: 'CLIENT',
        isActive: true,
      },
    })

    return NextResponse.json(
      { id: user.id, email: user.email, username: user.username },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
