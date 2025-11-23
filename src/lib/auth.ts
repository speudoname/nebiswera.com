import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

const useSecureCookies = process.env.NODE_ENV === 'production'
const cookieDomain = process.env.NODE_ENV === 'production' ? '.nebiswera.com' : undefined

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: useSecureCookies ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
    csrfToken: {
      name: useSecureCookies ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        // Note: Email verification grace period is now checked in middleware
        // Users can always log in, but unverified users after 24h are redirected to verify-required page

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
          emailVerificationSentAt: user.emailVerificationSentAt,
          preferredLocale: user.preferredLocale,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role?: string }).role
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified
        token.emailVerificationSentAt = (user as { emailVerificationSentAt?: Date | null }).emailVerificationSentAt
        token.preferredLocale = (user as { preferredLocale?: string }).preferredLocale
      }
      // Refresh user data from database when session is updated
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            preferredLocale: true,
            emailVerified: true,
            emailVerificationSentAt: true,
          },
        })
        if (dbUser) {
          token.preferredLocale = dbUser.preferredLocale
          token.emailVerified = dbUser.emailVerified
          token.emailVerificationSentAt = dbUser.emailVerificationSentAt
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as Date | null
        session.user.emailVerificationSentAt = token.emailVerificationSentAt as Date | null
        session.user.preferredLocale = token.preferredLocale as string
      }
      return session
    },
  },
})
