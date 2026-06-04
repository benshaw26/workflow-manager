import { NextRequest, NextResponse } from 'next/server'
import { reviewsDb } from '@/lib/reviews/supabase'
import { sendEmail } from '@/lib/reviews/brevo'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { type, subject, emailBody, sendNow } = await req.json()

  const { data: lead } = await reviewsDb.from('Lead').select('*').eq('id', params.id).single()
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: event } = await reviewsDb.from('OutreachEvent').insert({ leadId: params.id, type, channel: type, subject, body: emailBody, status: 'DRAFT' }).select().single()

  if (sendNow && type === 'EMAIL' && lead.email && subject && emailBody) {
    const result = await sendEmail(lead.email, lead.ownerFirstName || lead.businessName, subject, emailBody)
    if (result.error) {
      await reviewsDb.from('OutreachEvent').update({ status: 'FAILED' }).eq('id', event.id)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    await reviewsDb.from('OutreachEvent').update({ status: 'SENT', sentAt: new Date().toISOString() }).eq('id', event.id)
    await reviewsDb.from('Lead').update({ status: 'CONTACTED' }).eq('id', params.id)
  }

  return NextResponse.json(event)
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data } = await reviewsDb.from('OutreachEvent').select('*').eq('leadId', params.id).order('createdAt', { ascending: false })
  return NextResponse.json(data || [])
}
