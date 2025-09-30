/**
 * API for fetching bookings with payment information for WhatsApp communication
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 *
 * Endpoint to get bookings with payment status for WhatsApp integration
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const providerId = searchParams.get("providerId");

    if (!clientId && !providerId) {
      return NextResponse.json(
        { success: false, error: "clientId ou providerId é obrigatório" },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (providerId) {
      whereClause.providerId = providerId;
    }

    const bookings = await prisma.serviceRequest.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        provider: {
          select: {
            name: true,
            phone: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform bookings to include payment information
    // check active subscription if providerId present
    let activeSub: any = null
    if (providerId) {
      activeSub = await prisma.subscription.findFirst({
        where: {
          serviceProvider: { userId: providerId },
          status: 'ACTIVE',
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
        }
      })
    }

    const clientIds = bookings.map((booking) => booking.clientId).filter((id): id is string => Boolean(id))
    const clientRatings = new Map<string, { average: number; count: number }>()

    if (clientIds.length > 0) {
      const stats = await prisma.serviceRequest.groupBy({
        by: ['clientId'],
        where: {
          clientId: { in: clientIds },
          providerReviewRating: { not: null },
        },
        _avg: { providerReviewRating: true },
        _count: { providerReviewRating: true },
      })

      for (const stat of stats) {
        const avg = stat._avg.providerReviewRating
        const count = stat._count.providerReviewRating
        if (avg != null && count > 0) {
          clientRatings.set(stat.clientId, {
            average: Math.round(avg * 10) / 10,
            count,
          })
        }
      }
    }

    const transformedBookings = bookings.map((booking) => {
      const unlockedByPayment = booking.payments?.some?.(
        (p) => p.status === 'APPROVED' || p.status === 'COMPLETED' || p.status === 'PAID'
      )
      const unlocked = !!activeSub || !!unlockedByPayment
      const client = unlocked
        ? { ...booking.client, id: booking.clientId }
        : { name: 'Dados bloqueados', phone: undefined, id: undefined }
      const ratingEntry = booking.clientId ? clientRatings.get(booking.clientId) : undefined
      return ({
      id: booking.id,
      status: booking.status,
      requestType: booking.requestType,
      description: booking.description,
      preferredDate: booking.scheduledDate?.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      estimatedPrice: booking.estimatedPrice,
      finalPrice: booking.finalPrice,
      travelCost: booking.travelCost,
      basePriceSnapshot: booking.basePriceSnapshot,
      travelDistanceKm: booking.travelDistanceKm,
      travelDurationMinutes: booking.travelDurationMinutes,
      travelRatePerKmSnapshot: booking.travelRatePerKmSnapshot,
      travelMinimumFeeSnapshot: booking.travelMinimumFeeSnapshot,
      travelFixedFeeSnapshot: booking.travelFixedFeeSnapshot,
      service: booking.service,
      client,
      serviceProvider: {
        user: booking.provider,
      },
      clientRatingAverage: ratingEntry?.average ?? null,
      clientRatingCount: ratingEntry?.count ?? 0,
      providerReviewRating: booking.providerReviewRating ?? null,
      providerReviewComment: booking.providerReviewComment ?? null,
      providerReviewGivenAt: booking.providerReviewGivenAt?.toISOString?.() ?? null,
      payment:
        booking.payments.length > 0 ?
          {
            status: booking.payments[0].status,
          }
        : null,
      unlocked,
    })});

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
