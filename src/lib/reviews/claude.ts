import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EMAIL_SYSTEM = `You write cold outreach emails for Ben Shaw at BMS Services (bmsservices.uk).
BMS Services sells a Google Reviews Manager — automatically follows up with recent customers to get more Google reviews, flags negative feedback before it goes public, sends weekly performance reports. Starts at £150/month for pilot clients.

Rules:
- Max 150 words in the body
- No bullet points, bold text, or headers
- Plain conversational prose only
- Subject must reference the specific business and their review situation
- Open with a specific observation using the real numbers
- Mention the competitor by name and review count
- Make the pain real without being insulting
- Offer a free 30-day trial — no card, no commitment
- End with a single CTA: a 10-minute call
- Sign off as Ben from BMS Services with bmsservices.uk
- Do not use "I hope this finds you well"
- Do not mention AI
- Must feel written specifically for that business, not a template
- Warm, direct, British tone`

const LINKEDIN_SYSTEM = `You write short LinkedIn outreach for Ben Shaw from BMS Services (bmsservices.uk), helping local UK businesses get more Google reviews.
Connection note: under 300 chars, genuine local business connection feel, not a sales pitch.
Follow-up DM: under 100 words, mentions one specific thing about their business, offers the free pilot.`

interface EmailInput {
  businessName: string; ownerFirstName?: string; category: string
  reviewCount: number; starRating: number; lastReviewDate?: string
  reviewsLast90Days: number; hasReplied: boolean
  nearestCompetitorName?: string; nearestCompetitorReviewCount?: number; town?: string
}

export async function generateOutreachContent(input: EmailInput) {
  const ctx = `Business: ${input.businessName}
Owner: ${input.ownerFirstName || 'not found'}
Category: ${input.category}
Location: ${input.town || 'UK'}
Reviews: ${input.reviewCount} total, ${input.reviewsLast90Days} in last 90 days
Rating: ${input.starRating}/5
Last review: ${input.lastReviewDate || 'unknown'}
Replied to last 5 reviews: ${input.hasReplied ? 'yes' : 'no'}
Nearest competitor: ${input.nearestCompetitorName || 'none found'} (${input.nearestCompetitorReviewCount || '?'} reviews)`

  const [emailResp, liResp] = await Promise.all([
    client.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 600, system: EMAIL_SYSTEM,
      messages: [{ role: 'user', content: `Write a cold email for this business. Return JSON: {"subject":"...","body":"..."}\n\n${ctx}` }],
    }),
    client.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 400, system: LINKEDIN_SYSTEM,
      messages: [{ role: 'user', content: `Write LinkedIn outreach. Return JSON: {"connectionNote":"...","followUpDm":"..."}\n\n${ctx}` }],
    }),
  ])

  const emailJson = JSON.parse((emailResp.content[0] as { text: string }).text.match(/\{[\s\S]*\}/)?.[0] || '{}')
  const liJson = JSON.parse((liResp.content[0] as { text: string }).text.match(/\{[\s\S]*\}/)?.[0] || '{}')

  return {
    email: { subject: emailJson.subject || `${input.businessName} — your Google reviews`, body: emailJson.body || '' },
    linkedInNote: liJson.connectionNote || '',
    linkedInDm: liJson.followUpDm || '',
  }
}

export async function generateFacebookPost(category: string, town: string): Promise<string> {
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 200,
    messages: [{ role: 'user', content: `Write a Facebook group post under 80 words for local ${category} businesses in ${town || 'the UK'} who might want more Google reviews. Mention a free 30-day pilot. Not spammy. Sign off as Ben from BMS Services (bmsservices.uk). Return just the post text.` }],
  })
  return (resp.content[0] as { text: string }).text
}
