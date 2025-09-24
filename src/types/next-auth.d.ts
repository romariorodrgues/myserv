/**
 * NextAuth.js configuration types
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import type { DefaultSession } from "next-auth"
import type { UserType } from "@/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userType: UserType
      isApproved: boolean
      isActive: boolean
      termsVersion: string | null
      termsAcceptedAt: string | null
      deactivatedAt: string | null
    } & DefaultSession["user"]
  }

  interface User {
    userType: UserType
    isApproved: boolean
    isActive: boolean
    termsVersion: string | null
    termsAcceptedAt: string | null
    deactivatedAt: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: UserType
    isApproved: boolean
    isActive: boolean
    termsVersion?: string | null
    termsAcceptedAt?: string | null
    deactivatedAt?: string | null
  }
}
