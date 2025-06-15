/**
 * Database connection utility
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Singleton pattern for Prisma client to prevent multiple instances
 * in development environment with hot reloading
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
