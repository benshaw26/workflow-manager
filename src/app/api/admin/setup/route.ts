import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const ALL_AUTOMATION_IDS = [
  'property-analysis',
  'invoice-creation',
  'content-creation',
  'ai-chatbot',
  'email-marketing',
  'email-response',
]

// One-time admin setup endpoint.
// Only works if no ADMIN user exists — safe to leave deployed as it's a no-op after first use.
export async function GET() {
  // Check if admin already exists
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (existing) {
    return NextResponse.json({ message: 'Admin already exists', email: existing.email }, { status: 409 })
  }

  const adminEmail    = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName     = process.env.ADMIN_NAME     ?? 'Admin'
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin'

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set' },
      { status: 500 }
    )
  }

  const hashed = await bcrypt.hash(adminPassword, 12)

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name:     adminName,
      username: adminUsername,
      email:    adminEmail,
      password: hashed,
      role:     'ADMIN',
      isActive: true,
    },
    update: {
      role:     'ADMIN',
      isActive: true,
      password: hashed,
    },
  })

  for (const automationId of ALL_AUTOMATION_IDS) {
    await prisma.userAutomation.upsert({
      where: { userId_automationId: { userId: user.id, automationId } },
      create: { userId: user.id, automationId, grantedBy: 'setup-api' },
      update: {},
    })
  }

  return NextResponse.json({
    message: 'Admin account created successfully',
    email: user.email,
    note: 'Delete or disable this endpoint after use.',
  })
}
