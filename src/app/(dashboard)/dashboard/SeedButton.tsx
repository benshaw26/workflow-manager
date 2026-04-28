'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Database } from 'lucide-react'

export function SeedButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Seed failed — make sure you are logged in')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleSeed} loading={loading} className="gap-2">
      <Database className="w-4 h-4" />
      Load Demo Data
    </Button>
  )
}
