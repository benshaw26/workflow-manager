import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { platform, content, hashtags, scheduledAt } = await request.json()

  if (!platform || !content || !scheduledAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const post = await prisma.scheduledPost.create({
    data: {
      userId: session.user.id,
      platform,
      content,
      hashtags: JSON.stringify(hashtags || []),
      scheduledAt: new Date(scheduledAt),
    },
  })

  return NextResponse.json({ post })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const posts = await prisma.scheduledPost.findMany({
    where: { userId: session.user.id },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      hashtags: JSON.parse(p.hashtags),
    })),
  })
}
