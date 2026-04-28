'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useRef } from 'react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

const MicrochipScene = dynamic(() => import('@/components/three/MicrochipScene'), {
  ssr: false,
  loading: () => null,
})

const WebGLShader = dynamic(
  () => import('@/components/ui/web-gl-shader').then((m) => m.WebGLShader),
  { ssr: false, loading: () => null }
)

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })
  const chipY  = useTransform(scrollYProgress, [0, 1], [0, 160])
  const textY  = useTransform(scrollYProgress, [0, 1], [0, 60])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center bg-bms-dark"
    >
      {/* White wave shader — behind everything */}
      <WebGLShader />

      {/* Noise grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          zIndex: 1,
        }}
      />

      {/* ── 3D chip — top-right, 45% width, 75% height ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute top-0 right-0 w-[55%] h-[90%] pointer-events-none"
        style={{ zIndex: 2, y: chipY }}
      >
        <MicrochipScene />
      </motion.div>

      {/* Right-side glow that blooms from the chip */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 3 }}
      >
        <div className="absolute right-0 top-0 w-[50vw] h-[70vh] bg-bms-cyan/5 blur-[120px] rounded-full" />
        <div className="absolute right-1/4 top-1/4 w-[30vw] h-[30vh] bg-bms-purple/4 blur-[100px] rounded-full" />
      </div>

      {/* Left text fade — gradient mask so text reads cleanly over chip */}
      <div
        className="absolute inset-y-0 left-0 w-[55%] pointer-events-none"
        style={{ zIndex: 4, background: 'linear-gradient(to right, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.75) 65%, transparent 100%)' }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bms-dark to-transparent pointer-events-none"
        style={{ zIndex: 4 }}
      />

      {/* ── Text content — overlaid on top ── */}
      <div
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20"
        style={{ zIndex: 5 }}
      >
        <motion.div style={{ y: textY, opacity }} className="max-w-2xl">

          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-bms-border bg-bms-card/60 backdrop-blur-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-bms-muted">Accepting new clients</span>
            <span className="w-px h-3 bg-bms-border" />
            <span className="text-xs font-semibold text-bms-cyan">AI Automation Studio</span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[0.95] tracking-tight mb-6">
              <span className="block text-bms-text">Your business.</span>
              <span className="block relative">
                <span className="bg-gradient-to-r from-bms-cyan via-[#4af7ff] to-bms-purple bg-clip-text text-transparent">
                  Supercharged
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
                  className="absolute -bottom-1 left-0 h-px bg-gradient-to-r from-bms-cyan to-transparent origin-left"
                  style={{ width: '70%' }}
                />
              </span>
              <span className="block text-bms-text">by AI.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-bms-muted text-lg leading-relaxed mb-10 max-w-lg"
          >
            BMS Services builds custom AI systems that eliminate your most repetitive work — from scanning thousands of properties to responding to every email — so your team operates at 10×.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-wrap items-center gap-4 mb-12"
          >
            <Link href="/booking">
              <LiquidButton size="xl" className="border border-bms-cyan/30 text-bms-cyan font-bold tracking-wide">
                Book a Free Demo
              </LiquidButton>
            </Link>
            <Link
              href="/automations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-bms-muted hover:text-bms-text transition-colors group"
            >
              Explore automations
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Micro metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="flex items-center gap-6 pt-8 border-t border-bms-border/60"
          >
            {[
              { value: '500+', label: 'Daily runs' },
              { value: '98%',  label: 'Success rate' },
              { value: '50+',  label: 'Clients' },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-black text-bms-text num">{m.value}</p>
                <p className="text-xs text-bms-muted font-medium">{m.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        style={{ zIndex: 5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-bms-muted/60">scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-4 h-4 text-bms-muted/40" />
        </motion.div>
      </motion.div>
    </section>
  )
}
