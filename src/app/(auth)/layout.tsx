import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { FloatingPaths } from '@/components/ui/background-paths'
import { BMSLogoIcon } from '@/components/ui/BMSLogo'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect(session.user.role === 'ADMIN' ? '/admin' : '/dashboard')
  }
  return (
    <div className="relative min-h-screen bg-bms-dark flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* Animated path background */}
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />

      {/* Subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-bms-cyan/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-bms-purple/4 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10 relative z-10 group">
        <BMSLogoIcon className="w-10 h-10 transition-opacity duration-200 group-hover:opacity-75" />
        <span className="text-xl font-bold text-bms-text font-display group-hover:text-bms-cyan transition-colors duration-200">
          BMS <span className="text-bms-cyan">Services</span>
        </span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
