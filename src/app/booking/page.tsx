'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'
import { BookingProgress } from '@/components/booking/BookingProgress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { AUTOMATIONS } from '@/lib/constants'

const STEPS = ['Select Date & Time', 'Your Details', 'Confirmation']

const detailsSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  company: z.string().optional(),
  phone: z.string().optional(),
  service: z.string().min(1, 'Please select a service'),
  message: z.string().optional(),
})

type DetailsData = z.infer<typeof detailsSchema>

export default function PublicBookingPage() {
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const [booking, setBooking] = useState<{ id: string; name: string } | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<DetailsData>({
    resolver: zodResolver(detailsSchema),
  })

  const onSubmit = async (data: DetailsData) => {
    if (!selectedDate || !selectedTime) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Booking failed')
      setBooking({ id: json.booking.id, name: data.name })
      setStep(3)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bms-dark pt-24 pb-16">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-bms-cyan/3 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-bms-purple/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-bms-cyan/30 bg-bms-cyan/5 text-bms-cyan text-sm font-medium mb-4">
              Free Consultation
            </span>
            <h1 className="text-4xl font-bold text-bms-text mb-3">
              Book Your{' '}
              <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
                Free Demo
              </span>
            </h1>
            <p className="text-bms-muted">
              30-minute call · No commitment · Results in days
            </p>
          </motion.div>

          <BookingProgress step={step} steps={STEPS} />

          <div className="bg-bms-card border border-bms-border rounded-2xl p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-bms-text mb-1">Select a Date</h2>
                    <p className="text-bms-muted text-sm mb-4">Monday–Friday · GMT timezone · Available from tomorrow</p>
                    <div className="bg-bms-darker border border-bms-border rounded-xl p-4 inline-block">
                      <BookingCalendar selected={selectedDate} onSelect={setSelectedDate} />
                    </div>
                  </div>
                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="text-bms-text font-medium mb-3">{format(selectedDate, 'EEEE, dd MMMM yyyy')}</p>
                      <TimeSlotPicker selected={selectedTime} onSelect={setSelectedTime} />
                    </motion.div>
                  )}
                  <Button className="w-full gap-2" disabled={!selectedDate || !selectedTime} onClick={() => setStep(2)}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-6 p-3 bg-bms-cyan/5 border border-bms-cyan/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-bms-cyan" />
                    <span className="text-bms-cyan text-sm font-medium">
                      {selectedDate && format(selectedDate, 'EEE, dd MMM yyyy')} at {selectedTime} GMT
                    </span>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input id="name" label="Full Name *" placeholder="James Harrison" error={errors.name?.message} {...register('name')} />
                      <Input id="email" label="Email *" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
                      <Input id="company" label="Company" placeholder="Acme Ltd" {...register('company')} />
                      <Input id="phone" label="Phone" placeholder="+44 7700 900000" {...register('phone')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-bms-text mb-1.5">Service of Interest *</label>
                      <select className="w-full px-4 py-3 bg-bms-darker border border-bms-border rounded-lg text-bms-text focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan transition-all" {...register('service')}>
                        <option value="">Select a service...</option>
                        {AUTOMATIONS.map((a) => <option key={a.id} value={a.title}>{a.title}</option>)}
                        <option value="General Enquiry">General Enquiry</option>
                      </select>
                      {errors.service && <p className="text-xs text-red-400 mt-1">{errors.service.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-bms-text mb-1.5">Message (optional)</label>
                      <textarea rows={3} placeholder="Tell us about your business..." className="w-full px-4 py-3 bg-bms-darker border border-bms-border rounded-lg text-bms-text placeholder-bms-muted focus:outline-none focus:ring-2 focus:ring-bms-cyan/50 focus:border-bms-cyan transition-all resize-none" {...register('message')} />
                    </div>
                    {submitError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{submitError}</div>}
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
                      <Button type="submit" loading={submitting} className="flex-1 gap-2">Confirm Booking <ArrowRight className="w-4 h-4" /></Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && booking && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-bms-text mb-2">You&apos;re booked in!</h2>
                  <p className="text-bms-muted mb-6">
                    Thanks {booking.name.split(' ')[0]}! Your demo is confirmed for{' '}
                    <span className="text-bms-cyan font-semibold">
                      {selectedDate && format(selectedDate, 'EEEE, dd MMMM yyyy')} at {selectedTime}
                    </span>
                  </p>
                  <div className="bg-bms-darker border border-bms-border rounded-xl p-4 text-left mb-6 max-w-xs mx-auto">
                    <p className="text-bms-text text-sm">📅 {selectedDate && format(selectedDate, 'EEE, dd MMM yyyy')}</p>
                    <p className="text-bms-text text-sm">🕐 {selectedTime} GMT · 30 minutes</p>
                    <p className="text-bms-text text-sm">🎯 {getValues('service')}</p>
                    <p className="text-xs text-bms-muted mt-2">Reference: {booking.id.slice(0, 8)}</p>
                  </div>
                  <p className="text-bms-muted text-sm mb-6">Our team will email you a meeting link shortly.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
