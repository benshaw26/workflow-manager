import { type NextRequest, NextResponse } from 'next/server'

const MONTAGE_SERVER = process.env.MONTAGE_SERVER_URL ?? 'http://localhost:3001'

function buildUpstreamUrl(req: NextRequest, pathSegments: string[]): string {
  const upstreamPath = pathSegments.join('/')
  const search = req.nextUrl.search ?? ''
  return `${MONTAGE_SERVER}/api/${upstreamPath}${search}`
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const upstreamUrl = buildUpstreamUrl(req, path)

  // Forward relevant headers — including Range for video seeking
  const forwardHeaders: HeadersInit = {
    'Content-Type': req.headers.get('Content-Type') ?? 'application/json',
  }
  const range = req.headers.get('Range')
  if (range) forwardHeaders['Range'] = range

  const accept = req.headers.get('Accept')
  if (accept) forwardHeaders['Accept'] = accept

  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text()
    } catch {
      body = undefined
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body || undefined,
      // @ts-expect-error Node 18+ fetch supports duplex
      duplex: body ? 'half' : undefined,
    })

    const responseHeaders = new Headers()
    // Forward content-type, content-length, content-range, etc.
    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase()
      if (
        lower === 'content-type' ||
        lower === 'content-length' ||
        lower === 'content-range' ||
        lower === 'accept-ranges' ||
        lower === 'cache-control' ||
        lower === 'transfer-encoding'
      ) {
        responseHeaders.set(key, value)
      }
    }

    // SSE streams — return a streaming response
    const contentType = upstream.headers.get('Content-Type') ?? ''
    if (contentType.includes('text/event-stream')) {
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    const responseBody = await upstream.arrayBuffer()
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch {
    return NextResponse.json(
      { error: 'Montage server unreachable. Ensure the Relay desktop app is running.' },
      { status: 502 },
    )
  }
}

export const GET     = proxy
export const POST    = proxy
export const DELETE  = proxy
export const PUT     = proxy
export const PATCH   = proxy

export const dynamic = 'force-dynamic'
