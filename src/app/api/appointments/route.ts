/**
 * Appointments API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles user appointments management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for appointments
const appointmentSchema = z.object({
  serviceRequestId: z.string().cuid()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'

    // Get user's service requests (appointments)
    const appointments = await prisma.serviceRequest.findMany({
      where: {
        OR: [
          { clientId: session.user.id },
          { providerId: session.user.id }
        ],
        ...(status && { status: status as any }),
        ...(upcoming && {
          scheduledDate: {
            gte: new Date()
          }
        })
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            phone: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            phone: true
          }
        },
        service: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    // Format response
    const formattedAppointments = appointments.map(appointment => {
      const isClient = appointment.clientId === session.user.id
      const otherUser = isClient ? appointment.provider : appointment.client

      return {
        id: appointment.id,
        serviceId: appointment.serviceId,
        serviceName: appointment.service?.name || 'Serviço',
        category: appointment.service?.category?.name || 'Diversos',
        status: appointment.status,
        type: appointment.requestType,
        scheduledDate: appointment.scheduledDate,
        description: appointment.description,
        budget: appointment.budget,
        userRole: isClient ? 'CLIENT' : 'PROVIDER',
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          profileImage: otherUser.profileImage,
          phone: otherUser.phone
        } : null,
        createdAt: appointment.createdAt
      }
    })

    return NextResponse.json({
      appointments: formattedAppointments,
      total: formattedAppointments.length
    })

  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
