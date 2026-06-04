import { NextRequest } from 'next/server'
import { reviewsDb } from '@/lib/reviews/supabase'
import { searchPlaces, getPlaceDetails, qualifyLead, calcPainScore } from '@/lib/reviews/google-places'
import { scrapeWebsite } from '@/lib/reviews/scraper'
import { generateOutreachContent } from '@/lib/reviews/claude'
import { TARGET_CATEGORIES, TARGET_LOCATIONS, UK_REGIONS } from '@/lib/reviews/constants'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    categories = TARGET_CATEGORIES.slice(0, 3),
    locations = ['Buckinghamshire'],
    radiusMeters = 8000,
    scrape = true,
    generateContent = true,
    limit = 20,
  } = body

  const selectedLocations = locations.flatMap((region: string) =>
    (UK_REGIONS[region] || TARGET_LOCATIONS.filter(l => l.name === region)).map(l => l)
  )

  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: object) => controller.enqueue(enc.encode(`data: ${JSON.stringify(msg)}\n\n`))
      const seen = new Set<string>()
      let qualifiedCount = 0, processedCount = 0

      try {
        for (const category of categories) {
          if (qualifiedCount >= limit) break
          for (const location of selectedLocations) {
            if (qualifiedCount >= limit) break
            send({ type: 'progress', message: `Searching ${category} in ${location.name}...` })

            let places
            try { places = await searchPlaces(`${category} near`, location.lat, location.lng, radiusMeters) }
            catch (e) { send({ type: 'error', message: `Search failed: ${e}` }); continue }

            for (const place of places) {
              if (qualifiedCount >= limit || seen.has(place.placeId)) continue
              seen.add(place.placeId); processedCount++

              const { data: existing } = await reviewsDb.from('Lead').select('id').eq('placeId', place.placeId).single()
              if (existing) { send({ type: 'skip', message: `Already have ${place.name}` }); continue }

              send({ type: 'progress', message: `Checking ${place.name}...` })
              let details
              try { details = await getPlaceDetails(place.placeId) } catch { continue }
              if (!details) continue

              const q = qualifyLead(details)
              if (!q.qualified) {
                await reviewsDb.from('Lead').insert({
                  placeId: details.placeId, businessName: details.name, category,
                  address: details.address, town: location.name, reviewCount: details.reviewCount,
                  starRating: details.rating, phone: details.phone, website: details.website,
                  googleMapsUrl: details.googleMapsUrl, hasRepliedToReviews: q.hasReplied,
                  reviewsLast90Days: q.reviewsLast90Days,
                  lastReviewDate: details.reviews[0] ? new Date(details.reviews[0].time * 1000).toISOString() : null,
                  status: 'DISQUALIFIED', disqualifiedReason: q.reason, painScore: 0,
                })
                send({ type: 'disqualified', message: `${details.name} — ${q.reason}` }); continue
              }

              // Find competitor
              let competitor: { name: string; reviewCount: number } | undefined
              try {
                const comps = await searchPlaces(`${category} near`, location.lat, location.lng, radiusMeters + 5000)
                const better = comps.filter(c => c.placeId !== place.placeId && c.reviewCount > details.reviewCount).sort((a, b) => b.reviewCount - a.reviewCount)
                if (better[0]) competitor = { name: better[0].name, reviewCount: better[0].reviewCount }
              } catch { /* no competitor */ }

              const painScore = calcPainScore({ reviewsLast90Days: q.reviewsLast90Days, hasReplied: q.hasReplied, rating: details.rating, competitorReviews: competitor?.reviewCount, reviewCount: details.reviewCount })

              let ownerFirstName: string | undefined, email: string | undefined
              if (scrape && details.website) {
                send({ type: 'progress', message: `Scraping ${details.name}...` })
                try { const s = await scrapeWebsite(details.website); ownerFirstName = s.ownerFirstName; email = s.email } catch { /* skip */ }
              }

              let generatedEmail: string | undefined, generatedLinkedInNote: string | undefined, generatedLinkedInDm: string | undefined
              if (generateContent) {
                send({ type: 'progress', message: `Generating outreach for ${details.name}...` })
                try {
                  const c = await generateOutreachContent({ businessName: details.name, ownerFirstName, category, reviewCount: details.reviewCount, starRating: details.rating, lastReviewDate: details.reviews[0] ? new Date(details.reviews[0].time * 1000).toLocaleDateString('en-GB') : undefined, reviewsLast90Days: q.reviewsLast90Days, hasReplied: q.hasReplied, nearestCompetitorName: competitor?.name, nearestCompetitorReviewCount: competitor?.reviewCount, town: location.name })
                  generatedEmail = `Subject: ${c.email.subject}\n\n${c.email.body}`
                  generatedLinkedInNote = c.linkedInNote; generatedLinkedInDm = c.linkedInDm
                } catch { /* skip */ }
              }

              const { data: lead } = await reviewsDb.from('Lead').insert({
                placeId: details.placeId, businessName: details.name, category, ownerFirstName, email,
                phone: details.phone, website: details.website, googleMapsUrl: details.googleMapsUrl,
                address: details.address, town: location.name, reviewCount: details.reviewCount,
                starRating: details.rating, lastReviewDate: details.reviews[0] ? new Date(details.reviews[0].time * 1000).toISOString() : null,
                reviewsLast90Days: q.reviewsLast90Days, hasRepliedToReviews: q.hasReplied,
                nearestCompetitorName: competitor?.name, nearestCompetitorReviewCount: competitor?.reviewCount,
                painScore, status: 'QUALIFIED', generatedEmail, generatedLinkedInNote, generatedLinkedInDm,
              }).select().single()

              qualifiedCount++
              send({ type: 'lead', lead, message: `✓ ${details.name} — pain ${painScore}/10` })
            }
          }
        }
        send({ type: 'complete', qualifiedCount, processedCount })
      } catch (e) { send({ type: 'error', message: String(e) }) }
      finally { controller.close() }
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
