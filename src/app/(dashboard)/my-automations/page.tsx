import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AUTOMATIONS } from '@/lib/constants'
import Link from 'next/link'
import {
  Building2, FileText, PenTool, MessageSquare, Mail, Inbox, Share2, UserCircle,
  TrendingUp, CheckCircle2, Clock, ArrowRight, Lock,
} from 'lucide-react'
import { LaunchButton } from './LaunchButton'

const ICON_MAP: Record<string, React.ReactNode> = {
  Building2:    <Building2 className="w-6 h-6" />,
  FileText:     <FileText className="w-6 h-6" />,
  PenTool:      <PenTool className="w-6 h-6" />,
  MessageSquare:<MessageSquare className="w-6 h-6" />,
  Mail:         <Mail className="w-6 h-6" />,
  Inbox:        <Inbox className="w-6 h-6" />,
  Share2:       <Share2 className="w-6 h-6" />,
  UserCircle:   <UserCircle className="w-6 h-6" />,
}

const WEIGHTS: Record<string, number> = {
  'property-analysis':      0.28,
  'invoice-creation':       0.14,
  'content-creation':       0.18,
  'ai-chatbot':             0.16,
  'email-marketing':        0.09,
  'email-response':         0.06,
  'social-media-scheduler': 0.09,
  'bio-creation':           0.07,
}

export default async function MyAutomationsPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  // Fetch only the automations this user has purchased/been granted
  const grantedRecords = await prisma.userAutomation.findMany({
    where: { userId },
    select: { automationId: true },
  })
  const grantedIds = new Set(grantedRecords.map((r) => r.automationId))
  const userAutomations = AUTOMATIONS.filter((a) => grantedIds.has(a.id))

  const snapshots = await prisma.analyticsSnapshot.findMany({ where: { userId } })

  const totals = snapshots.reduce(
    (acc, s) => ({
      runs:     acc.runs     + s.automationRuns,
      success:  acc.success  + s.successfulOutputs,
      failed:   acc.failed   + s.failedOutputs,
      timeMins: acc.timeMins + s.timeSavedMinutes,
    }),
    { runs: 0, success: 0, failed: 0, timeMins: 0 }
  )

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold text-bms-text">My Automations</h2>
        <p className="text-bms-muted text-sm mt-1">
          Your purchased automations. Click &quot;Launch&quot; to run one, or view its analytics below.
        </p>
      </div>

      {userAutomations.length === 0 ? (
        <div className="bg-bms-card border border-bms-border rounded-xl p-10 text-center">
          <Lock className="w-10 h-10 text-bms-muted mx-auto mb-3" />
          <h3 className="text-bms-text font-semibold mb-1">No automations yet</h3>
          <p className="text-bms-muted text-sm mb-4">
            You don&apos;t have access to any automations. Book a demo to get started.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-bms-cyan-dark transition-colors"
          >
            Book a Demo
          </Link>
        </div>
      ) : (
        <>
          {totals.runs === 0 && (
            <div className="bg-bms-cyan/5 border border-bms-cyan/20 rounded-xl p-4 text-sm text-bms-muted">
              No analytics yet — go to{' '}
              <Link href="/dashboard" className="text-bms-cyan hover:underline">Dashboard</Link>{' '}
              and load demo data to see stats, or launch an automation to record real runs.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {userAutomations.map((automation) => {
              const w = WEIGHTS[automation.id] ?? 0.1
              const runs    = Math.round(totals.runs * w)
              const success = Math.round(totals.success * w)
              const failed  = Math.round(totals.failed * w)
              const hours   = Math.round((totals.timeMins * w) / 60 * 10) / 10
              const rate    = runs > 0 ? Math.round((success / runs) * 100) : 0

              return (
                <div
                  key={automation.id}
                  className="bg-bms-card border border-bms-border rounded-xl p-6 flex flex-col gap-5 hover:border-bms-cyan/30 transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      automation.color === 'cyan'
                        ? 'bg-bms-cyan/10 text-bms-cyan'
                        : 'bg-bms-purple/10 text-bms-purple'
                    }`}>
                      {ICON_MAP[automation.icon]}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-medium">Active</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-bms-text font-semibold text-base mb-1">{automation.title}</h3>
                    <p className="text-bms-muted text-xs line-clamp-2">{automation.tagline}</p>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bms-darker rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3 h-3 text-bms-cyan" />
                        <span className="text-[10px] text-bms-muted uppercase tracking-wide">Runs</span>
                      </div>
                      <p className="text-lg font-bold text-bms-text">{runs.toLocaleString()}</p>
                    </div>
                    <div className="bg-bms-darker rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-bms-muted uppercase tracking-wide">Success</span>
                      </div>
                      <p className="text-lg font-bold text-bms-text">{rate}%</p>
                    </div>
                    <div className="bg-bms-darker rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3 h-3 text-bms-purple" />
                        <span className="text-[10px] text-bms-muted uppercase tracking-wide">Saved</span>
                      </div>
                      <p className="text-lg font-bold text-bms-text">{hours}h</p>
                    </div>
                    <div className="bg-bms-darker rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-3 h-3 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                        </span>
                        <span className="text-[10px] text-bms-muted uppercase tracking-wide">Failed</span>
                      </div>
                      <p className="text-lg font-bold text-bms-text">{failed.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-bms-border">
                    {automation.launchUrl ? (
                      <LaunchButton automationId={automation.id} launchUrl={automation.launchUrl} />
                    ) : (
                      <span className="text-bms-muted text-xs">No live app configured</span>
                    )}
                    <Link
                      href={`/my-automations/${automation.id}`}
                      className="inline-flex items-center gap-1 text-xs text-bms-muted hover:text-bms-cyan transition-colors"
                    >
                      Analytics <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
