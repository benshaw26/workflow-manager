export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { reviewsDb } from '@/lib/reviews/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const sortBy = searchParams.get('sortBy') || 'painScore'
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = 25

  let query = reviewsDb.from('Lead').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)
  if (search) query = query.or(`businessName.ilike.%${search}%,email.ilike.%${search}%,ownerFirstName.ilike.%${search}%`)
  query = query.order(sortBy, { ascending: false }).range((page - 1) * perPage, page * perPage - 1)

  const { data: leads, count, error } = await query
  if (error) return NextResponse.json({ leads: [], total: 0 })
  return NextResponse.json({ leads, total: count ?? 0, page, perPage })
}
