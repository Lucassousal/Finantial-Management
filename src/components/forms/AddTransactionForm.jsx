import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Plus, Loader2, FileText } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../../lib/utils'

export const AddTransactionForm = React.memo(({ addTransaction, categories, familyMembers, importingPdf, handlePdfUpload }) => {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [familyMemberId, setFamilyMemberId] = useState('')
  const [isFuture, setIsFuture] = useState(false)
  const [notes, setNotes] = useState('')
  const [submittingTrans, setSubmittingTrans] = useState(false)

  const handleAddTrans = async (e) => {
    e.preventDefault()
    if (!description || !amount || !categoryId || !date) return
    setSubmittingTrans(true)
    try {
      await addTransaction({
        description,
        amount: parseCurrencyToNumber(amount),
        type,
        category_id: categoryId,
        date,
        family_member_id: (familyMemberId && familyMemberId !== 'none') ? familyMemberId : null,
        is_future: isFuture,
        notes: notes || null
      })
      setDescription('')
      setAmount('')
      setFamilyMemberId('')
      setNotes('')
      setIsFuture(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingTrans(false)
    }
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl text-zinc-900 dark:text-white">Nova Movimentação</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Lançamento de fluxo de caixa único (imediato ou futuro).</CardDescription>
        </div>
        <div>
          <label className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm font-medium h-8 px-3 gap-1.5 transition-colors shadow-xs">
            <FileText size={16} className="text-emerald-500" />
            Importar Fatura (PDF)
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handlePdfUpload} 
              className="hidden" 
              disabled={importingPdf}
            />
          </label>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleAddTrans} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Supermercado, Transferência, etc."
              required 
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor</label>
            <Input 
              type="text" 
              value={amount} 
              onChange={(e) => setAmount(formatCurrencyInput(e.target.value))} 
              placeholder="R$ 0,00"
              required 
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de Fluxo</label>
            <Select value={type} onValueChange={(val) => setType(val)}>
              <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="investment">Investimento (Aporte)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val)}>
              <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                {categories.filter(c => c.type === type).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data do Lançamento</label>
            <Input 
              type="date"
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Familiar / Membro (Opcional)</label>
            <Select value={familyMemberId} onValueChange={(val) => setFamilyMemberId(val)}>
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

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Observações (Opcional)</label>
            <Input 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Mais informações sobre a transação..."
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input 
              type="checkbox" 
              id="isFuture" 
              checked={isFuture} 
              onChange={(e) => setIsFuture(e.target.checked)} 
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="isFuture" className="text-sm text-zinc-600 dark:text-zinc-300 select-none cursor-pointer">
              Agendar como lançamento futuro (previsto)
            </label>
          </div>

          <Button 
            type="submit" 
            disabled={submittingTrans}
            className="w-full sm:col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 mt-2 cursor-pointer"
          >
            {submittingTrans ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Plus size={16} /> Lançar Movimentação
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
})
