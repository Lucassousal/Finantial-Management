import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'
import { ConfirmDialog } from './ui/confirm-dialog'


export default function InvestmentsTab() {
  const { 
    investments, 
    addInvestment, 
    deleteInvestment, 
    updateInvestmentBalance,
    loading 
  } = useFinancial()

  // Estados Novo Investimento
  const [name, setName] = useState('')
  const [type, setType] = useState('fixed_income')
  const [institution, setInstitution] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Estados Atualização de Saldo
  const [selectedInvestId, setSelectedInvestId] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0])
  const [submittingUpdate, setSubmittingUpdate] = useState(false)

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

  const handleAddInvestment = async (e) => {
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
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateBalance = async (e) => {
    e.preventDefault()
    if (!selectedInvestId || !newBalance) return
    setSubmittingUpdate(true)
    try {
      await updateInvestmentBalance(
        selectedInvestId,
        parseCurrencyToNumber(newBalance),
        updateDate
      )
      setNewBalance('')
      setSelectedInvestId('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingUpdate(false)
    }
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulário Novo Investimento */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Novo Ativo</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Cadastre um novo investimento na sua carteira.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddInvestment} className="space-y-4">
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
                <Select value={type} onValueChange={(val) => setType(val)}>
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

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-2 cursor-pointer"
              >
                <Plus size={16} /> Cadastrar Investimento
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Atualização de Saldo de Ativos Existentes */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Atualizar Saldo</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Lance o novo valor de um investimento para gerar o histórico de evolução patrimonial.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateBalance} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Selecionar Investimento</label>
                <Select value={selectedInvestId} onValueChange={(val) => setSelectedInvestId(val)}>
                  <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                    <SelectValue placeholder="Escolha o ativo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                    {investments.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Novo Saldo Acumulado</label>
                <Input 
                  type="text" 
                  value={newBalance} 
                  onChange={(e) => setNewBalance(formatCurrencyInput(e.target.value))} 
                  placeholder="R$ 0,00"
                  required 
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data de Referência</label>
                <Input 
                  type="date"
                  value={updateDate} 
                  onChange={(e) => setUpdateDate(e.target.value)} 
                  required 
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                />
              </div>

              <Button 
                type="submit" 
                disabled={submittingUpdate}
                className="w-full bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-100 font-medium gap-2 cursor-pointer"
              >
                <Edit2 size={16} /> Salvar Nova Cotação / Saldo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Ativos */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-white">Distribuição de Ativos</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Listagem de investimentos cadastrados e saldos atuais.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {investments.length === 0 ? (
              <div className="text-zinc-500 text-center py-6">Nenhum ativo cadastrado.</div>
            ) : (
              investments.map(i => (
                <div key={i.id} className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-white">{i.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{i.institution || 'Sem corretora'} • {translateType(i.type)}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => confirmDeleteInvestment(i.id, i.name, i.current_balance)}
                      className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <Trash2 size={14} />
                    </Button>

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

      <ConfirmDialog 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title={deleteConfirmTitle}
        description={deleteConfirmDesc}
      />
    </div>
  )
}

