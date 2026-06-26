import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { Plus, Trash2, PiggyBank, Target, Calendar, Edit2 } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'
import { ConfirmDialog } from './ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { AddGoalModal } from './modals/AddGoalModal'
import { DepositGoalModal } from './modals/DepositGoalModal'
import { EmptyState } from './ui/empty-state'

export default function GoalsTab() {
  const { 
    savingGoals, 
    addSavingGoal, 
    deleteSavingGoal, 
    updateSavingGoal,
    updateSavingGoalAmount,
    loading 
  } = useFinancial()

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)

  // Estados Edição de Meta
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editTargetAmount, setEditTargetAmount] = useState('')
  const [editCurrentAmount, setEditCurrentAmount] = useState('')
  const [editTargetDate, setEditTargetDate] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const handleStartEdit = (goal) => {
    setEditId(goal.id)
    setEditName(goal.name)
    setEditTargetAmount(formatCurrencyInput(String(Math.round(goal.target_amount * 100))))
    setEditCurrentAmount(formatCurrencyInput(String(Math.round(goal.current_amount * 100))))
    setEditTargetDate(goal.target_date || '')
    setIsEditOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editName || !editTargetAmount) return
    setSubmittingEdit(true)
    try {
      await updateSavingGoal(editId, {
        name: editName,
        target_amount: parseCurrencyToNumber(editTargetAmount),
        current_amount: parseCurrencyToNumber(editCurrentAmount),
        target_date: editTargetDate || null
      })
      setIsEditOpen(false)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar alterações do objetivo.")
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Estados de confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [deleteConfirmDesc, setDeleteConfirmDesc] = useState('')

  const confirmDeleteGoal = (id, name, target, current) => {
    setDeleteConfirmId(id)
    setDeleteConfirmTitle('Confirmar Exclusão de Meta/Objetivo')
    setDeleteConfirmDesc(`Tem certeza de que deseja excluir o objetivo "${name}" (Progresso: ${formatCurrency(current)} de ${formatCurrency(target)})? Esta ação não pode ser desfeita e todo o progresso registrado será perdido.`)
    setDeleteConfirmOpen(true)
  }

  const executeDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteSavingGoal(deleteConfirmId)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteConfirmId(null)
    }
  }


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
        await updateSavingGoalAmount(selectedGoalId, newTotal, parseCurrencyToNumber(depositAmount), depositDate)
        setDepositAmount('')
        setSelectedGoalId('')
        setDepositDate(new Date().toISOString().split('T')[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingDeposit(false)
    }
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Metas Financeiras</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Acompanhe seus objetivos e reserve capital.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsAddGoalOpen(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white gap-2 cursor-pointer">
            <Plus size={16} /> Nova Meta
          </Button>
          <Button onClick={() => setIsDepositOpen(true)} variant="outline" className="w-full sm:w-auto gap-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <PiggyBank size={16} className="text-emerald-500" /> Guardar Dinheiro
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Metas Atuais e Progresso */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm w-full">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Seus Objetivos</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Progresso acumulado de metas.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-4 pr-1">
            {savingGoals.length === 0 ? (
              <EmptyState 
                icon={Target} 
                title="Nenhum objetivo cadastrado" 
                description="Suas conquistas começam aqui. Crie uma meta para começar a poupar dinheiro com um propósito claro."
                actionLabel="Criar Meta"
                onAction={() => setIsAddGoalOpen(true)}
              />
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
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleStartEdit(goal)}
                          className="h-7 w-7 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => confirmDeleteGoal(goal.id, goal.name, goal.target_amount, goal.current_amount)}
                          className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

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

      <AddGoalModal 
        isOpen={isAddGoalOpen} 
        onClose={() => setIsAddGoalOpen(false)} 
        addSavingGoal={addSavingGoal} 
      />

      <DepositGoalModal 
        isOpen={isDepositOpen} 
        onClose={() => setIsDepositOpen(false)} 
        savingGoals={savingGoals} 
        updateSavingGoalAmount={updateSavingGoalAmount} 
      />

      <ConfirmDialog 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title={deleteConfirmTitle}
        description={deleteConfirmDesc}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
          <DialogHeader>
            <DialogTitle>Editar Meta / Objetivo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Objetivo</label>
              <Input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor Alvo</label>
                <Input 
                  type="text" 
                  value={editTargetAmount} 
                  onChange={(e) => setEditTargetAmount(formatCurrencyInput(e.target.value))} 
                  required 
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor Guardado (Atual)</label>
                <Input 
                  type="text" 
                  value={editCurrentAmount} 
                  onChange={(e) => setEditCurrentAmount(formatCurrencyInput(e.target.value))} 
                  required 
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data Limite (Opcional)</label>
              <Input 
                type="date"
                value={editTargetDate} 
                onChange={(e) => setEditTargetDate(e.target.value)} 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
                {submittingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

