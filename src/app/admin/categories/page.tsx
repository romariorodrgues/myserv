/**
 * Admin Categories Management
 * Create and manage the cascading taxonomy.
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import EmojiPicker, { EMOJI_PRESETS } from '@/components/ui/emoji-picker'
import { Label } from '@/components/ui/label'
import CascadingCategoryPicker from '@/components/categories/cascading-category-picker'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Check, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

type Cat = { id: string; name: string; isLeaf: boolean; isActive: boolean; serviceCount: number }

export default function AdminCategoriesPage() {
  const [currentPath, setCurrentPath] = useState<Cat[]>([])
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', icon: '', requiresDriverLicense: false, allowScheduling: true })
  const parentId = useMemo(() => currentPath.at(-1)?.id ?? null, [currentPath])

  const [editing, setEditing] = useState<Cat | null>(null)
  const [editName, setEditName] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro ao criar categoria')
      setForm({ name: '', description: '', icon: '', requiresDriverLicense: false, allowScheduling: true })
      setCreating(false)
      // força recarregar picker mudando o path (no-op)
      setCurrentPath((p) => [...p])
    } catch (e) {
      console.error(e)
      alert('Erro ao criar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (node: Cat) => {
    setToggling(node.id)
    try {
      const res = await fetch(`/api/admin/categories/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !node.isActive })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro')
      setCurrentPath((p) => [...p])
    } catch (e) {
      console.error(e)
      alert('Erro ao atualizar')
    } finally {
      setToggling(null)
    }
  }

  const handleRename = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/categories/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro')
      setEditing(null)
      setCurrentPath((p) => p.map((n) => (n.id === editing.id ? { ...n, name: editName } : n)))
    } catch (e) {
      console.error(e)
      alert('Erro ao renomear')
    } finally {
      setSaving(false)
    }
  }

  const [selectedDetails, setSelectedDetails] = useState<{ id: string; requiresDriverLicense: boolean; allowScheduling: boolean } | null>(null)

  useEffect(() => {
    const current = currentPath.at(-1)
    if (!current) { setSelectedDetails(null); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/categories/${current.id}`)
        const data = await res.json()
        if (res.ok && data.success) {
          setSelectedDetails({
            id: data.category.id,
            requiresDriverLicense: !!data.category.requiresDriverLicense,
            allowScheduling: data.category.allowScheduling !== false
          })
        }
      } catch {}
    })()
  }, [currentPath])

  const toggleRequiresDL = async () => {
    const node = currentPath.at(-1)
    if (!node || !selectedDetails) return
    const newVal = !selectedDetails.requiresDriverLicense
    setToggling(node.id)
    try {
      const res = await fetch(`/api/admin/categories/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiresDriverLicense: newVal })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro')
      setSelectedDetails((d) => d ? { ...d, requiresDriverLicense: newVal } : d)
    } catch (e) {
      console.error(e)
      alert('Erro ao atualizar')
    } finally {
      setToggling(null)
    }
  }

  const toggleAllowScheduling = async () => {
    const node = currentPath.at(-1)
    if (!node || !selectedDetails) return
    const newVal = !selectedDetails.allowScheduling
    setToggling(node.id)
    try {
      const res = await fetch(`/api/admin/categories/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowScheduling: newVal })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro')
      setSelectedDetails((d) => d ? { ...d, allowScheduling: newVal } : d)
    } catch (e) {
      console.error(e)
      alert('Erro ao atualizar')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">Categorias (Admin)</h1>
        <p className="text-gray-600">Gerencie a árvore de serviços da plataforma</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <CascadingCategoryPicker
            value={selectedLeafId}
            onChange={(leafId, path) => {
              setSelectedLeafId(leafId)
              setCurrentPath(path as Cat[])
            }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criar subcategoria */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar subcategoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">
              Pai selecionado: {currentPath.length ? currentPath.map((n) => n.name).join(' > ') : 'Raiz'}
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Ícone (emoji)</Label>
                  <EmojiPicker
                    value={form.icon}
                    onChange={(emoji) => setForm((f) => ({ ...f, icon: emoji }))}
                    placeholder="Opcional — ex.: 🧺"
                    openOnFocus
                    suggestions={(() => {
                      const hint = (currentPath.at(-1)?.name || '').toLowerCase()
                      if (hint.includes('limpeza')) return EMOJI_PRESETS.limpeza
                      if (hint.includes('beleza')) return EMOJI_PRESETS.beleza
                      if (hint.includes('pet')) return EMOJI_PRESETS.pets
                      if (hint.includes('reforma') || hint.includes('manutenção') || hint.includes('manutencao')) return EMOJI_PRESETS.reformas
                      if (hint.includes('tecno')) return EMOJI_PRESETS.tecnologia
                      if (hint.includes('transp')) return EMOJI_PRESETS.transporte
                      if (hint.includes('educ')) return EMOJI_PRESETS.educacao
                      return undefined
                    })()}
                  />
                </div>
              </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label>Exige CNH</Label>
                  <p className="text-xs text-gray-500">Marque para categorias como Transporte/Frete/Motoboy etc.</p>
                </div>
                <Switch checked={form.requiresDriverLicense} onCheckedChange={(v) => setForm((f) => ({ ...f, requiresDriverLicense: v }))} />
              </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Permite agendamento</Label>
                <p className="text-xs text-gray-500">Controle se serviços desta categoria podem abrir agenda.</p>
              </div>
              <Switch checked={form.allowScheduling} onCheckedChange={(v) => setForm((f) => ({ ...f, allowScheduling: v }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={saving || !form.name.trim()}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar categoria
              </Button>
              {creating && (
                <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Renomear / Toggle ativo */}
        <Card>
          <CardHeader>
            <CardTitle>Editar categoria selecionada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentPath.length === 0 ? (
              <div className="text-gray-500">Selecione uma categoria no painel acima</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Atual:</span>
                  <Badge>{currentPath.at(-1)?.name}</Badge>
                  {!currentPath.at(-1)?.isActive && <Badge variant="secondary">Inativa</Badge>}
                </div>
                {!editing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(currentPath.at(-1)!); setEditName(currentPath.at(-1)!.name) }}>
                      <Pencil className="h-4 w-4 mr-1" /> Renomear
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(currentPath.at(-1)!)} disabled={toggling === currentPath.at(-1)!.id}>
                      {toggling === currentPath.at(-1)!.id ? <Loader2 className="h-4 w-4 animate-spin" /> : currentPath.at(-1)!.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-xs" />
                    <Button size="sm" onClick={handleRename} disabled={saving}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
                  </div>
                )}

                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Exige CNH</div>
                    <div className="text-xs text-gray-500">Controla elegibilidade do prestador para esta categoria</div>
                  </div>
                  <Switch disabled={!selectedDetails} checked={!!selectedDetails?.requiresDriverLicense} onCheckedChange={toggleRequiresDL} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Permitir agendamento</div>
                    <div className="text-xs text-gray-500">Quando desativado, prestadores só poderão receber orçamentos.</div>
                  </div>
                  <Switch
                    disabled={!selectedDetails || !currentPath.at(-1)?.isLeaf}
                    checked={!!selectedDetails?.allowScheduling}
                    onCheckedChange={toggleAllowScheduling}
                  />
                </div>
                {!currentPath.at(-1)?.isLeaf && (
                  <p className="text-xs text-gray-500 text-right">Disponível apenas para folhas da árvore de categorias.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
