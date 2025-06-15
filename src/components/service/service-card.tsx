/**
 * Service Card Components for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Reusable card components for displaying service listings
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Star, Heart, MessageSquare, ChevronRight, CheckCircle, User } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

// Type definitions
export type ServiceRating = {
  average: number
  count: number
}

export type ServiceProviderInfo = {
  id: string
  name: string
  image: string
  rating: ServiceRating
  verified: boolean
}

export type ServiceLocation = {
  city: string
  state: string
  neighborhood?: string
}

export type ServiceCardProps = {
  id: string
  title: string
  category: string
  description?: string
  image?: string
  price: {
    value: number
    unit?: string // 'hour' | 'day' | 'job'
  }
  provider: ServiceProviderInfo
  location: ServiceLocation
  distance?: number // in kilometers
  available?: boolean
  featured?: boolean
  className?: string
}

// Service Card - Horizontal Layout (for search results)
export function ServiceCardHorizontal({
  id,
  title,
  category,
  description,
  image,
  price,
  provider,
  location,
  distance,
  available = true,
  featured = false,
  className,
}: ServiceCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  return (
    <Link href={`/services/${id}`}>
      <Card className={cn(
        "overflow-hidden hover:shadow-md transition-shadow", 
        featured && "ring-2 ring-secondary",
        className
      )}>
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative h-48 md:h-auto md:w-1/3 md:min-h-[12rem]">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Sem imagem</span>
              </div>
            )}
            {featured && (
              <div className="absolute top-2 left-2">
                <span className="bg-secondary text-white text-xs font-medium px-2 py-1 rounded-md">
                  Destaque
                </span>
              </div>
            )}
            <button
              onClick={toggleFavorite}
              className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                )}
              />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-secondary font-medium">{category}</span>
                <h3 className="font-semibold text-lg leading-tight mt-1">{title}</h3>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">
                  R$ {price.value.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {price.unit === 'hour' && 'por hora'}
                  {price.unit === 'day' && 'por dia'}
                  {price.unit === 'job' && 'por serviço'}
                </div>
              </div>
            </div>
            
            {description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {description}
              </p>
            )}

            {/* Provider and location info */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-1 text-gray-500" />
                <span>{provider.name}</span>
                {provider.verified && (
                  <CheckCircle className="w-3 h-3 ml-1 text-secondary" />
                )}
                <div className="flex items-center ml-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="ml-1">{provider.rating.average.toFixed(1)}</span>
                  <span className="text-xs ml-1">({provider.rating.count})</span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                <span>
                  {location.neighborhood ? `${location.neighborhood}, ` : ''}
                  {location.city}/{location.state}
                </span>
                {distance && (
                  <span className="ml-1 text-xs">
                    ({distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`})
                  </span>
                )}
              </div>
            </div>

            {/* Footer with buttons */}
            <div className="mt-4 flex items-center justify-between">
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                available 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 text-gray-700"
              )}>
                {available ? "Disponível hoje" : "Agenda indisponível"}
              </span>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary hover:text-white"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Contatar
                </Button>
                <Button size="sm" variant="secondary">
                  Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

// Service Card - Grid Layout (for featured listings)
export function ServiceCardGrid({
  id,
  title,
  category,
  image,
  price,
  provider,
  location,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  available = true,
  featured = false,
  className,
}: ServiceCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  return (
    <Link href={`/services/${id}`}>
      <Card className={cn(
        "overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col", 
        featured && "ring-2 ring-secondary",
        className
      )}>
        {/* Image Section */}
        <div className="relative h-44">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}
          {featured && (
            <div className="absolute top-2 left-2">
              <span className="bg-secondary text-white text-xs font-medium px-2 py-1 rounded-md">
                Destaque
              </span>
            </div>
          )}
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
              )}
            />
          </button>
        </div>

        {/* Content Section */}
        <CardContent className="flex-1 flex flex-col">
          <div className="mt-2">
            <span className="text-xs text-secondary font-medium">{category}</span>
            <h3 className="font-semibold leading-tight mt-1">{title}</h3>
            
            <div className="flex items-center gap-1 mt-1 text-sm">
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="ml-1 text-sm">{provider.rating.average.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-500">({provider.rating.count} avaliações)</span>
            </div>

            <div className="flex items-center text-xs text-gray-600 mt-2">
              <MapPin className="w-3 h-3 mr-1 text-gray-500" />
              <span className="truncate">
                {location.city}/{location.state}
              </span>
            </div>
          </div>
          
          <div className="mt-auto pt-4">
            <div className="flex items-end justify-between">
              <div className="flex items-center text-xs">
                <User className="w-3 h-3 mr-1 text-gray-500" />
                <span className="truncate max-w-[120px]">{provider.name}</span>
                {provider.verified && (
                  <CheckCircle className="w-3 h-3 ml-1 text-secondary" />
                )}
              </div>
              <div>
                <div className="text-base font-semibold text-primary text-right">
                  R$ {price.value.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {price.unit === 'hour' && 'por hora'}
                  {price.unit === 'day' && 'por dia'}
                  {price.unit === 'job' && 'por serviço'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-100 bg-gray-50/50 pt-3">
          <Button size="sm" variant="secondary" className="w-full">
            Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

// Compact Service Card (for recommendations, recent views)
export function ServiceCardCompact({
  id,
  title,
  category,
  image,
  price,
  location,
  className,
}: ServiceCardProps) {
  return (
    <Link href={`/services/${id}`}>
      <div className={cn("flex items-center gap-3 group", className)}>
        <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Sem imagem</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="text-xs text-secondary">{category}</span>
          <h4 className="font-medium text-sm leading-tight truncate group-hover:text-secondary transition-colors">
            {title}
          </h4>
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{location.city}</span>
            </div>
            <span className="text-xs font-medium">
              R$ {price.value.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
