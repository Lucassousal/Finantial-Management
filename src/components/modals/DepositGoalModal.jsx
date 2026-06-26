import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { PiggyBank } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../../lib/utils'

export function DepositGoalModal({ isOpen, onClose, savingGoals, updateSavingGoalAmount }) {
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositDate, setDepositDate] = useState(() => new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedGoalId || !depositAmount) return
    setSubmitting(true)
    try {
      const goal = savingGoals.find(g => g.id === selectedGoalId)
      if (goal) {
        const newTotal = parseFloat(goal.current_amount || 0) + parseCurrencyToNumber(depositAmount)
        await updateSavingGoalAmount(selectedGoalId, newTotal, parseCurrencyToNumber(depositAmount), depositDate)
        setDepositAmount('')
        setSelectedGoalId('')
        setDepositDate(new Date().toISOString().split('T')[0])
        onClose()
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao registrar depósito.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 w-full sm:max-w-md max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-xl">Guardar Dinheiro</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
            Direcione uma quantia economizada para um de seus objetivos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Selecionar Meta</label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId} required>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectValue placeholder="Escolha a meta" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  {savingGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
                  ))}
                  {savingGoals.length === 0 && (
                    <SelectItem value="none" disabled>Nenhuma meta cadastrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor a Depositar</label>
              <Input 
                type="text" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(formatCurrencyInput(e.target.value))} 
                placeholder="R$ 0,00"
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data do Depósito</label>
              <Input 
                type="date"
                value={depositDate} 
                onChange={(e) => setDepositDate(e.target.value)} 
                required
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-6 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-100 cursor-pointer">
                {submitting ? 'Processando...' : 'Registrar Depósito'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
