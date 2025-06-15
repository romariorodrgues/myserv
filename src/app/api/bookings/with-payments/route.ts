/**
 * API for fetching bookings with payment information for WhatsApp communication
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Endpoint to get bookings with payment status for WhatsApp integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const providerId = searchParams.get('providerId')

    if (!clientId && !providerId) {
      return NextResponse.json(
        { success: false, error: 'clientId ou providerId é obrigatório' },
        { status: 400 }
      )
    }

    let whereClause: any = {}
    
    if (clientId) {
      whereClause.clientId = clientId
    }
    
    if (providerId) {
      whereClause.providerId = providerId
    }

    const bookings = await prisma.serviceRequest.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            name: true
          }
        },
        client: {
          select: {
            name: true,
            phone: true
          }
        },
        provider: {
          select: {
            name: true,
            phone: true
          }
        },
        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform bookings to include payment information
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      status: booking.status,
      description: booking.description,
      preferredDate: booking.scheduledDate?.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      estimatedPrice: booking.estimatedPrice,
      finalPrice: booking.finalPrice,
      service: booking.service,
      client: booking.client,
      serviceProvider: {
        user: booking.provider
      },
      payment: booking.payments.length > 0 ? {
        status: booking.payments[0].status === 'APPROVED' ? 'COMPLETED' : 
                booking.payments[0].status === 'REJECTED' ? 'FAILED' :
                booking.payments[0].status === 'CANCELLED' ? 'FAILED' : 'PENDING'
      } : null
    }))

    return NextResponse.json({
      success: true,
      bookings: transformedBookings
    })

  } catch (error) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
