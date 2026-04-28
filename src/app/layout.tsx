import type { Metadata } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/providers/Providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BMS Services — AI Automation for Modern Businesses',
  description:
    'BMS Services deploys custom AI automations that transform your business operations. Property analysis, invoice creation, content generation, AI chatbots, email marketing and more.',
  keywords: 'AI automation, business automation, property analysis, AI chatbot, email marketing automation',
  openGraph: {
    title: 'BMS Services — AI Automation for Modern Businesses',
    description: 'Custom AI automations that save time, reduce costs, and scale your operations.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
