import { NextRequest, NextResponse } from 'next/server'
import { reviewsDb } from '@/lib/reviews/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { dueAt, type, notes } = await req.json()
  const { data } = await reviewsDb.from('FollowUp').insert({ leadId: params.id, dueAt, type, notes }).select().single()
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { followUpId, completed, notes } = await req.json()
  const { data } = await reviewsDb.from('FollowUp').update({ completed, completedAt: completed ? new Date().toISOString() : null, notes }).eq('id', followUpId).select().single()
  return NextResponse.json(data)
}
