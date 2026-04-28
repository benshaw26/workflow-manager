'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Loader2 } from 'lucide-react'

interface LaunchButtonProps {
  automationId: string
  launchUrl: string
}

export function LaunchButton({ automationId, launchUrl }: LaunchButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLaunch = async () => {
    // Internal routes — navigate directly, no JWT needed
    if (launchUrl.startsWith('/')) {
      router.push(launchUrl)
      return
    }
    setLoading(true)
    setError(null)
    // Open a blank window immediately (synchronous click context) so browsers don't block it as a popup
    const win = window.open('about:blank', '_blank')
    try {
      const res = await fetch('/api/automations/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId }),
      })
      const data = await res.json()
      if (!res.ok) {
        win?.close()
        setError(data.error || 'Failed to launch')
        return
      }
      if (win) win.location.href = `${launchUrl}?token=${data.token}`
    } catch {
      win?.close()
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleLaunch}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-bms-cyan text-bms-dark font-semibold text-sm px-4 py-2 rounded-lg hover:bg-bms-cyan-dark disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</>
        ) : (
          <><ExternalLink className="w-4 h-4" /> Launch Automation</>
        )}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
