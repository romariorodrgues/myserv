'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Star, User } from 'lucide-react'
import { ReviewForm } from '@/components/reviews/review-components'

interface ProviderReviewModalProps {
  bookingId: string
  onClose: () => void
  onSubmitted?: () => void
}

export function ProviderReviewModal({ bookingId, onClose, onSubmitted }: ProviderReviewModalProps) {
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
          setError(data.error || 'Erro ao carregar a solicitação')
        }
      } catch (fetchError) {
        console.error(fetchError)
        setError('Erro ao carregar a solicitação')
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
      const res = await fetch('/api/reviews/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceRequestId: bookingId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Erro ao enviar avaliação')
      }
      onSubmitted?.()
      onClose()
    } catch (submitError) {
      console.error(submitError)
      setError(submitError instanceof Error ? submitError.message : 'Erro ao enviar avaliação')
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
                Avaliar Cliente
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
            ) : booking?.providerReviewGivenAt ? (
              <div className="py-6 text-center text-gray-600 text-sm">Você já avaliou este cliente.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                    {booking?.client?.profileImage ? (
                      <Image src={booking.client.profileImage} alt={booking.client.name} width={48} height={48} className="rounded-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Cliente</div>
                    <div className="font-medium">{booking?.client?.name}</div>
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
