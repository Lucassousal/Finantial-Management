import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Plus } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../../lib/utils'

export function AddBudgetModal({ isOpen, onClose, addBudget, categories }) {
  const [categoryId, setCategoryId] = useState('')
  const [amountLimit, setAmountLimit] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!categoryId || !amountLimit || !month) return
    setSubmitting(true)
    try {
      await addBudget({
        category_id: categoryId,
        amount_limit: parseCurrencyToNumber(amountLimit),
        month
      })
      setCategoryId('')
      setAmountLimit('')
      onClose()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar limite de gastos.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 w-full sm:max-w-md max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-xl">Novo Orçamento</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
            Defina um teto de gastos mensal para uma categoria.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  {categories.filter(c => c.type === 'expense').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Limite Mensal</label>
              <Input 
                type="text" 
                value={amountLimit} 
                onChange={(e) => setAmountLimit(formatCurrencyInput(e.target.value))} 
                placeholder="R$ 0,00"
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mês de Referência</label>
              <Input 
                type="month"
                value={month} 
                onChange={(e) => setMonth(e.target.value)} 
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-6 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
                {submitting ? 'Salvando...' : 'Definir Teto'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
