import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Plus, Loader2, FileText, Trash2 } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../../lib/utils'
import { useFinancial } from '../../context/FinancialContext'

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

  const { investments, savingGoals, updateInvestmentBalance, updateSavingGoalAmount } = useFinancial()
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('')
  const [goalAllocations, setGoalAllocations] = useState([]) // [{ goalId: '', amountStr: '' }]

  const addGoalAllocation = () => setGoalAllocations([...goalAllocations, { goalId: '', amountStr: '' }])
  const removeGoalAllocation = (index) => setGoalAllocations(goalAllocations.filter((_, i) => i !== index))
  const updateGoalAllocation = (index, field, value) => {
    const newArr = [...goalAllocations]
    newArr[index][field] = value
    setGoalAllocations(newArr)
  }

    const handleAddTrans = async (e) => {
    e.preventDefault()
    if (!description || !amount || !categoryId || !date) {
      alert("Por favor, preencha todos os campos obrigatórios (Descrição, Valor, Categoria e Data).")
      return
    }
    if ((type === 'investment' || type === 'redemption') && !selectedInvestmentId) {
      alert("Por favor, selecione um investimento.")
      return
    }

    const totalAmountNum = parseCurrencyToNumber(amount)

    // Validar alocações de metas
    if (type === 'investment' && goalAllocations.length > 0) {
      let allocatedTotal = 0
      for (const alloc of goalAllocations) {
        if (!alloc.goalId || !alloc.amountStr) {
          alert("Preencha todos os campos das metas distribuídas ou remova a linha vazia.")
          return
        }
        allocatedTotal += parseCurrencyToNumber(alloc.amountStr)
      }
      if (allocatedTotal > totalAmountNum) {
        alert("O valor distribuído para as metas não pode ultrapassar o valor total do Aporte!")
        return
      }
    }

    setSubmittingTrans(true)
    try {
      await addTransaction({
        description,
        amount: totalAmountNum,
        type,
        category_id: categoryId,
        date,
        family_member_id: (familyMemberId && familyMemberId !== 'none') ? familyMemberId : null,
        is_future: isFuture,
        notes: notes || null
      })

      // Se for aporte ou resgate, atualiza o saldo do investimento
      if ((type === 'investment' || type === 'redemption') && selectedInvestmentId) {
        const inv = investments.find(i => i.id === selectedInvestmentId)
        if (inv) {
          const delta = type === 'investment' ? totalAmountNum : -totalAmountNum
          const newBalance = parseFloat(inv.current_balance || 0) + delta
          await updateInvestmentBalance(selectedInvestmentId, newBalance, date)
        }
        
        // E injeta o dinheiro nas metas selecionadas (apenas para aportes)
        if (type === 'investment') {
          for (const alloc of goalAllocations) {
            const allocNum = parseCurrencyToNumber(alloc.amountStr)
            if (allocNum > 0) {
              const goal = savingGoals.find(g => g.id === alloc.goalId)
              if (goal) {
                const newGoalTotal = parseFloat(goal.current_amount || 0) + allocNum
                await updateSavingGoalAmount(alloc.goalId, newGoalTotal, allocNum, date)
              }
            }
          }
        }
      }

      setDescription('')
      setAmount('')
      setFamilyMemberId('')
      setNotes('')
      setIsFuture(false)
      setSelectedInvestmentId('')
      setGoalAllocations([])
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
            <Select value={type} onValueChange={(val) => { setType(val); setCategoryId(''); }}>
              <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="investment">Investimento (Aporte)</SelectItem>
                <SelectItem value="redemption">Investimento (Resgate)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val)} required>
              <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                {categories.filter(c => c.type === (type === 'redemption' ? 'investment' : type)).map((cat) => (
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

          {(type === 'investment' || type === 'redemption') && (
            <div className="sm:col-span-2 space-y-4 mt-2 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <div className="space-y-2">
                <label className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                  {type === 'investment' ? 'Investimento Destino' : 'Investimento de Origem'} <span className="text-red-500">*</span>
                </label>
                <Select value={selectedInvestmentId} onValueChange={setSelectedInvestmentId} required={type === 'investment' || type === 'redemption'}>
                  <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                    <SelectValue placeholder={type === 'investment' ? 'Onde o dinheiro foi investido?' : 'De qual investimento o dinheiro saiu?'} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                    {investments.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                    ))}
                    {investments.length === 0 && (
                      <SelectItem value="none" disabled>Nenhum investimento cadastrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">O saldo deste investimento será atualizado automaticamente.</p>
              </div>

              {type === 'investment' && (
                <div className="space-y-3 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Distribuir em Metas (Opcional)</label>
                  <Button type="button" variant="outline" size="sm" onClick={addGoalAllocation} className="h-7 text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
                    <Plus size={14} className="mr-1" /> Adicionar Meta
                  </Button>
                </div>
                
                {goalAllocations.map((alloc, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Select value={alloc.goalId} onValueChange={(val) => updateGoalAllocation(idx, 'goalId', val)}>
                        <SelectTrigger className="h-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 text-xs">
                          <SelectValue placeholder="Selecione a Meta" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 text-xs">
                          {savingGoals.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-1/3 space-y-1">
                      <Input 
                        value={alloc.amountStr} 
                        onChange={(e) => updateGoalAllocation(idx, 'amountStr', formatCurrencyInput(e.target.value))} 
                        placeholder="Valor"
                        className="h-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 text-xs text-right"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGoalAllocation(idx)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

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
