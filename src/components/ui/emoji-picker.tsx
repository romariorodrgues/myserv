'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type EmojiPickerProps = {
  value?: string
  onChange: (emoji: string) => void
  placeholder?: string
  suggestions?: string[] // optional curated list
  openOnFocus?: boolean
  className?: string
}

// Small curated emoji palette (lightweight; no heavy libs)
const COMMON: string[] = '🧹 🧺 🧽 🧴 🧼 🧻 🛁 🧯 🧤 🧷 🧵 🧶 🧰 🛠️ 🔧 🔨 ⚙️ 🪛 🪚 🧱 🪜 🖌️ 🎨 🧲 💡 🔌 🚰 🧪 🧴 🐶 🐱 🐾 ✂️ 💅 💇 💄 💆 💻 🖥️ 🛟 📶 🔒 🔍 🚚 🚗 🛻 🧑‍🏫 📚 🎓 📦 🏠 🏢'.split(' ')

// Category presets (used when caller provides hints)
export const EMOJI_PRESETS: Record<string, string[]> = {
  limpeza: '🧹 🧺 🧽 🧴 🧼 🛁 🪣'.split(' '),
  beleza: '💅 💄 💇 💆 ✂️'.split(' '),
  pets: '🐶 🐱 🐾 ✂️'.split(' '),
  reformas: '🛠️ 🔧 🪚 🧱 🪜 🧰'.split(' '),
  tecnologia: '💻 🛟 📶 🔌'.split(' '),
  transporte: '🚚 🚗 🛻 📦'.split(' '),
  educacao: '📚 🎓 🧑‍🏫'.split(' '),
}

export default function EmojiPicker({ value, onChange, placeholder = 'Emoji (opcional)', suggestions, openOnFocus = true, className = '' }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const list = (suggestions && suggestions.length ? suggestions : COMMON).filter((e) =>
    query.trim() ? e.includes(query.trim()) : true,
  )

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <Input
        value={value || ''}
        onFocus={() => openOnFocus && setOpen(true)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="cursor-pointer"
      />

      {open && (
        <div className="absolute z-50 mt-2 w-[280px] rounded-md border bg-white shadow-lg p-2 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Pesquisar (ex.: 🧺)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-auto">
            {list.map((e, i) => (
              <button
                key={`${e}-${i}`}
                onClick={() => { onChange(e); setOpen(false) }}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100"
                title={e}
                type="button"
              >
                <span className="text-lg leading-none">{e}</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">Dica: você pode deixar em branco — herdaremos o ícone do pai.</div>
        </div>
      )}
    </div>
  )
}

