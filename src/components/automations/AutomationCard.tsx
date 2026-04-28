'use client'

import { Building2, FileText, PenTool, MessageSquare, Mail, Inbox, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import type { Automation } from '@/types'

const iconMap: Record<string, React.ElementType> = {
  Building2, FileText, PenTool, MessageSquare, Mail, Inbox,
}

interface Props {
  automation: Automation
  onClick: (a: Automation) => void
}

export function AutomationCard({ automation, onClick }: Props) {
  const Icon = iconMap[automation.icon] ?? Zap

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      onClick={() => onClick(automation)}
      className="group bg-bms-card border border-bms-border rounded-xl p-6 cursor-pointer hover:border-bms-cyan/40 hover:shadow-card-hover transition-colors duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          automation.color === 'cyan'
            ? 'bg-bms-cyan/10 border border-bms-cyan/20'
            : 'bg-bms-purple/10 border border-bms-purple/20'
        }`}>
          <Icon className={`w-6 h-6 ${automation.color === 'cyan' ? 'text-bms-cyan' : 'text-bms-purple-light'}`} />
        </div>
        <Badge variant="default">{automation.category}</Badge>
      </div>

      <h3 className="text-lg font-bold text-bms-text mb-2 group-hover:text-bms-cyan transition-colors duration-300">
        {automation.title}
      </h3>
      <p className="text-bms-muted text-sm leading-relaxed mb-4">{automation.tagline}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {automation.benefits.slice(0, 2).map((b, i) => (
          <span key={i} className="text-xs text-bms-muted bg-bms-darker px-2 py-0.5 rounded-full border border-bms-border">
            ✓ {b.split(' ').slice(0, 4).join(' ')}...
          </span>
        ))}
      </div>

      <button className="inline-flex items-center gap-1 text-xs font-semibold text-bms-cyan group-hover:gap-2 transition-all duration-200">
        View details <ArrowRight className="w-3 h-3" />
      </button>
    </motion.div>
  )
}

function Zap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}
