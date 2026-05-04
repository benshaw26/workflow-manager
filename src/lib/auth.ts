import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Email/username and password are required')
        }

        const identifier = credentials.identifier.toLowerCase().trim()
        const password   = credentials.password

        // ── Auto-bootstrap admin on very first login ─────────────────────────
        // If no admin account exists yet and the identifier + password match
        // the configured admin credentials, create the account automatically.
        const adminEmail    = (process.env.ADMIN_EMAIL    ?? 'shawben381@gmail.com').toLowerCase()
        const adminPassword =  process.env.ADMIN_PASSWORD ?? 'BmsAdmin2025!'
        const adminUsername = (process.env.ADMIN_USERNAME ?? 'admin').toLowerCase()

        const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

        if (
          !adminExists &&
          (identifier === adminEmail || identifier === adminUsername) &&
          password === adminPassword
        ) {
          const hashed = await bcrypt.hash(password, 12)
          const newAdmin = await prisma.user.upsert({
            where: { email: adminEmail },
            create: {
              name:     process.env.ADMIN_NAME ?? 'Ben',
              username: adminUsername,
              email:    adminEmail,
              password: hashed,
              role:     'ADMIN',
              isActive: true,
            },
            update: { role: 'ADMIN', isActive: true, password: hashed },
          })
          const ALL_IDS = [
            'property-analysis','invoice-creation','content-creation',
            'ai-chatbot','email-marketing','email-response','bio-creation',
            'montage-creation',
          ]
          for (const automationId of ALL_IDS) {
            await prisma.userAutomation.upsert({
              where: { userId_automationId: { userId: newAdmin.id, automationId } },
              create: { userId: newAdmin.id, automationId, grantedBy: 'auto-bootstrap' },
              update: {},
            })
          }
          return {
            id:       newAdmin.id,
            email:    newAdmin.email,
            name:     newAdmin.name,
            role:     newAdmin.role,
            username: newAdmin.username,
            isActive: newAdmin.isActive,
          }
        }
        // ─────────────────────────────────────────────────────────────────────

        // Normal login — match by email or username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
            ],
          },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        if (!user.isActive) {
          throw new Error('Account deactivated. Please contact support.')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id:       user.id,
          email:    user.email,
          name:     user.name,
          role:     user.role,
          username: user.username,
          isActive: user.isActive,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.username = (user as { username?: string | null }).username ?? null
        token.isActive = (user as { isActive?: boolean }).isActive ?? true
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string | null
        session.user.isActive = token.isActive as boolean
      }
      return session
    },
  },
}
