import { reviewsDb } from './supabase'
import { CHAIN_KEYWORDS, QUALIFICATION } from './constants'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const BASE_URL = 'https://places.googleapis.com/v1/places'
const CACHE_TTL_HOURS = 24

async function getCached(key: string): Promise<unknown | null> {
  try {
    const { data } = await reviewsDb
      .from('PlacesCache')
      .select('data, expiresAt')
      .eq('cacheKey', key)
      .single()
    if (!data || new Date(data.expiresAt) < new Date()) return null
    return JSON.parse(data.data)
  } catch { return null }
}

async function setCache(key: string, value: unknown) {
  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600000).toISOString()
  await reviewsDb.from('PlacesCache').upsert({ cacheKey: key, data: JSON.stringify(value), expiresAt })
}

export interface PlaceResult {
  placeId: string; name: string; address: string; rating: number
  reviewCount: number; phone?: string; website?: string
  googleMapsUrl: string; types: string[]; businessStatus: string
}

export interface PlaceReview {
  authorName: string; rating: number; text: string
  time: number; ownerReply?: string
}

export interface PlaceDetails extends PlaceResult {
  reviews: PlaceReview[]
}

export async function searchPlaces(query: string, lat: number, lng: number, radiusMeters = 8000): Promise<PlaceResult[]> {
  const cacheKey = `search_v2:${query}:${lat}:${lng}:${radiusMeters}`
  const cached = await getCached(cacheKey)
  if (cached) return cached as PlaceResult[]

  const res = await fetch(`${BASE_URL}:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.types,places.businessStatus',
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters } },
      languageCode: 'en-GB', regionCode: 'GB', maxResultCount: 20,
    }),
  })

  if (!res.ok) throw new Error(`Places API: ${res.status}`)
  const data = await res.json()

  const results: PlaceResult[] = (data.places || []).map((p: Record<string, unknown>) => ({
    placeId: p.id as string,
    name: (p.displayName as Record<string, string>)?.text || '',
    address: (p.formattedAddress as string) || '',
    rating: (p.rating as number) || 0,
    reviewCount: (p.userRatingCount as number) || 0,
    phone: p.nationalPhoneNumber as string | undefined,
    website: p.websiteUri as string | undefined,
    googleMapsUrl: (p.googleMapsUri as string) || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    types: (p.types as string[]) || [],
    businessStatus: (p.businessStatus as string) || 'OPERATIONAL',
  }))

  await setCache(cacheKey, results)
  await new Promise(r => setTimeout(r, 150))
  return results
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const cacheKey = `details_v2:${placeId}`
  const cached = await getCached(cacheKey)
  if (cached) return cached as PlaceDetails

  const res = await fetch(`${BASE_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,reviews,nationalPhoneNumber,websiteUri,googleMapsUri,types,businessStatus',
    },
  })

  if (!res.ok) { if (res.status === 404) return null; throw new Error(`Details: ${res.status}`) }
  const p = await res.json()

  const details: PlaceDetails = {
    placeId: p.id, name: p.displayName?.text || '',
    address: p.formattedAddress || '', rating: p.rating || 0, reviewCount: p.userRatingCount || 0,
    phone: p.nationalPhoneNumber, website: p.websiteUri,
    googleMapsUrl: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    types: p.types || [], businessStatus: p.businessStatus || 'OPERATIONAL',
    reviews: (p.reviews || []).map((r: Record<string, unknown>) => ({
      authorName: (r.authorAttribution as Record<string, string>)?.displayName || '',
      rating: (r.rating as number) || 0,
      text: (r.text as Record<string, string>)?.text || '',
      time: Math.floor(new Date((r.publishTime as string) || 0).getTime() / 1000),
      ownerReply: (r.ownerResponse as Record<string, string>)?.text,
    })),
  }

  await setCache(cacheKey, details)
  await new Promise(r => setTimeout(r, 150))
  return details
}

export function isChain(name: string): boolean {
  const lower = name.toLowerCase()
  return CHAIN_KEYWORDS.some(kw => lower.includes(kw))
}

export function qualifyLead(details: PlaceDetails) {
  const { reviewCount, rating, reviews } = details

  if (isChain(details.name)) return { qualified: false, reason: 'Likely a chain or franchise', reviewsLast90Days: 0, hasReplied: false }
  if (reviewCount < QUALIFICATION.minReviews) return { qualified: false, reason: `Too few reviews (${reviewCount})`, reviewsLast90Days: 0, hasReplied: false }
  if (reviewCount > QUALIFICATION.maxReviews) return { qualified: false, reason: `Too many reviews (${reviewCount})`, reviewsLast90Days: 0, hasReplied: false }
  if (rating <= QUALIFICATION.badRating) return { qualified: false, reason: `Rating too low (${rating})`, reviewsLast90Days: 0, hasReplied: false }
  if (rating >= QUALIFICATION.goodRating) return { qualified: false, reason: `Rating too high (${rating})`, reviewsLast90Days: 0, hasReplied: false }

  const ninetyAgo = Date.now() / 1000 - 90 * 86400
  const reviewsLast90Days = reviews.filter(r => r.time > ninetyAgo).length

  if (reviewsLast90Days >= QUALIFICATION.maxReviewsLast90Days) return { qualified: false, reason: `Too many recent reviews (${reviewsLast90Days})`, reviewsLast90Days, hasReplied: false }

  const thirtyAgo = Date.now() / 1000 - 30 * 86400
  const last5 = reviews.slice(0, 5)
  const repliedRecently = last5.some(r => r.ownerReply && r.time > thirtyAgo)
  if (repliedRecently) return { qualified: false, reason: 'Business replied to a recent review', reviewsLast90Days, hasReplied: true }

  return { qualified: true, reviewsLast90Days, hasReplied: last5.some(r => r.ownerReply) }
}

export function calcPainScore(p: { reviewsLast90Days: number; hasReplied: boolean; rating: number; competitorReviews?: number; reviewCount: number }): number {
  let s = 0
  if (p.reviewsLast90Days < 3) s += 3
  if (!p.hasReplied) s += 2
  if (p.rating >= 3.5 && p.rating <= 4.2) s += 2
  if (p.competitorReviews && p.competitorReviews >= p.reviewCount * 2) s += 2
  if (p.reviewCount < 40) s += 1
  return Math.min(s, 10)
}
