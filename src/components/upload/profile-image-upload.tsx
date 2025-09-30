/**
 * Profile Image Upload component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Component for uploading and managing profile images
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cdnImageUrl } from '@/lib/cdn'
import { AvatarCropperModal } from './avatar-cropper-modal'
import { getCroppedImg } from '@/lib/image/crop'
import { getAutoCenter } from '@/lib/face/autoCenter'

interface ProfileImageUploadProps {
  currentImage?: string | null
  userName: string
  onImageUpdate?: (imagePath: string | null) => void
  className?: string
}

export function ProfileImageUpload({ 
  currentImage, 
  userName, 
  onImageUpdate,
  className = '' 
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage ? cdnImageUrl(currentImage) : null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [initialCenter, setInitialCenter] = useState<{ x: number; y: number } | undefined>(undefined)
  const [initialZoom, setInitialZoom] = useState<number | undefined>(undefined)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPG, PNG ou WebP')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB')
      return
    }

    setError('')
    setUploading(true)
    try {
      const localUrl = URL.createObjectURL(file)
      setCropSrc(localUrl)
      try {
        const auto = await getAutoCenter(file)
        if (auto) { setInitialCenter(auto.center); setInitialZoom(auto.zoom) }
      } catch {}
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleRemoveImage = async () => {
    setUploading(true)
    setError('')

    try {
      // Zera a chave no perfil (mantém compat DELETE local como fallback)
      const res = await fetch('/api/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileImageKey: null }) })
      if (!res.ok) {
        const response = await fetch('/api/upload/profile-image', { method: 'DELETE' })
        await response.json()
      }
      setPreview(null)
      onImageUpdate?.(null)
    } catch (error) {
      console.error('Remove image error:', error)
      setError('Erro ao remover imagem')
    } finally {
      setUploading(false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const isBlobPreview = preview?.startsWith('blob:') || preview?.startsWith('data:')

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="space-y-4">
        {/* Current Image Display */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="relative h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
              {preview ? (
                <Image
                  src={preview}
                  alt={userName}
                  fill
                  sizes="128px"
                  quality={95}
                  unoptimized={isBlobPreview}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-300">
                  <User className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>

            {preview && !uploading && (
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Remover imagem"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="space-y-3">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Envie sua foto de perfil
              </p>
              <p className="text-sm text-gray-500">
                Arraste e solte ou clique para selecionar
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              disabled={uploading}
              className="flex items-center space-x-2"
            >
              <Camera className="h-4 w-4" />
              <span>Escolher Arquivo</span>
            </Button>
            
            <p className="text-xs text-gray-500">
              JPG, PNG ou WebP. Máximo 5MB.
            </p>
          </div>
        </div>

        {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {cropSrc && (
        <AvatarCropperModal
          src={cropSrc}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null) }}
          onConfirm={async (pixels) => {
            try {
              setUploading(true)
              const blob = await getCroppedImg(cropSrc, pixels)
              const file = blob instanceof File ? blob : new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
              const formData = new FormData()
              formData.append('image', file, 'avatar.jpg')

              const uploadRes = await fetch('/api/upload/profile-image', {
                method: 'POST',
                body: formData,
              })

              const payload = await uploadRes.json().catch(() => ({}))
              const imagePath = payload?.data?.imagePath as string | undefined

              if (!uploadRes.ok || !payload?.success || !imagePath) {
                throw new Error(payload?.error || 'Erro ao enviar imagem')
              }

              const resolved = cdnImageUrl(imagePath)
              setPreview(resolved)
              onImageUpdate?.(imagePath)
            } catch (e: any) {
              setError(e?.message || 'Erro ao enviar imagem')
            } finally {
              if (cropSrc) URL.revokeObjectURL(cropSrc)
              setCropSrc(null)
              setUploading(false)
            }
          }}
        />
      )}
      </div>
    </div>
  )
}

// Compact version for forms
export function ProfileImageUploadCompact({ 
  currentImage, 
  userName, 
  onImageUpdate,
  className = '' 
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage ? cdnImageUrl(currentImage) : null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [initialCenter, setInitialCenter] = useState<{ x: number; y: number } | undefined>(undefined)
  const [initialZoom, setInitialZoom] = useState<number | undefined>(undefined)

  useEffect(() => {
    setPreview(currentImage ? cdnImageUrl(currentImage) : null)
  }, [currentImage])

  const handleFileSelect = async (file: File) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande')
      return
    }

    setError('')
    setUploading(true)

    if (cropSrc) {
      URL.revokeObjectURL(cropSrc)
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setCropSrc(localUrl)

    try {
      const auto = await getAutoCenter(file)
      if (auto) {
        setInitialCenter(auto.center)
        setInitialZoom(auto.zoom)
      } else {
        setInitialCenter(undefined)
        setInitialZoom(undefined)
      }
    } catch {
      setInitialCenter(undefined)
      setInitialZoom(undefined)
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const compactBlobPreview = preview?.startsWith('blob:') || preview?.startsWith('data:')

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="relative h-16 w-16 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-200">
            {preview ? (
              <Image
                src={preview}
                alt={userName}
                fill
                sizes="64px"
                quality={95}
                unoptimized={compactBlobPreview}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-300">
                <User className="h-6 w-6 text-gray-600" />
              </div>
            )}
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            <Camera className="h-4 w-4" />
            <span>Alterar Foto</span>
          </Button>
          
          {error && (
            <p className="text-red-600 text-xs mt-1">{error}</p>
          )}
        </div>
      </div>
      {cropSrc && (
        <AvatarCropperModal
          src={cropSrc}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
            setPreview(currentImage ? cdnImageUrl(currentImage) : null)
          }}
          onConfirm={async (pixels) => {
            try {
              setUploading(true)
              const blob = await getCroppedImg(cropSrc, pixels)
              const file = blob instanceof File ? blob : new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
              const formData = new FormData()
              formData.append('image', file, 'avatar.jpg')

              const uploadRes = await fetch('/api/upload/profile-image', {
                method: 'POST',
                body: formData,
              })

              const payload = await uploadRes.json().catch(() => ({}))
              const imagePath = payload?.data?.imagePath as string | undefined

              if (!uploadRes.ok || !payload?.success || !imagePath) {
                throw new Error(payload?.error || 'Erro ao fazer upload')
              }

              const resolved = cdnImageUrl(imagePath)
              setPreview(resolved)
              onImageUpdate?.(imagePath)
              setError('')
            } catch (err: any) {
              console.error('Compact crop upload error:', err)
              setError(err?.message || 'Erro ao fazer upload')
              setPreview(currentImage ? cdnImageUrl(currentImage) : null)
            } finally {
              URL.revokeObjectURL(cropSrc)
              setCropSrc(null)
              setUploading(false)
            }
          }}
        />
      )}
    </div>
  )
}
