import { cn } from '@/lib/utils'

interface Props {
  step: number
  steps: string[]
}

export function BookingProgress({ step, steps }: Props) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const isCompleted = num < step
        const isActive = num === step
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300',
                  isCompleted
                    ? 'bg-bms-cyan border-bms-cyan text-bms-dark'
                    : isActive
                    ? 'border-bms-cyan text-bms-cyan bg-bms-cyan/10'
                    : 'border-bms-border text-bms-muted bg-bms-darker'
                )}
              >
                {isCompleted ? '✓' : num}
              </div>
              <span className={cn(
                'text-xs mt-1.5 font-medium text-center whitespace-nowrap',
                isActive ? 'text-bms-cyan' : isCompleted ? 'text-bms-text' : 'text-bms-muted'
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-2 mb-4 transition-all duration-300',
                num < step ? 'bg-bms-cyan' : 'bg-bms-border'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
