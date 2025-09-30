/**
 * Review component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Component for displaying and creating reviews
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, MessageCircle, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

interface ReviewStats {
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

interface ReviewFormProps {
  serviceRequestId: string
  onSubmit: (data: { rating: number; comment: string }) => void
  loading?: boolean
  showComment?: boolean
}

interface ReviewListProps {
  reviews: Review[]
  stats: ReviewStats
  loading?: boolean
}

interface StarRatingProps {
  rating: number
  interactive?: boolean
  size?: 'sm' | 'md' | 'lg'
  onRate?: (rating: number) => void
}

// Star Rating Component
export function StarRating({ rating, interactive = false, size = 'md', onRate }: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleClick = (newRating: number) => {
    if (interactive && onRate) {
      onRate(newRating)
    }
  }

  const handleMouseEnter = (newRating: number) => {
    if (interactive) {
      setHoveredRating(newRating)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredRating(0)
    }
  }

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoveredRating || rating)
        return (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              interactive ? 'cursor-pointer' : ''
            } transition-colors ${
              filled
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          />
        )
      })}
    </div>
  )
}

// Review Form Component
export function ReviewForm({ onSubmit, loading = false, showComment = true }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: { [key: string]: string } = {}
    
    if (!rating) {
      newErrors.rating = 'Por favor, selecione uma avaliação'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    onSubmit({ rating, comment: showComment ? comment : '' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span>Avaliar Serviço</span>
        </CardTitle>
        <CardDescription>
          Sua avaliação ajuda outros usuários a escolherem os melhores profissionais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avaliação *
            </label>
            <StarRating
              rating={rating}
              interactive
              size="lg"
              onRate={setRating}
            />
            {errors.rating && (
              <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
            )}
          </div>

          {showComment && (
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comentário (opcional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte como foi sua experiência com este profissional..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                maxLength={500}
              />
              <p className="text-gray-500 text-xs mt-1">
                {comment.length}/500 caracteres
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Review Statistics Component
export function ReviewStats({ stats }: { stats: ReviewStats }) {
  const { averageRating, totalReviews, ratingDistribution } = stats

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span>Estatísticas de Avaliações</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{averageRating}</div>
          <StarRating rating={averageRating} size="lg" />
          <p className="text-gray-600 mt-1">{totalReviews} avaliações</p>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution]
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            
            return (
              <div key={rating} className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Individual Review Component
export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {review.giver.profileImage ? (
              <Image
                src={review.giver.profileImage}
                alt={review.giver.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {review.giver.name}
                </p>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Serviço: <span className="font-medium">{review.serviceRequest.service.name}</span>
              </p>
              
              {review.comment && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Review List Component
export function ReviewList({ reviews, stats, loading = false }: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
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
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma avaliação encontrada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <ReviewStats stats={stats} />
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
