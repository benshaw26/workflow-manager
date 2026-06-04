import { NextRequest, NextResponse } from 'next/server'
import { reviewsDb } from '@/lib/reviews/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await reviewsDb.from('Lead').select('*, OutreachEvent(*), FollowUp(*)').eq('id', params.id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const allowed = ['status', 'notes', 'tags', 'assignedTo', 'dealValue', 'ownerFirstName', 'email', 'phone', 'website', 'generatedEmail', 'generatedLinkedInNote', 'generatedLinkedInDm', 'generatedFbPost', 'closedAt']
  const update: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) update[k] = body[k]

  const { data, error } = await reviewsDb.from('Lead').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
