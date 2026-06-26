import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Plus } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../../lib/utils'

export function AddInvestmentModal({ isOpen, onClose, addInvestment }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('fixed_income')
  const [institution, setInstitution] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !initialBalance) return
    setSubmitting(true)
    try {
      await addInvestment({
        name,
        type,
        institution: institution || null,
        current_balance: parseCurrencyToNumber(initialBalance)
      })
      setName('')
      setInstitution('')
      setInitialBalance('')
      setType('fixed_income')
      onClose()
    } catch (err) {
      console.error(err)
      alert("Erro ao cadastrar investimento.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 w-full sm:max-w-md max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-xl">Novo Ativo</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
            Cadastre um novo investimento na sua carteira.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Ativo</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: Tesouro Selic 2029, PETR4"
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de Ativo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                  <SelectItem value="stocks">Ações</SelectItem>
                  <SelectItem value="fii">Fundos Imobiliários (FII)</SelectItem>
                  <SelectItem value="crypto">Criptomoedas</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="other">Outros Ativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Instituição (Opcional)</label>
              <Input 
                value={institution} 
                onChange={(e) => setInstitution(e.target.value)} 
                placeholder="Ex: XP, Nu invest, Binance"
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Saldo Atual / Inicial</label>
              <Input 
                type="text" 
                value={initialBalance} 
                onChange={(e) => setInitialBalance(formatCurrencyInput(e.target.value))} 
                placeholder="R$ 0,00"
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-6 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">
                {submitting ? 'Salvando...' : 'Cadastrar Investimento'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
