import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Só tentar conectar se estiver autenticado
    if (status !== 'authenticated' || !session?.user?.id) {
      // Desconectar se não há sessão válida
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Conectar socket se ainda não conectado
    if (!socketRef.current) {
      console.log('Inicializando conexão Socket.io...')
      
      const socketInstance = io({
        path: '/api/socket',
        addTrailingSlash: false,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000
      })

      socketRef.current = socketInstance
      setSocket(socketInstance)

      // Event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id)
        setIsConnected(true)
        
        // Autenticar com user ID
        console.log('Enviando autenticação para userId:', session.user.id)
        socketInstance.emit('authenticate', {
          userId: session.user.id
        })
      })

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })
    }

    // Cleanup na desmontagem do componente
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [session?.user?.id, status])

  return socket
}

export function useSocketConnection() {
  const socket = useSocket()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      setIsConnected(false)
      return
    }

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    // Verificar estado inicial
    setIsConnected(socket.connected)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [socket])

  return { socket, isConnected }
}
