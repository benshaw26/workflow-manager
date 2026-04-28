'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be 32 characters or fewer')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, _ and -'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // Auto sign-in after registration
    const signInRes = await signIn('credentials', {
      identifier: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (signInRes?.error) {
      router.push('/login')
    } else {
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
        <h1 className="text-2xl font-bold text-bms-text mb-2">Create your account</h1>
        <p className="text-bms-muted text-sm">Get access to your BMS Services dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Username */}
        <div className="relative">
          <AtSign className="absolute left-3 top-9 w-4 h-4 text-bms-muted pointer-events-none" />
          <Input
            id="username"
            label="Username"
            placeholder="your_username"
            className="pl-10"
            error={errors.username?.message}
            {...register('username')}
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-9 w-4 h-4 text-bms-muted pointer-events-none" />
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="you@company.com"
            className="pl-10"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-9 w-4 h-4 text-bms-muted pointer-events-none" />
          <Input
            id="password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            className="pl-10 pr-10"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-9 text-bms-muted hover:text-bms-text transition-colors"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Confirm password */}
        <div className="relative">
          <Lock className="absolute left-3 top-9 w-4 h-4 text-bms-muted pointer-events-none" />
          <Input
            id="confirmPassword"
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your password"
            className="pl-10 pr-10"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-9 text-bms-muted hover:text-bms-text transition-colors"
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-center text-bms-muted text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-bms-cyan hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
