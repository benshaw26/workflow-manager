import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      username: string | null
      isActive: boolean
    } & DefaultSession['user']
  }
}
