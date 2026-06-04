import { NextRequest, NextResponse } from 'next/server'
import { reviewsDb } from '@/lib/reviews/supabase'
import { generateOutreachContent, generateFacebookPost } from '@/lib/reviews/claude'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { type } = await req.json()
  const { data: lead } = await reviewsDb.from('Lead').select('*').eq('id', params.id).single()
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (type === 'facebook') {
    const post = await generateFacebookPost(lead.category, lead.town || 'UK')
    await reviewsDb.from('Lead').update({ generatedFbPost: post }).eq('id', params.id)
    return NextResponse.json({ generatedFbPost: post })
  }

  const c = await generateOutreachContent({ businessName: lead.businessName, ownerFirstName: lead.ownerFirstName, category: lead.category, reviewCount: lead.reviewCount, starRating: lead.starRating, lastReviewDate: lead.lastReviewDate ? new Date(lead.lastReviewDate).toLocaleDateString('en-GB') : undefined, reviewsLast90Days: lead.reviewsLast90Days, hasReplied: lead.hasRepliedToReviews, nearestCompetitorName: lead.nearestCompetitorName, nearestCompetitorReviewCount: lead.nearestCompetitorReviewCount, town: lead.town })
  const updates = { generatedEmail: `Subject: ${c.email.subject}\n\n${c.email.body}`, generatedLinkedInNote: c.linkedInNote, generatedLinkedInDm: c.linkedInDm }
  await reviewsDb.from('Lead').update(updates).eq('id', params.id)
  return NextResponse.json(updates)
}
