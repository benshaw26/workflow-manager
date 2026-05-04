import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const ALL_AUTOMATION_IDS = [
  'property-analysis',
  'invoice-creation',
  'content-creation',
  'ai-chatbot',
  'email-marketing',
  'email-response',
  'bio-creation',
]

export async function seedAdminIfNeeded() {
  try {
    const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (existing) return

    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@bmsservices.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'BmsAdmin2025!'
    const adminName     = process.env.ADMIN_NAME     || 'Site Admin'

    const hashed = await bcrypt.hash(adminPassword, 12)

    const user = await prisma.user.create({
      data: {
        name:     adminName,
        username: adminUsername.toLowerCase(),
        email:    adminEmail.toLowerCase(),
        password: hashed,
        role:     'ADMIN',
        isActive: true,
      },
    })

    for (const automationId of ALL_AUTOMATION_IDS) {
      await prisma.userAutomation.upsert({
        where: { userId_automationId: { userId: user.id, automationId } },
        create: { userId: user.id, automationId, grantedBy: 'system' },
        update: {},
      })
    }

    console.log('[BMS] Admin account seeded:', user.email)
  } catch (err) {
    console.error('[BMS] Admin seed failed:', err)
  }
}
