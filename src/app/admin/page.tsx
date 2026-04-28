'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Trash2, ShieldOff, ShieldCheck, ChevronDown,
  ChevronUp, X, Eye, EyeOff, Search, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const AUTOMATION_IDS = [
  { id: 'property-analysis',  label: 'Property Analysis' },
  { id: 'invoice-creation',   label: 'Invoice Creation' },
  { id: 'content-creation',   label: 'Content Creation' },
  { id: 'ai-chatbot',         label: 'AI Chatbot' },
  { id: 'email-marketing',    label: 'Email Marketing' },
  { id: 'email-response',     label: 'Email Response' },
]

type UserRow = {
  id: string
  name: string | null
  username: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
  userAutomations: { automationId: string }[]
}

export default function AdminPage() {
  const [users, setUsers]           = useState<UserRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Create form
  const [form, setForm] = useState({ username: '', email: '', password: '', name: '' })
  const [showPw, setShowPw]       = useState(false)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating]   = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q)
    )
  })

  async function toggleActive(user: UserRow) {
    setTogglingId(user.id)
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    await fetchUsers()
    setTogglingId(null)
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setDeletingId(id)
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    await fetchUsers()
    setDeletingId(null)
  }

  async function toggleAutomation(userId: string, automationId: string, assigned: boolean) {
    await fetch(`/api/admin/users/${userId}/automations`, {
      method: assigned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automationId }),
    })
    await fetchUsers()
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const json = await res.json()
      setCreateError(json.error ?? 'Failed to create user')
    } else {
      setShowCreate(false)
      setForm({ username: '', email: '', password: '', name: '' })
      await fetchUsers()
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-bms-text flex items-center gap-2">
            <Users className="w-6 h-6 text-bms-cyan" />
            Client Management
          </h2>
          <p className="text-bms-muted text-sm mt-1">
            {users.filter(u => u.role === 'CLIENT').length} client{users.filter(u => u.role === 'CLIENT').length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bms-muted pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or email…"
          className="w-full pl-10 pr-4 py-2.5 bg-bms-card border border-bms-border rounded-xl text-bms-text placeholder:text-bms-muted text-sm focus:outline-none focus:border-bms-cyan/50 transition-colors"
        />
      </div>

      {/* User list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-bms-card border border-bms-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-bms-muted">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No users match your search.' : 'No clients yet — add one above.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            const assignedIds = user.userAutomations.map((a) => a.automationId)
            const isExpanded = expandedId === user.id

            return (
              <motion.div
                key={user.id}
                layout
                className={cn(
                  'bg-bms-card border rounded-xl overflow-hidden transition-colors',
                  isExpanded ? 'border-bms-cyan/40' : 'border-bms-border'
                )}
              >
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-bms-cyan/20 to-bms-purple/20 border border-bms-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-bms-cyan uppercase">
                      {(user.username ?? user.email)[0]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-bms-text text-sm font-medium truncate">
                        {user.name ?? user.username ?? user.email}
                      </span>
                      {user.username && (
                        <span className="text-xs text-bms-muted font-mono">@{user.username}</span>
                      )}
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        user.role === 'ADMIN'
                          ? 'bg-bms-purple/15 text-bms-purple border border-bms-purple/20'
                          : 'bg-bms-cyan/10 text-bms-cyan border border-bms-cyan/15'
                      )}>
                        {user.role}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        user.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      )}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-bms-muted truncate mt-0.5">{user.email}</p>
                  </div>

                  {/* Automation count */}
                  <div className="text-center flex-shrink-0 hidden sm:block">
                    <p className="text-lg font-bold text-bms-text font-mono">{assignedIds.length}</p>
                    <p className="text-xs text-bms-muted">automations</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.role !== 'ADMIN' && (
                      <>
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={togglingId === user.id}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                          className={cn(
                            'p-2 rounded-lg border transition-colors disabled:opacity-50',
                            user.isActive
                              ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                              : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                          )}
                        >
                          {user.isActive
                            ? <ShieldOff className="w-4 h-4" />
                            : <ShieldCheck className="w-4 h-4" />
                          }
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={deletingId === user.id}
                          title="Delete user"
                          className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : user.id)}
                      className="p-2 rounded-lg border border-bms-border text-bms-muted hover:text-bms-text hover:border-bms-cyan/30 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Automation toggles */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-bms-border overflow-hidden"
                    >
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-bms-muted uppercase tracking-wider mb-3">
                          Automation Access
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {AUTOMATION_IDS.map(({ id, label }) => {
                            const assigned = assignedIds.includes(id)
                            return (
                              <button
                                key={id}
                                onClick={() => toggleAutomation(user.id, id, assigned)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left',
                                  assigned
                                    ? 'border-bms-cyan/40 bg-bms-cyan/10 text-bms-cyan'
                                    : 'border-bms-border bg-bms-darker/50 text-bms-muted hover:border-bms-border/80 hover:text-bms-text'
                                )}
                              >
                                <div className={cn(
                                  'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border',
                                  assigned
                                    ? 'bg-bms-cyan border-bms-cyan'
                                    : 'border-bms-border'
                                )}>
                                  {assigned && <Check className="w-2.5 h-2.5 text-bms-dark" />}
                                </div>
                                <span className="truncate text-xs">{label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create client modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-bms-card border border-bms-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-bms-text">Add New Client</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg text-bms-muted hover:text-bms-text hover:bg-bms-darker transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={createUser} className="space-y-4">
                <Input
                  id="c-name"
                  label="Full name (optional)"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  id="c-username"
                  label="Username"
                  placeholder="jane_smith"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
                <Input
                  id="c-email"
                  label="Email address"
                  type="email"
                  placeholder="jane@company.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <div className="relative">
                  <Input
                    id="c-password"
                    label="Password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    required
                    className="pr-10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-9 text-bms-muted hover:text-bms-text transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {createError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {createError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={creating} className="flex-1">
                    Create Client
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
