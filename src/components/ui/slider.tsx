'use client'

import * as React from 'react'

// Compat wrapper that mimics shadcn/ui Slider API using a native range input.
// Expected usage: <Slider value={[n]} onValueChange={([v]) => ...} min max step />

type SliderProps = {
  value: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, disabled, className }: SliderProps) {
  const v = Array.isArray(value) && value.length ? value[0] : 0
  return (
    <input
      type="range"
      value={v}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      className={className ?? 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'}
    />
  )
}

export default Slider

