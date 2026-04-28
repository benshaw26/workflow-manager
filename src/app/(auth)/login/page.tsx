'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Invalid email/username or password. Please try again.')
    } else {
      // Let the server redirect based on role
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-bms-card border border-bms-border rounded-2xl p-8 shadow-card"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-bms-text mb-2">Welcome back</h1>
        <p className="text-bms-muted text-sm">Sign in to your BMS Services dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bms-muted pointer-events-none mt-3" />
          <Input
            id="identifier"
            label="Email or username"
            type="text"
            placeholder="you@company.com or username"
            className="pl-10"
            error={errors.identifier?.message}
            {...register('identifier')}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bms-muted pointer-events-none mt-3" />
          <Input
            id="password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-9 text-bms-muted hover:text-bms-text transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-bms-muted text-sm mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-bms-cyan hover:underline font-medium">
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
