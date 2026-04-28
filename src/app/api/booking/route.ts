import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { TIME_SLOTS } from '@/lib/constants'

// GET: return booked slots for a given date
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')

  if (!dateParam) {
    return NextResponse.json({ error: 'date query parameter required' }, { status: 400 })
  }

  const date = parseISO(dateParam)
  const bookings = await prisma.booking.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      status: { not: 'CANCELLED' },
    },
    select: { scheduledAt: true },
  })

  const bookedTimes = bookings.map((b) => format(new Date(b.scheduledAt), 'HH:mm'))
  const slots = TIME_SLOTS.map((t) => ({ time: t, available: !bookedTimes.includes(t) }))

  return NextResponse.json({ slots, bookedTimes })
}

const bookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  service: z.string().min(1),
  message: z.string().optional(),
  date: z.string(), // ISO date string
  time: z.string(), // HH:mm
})

// POST: create a booking
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const data = bookingSchema.parse(body)

    const [hours, minutes] = data.time.split(':').map(Number)
    const scheduledAt = parseISO(data.date)
    scheduledAt.setHours(hours, minutes, 0, 0)

    // Check slot still available
    const conflicting = await prisma.booking.findFirst({
      where: {
        scheduledAt,
        status: { not: 'CANCELLED' },
      },
    })

    if (conflicting) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another.' },
        { status: 409 }
      )
    }

    const booking = await prisma.booking.create({
      data: {
        userId: session?.user?.id ?? null,
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        service: data.service,
        message: data.message,
        scheduledAt,
        status: 'PENDING',
      },
    })

    // Mock email confirmation (console log)
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 NEW BOOKING CONFIRMATION — BMS Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:       ${booking.id}
Name:     ${booking.name}
Email:    ${booking.email}
Company:  ${booking.company ?? 'N/A'}
Phone:    ${booking.phone ?? 'N/A'}
Service:  ${booking.service}
Date:     ${format(scheduledAt, 'EEEE, dd MMMM yyyy')}
Time:     ${format(scheduledAt, 'HH:mm')} GMT
Message:  ${booking.message ?? 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[In production: send confirmation email via Resend]
    `)

    return NextResponse.json({ booking, success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('[BOOKING ERROR]', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
