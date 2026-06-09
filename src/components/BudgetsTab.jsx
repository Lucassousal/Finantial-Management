import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'

export default function BudgetsTab() {
  const { 
    budgets, 
    categories, 
    transactions, 
    addBudget, 
    deleteBudget 
  } = useFinancial()

  const [categoryId, setCategoryId] = useState('')
  const [amountLimit, setAmountLimit] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // 'YYYY-MM'
  const [submitting, setSubmitting] = useState(false)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const handleAddBudget = async (e) => {
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
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Calcula o valor gasto por categoria para o orçamento correspondente
  const getAmountSpent = (catId, budgetMonth) => {
    return transactions
      .filter((t) => t.category_id === catId && t.type === 'expense' && t.date.startsWith(budgetMonth))
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulário Novo Orçamento */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Definir Limite de Gastos</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Estabeleça um teto de despesa mensal para uma categoria específica.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
                <Select value={categoryId} onValueChange={(val) => setCategoryId(val)}>
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

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 cursor-pointer"
              >
                <Plus size={16} /> Definir Teto
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Listagem de Orçamentos Ativos */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Acompanhamento de Orçamentos</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Verifique a porcentagem de limite consumida em cada categoria.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {budgets.length === 0 ? (
              <div className="text-zinc-500 text-center py-6">Nenhum orçamento configurado para este mês.</div>
            ) : (
              budgets.map(b => {
                const spent = getAmountSpent(b.category_id, b.month)
                const pct = Math.min(100, Math.round((spent / b.amount_limit) * 100))
                const isOverBudget = spent > b.amount_limit
                const isCloseToBudget = spent >= b.amount_limit * 0.75 && spent <= b.amount_limit

                // Determina a cor visual
                let progressColor = 'bg-emerald-500' // Verde
                if (isOverBudget) {
                  progressColor = 'bg-rose-500' // Vermelho
                } else if (isCloseToBudget) {
                  progressColor = 'bg-amber-500' // Laranja / Amarelo
                }

                // Formatação do mês '2026-06' -> '06/2026'
                const [y, m] = b.month.split('-')
                const formattedMonth = `${m}/${y}`

                return (
                  <div key={b.id} className="p-4 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.categories?.color }}></span>
                          <h4 className="font-semibold text-zinc-900 dark:text-white">{b.categories?.name || 'Geral'}</h4>
                          <span className="text-xs text-zinc-500">• Mês {formattedMonth}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteBudget(b.id)}
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-500 dark:text-zinc-450">Gasto: {formatCurrency(spent)} de {formatCurrency(b.amount_limit)}</span>
                        <span className={`font-semibold ${isOverBudget ? 'text-rose-600 dark:text-rose-450' : isCloseToBudget ? 'text-amber-600 dark:text-amber-450' : 'text-emerald-600 dark:text-emerald-450'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>

                    {isOverBudget ? (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                        <AlertTriangle size={14} />
                        Limite estourado! Evite novas despesas nesta categoria.
                      </div>
                    ) : isCloseToBudget ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                        <AlertTriangle size={14} />
                        Atenção! Mais de 75% do teto já foi consumido.
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                        <CheckCircle size={14} />
                        Gastos dentro do planejado.
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
