import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Plus, Trash2, Calendar, User, Tag, Clock } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'

export default function TransactionsTab() {
  const { 
    transactions, 
    categories, 
    recurringRules,
    familyMembers,
    addTransaction, 
    deleteTransaction,
    addRecurringRule,
    deleteRecurringRule,
    loading 
  } = useFinancial()

  // Estados Transação
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [familyMemberId, setFamilyMemberId] = useState('')
  const [isFuture, setIsFuture] = useState(false)
  const [notes, setNotes] = useState('')
  const [submittingTrans, setSubmittingTrans] = useState(false)

  // Estados Recorrência
  const [recDesc, setRecDesc] = useState('')
  const [recAmount, setRecAmount] = useState('')
  const [recType, setRecType] = useState('expense')
  const [recCatId, setRecCatId] = useState('')
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0])
  const [recEndDate, setRecEndDate] = useState('')
  const [recFamilyMemberId, setRecFamilyMemberId] = useState('')
  const [submittingRec, setSubmittingRec] = useState(false)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

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
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      {/* Formulário de Transação */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-zinc-900 dark:text-white">Nova Movimentação</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Lançamento de fluxo de caixa único (imediato ou futuro).</CardDescription>
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
              <Plus size={16} /> Lançar Movimentação
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cadastro de Despesas/Receitas Recorrentes */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-zinc-900 dark:text-white">Lançamentos Recorrentes</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Configure despesas ou receitas repetidas mensalmente (financiamentos, assinaturas, salários fixos).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          {/* Formulário Recorrência */}
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
              <Clock size={16} /> Salvar Regra de Recorrência
            </Button>
          </form>

          {/* Listagem de Recorrências Cadastradas */}
          <div className="lg:col-span-2 overflow-x-auto">
            <Table className="text-zinc-750 dark:text-zinc-200">
              <TableHeader className="border-zinc-200 dark:border-zinc-800">
                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Descrição</TableHead>
                  <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Categoria</TableHead>
                  <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Responsável</TableHead>
                  <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Período</TableHead>
                  <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium text-right">Valor Mensal</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-zinc-500 text-center py-6">Nenhum lançamento recorrente configurado.</TableCell>
                  </TableRow>
                ) : (
                  recurringRules.map((rule) => (
                    <TableRow key={rule.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40">
                      <TableCell className="font-medium text-zinc-900 dark:text-white">{rule.description}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent">
                          {rule.categories?.name || 'Geral'}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-800 dark:text-zinc-300">{rule.family_members?.name || '-'}</TableCell>
                      <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                        De {new Date(rule.start_date).toLocaleDateString('pt-BR')} 
                        {rule.end_date ? ` até ${new Date(rule.end_date).toLocaleDateString('pt-BR')}` : ' (Indeterminado)'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${rule.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(rule.amount)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteRecurringRule(rule.id)}
                          className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Histórico Geral de Transações */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-zinc-900 dark:text-white">Histórico Completo de Transações</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Listagem das transações normais e futuros agendamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-zinc-500 dark:text-zinc-400 text-center py-6">Carregando dados...</div>
          ) : transactions.length === 0 ? (
            <div className="text-zinc-500 dark:text-zinc-400 text-center py-6">Nenhuma transação encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-zinc-750 dark:text-zinc-200">
                <TableHeader className="border-zinc-200 dark:border-zinc-800">
                  <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Descrição</TableHead>
                    <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Membro</TableHead>
                    <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Categoria</TableHead>
                    <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Data</TableHead>
                    <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium">Tipo</TableHead>
                    <TableHead className="text-zinc-500 dark:text-zinc-400 font-medium text-right">Valor</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40">
                      <TableCell>
                        <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                          {t.description}
                          {t.is_future && (
                            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20">
                              Agendado
                            </span>
                          )}
                        </div>
                        {t.notes && <p className="text-xs text-zinc-500 font-normal">{t.notes}</p>}
                      </TableCell>
                      <TableCell className="text-zinc-800 dark:text-zinc-300">{t.family_members?.name || '-'}</TableCell>
                      <TableCell>
                        <span 
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ 
                            backgroundColor: (t.categories?.color || '#3f3f46') + '15',
                            color: t.categories?.color || '#a1a1aa'
                          }}
                        >
                          {t.categories?.name || 'Geral'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
                        {t.type === 'income' ? 'Receita' : t.type === 'investment' ? 'Aporte' : 'Despesa'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteTransaction(t.id)}
                          className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
