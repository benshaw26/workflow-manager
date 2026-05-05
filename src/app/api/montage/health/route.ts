import { NextResponse } from 'next/server'

const MONTAGE_SERVER = process.env.MONTAGE_SERVER_URL ?? 'http://localhost:3001'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(`${MONTAGE_SERVER}/api/montage/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      return NextResponse.json({ online: true, url: MONTAGE_SERVER })
    }
    // Server responded but not OK — still counts as reachable
    return NextResponse.json({ online: true, url: MONTAGE_SERVER, status: res.status })
  } catch {
    // Try the root as a fallback ping
    try {
      await fetch(MONTAGE_SERVER, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })
      return NextResponse.json({ online: true, url: MONTAGE_SERVER })
    } catch {
      return NextResponse.json({ online: false, url: MONTAGE_SERVER }, { status: 503 })
    }
  }
}
