import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Check which critical env vars are present (never expose values)
  const checks = {
    DATABASE_URL:      !!process.env.DATABASE_URL,
    DIRECT_URL:        !!process.env.DIRECT_URL,
    NEXTAUTH_SECRET:   !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL:      !!process.env.NEXTAUTH_URL,
    NEXTAUTH_URL_value: process.env.NEXTAUTH_URL ?? 'NOT SET',
  }

  // Try DB connection
  let dbOk = false
  let dbError = ''
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message.slice(0, 120) : 'Unknown error'
  }

  const allGood = checks.DATABASE_URL && checks.NEXTAUTH_SECRET && checks.NEXTAUTH_URL && dbOk

  return NextResponse.json({
    status: allGood ? 'ok' : 'issues found',
    env: checks,
    database: { connected: dbOk, error: dbError || null },
  }, { status: allGood ? 200 : 500 })
}
