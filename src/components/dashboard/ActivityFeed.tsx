import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, XCircle, Clock, Zap } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: string
  status: string
  createdAt: string
}

const statusConfig = {
  SUCCESS: { variant: 'success' as const, icon: CheckCircle2, label: 'Success' },
  FAILED: { variant: 'error' as const, icon: XCircle, label: 'Failed' },
  RUNNING: { variant: 'info' as const, icon: Clock, label: 'Running' },
  PENDING: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
}

const typeLabels: Record<string, string> = {
  PROPERTY_ANALYSIS: 'Property Analysis',
  INVOICE_CREATION: 'Invoice Creation',
  CONTENT_CREATION: 'Content Creation',
  AI_CHATBOT: 'AI Chatbot',
  EMAIL_MARKETING: 'Email Marketing',
  EMAIL_RESPONSE: 'Email Response',
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-bms-card border border-bms-border rounded-xl p-6">
      <h3 className="text-bms-text font-semibold mb-4">Recent Activity</h3>
      {items.length === 0 ? (
        <div className="text-center py-8">
          <Zap className="w-8 h-8 text-bms-border mx-auto mb-2" />
          <p className="text-bms-muted text-sm">No automation runs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const config = statusConfig[item.status as keyof typeof statusConfig] ?? statusConfig.PENDING
            const Icon = config.icon
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-bms-darker border border-bms-border">
                <Icon className={`w-4 h-4 flex-shrink-0 ${
                  item.status === 'SUCCESS' ? 'text-emerald-400'
                  : item.status === 'FAILED' ? 'text-red-400'
                  : 'text-bms-cyan'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-bms-text text-sm font-medium truncate">
                    {typeLabels[item.type] ?? item.type}
                  </p>
                  <p className="text-bms-muted text-xs">
                    {formatDate(item.createdAt)} at {formatTime(item.createdAt)}
                  </p>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
