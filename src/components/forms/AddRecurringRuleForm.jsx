import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Clock, Loader2 } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../../lib/utils'

export const AddRecurringRuleForm = React.memo(({ addRecurringRule, categories, familyMembers }) => {
  const [recDesc, setRecDesc] = useState('')
  const [recAmount, setRecAmount] = useState('')
  const [recType, setRecType] = useState('expense')
  const [recCatId, setRecCatId] = useState('')
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0])
  const [recEndDate, setRecEndDate] = useState('')
  const [recFamilyMemberId, setRecFamilyMemberId] = useState('')
  const [submittingRec, setSubmittingRec] = useState(false)

  const handleAddRec = async (e) => {
    e.preventDefault()
    if (!recDesc || !recAmount || !recCatId || !recStartDate) return
    setSubmittingRec(true)
    try {
      await addRecurringRule({
        description: recDesc,
        amount: parseCurrencyToNumber(recAmount),
        type: recType,
        category_id: recCatId,
        start_date: recStartDate,
        end_date: recEndDate || null,
        family_member_id: (recFamilyMemberId && recFamilyMemberId !== 'none') ? recFamilyMemberId : null,
        frequency: 'monthly'
      })
      setRecDesc('')
      setRecAmount('')
      setRecFamilyMemberId('')
      setRecEndDate('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingRec(false)
    }
  }

  return (
    <form onSubmit={handleAddRec} className="space-y-4 lg:col-span-1">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
        <Input 
          value={recDesc} 
          onChange={(e) => setRecDesc(e.target.value)} 
          placeholder="Ex: Assinatura Netflix, Parcela Carro"
          required 
          className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor</label>
          <Input 
            type="text" 
            value={recAmount} 
            onChange={(e) => setRecAmount(formatCurrencyInput(e.target.value))} 
            placeholder="R$ 0,00"
            required 
            className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
          <Select value={recType} onValueChange={(val) => setRecType(val)}>
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
        <Select value={recCatId} onValueChange={(val) => setRecCatId(val)}>
          <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
            {categories.filter(c => c.type === recType).map((cat) => (
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
            value={recStartDate} 
            onChange={(e) => setRecStartDate(e.target.value)} 
            required 
            className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Término (Op.)</label>
          <Input 
            type="date"
            value={recEndDate} 
            onChange={(e) => setRecEndDate(e.target.value)} 
            className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pessoa Responsável (Opcional)</label>
        <Select value={recFamilyMemberId} onValueChange={(val) => setRecFamilyMemberId(val)}>
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
      <Button 
        type="submit" 
        disabled={submittingRec}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-2 cursor-pointer"
      >
        {submittingRec ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Salvando...
          </>
        ) : (
          <>
            <Clock size={16} /> Salvar Regra de Recorrência
          </>
        )}
      </Button>
    </form>
  )
})
