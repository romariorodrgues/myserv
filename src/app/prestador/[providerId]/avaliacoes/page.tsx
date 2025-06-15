/**
 /**
 * Service provider reviews page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Page to display all reviews for a service provider
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { ReviewList } from '@/components/reviews/review-components'
import { Card, CardContent } from "@/components/ui/card"
import { User, Star, Calendar, MapPin } from 'lucide-react'

interface ServiceProvider {
  id: string
  user: {
    id: string
    name: string
    profileImage: string | null
    createdAt: string
    address?: {
      city: string
      state: string
    }
  }
  services: Array<{
    service: {
      id: string
      name: string
    }
  }>
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  giver: {
    id: string
    name: string
    profileImage: string | null
  }
  receiver: {
    id: string
    name: string
    profileImage: string | null
  }
  serviceRequest: {
    service: {
      id: string
      name: string
    }
  }
}

interface ReviewData {
  reviews: Review[]
  statistics: {
    averageRating: number
    totalReviews: number
    ratingDistribution: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ProviderReviewsPage() {
  const params = useParams()
  const providerId = params.providerId as string
  
  const [provider, setProvider] = useState<ServiceProvider | null>(null)
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const fetchProvider = useCallback(async () => {
    try {
      const response = await fetch(`/api/service-providers/${providerId}`)
      const data = await response.json()
      
      if (data.success) {
        setProvider(data.data)
      } else {
        setError('Prestador não encontrado')
      }
    } catch (error) {
      console.error('Fetch provider error:', error)
      setError('Erro ao carregar dados do prestador')
    }
  }, [providerId])

  const fetchReviews = useCallback(async (pageNum = 1) => {
    try {
      const response = await fetch(`/api/reviews?serviceProviderId=${providerId}&page=${pageNum}&limit=10`)
      const data = await response.json()
      
      if (data.success) {
        setReviewData(data.data)
      } else {
        setError('Erro ao carregar avaliações')
      }
    } catch (error) {
      console.error('Fetch reviews error:', error)
      setError('Erro ao carregar avaliações')
    }
  }, [providerId])

  useEffect(() => {
    if (providerId) {
      Promise.all([
        fetchProvider(),
        fetchReviews(page)
      ]).finally(() => setLoading(false))
    }
  }, [providerId, page, fetchProvider, fetchReviews])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3" />
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="h-20 w-20 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-300 rounded w-1/2" />
                  <div className="h-4 bg-gray-300 rounded w-1/3" />
                  <div className="h-4 bg-gray-300 rounded w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-1/4" />
                      <div className="h-4 bg-gray-300 rounded w-3/4" />
                      <div className="h-16 bg-gray-300 rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!provider || !reviewData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Dados não encontrados</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Avaliações</h1>
        <p className="text-gray-600 mt-1">
          Veja o que os clientes falam sobre este profissional
        </p>
      </div>

      {/* Provider Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {provider.user.profileImage ? (
                <Image
                  src={provider.user.profileImage}
                  alt={provider.user.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {provider.user.name}
              </h2>
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                {provider.user.address && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{provider.user.address.city}, {provider.user.address.state}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Desde {new Date(provider.user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {provider.services.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Serviços oferecidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                      >
                        {service.service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reviewData.statistics.totalReviews > 0 && (
                <div className="mt-4 flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-semibold">
                    {reviewData.statistics.averageRating}
                  </span>
                  <span className="text-gray-600">
                    ({reviewData.statistics.totalReviews} avaliações)
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <ReviewList
        reviews={reviewData.reviews}
        stats={reviewData.statistics}
        loading={false}
      />

      {/* Pagination */}
      {reviewData.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          {[...Array(reviewData.pagination.pages)].map((_, i) => {
            const pageNum = i + 1
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
