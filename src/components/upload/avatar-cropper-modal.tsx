"use client"
import Cropper from 'react-easy-crop'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function AvatarCropperModal({
  src,
  onCancel,
  onConfirm,
  initialCenter,
  initialZoom,
}: {
  src: string
  onCancel: () => void
  onConfirm: (croppedAreaPixels: { x: number; y: number; width: number; height: number }) => void
  initialCenter?: { x: number; y: number }
  initialZoom?: number
}) {
  const [crop, setCrop] = useState({ x: (initialCenter?.x ?? 0.5) * 100 - 50, y: (initialCenter?.y ?? 0.5) * 100 - 50 })
  const [zoom, setZoom] = useState(initialZoom ?? 1)
  const [area, setArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-4 space-y-4">
        <div className="relative h-64 rounded-md overflow-hidden">
          <Cropper
            image={src}
            crop={{ x: crop.x, y: crop.y }}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={(c) => setCrop(c as any)}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>
        <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={() => area && onConfirm(area)}>Confirmar</Button>
        </div>
      </div>
    </div>
  )
}

