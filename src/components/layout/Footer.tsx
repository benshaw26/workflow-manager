import Link from 'next/link'
import { Zap, Twitter, Linkedin, Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-bms-darker border-t border-bms-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-bms-cyan to-bms-purple rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-bms-dark" />
              </div>
              <span className="text-lg font-bold text-bms-text">
                BMS <span className="text-bms-cyan">Services</span>
              </span>
            </Link>
            <p className="text-bms-muted text-sm leading-relaxed max-w-xs">
              Transforming businesses through intelligent AI automations. Save time, reduce costs, and scale operations without limits.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-bms-muted hover:text-bms-cyan transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-bms-muted hover:text-bms-cyan transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-bms-muted hover:text-bms-cyan transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-bms-text font-semibold mb-4 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-2">
              {['Property Analysis', 'Invoice Creation', 'Content Creation', 'AI Chatbot', 'Email Marketing', 'Email Response'].map((s) => (
                <li key={s}>
                  <Link href="/automations" className="text-bms-muted hover:text-bms-cyan text-sm transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-bms-text font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'Automations', href: '/automations' },
                { label: 'Book a Demo', href: '/booking' },
                { label: 'Login', href: '/login' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-bms-muted hover:text-bms-cyan text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-bms-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-bms-muted text-sm">
            © {new Date().getFullYear()} BMS Services. All rights reserved.
          </p>
          <p className="text-bms-muted text-sm">
            Built with{' '}
            <span className="text-bms-cyan">AI</span>
            {' '}for the businesses of tomorrow.
          </p>
        </div>
      </div>
    </footer>
  )
}
