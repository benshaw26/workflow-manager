const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const ALL_AUTOMATION_IDS = [
  'property-analysis',
  'invoice-creation',
  'content-creation',
  'ai-chatbot',
  'email-marketing',
  'email-response',
]

async function main() {
  // ── Admin seeding ────────────────────────────────────────────────────────
  // Prefer env vars; fall back to hard-coded defaults if not set
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminEmail    = process.env.ADMIN_EMAIL    || 'shawben381@gmail.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'BmsAdmin2025!'
  const adminName     = process.env.ADMIN_NAME     || 'Ben Shaw'

  console.log('Seeding admin account...')

  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: adminEmail } })
  }

  if (!user) {
    const hashed = await bcrypt.hash(adminPassword, 12)
    user = await prisma.user.create({
      data: {
        name:     adminName,
        username: adminUsername,
        email:    adminEmail,
        password: hashed,
        role:     'ADMIN',
        isActive: true,
      },
    })
    console.log('Created admin:', user.email)
    if (!process.env.ADMIN_PASSWORD) {
      console.log('⚠  Temporary password: BmsAdmin2025! — change this after first login')
    }
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role:     'ADMIN',
        isActive: true,
        username: user.username ?? adminUsername,
      },
    })
    console.log('Found existing admin:', user.email, '— ensured ADMIN role')
  }

  // ── Grant admin access to all automations ─────────────────────────────────
  for (const automationId of ALL_AUTOMATION_IDS) {
    await prisma.userAutomation.upsert({
      where: { userId_automationId: { userId: user.id, automationId } },
      create: { userId: user.id, automationId, grantedBy: 'seed' },
      update: {},
    })
  }
  console.log('Granted all automations to admin.')
  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
