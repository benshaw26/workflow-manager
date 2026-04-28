'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, Zap, Calendar, LogOut, User, Bot, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const clientNavItems = [
  { label: 'Dashboard',       href: '/dashboard',                icon: LayoutDashboard },
  { label: 'My Automations',  href: '/dashboard/my-automations', icon: Bot },
  { label: 'Automations',     href: '/automations',              icon: Zap },
  { label: 'Book a Demo',     href: '/booking',                  icon: Calendar },
]

const adminNavItems = [
  { label: 'Admin Panel',     href: '/admin',                    icon: ShieldCheck },
  { label: 'Dashboard',       href: '/dashboard',                icon: LayoutDashboard },
  { label: 'Automations',     href: '/automations',              icon: Zap },
  { label: 'Book a Demo',     href: '/booking',                  icon: Calendar },
]

function SidebarLogo() {
  const { open, animate } = useSidebar()
  return (
    <Link href="/" className="flex items-center gap-3 py-2 mb-2">
      <div className="w-8 h-8 bg-gradient-to-br from-bms-cyan to-bms-purple rounded-lg flex items-center justify-center flex-shrink-0 shadow-cyan-glow">
        <Zap className="w-4 h-4 text-bms-dark" />
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.2 }}
        className="text-base font-bold text-bms-text whitespace-pre !p-0 !m-0"
      >
        BMS <span className="text-bms-cyan">Services</span>
      </motion.span>
    </Link>
  )
}

function SidebarContent() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { open, animate } = useSidebar()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const isAdmin = session?.user?.role === 'ADMIN'
  const navItems = isAdmin ? adminNavItems : clientNavItems

  const links = navItems.map(({ label, href, icon: Icon }) => ({
    label,
    href,
    icon: (
      <Icon
        className={cn(
          'w-5 h-5 flex-shrink-0 transition-colors',
          isActive(href) ? 'text-bms-cyan' : 'text-bms-muted group-hover/sidebar:text-bms-cyan'
        )}
      />
    ),
  }))

  return (
    <SidebarBody className="justify-between gap-6">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarLogo />

        {/* Divider */}
        <motion.div
          animate={{ opacity: animate ? (open ? 1 : 0) : 1 }}
          className="h-px bg-bms-border mb-4"
        />

        <div className="flex flex-col gap-1">
          {links.map((link) => (
            <SidebarLink
              key={link.href}
              link={link}
              className={cn(
                isActive(link.href) && 'bg-bms-cyan/10 border border-bms-cyan/20'
              )}
            />
          ))}
        </div>
      </div>

      {/* User + sign out */}
      <div className="flex flex-col gap-2 border-t border-bms-border pt-4">
        <SidebarLink
          link={{
            label: session?.user?.name ?? 'Client',
            href: '/dashboard',
            icon: (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-bms-cyan to-bms-purple flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-bms-dark" />
              </div>
            ),
          }}
        />
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-2 py-2.5 w-full rounded-lg text-bms-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group/sidebar"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <motion.span
            animate={{
              display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium whitespace-pre !p-0 !m-0"
          >
            Sign Out
          </motion.span>
        </button>
      </div>
    </SidebarBody>
  )
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sidebar open={open} setOpen={setOpen} animate>
      <SidebarContent />
    </Sidebar>
  )
}
