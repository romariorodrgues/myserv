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
    } & DefaultSession["user"]
  }

  interface User {
    userType: UserType
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: UserType
  }
}
