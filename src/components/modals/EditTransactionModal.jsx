import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

export function formatCurrencyInput(value) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  const number = parseInt(digits, 10) / 100
  if (isNaN(number)) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

export function parseCurrencyToNumber(currencyString) {
  if (!currencyString) return 0
  const cleanString = currencyString.replace(/\./g, '').replace(',', '.')
  const numberString = cleanString.replace(/[^\d.-]/g, '')
  return parseFloat(numberString) || 0
}

export default function EditTransactionModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onSave, 
  categories, 
  familyMembers 
}) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [catId, setCatId] = useState('')
  const [date, setDate] = useState('')
  const [familyMemberId, setFamilyMemberId] = useState('none')
  const [isFuture, setIsFuture] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (transaction && isOpen) {
      setDesc(transaction.description || '')
      setAmount(formatCurrencyInput(String(Math.round(transaction.amount * 100))))
      setType(transaction.type || 'expense')
      setCatId(transaction.category_id || '')
      setDate(transaction.date || '')
      setFamilyMemberId(transaction.family_member_id || 'none')
      setIsFuture(transaction.is_future || false)
      setNotes(transaction.notes || '')
    }
  }, [transaction, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!desc || !amount || !catId || !date) return
    setSubmitting(true)
    try {
      await onSave(transaction.id, {
        description: desc,
        amount: parseCurrencyToNumber(amount),
        type,
        category_id: catId,
        date,
        family_member_id: (familyMemberId && familyMemberId !== 'none') ? familyMemberId : null,
        is_future: isFuture,
        notes: notes || null
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar alterações da transação.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-xl">Editar Movimentação</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
            <Input 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
              required 
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor</label>
              <Input 
                value={amount} 
                onChange={(e) => setAmount(formatCurrencyInput(e.target.value))} 
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="investment">Investimento (Aporte)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  {categories.filter(c => c.type === type).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
              <Input 
                type="date"
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Familiar / Membro (Opcional)</label>
            <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
              <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectValue placeholder="Selecione o membro" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectItem value="none">Nenhum / Geral</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Observações (Opcional)</label>
            <Input 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Mais informações..."
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="editTransIsFuture" 
              checked={isFuture} 
              onChange={(e) => setIsFuture(e.target.checked)} 
              className="h-4 w-4 rounded border-zinc-350 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="editTransIsFuture" className="text-sm text-zinc-650 dark:text-zinc-300 select-none cursor-pointer">
              Agendar como lançamento futuro (previsto)
            </label>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
