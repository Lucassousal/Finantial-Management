import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Edit2, TrendingUp } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'
import { ConfirmDialog } from './ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { AddInvestmentModal } from './modals/AddInvestmentModal'
import { UpdateInvestmentModal } from './modals/UpdateInvestmentModal'
import { EmptyState } from './ui/empty-state'

export default function InvestmentsTab() {
  const { 
    investments, 
    addInvestment, 
    deleteInvestment, 
    updateInvestment,
    updateInvestmentBalance,
    loading 
  } = useFinancial()

  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false)
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false)

  // Estados Edição de Investimento
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('fixed_income')
  const [editInstitution, setEditInstitution] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const handleStartEdit = (inv) => {
    setEditId(inv.id)
    setEditName(inv.name)
    setEditType(inv.type)
    setEditInstitution(inv.institution || '')
    setEditBalance(formatCurrencyInput(String(Math.round(inv.current_balance * 100))))
    setIsEditOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editName || !editBalance) return
    setSubmittingEdit(true)
    try {
      await updateInvestment(editId, {
        name: editName,
        type: editType,
        institution: editInstitution || null,
        current_balance: parseCurrencyToNumber(editBalance)
      })
      setIsEditOpen(false)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar alterações do ativo.")
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Estados de confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [deleteConfirmDesc, setDeleteConfirmDesc] = useState('')

  const confirmDeleteInvestment = (id, name, balance) => {
    setDeleteConfirmId(id)
    setDeleteConfirmTitle('Confirmar Exclusão de Ativo/Investimento')
    setDeleteConfirmDesc(`Tem certeza de que deseja excluir o investimento "${name}" (Saldo atual: ${formatCurrency(balance)})? Todo o histórico de saldos associado a este investimento também será permanentemente excluído.`)
    setDeleteConfirmOpen(true)
  }

  const executeDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteInvestment(deleteConfirmId)
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

  const totalInvested = investments.reduce((sum, i) => sum + parseFloat(i.current_balance || 0), 0)

  const translateType = (t) => {
    const types = {
      fixed_income: 'Renda Fixa',
      stocks: 'Ações',
      fii: 'Fundos Imobiliários',
      crypto: 'Criptomoedas',
      savings: 'Poupança',
      other: 'Outros'
    }
    return types[t] || t
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      {/* Resumo de Investimentos */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 md:col-span-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Patrimônio Acumulado em Investimentos</CardDescription>
            <CardTitle className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(totalInvested)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Seus Ativos</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Cadastre e atualize a cotação da sua carteira.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsAddInvestmentOpen(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white gap-2 cursor-pointer">
            <Plus size={16} /> Novo Ativo
          </Button>
          <Button onClick={() => setIsUpdateBalanceOpen(true)} variant="outline" className="w-full sm:w-auto gap-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <Edit2 size={16} className="text-indigo-500" /> Atualizar Saldo
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Lista de Ativos */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm w-full">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Distribuição de Ativos</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Listagem de investimentos cadastrados e saldos atuais.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {investments.length === 0 ? (
              <EmptyState 
                icon={TrendingUp} 
                title="Nenhum ativo cadastrado" 
                description="Construa seu patrimônio e acompanhe o crescimento dos seus rendimentos ao longo do tempo."
                actionLabel="Novo Ativo"
                onAction={() => setIsAddInvestmentOpen(true)}
              />
            ) : (
              investments.map(i => (
                <div key={i.id} className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-white">{i.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{i.institution || 'Sem corretora'} • {translateType(i.type)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStartEdit(i)}
                        className="h-7 w-7 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => confirmDeleteInvestment(i.id, i.name, i.current_balance)}
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-900">
                    <span className="text-xs text-zinc-500">Saldo Atual</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(i.current_balance)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AddInvestmentModal 
        isOpen={isAddInvestmentOpen} 
        onClose={() => setIsAddInvestmentOpen(false)} 
        addInvestment={addInvestment} 
      />

      <UpdateInvestmentModal 
        isOpen={isUpdateBalanceOpen} 
        onClose={() => setIsUpdateBalanceOpen(false)} 
        investments={investments} 
        updateInvestmentBalance={updateInvestmentBalance} 
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
            <DialogTitle>Editar Ativo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Ativo</label>
              <Input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de Ativo</label>
              <Select value={editType} onValueChange={(val) => setEditType(val)}>
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
                value={editInstitution} 
                onChange={(e) => setEditInstitution(e.target.value)} 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Saldo Atual</label>
              <Input 
                type="text" 
                value={editBalance} 
                onChange={(e) => setEditBalance(formatCurrencyInput(e.target.value))} 
                required 
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingEdit} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer">
                {submittingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

