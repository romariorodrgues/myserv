/**
 * NextAuth.js configuration for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles authentication with credentials and database integration
 */

import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { UserType } from "@/types"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            address: true
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        if (!user.isActive) {
          throw new Error("Conta desativada. Entre em contato com o suporte.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType as UserType,
          profileImage: user.profileImage,
          isApproved: user.isApproved,
          isActive: user.isActive,
          address: user.address,
          termsVersion: user.termsVersion ?? null,
          termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
          deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userType = user.userType
        token.isApproved = user.isApproved
        token.isActive = (user as any).isActive
        token.profileImage = user.profileImage
        token.address = user.address
        ;(token as any).termsVersion = (user as any).termsVersion
        ;(token as any).termsAcceptedAt = (user as any).termsAcceptedAt
        ;(token as any).deactivatedAt = (user as any).deactivatedAt
      }

      if (!user && token.sub) {
        const shouldRefreshStatus =
          token.userType === 'SERVICE_PROVIDER' &&
          (!token.isApproved || typeof (token as any).statusLastChecked !== 'number' || Date.now() - Number((token as any).statusLastChecked) > 60 * 1000)

        if (shouldRefreshStatus) {
          try {
            const fresh = await prisma.user.findUnique({
              where: { id: token.sub },
              select: {
                isApproved: true,
                isActive: true,
                profileImage: true,
                address: true,
              },
            })
            ;(token as any).statusLastChecked = Date.now()
            if (fresh) {
              token.isApproved = fresh.isApproved
              token.isActive = fresh.isActive
              token.profileImage = fresh.profileImage
              token.address = fresh.address
            }
          } catch (statusError) {
            console.error('[auth][jwt] status refresh error', statusError)
          }
        }
      }

      if (trigger === 'update' && session?.user) {
        const updatedUser = session.user as typeof session.user & {
          isActive?: boolean
          termsVersion?: string | null
          termsAcceptedAt?: string | null
          deactivatedAt?: string | null
          profileImage?: string | null
          address?: unknown
        }

        if (updatedUser.userType) token.userType = updatedUser.userType
        if (typeof updatedUser.isApproved === 'boolean') token.isApproved = updatedUser.isApproved
        if (typeof updatedUser.isActive === 'boolean') token.isActive = updatedUser.isActive
        if (updatedUser.profileImage !== undefined) token.profileImage = updatedUser.profileImage
        if (updatedUser.address !== undefined) token.address = updatedUser.address
        ;(token as any).termsVersion = updatedUser.termsVersion ?? (token as any).termsVersion ?? null
        ;(token as any).termsAcceptedAt = updatedUser.termsAcceptedAt ?? (token as any).termsAcceptedAt ?? null
        ;(token as any).deactivatedAt = updatedUser.deactivatedAt ?? (token as any).deactivatedAt ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.userType = token.userType as UserType
        session.user.isApproved = token.isApproved as boolean
        ;(session.user as any).isActive = token.isActive as boolean
        session.user.profileImage = token.profileImage as string | null
        session.user.address = token.address as any
        ;(session.user as any).termsVersion = (token as any).termsVersion ?? null
        ;(session.user as any).termsAcceptedAt = (token as any).termsAcceptedAt ?? null
        ;(session.user as any).deactivatedAt = (token as any).deactivatedAt ?? null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user }) {
      // Recria notificação "complete seu perfil (foto)" para prestadores sem avatar em todo login
      try {
        const u = await prisma.user.findUnique({ where: { id: user.id as string }, select: { id: true, userType: true, profileImage: true } })
        if (!u) return
        if (u.userType !== 'SERVICE_PROVIDER') return
        if (u.profileImage) return

        const existing = await prisma.notification.findFirst({
          where: { userId: u.id, type: 'SYSTEM', data: { path: ['kind'], equals: 'COMPLETE_PROFILE_PHOTO' } as any }
        })
        if (existing) {
          await prisma.notification.update({ where: { id: existing.id }, data: { isRead: false } })
        } else {
          await prisma.notification.create({
            data: {
              userId: u.id,
              type: 'SYSTEM',
              title: 'Complete seu perfil',
              message: 'Adicione sua foto de perfil para aumentar suas chances de aprovação.',
              isRead: false,
              data: { kind: 'COMPLETE_PROFILE_PHOTO', url: '/dashboard/profissional?tab=settings' }
            }
          })
        }
      } catch {
        // silencioso
      }
    }
  },
  pages: {
    signIn: '/entrar',
  }
}
