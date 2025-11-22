import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Login attempt for:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing email or password')
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        console.log('[AUTH] User found:', user ? 'yes' : 'no')

        if (!user || !user.password) {
          console.log('[AUTH] User not found or no password')
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        console.log('[AUTH] Password valid:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password')
          throw new Error('Invalid email or password')
        }

        // Check if email verification grace period has expired (24 hours)
        if (!user.emailVerified && user.emailVerificationSentAt) {
          const hoursSinceVerificationSent =
            (Date.now() - new Date(user.emailVerificationSentAt).getTime()) /
            (1000 * 60 * 60)

          if (hoursSinceVerificationSent > 24) {
            throw new Error(
              'Email not verified. Please verify your email to continue.'
            )
          }
        }

        console.log('[AUTH] Login successful for:', user.email, 'role:', user.role)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role?: string }).role
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
  },
})
