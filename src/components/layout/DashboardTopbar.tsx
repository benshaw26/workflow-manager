'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { User } from 'lucide-react'

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/my-automations': 'My Automations',
  '/automations': 'Automations',
  '/booking': 'Book a Demo',
}

export function DashboardTopbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <header className="h-14 bg-bms-darker/80 backdrop-blur-md border-b border-bms-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <p className="text-[10px] text-bms-muted uppercase tracking-[0.15em] font-medium">BMS Services</p>
        <h1 className="text-sm font-semibold text-bms-text leading-tight">
          {Object.entries(breadcrumbs).find(([key]) => pathname.startsWith(key) && (key === '/dashboard' ? pathname === key : true))?.[1] ?? 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-xs font-semibold text-bms-text">{session?.user?.name ?? 'Client'}</p>
          <p className="text-[10px] text-bms-muted">{session?.user?.email}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bms-cyan to-bms-purple flex items-center justify-center shadow-cyan-glow">
          <User className="w-4 h-4 text-bms-dark" />
        </div>
      </div>
    </header>
  )
}
