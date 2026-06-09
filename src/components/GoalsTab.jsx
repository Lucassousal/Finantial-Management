import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { Plus, Trash2, PiggyBank, Target, Calendar } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'

export default function GoalsTab() {
  const { 
    savingGoals, 
    addSavingGoal, 
    deleteSavingGoal, 
    updateSavingGoalAmount,
    loading 
  } = useFinancial()

  // Estados Nova Meta
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [submittingGoal, setSubmittingGoal] = useState(false)

  // Estados Aporte de Meta
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [submittingDeposit, setSubmittingDeposit] = useState(false)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()
    if (!name || !targetAmount) return
    setSubmittingGoal(true)
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
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingGoal(false)
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    if (!selectedGoalId || !depositAmount) return
    setSubmittingDeposit(true)
    try {
      const goal = savingGoals.find(g => g.id === selectedGoalId)
      if (goal) {
        const newTotal = parseFloat(goal.current_amount || 0) + parseCurrencyToNumber(depositAmount)
        await updateSavingGoalAmount(selectedGoalId, newTotal)
        setDepositAmount('')
        setSelectedGoalId('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingDeposit(false)
    }
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulário Nova Meta */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Nova Meta</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Defina um novo objetivo financeiro de poupança.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="space-y-4">
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

              <Button 
                type="submit" 
                disabled={submittingGoal}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 cursor-pointer"
              >
                <Plus size={16} /> Criar Objetivo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Formulário Aporte em Metas */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Guardar Dinheiro</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Direcione uma quantia economizada para um de seus objetivos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Selecionar Meta</label>
                <Select value={selectedGoalId} onValueChange={(val) => setSelectedGoalId(val)}>
                  <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                    <SelectValue placeholder="Escolha a meta" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                    {savingGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
                    ))}
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

              <Button 
                type="submit" 
                disabled={submittingDeposit}
                className="w-full bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-100 font-medium gap-2 cursor-pointer"
              >
                <PiggyBank size={16} /> Registrar Depósito
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Metas Atuais e Progresso */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Seus Objetivos</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Progresso acumulado de metas.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-4 pr-1">
            {savingGoals.length === 0 ? (
              <div className="text-zinc-500 text-center py-6">Nenhum objetivo cadastrado.</div>
            ) : (
              savingGoals.map(goal => {
                const pct = Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100))
                return (
                  <div key={goal.id} className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <Target size={16} className="text-emerald-500 dark:text-emerald-400" />
                          {goal.name}
                        </h4>
                        {goal.target_date && (
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Calendar size={10} /> Limite: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteSavingGoal(goal.id)}
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-500 dark:text-zinc-400">{formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                    </div>
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
