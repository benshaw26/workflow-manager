import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        {
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': variant === 'success',
          'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'error',
          'bg-amber-500/20 text-amber-400 border border-amber-500/30': variant === 'warning',
          'bg-bms-cyan/20 text-bms-cyan border border-bms-cyan/30': variant === 'info',
          'bg-bms-border text-bms-muted border border-bms-border-light': variant === 'default',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
