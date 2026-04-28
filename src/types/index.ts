export interface AnalyticsTotals {
  automationRuns: number
  itemsAnalyzed: number
  successfulOutputs: number
  failedOutputs: number
  timeSavedHours: number
}

export interface AnalyticsSeries {
  date: string
  runs: number
  success: number
  failed: number
}

export interface AnalyticsData {
  totals: AnalyticsTotals
  series: AnalyticsSeries[]
  insights: string[]
}

export interface BookingSlot {
  time: string
  available: boolean
}

export interface Automation {
  id: string
  title: string
  tagline: string
  icon: string
  category: string
  color: 'cyan' | 'purple'
  description: string
  benefits: string[]
  useCases: string[]
  launchUrl?: string
}
