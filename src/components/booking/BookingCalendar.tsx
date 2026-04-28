'use client'

import { DayPicker } from 'react-day-picker'
import { addDays, isBefore, startOfDay } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface Props {
  selected?: Date
  onSelect: (date: Date | undefined) => void
}

export function BookingCalendar({ selected, onSelect }: Props) {
  const today = startOfDay(new Date())
  const minDate = addDays(today, 1) // Earliest booking: tomorrow
  const maxDate = addDays(today, 60) // Max 60 days ahead

  const isDisabled = (date: Date) => {
    const day = date.getDay()
    return isBefore(date, minDate) || day === 0 || day === 6 // Disable past dates + weekends
  }

  return (
    <div className="booking-calendar">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #00d4ff;
          --rdp-background-color: rgba(0, 212, 255, 0.1);
          --rdp-accent-color-dark: #00a8cc;
          --rdp-background-color-dark: rgba(0, 212, 255, 0.2);
          margin: 0;
        }
        .rdp-day_selected:not([disabled]) {
          background-color: #00d4ff !important;
          color: #0a0a1a !important;
          font-weight: 700;
        }
        .rdp-day_today:not(.rdp-day_selected) {
          border: 1px solid rgba(0, 212, 255, 0.4);
          color: #00d4ff;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(0, 212, 255, 0.1);
          color: #00d4ff;
        }
        .rdp-caption_label {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .rdp-head_cell {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        .rdp-day {
          font-size: 13px;
          color: #e2e8f0;
        }
        .rdp-day_disabled {
          color: #374151 !important;
        }
        .rdp-nav_button {
          color: #94a3b8;
        }
        .rdp-nav_button:hover {
          color: #00d4ff;
          background: rgba(0, 212, 255, 0.1);
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={isDisabled}
        fromDate={minDate}
        toDate={maxDate}
      />
    </div>
  )
}
