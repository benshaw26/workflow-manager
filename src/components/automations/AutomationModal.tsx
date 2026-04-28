'use client'

import Link from 'next/link'
import { Building2, FileText, PenTool, MessageSquare, Mail, Inbox, CheckCircle2, ArrowRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import type { Automation } from '@/types'

const iconMap: Record<string, React.ElementType> = {
  Building2, FileText, PenTool, MessageSquare, Mail, Inbox,
}

interface Props {
  automation: Automation | null
  onClose: () => void
}

export function AutomationModal({ automation, onClose }: Props) {
  if (!automation) return null
  const Icon = iconMap[automation.icon] ?? MessageSquare

  return (
    <Modal isOpen={!!automation} onClose={onClose} title={automation.title}>
      {/* Icon + tagline */}
      <div className="flex items-start gap-4 mb-6 pb-6 border-b border-bms-border">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
          automation.color === 'cyan'
            ? 'bg-bms-cyan/10 border border-bms-cyan/20'
            : 'bg-bms-purple/10 border border-bms-purple/20'
        }`}>
          <Icon className={`w-7 h-7 ${automation.color === 'cyan' ? 'text-bms-cyan' : 'text-bms-purple-light'}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold mb-1 ${automation.color === 'cyan' ? 'text-bms-cyan' : 'text-bms-purple-light'}`}>
            {automation.category}
          </p>
          <p className="text-bms-muted text-sm">{automation.tagline}</p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="text-bms-text font-semibold mb-2">Overview</h4>
        <p className="text-bms-muted text-sm leading-relaxed">{automation.description}</p>
      </div>

      {/* Benefits */}
      <div className="mb-6">
        <h4 className="text-bms-text font-semibold mb-3">Key Benefits</h4>
        <ul className="space-y-2">
          {automation.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-bms-muted">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {/* Use Cases */}
      <div className="mb-6">
        <h4 className="text-bms-text font-semibold mb-3">Use Cases</h4>
        <ul className="space-y-2">
          {automation.useCases.map((uc, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-bms-muted">
              <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                automation.color === 'cyan' ? 'bg-bms-cyan' : 'bg-bms-purple-light'
              }`} />
              {uc}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="flex gap-3 pt-4 border-t border-bms-border">
        <Link href="/booking" className="flex-1" onClick={onClose}>
          <Button className="w-full gap-2">
            Book a Demo <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}
