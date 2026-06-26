import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Plus } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../../lib/utils'

export function AddGoalModal({ isOpen, onClose, addSavingGoal }) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !targetAmount) return
    setSubmitting(true)
    try {
      await addSavingGoal({
        name,
        target_amount: parseCurrencyToNumber(targetAmount),
        current_amount: 0.00,
        target_date: targetDate || null
      })
      setName('')
      setTargetAmount('')
      setTargetDate('')
      onClose()
    } catch (err) {
      console.error(err)
      alert("Erro ao criar objetivo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 w-full sm:max-w-md max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-xl">Nova Meta</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
            Defina um novo objetivo financeiro de poupança.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Objetivo</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: Reserva de Emergência, Viagem"
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor Alvo</label>
              <Input 
                type="text" 
                value={targetAmount} 
                onChange={(e) => setTargetAmount(formatCurrencyInput(e.target.value))} 
                placeholder="R$ 0,00"
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data Limite (Opcional)</label>
              <Input 
                type="date"
                value={targetDate} 
                onChange={(e) => setTargetDate(e.target.value)} 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-6 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
                {submitting ? 'Salvando...' : 'Criar Objetivo'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
