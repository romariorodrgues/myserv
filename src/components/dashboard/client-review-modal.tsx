/**
 * Client Review Modal
 * Opens when user needs to review a completed service.
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Star, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewForm, StarRating } from '@/components/reviews/review-components'

interface Props {
  bookingId: string
  onClose: () => void
  onSubmitted?: () => void
}

export function ClientReviewModal({ bookingId, onClose, onSubmitted }: Props) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        const data = await res.json()
        if (data.success) {
          setBooking(data.booking)
        } else {
          setError(data.error || 'Erro ao carregar a reserva')
        }
      } catch (e) {
        console.error(e)
        setError('Erro ao carregar a reserva')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  const handleSubmit = async ({ rating, comment }: { rating: number; comment: string }) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceRequestId: bookingId, rating, comment }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Erro ao enviar avaliação')
        setSubmitting(false)
        return
      }
      onSubmitted?.()
      onClose()
    } catch (e) {
      console.error(e)
      setError('Erro ao enviar avaliação')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Avaliar Profissional
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-gray-500">Carregando...</div>
            ) : error ? (
              <div className="py-6 text-center text-red-600 text-sm">{error}</div>
            ) : booking?.review ? (
              <div className="py-6 text-center text-gray-600 text-sm">Você já avaliou este serviço.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                    {booking?.provider?.profileImage ? (
                      <Image src={booking.provider.profileImage} alt={booking.provider.name} width={48} height={48} className="rounded-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Profissional</div>
                    <div className="font-medium">{booking?.provider?.name}</div>
                    <div className="text-xs text-gray-500">Serviço: {booking?.service?.name}</div>
                  </div>
                </div>

                <ReviewForm serviceRequestId={bookingId} onSubmit={handleSubmit} loading={submitting} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

