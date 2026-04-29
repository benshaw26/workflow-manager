import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Globe, Bot, Megaphone, FileText, Mail, Inbox, MessageSquare,
  Calendar, CheckCircle2, Clock, Zap, ArrowRight, Headphones,
} from 'lucide-react'

const SERVICE_META: Record<string, { icon: React.ElementType; color: string; desc: string; category: string }> = {
  'property-analysis':  { icon: Globe,        color: '#00d4ff', desc: 'AI scans and scores property listings for investment potential.', category: 'Analysis' },
  'invoice-creation':   { icon: FileText,     color: '#a855f7', desc: 'Auto-generates professional invoices from your data in seconds.', category: 'Finance' },
  'content-creation':   { icon: Megaphone,    color: '#00d4ff', desc: 'AI-written blogs, social posts, and ad copy at scale.', category: 'Marketing' },
  'ai-chatbot':         { icon: Bot,          color: '#a855f7', desc: '24/7 intelligent customer support agent for your business.', category: 'Support' },
  'email-marketing':    { icon: Mail,         color: '#00d4ff', desc: 'Personalised email campaigns built and sent automatically.', category: 'Marketing' },
  'email-response':     { icon: Inbox,        color: '#a855f7', desc: 'Reads, understands and replies to incoming emails for you.', category: 'Support' },
}

async function getUserServices(userId: string) {
  const automations = await prisma.userAutomation.findMany({
    where: { userId },
    orderBy: { grantedAt: 'asc' },
  })
  return automations
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role === 'ADMIN') {
    redirect('/admin')
  }

  const userId = session!.user.id
  const services = await getUserServices(userId)
  const firstName = session?.user?.name?.split(' ')[0] ?? session?.user?.username ?? 'there'

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bms-text">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-bms-muted text-sm mt-1">
            Here&apos;s an overview of your active BMS Services.
          </p>
        </div>
        <Link
          href="/booking"
          className="inline-flex items-center gap-2 px-4 py-2 bg-bms-purple/10 border border-bms-purple/30 text-bms-purple-light rounded-xl text-sm font-medium hover:bg-bms-purple/20 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Book a call
        </Link>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-bms-card border border-bms-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-bms-cyan/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-bms-cyan" />
          </div>
          <div>
            <p className="text-xl font-bold text-bms-text">{services.length}</p>
            <p className="text-xs text-bms-muted">Active Service{services.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="bg-bms-card border border-bms-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-bms-purple/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-bms-purple-light" />
          </div>
          <div>
            <p className="text-xl font-bold text-bms-text">Live</p>
            <p className="text-xs text-bms-muted">Account Status</p>
          </div>
        </div>
        <div className="bg-bms-card border border-bms-border rounded-xl p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-lg bg-bms-cyan/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-bms-cyan" />
          </div>
          <div>
            <p className="text-xl font-bold text-bms-text">24/7</p>
            <p className="text-xs text-bms-muted">Automation Uptime</p>
          </div>
        </div>
      </div>

      {/* Services section */}
      <div>
        <h2 className="text-base font-semibold text-bms-text mb-4">Your Services</h2>

        {services.length === 0 ? (
          /* No services yet */
          <div className="bg-bms-card border border-bms-border rounded-2xl p-10 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-4 text-bms-muted opacity-40" />
            <p className="text-bms-text font-medium mb-1">No services active yet</p>
            <p className="text-bms-muted text-sm mb-5">
              Book a discovery call and we&apos;ll set you up with the right AI services for your business.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-bms-purple text-white rounded-xl text-sm font-medium hover:bg-bms-purple/90 transition-colors"
            >
              Book a free call
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => {
              const meta = SERVICE_META[s.automationId]
              if (!meta) return null
              const Icon = meta.icon
              return (
                <div
                  key={s.id}
                  className="bg-bms-card border border-bms-border rounded-2xl p-5 hover:border-bms-cyan/30 transition-all duration-300 group flex flex-col gap-4"
                >
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: meta.color + '18' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-medium">Active</span>
                    </div>
                  </div>

                  {/* Label + category */}
                  <div className="flex-1">
                    <span className="text-xs font-medium text-bms-muted uppercase tracking-wider">{meta.category}</span>
                    <h3 className="text-bms-text font-semibold text-sm mt-0.5 mb-1.5">
                      {s.automationId
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </h3>
                    <p className="text-bms-muted text-xs leading-relaxed">{meta.desc}</p>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-bms-border flex items-center justify-between">
                    <span className="text-xs text-bms-muted">
                      Since {new Date(s.grantedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                    <Link
                      href={`/my-automations/${s.automationId}`}
                      className="text-xs font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
                      style={{ color: meta.color }}
                    >
                      Open <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Support CTA */}
      <div className="bg-gradient-to-r from-bms-purple/10 to-bms-cyan/10 border border-bms-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-bms-purple/15 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-5 h-5 text-bms-purple-light" />
        </div>
        <div className="flex-1">
          <p className="text-bms-text font-semibold text-sm">Need help or want to add a service?</p>
          <p className="text-bms-muted text-xs mt-0.5">Get in touch and I&apos;ll sort it — usually same day.</p>
        </div>
        <Link
          href="/booking"
          className="inline-flex items-center gap-2 px-4 py-2 bg-bms-purple text-white rounded-xl text-sm font-medium hover:bg-bms-purple/90 transition-colors whitespace-nowrap"
        >
          Get support
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  )
}
