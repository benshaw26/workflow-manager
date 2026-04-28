'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { BMSLogoIcon } from '@/components/ui/BMSLogo'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-bms-dark/80 backdrop-blur-xl border-b border-bms-border/60 shadow-[0_1px_0_0_rgba(0,212,255,0.05)]'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <BMSLogoIcon className="w-8 h-8 transition-opacity duration-300 group-hover:opacity-80" />
          <span className="text-sm font-bold tracking-tight text-bms-text group-hover:text-bms-cyan transition-colors duration-300 font-display">
            BMS<span className="text-bms-cyan ml-1">Services</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-bms-muted hover:text-bms-text transition-colors duration-200 rounded-lg hover:bg-bms-card group"
            >
              {link.label}
              <span className="absolute bottom-1 left-4 right-4 h-px bg-bms-cyan scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-1">
          {session ? (
            <Link href={session.user?.role === 'ADMIN' ? '/admin' : '/dashboard'}>
              <LiquidButton size="sm" className="border border-bms-cyan/30 text-bms-cyan text-xs font-bold tracking-wide px-5">
                Dashboard
              </LiquidButton>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-bms-muted hover:text-bms-text transition-colors px-3 py-2 rounded-lg hover:bg-bms-card">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-medium text-bms-muted hover:text-bms-cyan transition-colors px-3 py-2 rounded-lg hover:bg-bms-card">
                Sign Up
              </Link>
              <div className="w-px h-4 bg-bms-border mx-1" />
              <Link href="/booking">
                <LiquidButton size="sm" className="border border-bms-cyan/30 text-bms-cyan text-xs font-bold tracking-wide px-5">
                  Book Demo
                </LiquidButton>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-bms-muted hover:text-bms-text transition-colors rounded-lg hover:bg-bms-card"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-bms-dark/95 backdrop-blur-xl border-b border-bms-border overflow-hidden"
          >
            <div className="px-4 py-5 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-bms-muted hover:text-bms-cyan hover:bg-bms-card text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-bms-border flex flex-col gap-2">
                {session ? (
                  <Link href={session.user?.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)}>
                    <LiquidButton size="lg" className="w-full border border-bms-cyan/30 text-bms-cyan font-bold">Dashboard</LiquidButton>
                  </Link>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 block px-3 py-2.5 text-center text-sm font-medium text-bms-muted hover:text-bms-text hover:bg-bms-card rounded-lg transition-colors border border-bms-border">
                        Sign In
                      </Link>
                      <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex-1 block px-3 py-2.5 text-center text-sm font-medium text-bms-cyan hover:text-bms-cyan/80 hover:bg-bms-card rounded-lg transition-colors border border-bms-cyan/30">
                        Sign Up
                      </Link>
                    </div>
                    <Link href="/booking" onClick={() => setMobileOpen(false)}>
                      <LiquidButton size="lg" className="w-full border border-bms-cyan/30 text-bms-cyan font-bold">Book Demo</LiquidButton>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
