/**
 * Authentication test endpoint for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      success: true,
      authenticated: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Authentication test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
