'use client'

import { cn } from '@/lib/utils'
import { TIME_SLOTS } from '@/lib/constants'

interface Props {
  selected?: string
  onSelect: (time: string) => void
  bookedSlots?: string[]
}

export function TimeSlotPicker({ selected, onSelect, bookedSlots = [] }: Props) {
  return (
    <div>
      <h3 className="text-bms-text font-semibold mb-3 text-sm">Available Times</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {TIME_SLOTS.map((time) => {
          const isBooked = bookedSlots.includes(time)
          const isSelected = selected === time
          return (
            <button
              key={time}
              disabled={isBooked}
              onClick={() => onSelect(time)}
              className={cn(
                'px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200',
                isBooked
                  ? 'border-bms-border bg-bms-border/20 text-bms-border cursor-not-allowed line-through'
                  : isSelected
                  ? 'border-bms-cyan bg-bms-cyan text-bms-dark font-bold shadow-cyan-glow'
                  : 'border-bms-border text-bms-muted hover:border-bms-cyan/40 hover:text-bms-cyan hover:bg-bms-cyan/5'
              )}
            >
              {time}
            </button>
          )
        })}
      </div>
      {bookedSlots.length > 0 && (
        <p className="text-bms-muted text-xs mt-3">Grey slots are already booked for this date.</p>
      )}
    </div>
  )
}
