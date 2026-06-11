import React, { useState } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Plus, Trash2, Calendar, User, Tag, Clock, FileText } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'
import { ConfirmDialog } from './ui/confirm-dialog'
import { GoogleGenerativeAI } from '@google/generative-ai'



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

  // Estados de confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmType, setDeleteConfirmType] = useState('') // 'transaction' ou 'recurring'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [deleteConfirmDesc, setDeleteConfirmDesc] = useState('')

  // Estados de Importação de PDF
  const [importingPdf, setImportingPdf] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importItems, setImportItems] = useState([])
  const [selectedImportIds, setSelectedImportIds] = useState([])



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

  const confirmDeleteTrans = (id, description, amount) => {
    setDeleteConfirmId(id)
    setDeleteConfirmType('transaction')
    setDeleteConfirmTitle('Confirmar Exclusão de Transação')
    setDeleteConfirmDesc(`Tem certeza de que deseja excluir a transação "${description}" no valor de ${formatCurrency(amount)}?`)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteRec = (id, description, amount) => {
    setDeleteConfirmId(id)
    setDeleteConfirmType('recurring')
    setDeleteConfirmTitle('Confirmar Exclusão de Lançamento Recorrente')
    setDeleteConfirmDesc(`Tem certeza de que deseja excluir a regra de recorrência "${description}" no valor mensal de ${formatCurrency(amount)}?`)
    setDeleteConfirmOpen(true)
  }

  const executeDelete = async () => {
    if (!deleteConfirmId) return
    try {
      if (deleteConfirmType === 'transaction') {
        await deleteTransaction(deleteConfirmId)
      } else if (deleteConfirmType === 'recurring') {
        await deleteRecurringRule(deleteConfirmId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteConfirmId(null)
      setDeleteConfirmType('')
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!geminiKey) {
      alert("Chave de API do Gemini não configurada! Por favor, adicione VITE_GEMINI_API_KEY ao seu arquivo .env.local e reinicie o servidor.")
      return
    }

    setImportingPdf(true)
    try {
      const base64Data = await fileToBase64(file)
      
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      })

      const categoriesList = categories
        .filter(c => c.type === 'expense')
        .map(c => `ID: "${c.id}", Nome: "${c.name}"`)
        .join('\n')

      const prompt = `Você é um assistente de controle financeiro.
Sua tarefa é ler a fatura do cartão de crédito em PDF fornecida e extrair todas as compras/lançamentos de despesas.

Para cada despesa identificada, extraia as seguintes informações estruturadas:
1. data: A data da compra no formato ISO YYYY-MM-DD (deduza o ano correto com base nas datas da fatura).
2. descricao: O nome do estabelecimento ou descrição do lançamento (simplificado, sem termos de processamento como "PG *", "compra no cartão" etc.).
3. valor: O valor em número decimal positivo (use ponto como separador decimal). Se for parcelada, extraia apenas o valor da parcela individual cobrada nesta fatura.
4. categoria_id: O ID de uma das categorias fornecidas abaixo que melhor se adapta à despesa. Se nenhuma se adaptar perfeitamente, tente aproximar ou selecione a que mais se assemelha.
5. is_recurring: Um booleano (true/false) indicando se a despesa parece ser recorrente (como assinaturas Netflix, Spotify, telefone, internet, parcelas recorrentes).
6. parcelas_total: Se a compra for parcelada, identifique o número total de parcelas (ex: 10 se for "2/10"). Caso contrário, retorne null.
7. parcela_atual: Se a compra for parcelada, identifique o número da parcela atual (ex: 2 se for "2/10"). Caso contrário, retorne null.

Categorias disponíveis:
${categoriesList}

Retorne estritamente um objeto JSON no seguinte formato:
{
  "compras": [
    {
      "date": "YYYY-MM-DD",
      "description": "Nome do estabelecimento",
      "amount": 123.45,
      "category_id": "ID_DA_CATEGORIA",
      "is_recurring": true,
      "installments_total": 10,
      "installments_current": 2
    }
  ]
}`

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: "application/pdf"
          }
        },
        prompt
      ])

      const responseText = result.response.text()
      const parsedData = JSON.parse(responseText)
      const rawPurchases = parsedData.compras || []

      const processed = rawPurchases.map((purchase) => {
        // Encontra se já existe uma regra recorrente cadastrada com mesmo valor aproximado e nome similar
        const matchedRule = recurringRules.find((rule) => {
          const matchAmount = Math.abs(rule.amount - purchase.amount) < 0.01
          const pDesc = purchase.description.toLowerCase()
          const rDesc = rule.description.toLowerCase()
          const matchName = pDesc.includes(rDesc) || rDesc.includes(pDesc)
          return matchAmount && matchName
        })

        // Calcula a data de término do parcelamento se houver
        let calculatedEndDate = null
        if (purchase.is_recurring && purchase.installments_total && purchase.installments_current) {
          const monthsRemaining = purchase.installments_total - purchase.installments_current
          if (monthsRemaining > 0) {
            const dateObj = new Date(purchase.date + 'T00:00:00')
            dateObj.setMonth(dateObj.getMonth() + monthsRemaining)
            calculatedEndDate = dateObj.toISOString().split('T')[0]
          }
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          date: purchase.date,
          description: purchase.description,
          amount: purchase.amount,
          category_id: purchase.category_id || '',
          family_member_id: '', // Sempre em branco conforme solicitação
          is_recurring: purchase.is_recurring || false,
          installments_total: purchase.installments_total || null,
          installments_current: purchase.installments_current || null,
          end_date: calculatedEndDate,
          is_already_registered: !!matchedRule,
          matched_rule_id: matchedRule ? matchedRule.id : null,
          should_import: true // Por padrão, tudo vem marcado para importação
        }
      })

      // Ordena de modo que compras recorrentes identificadas fiquem no final
      processed.sort((a, b) => {
        if (a.is_recurring && !b.is_recurring) return 1
        if (!a.is_recurring && b.is_recurring) return -1
        return 0
      })

      setImportItems(processed)
      setSelectedImportIds([])
      setIsImportModalOpen(true)
    } catch (err) {
      console.error(err)
      alert("Ocorreu um erro ao ler o PDF da fatura. Por favor, verifique o console ou tente outro arquivo.")
    } finally {
      setImportingPdf(false)
      // Reseta o input de arquivo para permitir reenviar o mesmo arquivo se necessário
      e.target.value = ''
    }
  }

  const handleBulkDelete = () => {
    setImportItems(prev => prev.filter(item => !selectedImportIds.includes(item.id)))
    setSelectedImportIds([])
  }

  const handleBulkAssignMember = (memberId) => {
    if (!memberId) return
    const actualMemberId = memberId === 'none' ? '' : memberId
    setImportItems(prev => prev.map(item => {
      if (selectedImportIds.includes(item.id)) {
        return { ...item, family_member_id: actualMemberId }
      }
      return item
    }))
    setSelectedImportIds([])
  }

  const handleSaveImport = async () => {
    const itemsToSave = importItems.filter(i => i.should_import)
    if (itemsToSave.length === 0) {
      setIsImportModalOpen(false)
      return
    }

    try {
      for (const item of itemsToSave) {
        if (item.is_recurring) {
          // Cadastra como regra de recorrência
          await addRecurringRule({
            description: item.description,
            amount: item.amount,
            type: 'expense',
            category_id: item.category_id || null,
            start_date: item.date,
            end_date: item.end_date || null,
            family_member_id: item.family_member_id || null,
            frequency: 'monthly'
          })
        } else {
          // Cadastra como transação comum
          await addTransaction({
            description: item.description,
            amount: item.amount,
            type: 'expense',
            category_id: item.category_id || null,
            date: item.date,
            family_member_id: item.family_member_id || null,
            is_future: false,
            notes: 'Importado via Fatura PDF'
          })
        }
      }
      setIsImportModalOpen(false)
      alert(`${itemsToSave.length} lançamentos importados com sucesso!`)
    } catch (err) {
      console.error(err)
      alert("Ocorreu um erro ao salvar as transações importadas no banco de dados.")
    }
  }



  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      {/* Formulário de Transação */}
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
                          onClick={() => confirmDeleteRec(rule.id, rule.description, rule.amount)}
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
                          onClick={() => confirmDeleteTrans(t.id, t.description, t.amount)}
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

      <ConfirmDialog 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title={deleteConfirmTitle}
        description={deleteConfirmDesc}
      />

      {/* Modal de Tela Cheia para Importação de PDF */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 overflow-y-auto flex flex-col p-6 text-zinc-900 dark:text-zinc-50 animate-in fade-in-0 duration-200">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-6">
            {/* Header do Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-bold">Conferir Compras da Fatura</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Verifique e ajuste os dados identificados pela IA antes de salvar no sistema.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveImport} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
                  Confirmar e Importar ({importItems.filter(i => i.should_import).length} itens)
                </Button>
              </div>
            </div>

            {/* Ações em Lote */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Ações em Lote:</span>
                <span>{selectedImportIds.length} item(ns) selecionado(s)</span>
              </div>
              <div className="flex items-center gap-3">
                <Select onValueChange={handleBulkAssignMember} value="">
                  <SelectTrigger className="w-48 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-50">
                    <SelectValue placeholder="Alocar Familiar" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                    <SelectItem value="none">Nenhum / Geral</SelectItem>
                    {familyMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={selectedImportIds.length === 0}
                  onClick={handleBulkDelete}
                  className="cursor-pointer"
                >
                  Excluir Selecionados
                </Button>
              </div>
            </div>

            {/* Tabela do Modal */}
            <div className="flex-1 overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Table>
                <TableHeader className="border-zinc-200 dark:border-zinc-800">
                  <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={importItems.length > 0 && selectedImportIds.length === importItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImportIds(importItems.map(i => i.id))
                          } else {
                            setSelectedImportIds([])
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800"
                      />
                    </TableHead>
                    <TableHead className="w-16 text-center">Importar</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="w-32">Valor</TableHead>
                    <TableHead className="w-40">Categoria</TableHead>
                    <TableHead className="w-36">Data</TableHead>
                    <TableHead className="w-44">Responsável</TableHead>
                    <TableHead className="w-48">Tipo / Detalhes</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                        Nenhum item restante para importação.
                      </TableCell>
                    </TableRow>
                  ) : (
                    importItems.map((item) => {
                      const isSelected = selectedImportIds.includes(item.id)
                      return (
                        <TableRow 
                          key={item.id} 
                          className={`border-zinc-200 dark:border-zinc-800 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 ${
                            item.is_already_registered ? 'bg-amber-550/5 dark:bg-amber-550/10' : ''
                          } ${isSelected ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''}`}
                        >
                          {/* Checkbox de Seleção em lote */}
                          <TableCell className="text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedImportIds(prev => [...prev, item.id])
                                } else {
                                  setSelectedImportIds(prev => prev.filter(id => id !== item.id))
                                }
                              }}
                              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800"
                            />
                          </TableCell>

                          {/* Checkbox Se deve importar individualmente */}
                          <TableCell className="text-center">
                            <input 
                              type="checkbox"
                              checked={item.should_import}
                              onChange={(e) => {
                                setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, should_import: e.target.checked } : i))
                              }}
                              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 cursor-pointer"
                            />
                          </TableCell>

                          {/* Descrição */}
                          <TableCell>
                            <Input 
                              value={item.description}
                              onChange={(e) => {
                                setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))
                              }}
                              className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
                            />
                          </TableCell>

                          {/* Valor */}
                          <TableCell>
                            <Input 
                              value={formatCurrencyInput(String(Math.round(item.amount * 100)))} 
                              onChange={(e) => {
                                const val = parseCurrencyToNumber(e.target.value)
                                setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, amount: val } : i))
                              }}
                              className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 text-right"
                            />
                          </TableCell>

                          {/* Categoria */}
                          <TableCell>
                            <Select 
                              value={item.category_id} 
                              onValueChange={(val) => {
                                setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, category_id: val } : i))
                              }}
                            >
                              <SelectTrigger className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800">
                                <SelectValue placeholder="Sem Categoria" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                                {categories.filter(c => c.type === 'expense').map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Data */}
                          <TableCell>
                            <Input 
                              type="date"
                              value={item.date}
                              onChange={(e) => {
                                setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, date: e.target.value } : i))
                              }}
                              className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
                            />
                          </TableCell>

                          {/* Membro/Familiar */}
                          <TableCell>
                            <Select 
                              value={item.family_member_id || 'none'} 
                              onValueChange={(val) => {
                                setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, family_member_id: val === 'none' ? '' : val } : i))
                              }}
                            >
                              <SelectTrigger className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800">
                                <SelectValue placeholder="Selecione o membro" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                                <SelectItem value="none">Nenhum / Geral</SelectItem>
                                {familyMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Tipo / Detalhes */}
                          <TableCell className="text-xs">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="checkbox"
                                  checked={item.is_recurring}
                                  onChange={(e) => {
                                    setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, is_recurring: e.target.checked } : i))
                                  }}
                                  className="h-3.5 w-3.5 rounded border-zinc-350 dark:border-zinc-800 cursor-pointer"
                                  id={`rec-toggle-${item.id}`}
                                />
                                <label htmlFor={`rec-toggle-${item.id}`} className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">Recorrente</label>
                              </div>
                              {item.is_recurring && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-zinc-450">Total:</span>
                                  <input 
                                    type="number"
                                    value={item.installments_total || ''}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || null
                                      setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, installments_total: val } : i))
                                    }}
                                    className="w-10 text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 rounded text-center px-1 py-0.5 text-zinc-900 dark:text-zinc-50"
                                    placeholder="Total"
                                  />
                                  <span className="text-[10px] text-zinc-455">Atual:</span>
                                  <input 
                                    type="number"
                                    value={item.installments_current || ''}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || null
                                      setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, installments_current: val } : i))
                                    }}
                                    className="w-10 text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 rounded text-center px-1 py-0.5 text-zinc-900 dark:text-zinc-50"
                                    placeholder="Nº"
                                  />
                                </div>
                              )}
                              {item.is_already_registered && (
                                <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20 w-fit">
                                  Regra Já Cadastrada
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Excluir individual */}
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon-xs"
                              onClick={() => {
                                setImportItems(prev => prev.filter(i => i.id !== item.id))
                              }}
                              className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de Carregamento da IA */}
      {importingPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-lg font-semibold animate-pulse">Lendo fatura com Inteligência Artificial...</p>
            <p className="text-sm text-zinc-400">Isso pode levar alguns segundos de acordo com o tamanho do arquivo.</p>
          </div>
        </div>
      )}
    </div>
  )
}


