import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getReceiptGoogleConnection, getGoogleConnection } from '@/lib/google-auth'
import { gmailReceiptForwarderRunner } from '@/lib/automations/gmail-receipt-forwarder'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasAccess = await prisma.userAutomation.findFirst({
    where: { userId: session.user.id, automationId: 'receipt-forwarder' },
  })
  if (!hasAccess && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No access' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>

  // Inject Google token from httpOnly cookie
  const conn = getReceiptGoogleConnection(request) ?? getGoogleConnection(request)
  const enrichedBody: Record<string, unknown> = {
    ...body,
    ...(conn && conn.expires_at > Date.now() ? { _googleAccessToken: conn.access_token } : {}),
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      try {
        for await (const event of gmailReceiptForwarderRunner(enrichedBody)) {
          send(event)
        }
      } catch (err) {
        send({ type: 'workflow_error', error: String(err) })
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
