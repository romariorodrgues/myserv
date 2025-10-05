'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Folder, Leaf } from 'lucide-react'

export type CascCat = {
  id: string
  name: string
  isLeaf: boolean
  isActive: boolean
  serviceCount: number
  allowScheduling: boolean
}

type Props = {
  value: string | null
  onChange: (id: string | null, path: CascCat[]) => void
  className?: string
}

export default function CascadingCategoryPicker({ value, onChange, className = '' }: Props) {
  const [levels, setLevels] = useState<CascCat[][]>([])   // colunas (níveis)
  const [path, setPath] = useState<CascCat[]>([])         // trilha selecionada
  const [loading, setLoading] = useState(false)

  // controle de concorrência
  const ctrlRef = useRef<AbortController | null>(null)
  const reqIdRef = useRef(0)

  async function fetchLevel(parentId?: string | null): Promise<CascCat[]> {
    // cancela requisição anterior
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl

    const myReqId = ++reqIdRef.current
    setLoading(true)
    try {
      const url = parentId
        ? `/api/categories?parentId=${parentId}&active=true`
        : `/api/categories?active=true`

      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error('Erro ao buscar categorias')
      // se outra requisição já começou, ignora o resultado desta
      if (myReqId !== reqIdRef.current) return []

      const data = await res.json()
      return (data.categories || []) as CascCat[]
    } catch (err: any) {
      if (err?.name === 'AbortError') return [] // ignorado
      console.error(err)
      return []
    } finally {
      // só fecha o loading se essa ainda for a última requisição
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }

  // carrega raízes na montagem
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const roots = await fetchLevel(null)
      if (mounted) {
        setLevels([roots])
        setPath([])
      }
    })()
    return () => {
      mounted = false
      ctrlRef.current?.abort()
    }
  }, [])

  // selecionar nó
  const selectNode = async (node: CascCat, levelIndex: number) => {
    const newPath = [...path.slice(0, levelIndex), node]
    setPath(newPath)

    if (node.isLeaf) {
      onChange(node.id, newPath)
      // corta colunas seguintes e mantém até o nível desta seleção
      setLevels((prev) => prev.slice(0, levelIndex + 1))
      return
    }

    onChange(null, newPath)
    const children = await fetchLevel(node.id)
    setLevels((prev) => {
      const base = prev.slice(0, levelIndex + 1)
      return [...base, children]
    })
  }

  // voltar para raiz
  const goRoot = () => {
    setPath([])
    onChange(null, [])
    setLevels((prev) => [prev[0] || []]) // mantém cache das raízes já carregadas
  }

  // breadcrumb: voltar para um nível específico (mantendo seleção naquele nível)
  const goToLevel = async (levelIndex: number) => {
    // nívelIndex é o índice do item no path (0 = raiz selecionada, 1 = filho, etc.)
    const kept = path[levelIndex]
    const newPath = path.slice(0, levelIndex + 1)
    setPath(newPath)
    onChange(kept?.isLeaf ? kept.id : null, newPath)

    // mantém colunas até (levelIndex + 1). Se já tínhamos a coluna seguinte em cache, preserva.
    setLevels((prev) => prev.slice(0, levelIndex + 2))

    // se não havia a próxima coluna (porque tinha sido cortada ao escolher uma leaf), recarrega filhos
    if (!levels[levelIndex + 1] && !kept.isLeaf) {
      const children = await fetchLevel(kept.id)
      setLevels((prev) => {
        const base = prev.slice(0, levelIndex + 1)
        return [...base, children]
      })
    }
  }

  const rootClassName = className ? `${className} space-y-3` : 'space-y-3'

  return (
    <div className={rootClassName}>
      {/* Breadcrumb */}
      <div className="mb-2 flex flex-wrap items-center gap-1 text-sm text-gray-600">
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={goRoot}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Raiz
        </Button>
        {path.map((n, i) => (
          <span key={n.id} className="inline-flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            <button
              className="underline hover:text-brand-cyan"
              onClick={() => goToLevel(i)}
              title={`Ir para: ${n.name}`}
            >
              {n.name}
            </button>
          </span>
        ))}
        {value && (
          <Badge variant="secondary" className="ml-1">
            Selecionada
          </Badge>
        )}
        {path.length === 0 && <span className="text-gray-500">Selecione uma categoria</span>}
      </div>

      {/* Colunas */}
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col gap-3 sm:flex-row">
          {levels.map((list, idx) => (
            <div key={idx} className="min-w-[220px] flex-1 rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-2">
                {list.map((c) => {
                  const active = path[idx]?.id === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectNode(c, idx)}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition ${active ? 'border-brand-cyan ring-1 ring-brand-cyan bg-brand-cyan/5' : 'border-gray-200 hover:border-brand-cyan/40 hover:bg-brand-cyan/5'}`}
                    >
                      <span className="flex items-center gap-2">
                        {c.isLeaf ? (
                          <Leaf className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Folder className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700">{c.name}</span>
                      </span>
                      <Badge variant="secondary">{c.serviceCount}</Badge>
                    </button>
                  )
                })}
                {list.length === 0 && <div className="text-sm text-gray-500 p-2">Sem itens</div>}
                {loading && <div className="text-sm text-gray-400 p-2">Carregando...</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
