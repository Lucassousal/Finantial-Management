import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { formatCurrencyInput, parseCurrencyToNumber } from './EditTransactionModal'

export default function EditRecurringRuleModal({ 
  isOpen, 
  onClose, 
  rule, 
  onSave, 
  categories, 
  familyMembers 
}) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [catId, setCatId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [familyMemberId, setFamilyMemberId] = useState('none')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (rule && isOpen) {
      setDesc(rule.description || '')
      setAmount(formatCurrencyInput(String(Math.round(rule.amount * 100))))
      setType(rule.type || 'expense')
      setCatId(rule.category_id || '')
      setStartDate(rule.start_date || '')
      setEndDate(rule.end_date || '')
      setFamilyMemberId(rule.family_member_id || 'none')
    }
  }, [rule, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!desc || !amount || !catId || !startDate) return
    setSubmitting(true)
    try {
      await onSave(rule.id, {
        description: desc,
        amount: parseCurrencyToNumber(amount),
        type,
        category_id: catId,
        start_date: startDate,
        end_date: endDate || null,
        family_member_id: (familyMemberId && familyMemberId !== 'none') ? familyMemberId : null,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar alterações da regra recorrente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
        <DialogHeader>
          <DialogTitle>Editar Regra Recorrente</DialogTitle>
        </DialogHeader>
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
                </SelectContent>
              </Select>
            </div>
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Início</label>
              <Input 
                type="date"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Término (Op.)</label>
              <Input 
                type="date"
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pessoa Responsável (Opcional)</label>
            <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
              <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectValue placeholder="Selecione o responsável" />
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
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
