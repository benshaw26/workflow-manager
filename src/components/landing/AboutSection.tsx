'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CheckCircle2, Globe, Megaphone, Bot } from 'lucide-react'

const SKILLS = [
  { icon: Globe,      label: 'Web Design & Development',   desc: 'Custom-built sites — HTML5, CSS3, JS, WordPress, Webflow, Wix & Squarespace. Mobile-first, fast-loading, SEO-ready.' },
  { icon: Bot,        label: 'Marketing Automation',        desc: 'Email sequences, lead funnels, CRM setup, and full business marketing plans — so your marketing runs itself.' },
  { icon: Megaphone,  label: 'Social Media Marketing',      desc: 'Content strategy, paid ads across Facebook, Instagram, TikTok & LinkedIn, and community management.' },
]

const PROMISES = [
  'Every project handled personally — start to finish',
  'Clear communication at every stage',
  'Mobile-first, SEO-ready, built to convert',
  "You won't hear \"that's not my job\" — ever",
]

export function AboutSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 bg-bms-dark" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — bio */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-bms-cyan/30 bg-bms-cyan/5 text-bms-cyan text-sm font-medium mb-5">
              About Me
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-bms-text mb-6 leading-tight">
              Hi, I&apos;m{' '}
              <span className="bg-gradient-to-r from-bms-cyan to-bms-purple bg-clip-text text-transparent">
                Ben
              </span>
            </h2>

            <div className="space-y-4 text-bms-muted text-base leading-relaxed mb-8">
              <p>
                I&apos;m a passionate, self-taught web designer and digital consultant based in the UK, with a proven portfolio of live websites built for both new start-ups and established businesses.
              </p>
              <p>
                I specialise in creating clean, modern, and fully functional websites tailored to each client&apos;s brand and goals — whether that&apos;s a brand-new build from scratch or a complete redesign. Every project is handled personally by me, from the initial brief right through to launch.
              </p>
              <p>
                I pride myself on clear, consistent communication throughout every project. You&apos;ll always know where things stand, what&apos;s coming next, and why decisions are being made. I won&apos;t stop until you&apos;re 100% happy with the result.
              </p>
            </div>

            <ul className="space-y-2.5">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-bms-muted">
                  <CheckCircle2 className="w-4 h-4 text-bms-cyan shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — skill cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col gap-5"
          >
            {SKILLS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-bms-card border border-bms-border rounded-2xl p-6 flex gap-5 hover:border-bms-cyan/30 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-bms-cyan/10 flex items-center justify-center shrink-0 group-hover:bg-bms-cyan/15 transition-colors">
                  <Icon className="w-5 h-5 text-bms-cyan" />
                </div>
                <div>
                  <h3 className="text-bms-text font-semibold text-sm mb-1">{label}</h3>
                  <p className="text-bms-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
