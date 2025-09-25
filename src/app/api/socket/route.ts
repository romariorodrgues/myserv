import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Socket.io agora atende em /api/socketio',
  })
}

export async function POST() {
  return GET()
}
