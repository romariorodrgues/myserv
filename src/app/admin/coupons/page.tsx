/** Admin Coupons Management */
'use client'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Coupon = {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED' | string
  value: number
  appliesTo: 'FREE' | 'PREMIUM' | 'ENTERPRISE' | 'ANY' | string
  validFrom?: string
  validTo?: string
  isActive: boolean
  createdAt: string
}

export default function AdminCouponsPage() {
  const [list, setList] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Coupon>>({ discountType: 'PERCENT', appliesTo: 'ANY', isActive: true })

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/coupons')
    const j = await r.json()
    if (j.success) setList(j.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    const r = await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value: Number(form.value || 0) }) })
    const j = await r.json()
    if (!r.ok) { alert(j.error || 'Erro'); return }
    setOpen(false); setForm({ discountType: 'PERCENT', appliesTo: 'ANY', isActive: true }); load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
        <Button onClick={() => setOpen(true)}>Novo Cupom</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? 'Carregando…' : list.length === 0 ? (
            <div className="text-gray-500">Nenhum cupom cadastrado.</div>
          ) : (
            <div className="space-y-2">
              {list.map(c => (
                <div key={c.id} className="p-3 border rounded flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.code}</div>
                    <div className="text-sm text-gray-600 truncate">{c.discountType} {c.value}{c.discountType === 'PERCENT' ? '%' : ' R$'} • {c.appliesTo} • {c.isActive ? 'Ativo' : 'Inativo'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => { await fetch(`/api/admin/coupons/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !c.isActive }) }); load() }}> {c.isActive ? 'Desativar' : 'Ativar'} </Button>
                    <Button variant="outline" onClick={async () => { if (!confirm('Excluir este cupom?')) return; await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' }); load() }}>Excluir</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {open && (
        <Card>
          <CardHeader><CardTitle>Novo Cupom</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Código</label>
                <Input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="MY10OFF" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Tipo</label>
                <Select value={String(form.discountType)} onValueChange={(v) => setForm(f => ({ ...f, discountType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentual %</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-gray-700">Valor</label>
                <Input type="number" value={form.value as any || ''} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} placeholder="10" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Plano</label>
                <Select value={String(form.appliesTo)} onValueChange={(v) => setForm(f => ({ ...f, appliesTo: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANY">Qualquer</SelectItem>
                    <SelectItem value="FREE">Grátis</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-gray-700">Início</label>
                <Input type="date" value={(form.validFrom as any) || ''} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Fim</label>
                <Input type="date" value={(form.validTo as any) || ''} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

