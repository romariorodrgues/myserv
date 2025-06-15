/**
 * Scheduling API Routes for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles provider schedule management and appointment booking
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createScheduleSchema = z.object({
  providerId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean().default(true)
})

const updateScheduleSchema = z.object({
  id: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isActive: z.boolean().optional()
})

const createAppointmentSchema = z.object({
  providerId: z.string(),
  clientId: z.string(),
  serviceId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const date = searchParams.get('date')
    const type = searchParams.get('type') // 'schedule' or 'appointments'

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID é obrigatório' },
        { status: 400 }
      )
    }

    if (type === 'appointments') {
      // Get appointments for a specific date or date range
      const whereClause: any = {
        serviceProviderId: providerId
      }

      if (date) {
        const targetDate = new Date(date)
        const nextDay = new Date(targetDate)
        nextDay.setDate(nextDay.getDate() + 1)

        whereClause.scheduledDate = {
          gte: targetDate,
          lt: nextDay
        }
      }

      const appointments = await prisma.serviceRequest.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        }
      })

      const transformedAppointments = appointments.map(appointment => ({
        id: appointment.id,
        date: appointment.scheduledDate?.toISOString().split('T')[0],
        startTime: appointment.scheduledTime || '09:00',
        endTime: '10:00', // Default value since estimatedEndTime doesn't exist
        status: appointment.status,
        client: {
          name: appointment.client.name,
          phone: appointment.client.phone,
          email: appointment.client.email
        },
        service: {
          name: appointment.service.name,
          duration: 60 // Default duration
        },
        notes: appointment.description
      }))

      return NextResponse.json({
        success: true,
        appointments: transformedAppointments
      })
    }

    // Get provider schedule (availability)
    const availability = await prisma.availability.findMany({
      where: {
        serviceProviderId: providerId,
        isActive: true
      },
      orderBy: {
        dayOfWeek: 'asc'
      }
    })

    // Transform availability to schedule format
    const schedule = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayAvailability = availability.filter(a => a.dayOfWeek === dayIndex)
      
      return {
        dayOfWeek: dayIndex,
        isWorkingDay: dayAvailability.length > 0,
        timeSlots: dayAvailability.map(slot => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isActive
        }))
      }
    })

    return NextResponse.json({
      success: true,
      schedule
    })

  } catch (error) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'create_schedule') {
      const validatedData = createScheduleSchema.parse(body)

      // Check if schedule already exists for this day
      const existingSchedule = await prisma.availability.findFirst({
        where: {
          serviceProviderId: validatedData.providerId,
          dayOfWeek: validatedData.dayOfWeek,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime
        }
      })

      if (existingSchedule) {
        return NextResponse.json(
          { success: false, error: 'Horário já existe para este dia' },
          { status: 400 }
        )
      }

      const newSchedule = await prisma.availability.create({
        data: {
          serviceProviderId: validatedData.providerId,
          dayOfWeek: validatedData.dayOfWeek,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          isActive: validatedData.isActive
        }
      })

      return NextResponse.json({
        success: true,
        schedule: {
          id: newSchedule.id,
          startTime: newSchedule.startTime,
          endTime: newSchedule.endTime,
          isAvailable: newSchedule.isActive
        }
      })
    }

    if (action === 'create_appointment') {
      const validatedData = createAppointmentSchema.parse(body)

      // Check if slot is available
      const conflictingAppointment = await prisma.serviceRequest.findFirst({
        where: {
          providerId: validatedData.providerId,
          scheduledDate: new Date(validatedData.date),
          scheduledTime: validatedData.startTime,
          status: {
            not: 'CANCELLED'
          }
        }
      })

      if (conflictingAppointment) {
        return NextResponse.json(
          { success: false, error: 'Horário já está ocupado' },
          { status: 400 }
        )
      }

      const appointment = await prisma.serviceRequest.create({
        data: {
          clientId: validatedData.clientId,
          providerId: validatedData.providerId,
          serviceId: validatedData.serviceId,
          requestType: 'SCHEDULING',
          scheduledDate: new Date(validatedData.date),
          scheduledTime: validatedData.startTime,
          description: validatedData.notes,
          status: 'PENDING'
        },
        include: {
          client: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        appointment: {
          id: appointment.id,
          date: appointment.scheduledDate?.toISOString().split('T')[0],
          startTime: appointment.scheduledTime,
          endTime: '10:00', // Default value
          status: appointment.status,
          notes: appointment.description
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Schedule creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'update_schedule') {
      const validatedData = updateScheduleSchema.parse(body)

      const updatedSchedule = await prisma.availability.update({
        where: { id: validatedData.id },
        data: {
          ...(validatedData.startTime && { startTime: validatedData.startTime }),
          ...(validatedData.endTime && { endTime: validatedData.endTime }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive })
        }
      })

      return NextResponse.json({
        success: true,
        schedule: {
          id: updatedSchedule.id,
          startTime: updatedSchedule.startTime,
          endTime: updatedSchedule.endTime,
          isAvailable: updatedSchedule.isActive
        }
      })
    }

    if (action === 'update_appointment') {
      const { appointmentId, status, notes } = body

      if (!appointmentId) {
        return NextResponse.json(
          { success: false, error: 'ID do agendamento é obrigatório' },
          { status: 400 }
        )
      }

      const updatedAppointment = await prisma.serviceRequest.update({
        where: { id: appointmentId },
        data: {
          ...(status && { status }),
          ...(notes && { description: notes })
        },
        include: {
          client: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        appointment: {
          id: updatedAppointment.id,
          status: updatedAppointment.status,
          client: updatedAppointment.client,
          service: updatedAppointment.service,
          notes: updatedAppointment.description
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Schedule update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const appointmentId = searchParams.get('appointmentId')

    if (scheduleId) {
      await prisma.availability.delete({
        where: { id: scheduleId }
      })

      return NextResponse.json({
        success: true,
        message: 'Horário removido com sucesso'
      })
    }

    if (appointmentId) {
      await prisma.serviceRequest.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' }
      })

      return NextResponse.json({
        success: true,
        message: 'Agendamento cancelado com sucesso'
      })
    }

    return NextResponse.json(
      { success: false, error: 'ID é obrigatório' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Schedule deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
