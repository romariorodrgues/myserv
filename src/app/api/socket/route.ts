import { NextRequest, NextResponse } from 'next/server'
import { initializeSocketServer } from '@/lib/socket'

// Esta API route é necessária para inicializar o Socket.io
export async function GET(request: NextRequest) {
  try {
    // Verificar se já foi inicializado
    if (!(global as any).socketInitialized) {
      // Criar um servidor HTTP básico para o Socket.io
      const { createServer } = require('http')
      const httpServer = createServer()
      
      initializeSocketServer(httpServer)
      
      // Marcar como inicializado
      ;(global as any).socketInitialized = true
      
      console.log('Socket.io server initialized via API route')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Socket.io server ready',
      path: '/api/socket'
    })

  } catch (error) {
    console.error('Error initializing Socket.io:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Socket.io' },
      { status: 500 }
    )
  }
}

// Para desenvolvimento, permitir POST também
export async function POST(request: NextRequest) {
  return GET(request)
}
