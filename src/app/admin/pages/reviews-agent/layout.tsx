'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Overview', href: '/admin/pages/reviews-agent' },
  { label: 'Discover', href: '/admin/pages/reviews-agent/discover' },
  { label: 'CRM', href: '/admin/pages/reviews-agent/crm' },
]

export default function ReviewsAgentLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/pages" className="text-bms-muted hover:text-bms-text text-sm transition-colors">Pages</Link>
          <span className="text-bms-muted text-sm">/</span>
          <span className="text-bms-text text-sm font-medium">Google Reviews Agent</span>
        </div>
        <h2 className="text-2xl font-bold text-bms-text flex items-center gap-2">
          <span className="text-bms-cyan">★</span> Google Reviews Agent
        </h2>
        <p className="text-bms-muted text-sm mt-0.5">Lead generation for the Google Reviews Manager product</p>
      </div>

      <div className="flex gap-1 border-b border-bms-border">
        {TABS.map(t => {
          const active = t.href === '/admin/pages/reviews-agent' ? path === t.href : path.startsWith(t.href)
          return (
            <Link key={t.href} href={t.href} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors', active ? 'border-bms-cyan text-bms-cyan' : 'border-transparent text-bms-muted hover:text-bms-text')}>
              {t.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}
