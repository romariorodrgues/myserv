import type { NextApiRequest } from 'next'
import type { NextApiResponse } from 'next'
import type { Server as HTTPServer } from 'http'
import type { Socket } from 'net'
import type { Server as IOServer } from 'socket.io'

import { initializeSocketServer } from '@/lib/socket'

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer
    }
  }
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (!res.socket?.server) {
    res.status(500).json({ error: 'Socket server not available' })
    return
  }

  if (!res.socket.server.io) {
    const io = initializeSocketServer(res.socket.server)
    res.socket.server.io = io

    // Socket.IO already registra os listeners de upgrade quando anexado ao servidor.
    // Não precisamos adicionar um handler manual aqui.
  }

  if (req.headers.upgrade === 'websocket') {
    res.end()
    return
  }

  res.socket.server.io.engine.handleRequest(req as any, res as any)
  return
}
