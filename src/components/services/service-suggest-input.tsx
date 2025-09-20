// ServiceSuggestInput.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils' // se já tiver; senão, troque por `${}` simples

type SuggestItem = {
  id: string
  name: string
  breadcrumb?: string
  serviceCount?: number
}

export default function ServiceSuggestInput({
  placeholder = 'Ex.: lavagem de estofados',
  defaultValue = '',
  onSelect,
  onTextChange,
  inputClassName,
}: {
  placeholder?: string
  defaultValue?: string
  onSelect: (item: { type: 'leaf' | 'text'; id?: string; name: string }) => void
  onTextChange?: (value: string) => void
  inputClassName?: string
}) {
  const [query, setQuery] = useState(defaultValue)
  const [items, setItems] = useState<SuggestItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState<number>(-1)

  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = setTimeout(async () => {
      const q = query.trim()
      if (q.length < 2) {
        setItems([])
        setOpen(false)
        return
      }
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      try {
        const res = await fetch(`/api/categories/suggest?q=${encodeURIComponent(q)}&limit=8`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error('Failed to fetch suggestions')
        const data = await res.json()
        const list: SuggestItem[] = data.items || []
        setItems(list)
        setOpen(list.length > 0)
        setHighlight(list.length ? 0 : -1)
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.error(e)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(handler)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const choose = (item: SuggestItem | { name: string }) => {
    if ('id' in item) {
      onSelect({ type: 'leaf', id: item.id, name: item.name })
      setQuery(item.name)
      onTextChange?.(item.name)
    } else {
      onSelect({ type: 'text', name: item.name })
      setQuery(item.name)
      onTextChange?.(item.name)
    }
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && e.key === 'Enter') {
      const q = query.trim()
      if (q) choose({ name: q })
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (items.length ? (h + 1) % items.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (items.length ? (h - 1 + items.length) % items.length : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight >= 0 && items[highlight]) choose(items[highlight])
      else if (query.trim()) choose({ name: query.trim() })
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        {/* Ícone com as mesmas medidas do outro campo */}
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

        {/* Input com mesmas dimensões: pl-12 pr-12 h-14 text-lg */}
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onTextChange?.(e.target.value)
          }}
          onFocus={() => setOpen(items.length > 0)}
          onKeyDown={onKeyDown}
          className={cn('pl-12 pr-12 h-14 text-lg', inputClassName)}
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando serviços…
            </div>
          )}

          {!loading && items.map((it, idx) => (
            <button
              key={it.id}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => choose(it)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                highlight === idx ? 'bg-brand-cyan/10' : 'hover:bg-gray-50'
              }`}
            >
              <div className="min-w-0">
                {it.breadcrumb && (
                  <div className="text-[11px] text-gray-500 truncate">{it.breadcrumb}</div>
                )}
                <div className="text-gray-800 truncate">{it.name}</div>
              </div>
              {typeof it.serviceCount === 'number' && (
                <Badge variant="secondary" className="ml-2">{it.serviceCount}</Badge>
              )}
            </button>
          ))}

          {!loading && items.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Nenhuma sugestão. Pressione Enter para buscar por texto.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
