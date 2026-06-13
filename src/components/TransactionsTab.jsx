import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Trash2, Calendar, User, Tag, Clock, FileText, Edit2, Loader2 } from 'lucide-react'
import { formatCurrencyInput, parseCurrencyToNumber } from '../lib/utils'
import { ConfirmDialog } from './ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { GoogleGenerativeAI } from '@google/generative-ai'
import EditTransactionModal from './modals/EditTransactionModal'
import EditRecurringRuleModal from './modals/EditRecurringRuleModal'

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(window.pdfjsLib)
      } else {
        reject(new Error('pdfjsLib não encontrado após carregar script.'))
      }
    }
    script.onerror = (err) => reject(err)
    document.head.appendChild(script)
  })
}

const extractTextFromPdf = async (file) => {
  const pdfjsLib = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }
  return fullText
}

const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (err) {
    if (retries <= 0) throw err
    console.warn(`Erro na API Gemini (tentando novamente em ${delay}ms...):`, err)
    await new Promise(resolve => setTimeout(resolve, delay))
    return retryWithBackoff(fn, retries - 1, delay * 2)
  }
}

const ImportRow = React.memo(({ 
  item, 
  isSelected, 
  categories, 
  familyMembers, 
  onSelectChange, 
  onUpdate, 
  onDelete 
}) => {
  const [localDesc, setLocalDesc] = useState(item.description)
  const [localAmountStr, setLocalAmountStr] = useState(formatCurrencyInput(String(Math.round(item.amount * 100))))
  const [localDate, setLocalDate] = useState(item.date)

  useEffect(() => {
    setLocalDesc(item.description)
  }, [item.description])

  useEffect(() => {
    setLocalAmountStr(formatCurrencyInput(String(Math.round(item.amount * 100))))
  }, [item.amount])

  useEffect(() => {
    setLocalDate(item.date)
  }, [item.date])

  const handleDescBlur = () => {
    if (localDesc !== item.description) {
      onUpdate(item.id, { description: localDesc })
    }
  }

  const handleAmountBlur = () => {
    const val = parseCurrencyToNumber(localAmountStr)
    if (val !== item.amount) {
      onUpdate(item.id, { amount: val })
    }
  }

  const handleDateBlur = () => {
    if (localDate !== item.date) {
      onUpdate(item.id, { date: localDate })
    }
  }

  return (
    <TableRow 
      className={`border-zinc-200 dark:border-zinc-800 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 ${
        item.is_already_registered ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
      } ${isSelected ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''}`}
    >
      {/* Checkbox de Seleção em lote */}
      <TableCell className="text-center">
        <input 
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(item.id, e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 cursor-pointer"
        />
      </TableCell>

      {/* Checkbox Se deve importar individualmente */}
      <TableCell className="text-center">
        <input 
          type="checkbox"
          checked={item.should_import}
          onChange={(e) => onUpdate(item.id, { should_import: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 cursor-pointer"
        />
      </TableCell>

      {/* Nome Fatura (Somente Leitura) */}
      <TableCell className="max-w-[200px] truncate text-xs text-zinc-500 dark:text-zinc-400 font-mono" title={item.original_name}>
        {item.original_name}
      </TableCell>

      {/* Descrição */}
      <TableCell>
        <Input 
          value={localDesc}
          onChange={(e) => setLocalDesc(e.target.value)}
          onBlur={handleDescBlur}
          className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
        />
      </TableCell>

      {/* Valor */}
      <TableCell>
        <Input 
          value={localAmountStr}
          onChange={(e) => setLocalAmountStr(formatCurrencyInput(e.target.value))}
          onBlur={handleAmountBlur}
          className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 text-right"
          style={{ minWidth: '90px' }}
        />
      </TableCell>

      {/* Categoria */}
      <TableCell>
        <Select 
          value={item.category_id} 
          onValueChange={(val) => onUpdate(item.id, { category_id: val })}
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
          value={localDate}
          onChange={(e) => setLocalDate(e.target.value)}
          onBlur={handleDateBlur}
          className="h-8 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
        />
      </TableCell>

      {/* Membro/Familiar */}
      <TableCell>
        <Select 
          value={item.family_member_id || 'none'} 
          onValueChange={(val) => onUpdate(item.id, { family_member_id: val === 'none' ? '' : val })}
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
              onChange={(e) => onUpdate(item.id, { is_recurring: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-zinc-350 dark:border-zinc-800 cursor-pointer"
              id={`rec-toggle-${item.id}`}
            />
            <label htmlFor={`rec-toggle-${item.id}`} className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">Recorrente</label>
          </div>
          {item.is_recurring && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-zinc-455">Atual:</span>
              <input 
                type="number"
                value={item.installments_current || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || null
                  onUpdate(item.id, { installments_current: val })
                }}
                className="w-10 text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 rounded text-center px-1 py-0.5 text-zinc-900 dark:text-zinc-50"
                placeholder="Nº"
              />
              <span className="text-[10px] text-zinc-450">Total:</span>
              <input 
                type="number"
                value={item.installments_total || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || null
                  onUpdate(item.id, { installments_total: val })
                }}
                className="w-10 text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 rounded text-center px-1 py-0.5 text-zinc-900 dark:text-zinc-50"
                placeholder="Total"
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
          onClick={() => onDelete(item.id)}
          className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <Trash2 size={14} />
        </Button>
      </TableCell>
    </TableRow>
  )
})

export default function TransactionsTab() {
  const { 
    transactions, 
    categories, 
    recurringRules,
    familyMembers,
    addTransaction, 
    deleteTransaction,
    updateTransaction,
    addRecurringRule,
    deleteRecurringRule,
    updateRecurringRule,
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
  const [referenceMonth, setReferenceMonth] = useState(new Date().getMonth() + 1)
  const [referenceYear, setReferenceYear] = useState(new Date().getFullYear())
  const [savingImport, setSavingImport] = useState(false)

  // Estados para Edição de Lançamentos
  const [isEditRecOpen, setIsEditRecOpen] = useState(false)
  const [recurringRuleToEdit, setRecurringRuleToEdit] = useState(null)
  
  const [isEditTransOpen, setIsEditTransOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState(null)

  // Estados de Paginação e Filtro de Datas
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 30

  // Filtra as transações por data
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const targetDate = t.billing_date || t.date
      if (startDateFilter && targetDate < startDateFilter) return false
      if (endDateFilter && targetDate > endDateFilter) return false
      return true
    })
  }, [transactions, startDateFilter, endDateFilter])

  // Garante que a página atual é válida após filtragem
  const totalPages = useMemo(() => Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1, [filteredTransactions.length])
  const activePage = Math.min(currentPage, totalPages)
  
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      (activePage - 1) * ITEMS_PER_PAGE,
      activePage * ITEMS_PER_PAGE
    )
  }, [filteredTransactions, activePage])

  const handleStartEditRec = (rule) => {
    setRecurringRuleToEdit(rule)
    setIsEditRecOpen(true)
  }

  const handleStartEditTrans = (t) => {
    setTransactionToEdit(t)
    setIsEditTransOpen(true)
  }

  const handleSaveEditRec = async (id, data) => {
    await updateRecurringRule(id, data)
  }

  const handleSaveEditTrans = async (id, data) => {
    await updateTransaction(id, data)
  }



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

  const handleUpdateImportItem = useCallback((id, fields) => {
    setImportItems(prev => prev.map(item => item.id === id ? { ...item, ...fields } : item))
  }, [])

  const handleSelectChange = useCallback((id, checked) => {
    if (checked) {
      setSelectedImportIds(prev => [...prev, id])
    } else {
      setSelectedImportIds(prev => prev.filter(item => item !== id))
    }
  }, [])

  const handleDeleteImportItem = useCallback((id) => {
    setImportItems(prev => prev.filter(item => item.id !== id))
    setSelectedImportIds(prev => prev.filter(item => item !== id))
  }, [])

  const handleReferenceDateChange = (newMonth, newYear) => {
    setReferenceMonth(newMonth)
    setReferenceYear(newYear)
    
    setImportItems(prev => prev.map(item => {
      const isRecurring = item.is_recurring
      let adjustedDate = item.raw_date
      
      if (isRecurring && item.raw_date && newYear && newMonth) {
        const [pYear, pMonth] = item.raw_date.split('-').map(Number)
        if (pYear < newYear || (pYear === newYear && pMonth < newMonth)) {
          const pDateObj = new Date(item.raw_date + 'T00:00:00')
          const pDay = pDateObj.getDate()
          
          const billingDate = new Date(newYear, newMonth - 1, pDay)
          if (billingDate.getMonth() !== newMonth - 1) {
            const lastDay = new Date(newYear, newMonth, 0).getDate()
            adjustedDate = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
          } else {
            adjustedDate = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`
          }
        }
      }

      let calculatedEndDate = null
      if (isRecurring && item.installments_total && item.installments_current) {
        const monthsRemaining = item.installments_total - item.installments_current
        if (monthsRemaining >= 0) {
          const dateObj = new Date(adjustedDate + 'T00:00:00')
          dateObj.setMonth(dateObj.getMonth() + monthsRemaining)
          calculatedEndDate = dateObj.toISOString().split('T')[0]
        }
      }

      return {
        ...item,
        date: adjustedDate,
        end_date: calculatedEndDate
      }
    }))
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
      const textContent = await extractTextFromPdf(file)
      
      const genAI = new GoogleGenerativeAI(geminiKey)

      const categoriesList = categories
        .filter(c => c.type === 'expense')
        .map(c => `ID: "${c.id}", Nome: "${c.name}"`)
        .join('\n')

      const prompt = `Você é um assistente de controle financeiro especializado em processamento de faturas de cartão de crédito.
Sua tarefa é analisar o texto de uma fatura de cartão de crédito fornecida e extrair todas as compras/lançamentos de despesas na exata ordem em que aparecem na fatura.

Para cada despesa identificada, extraia as seguintes informações estruturadas:
1. data: A data da compra no formato ISO YYYY-MM-DD (deduza o ano correto com base nas datas da fatura e na data atual do sistema).
2. nome_fatura: O nome bruto do estabelecimento/lançamento exatamente como está descrito na fatura (ex: "PG *GOOGLE CRUNCHYROLL", "UBER *TRIP", "IFOOD *RESTAURANTE", etc.). Mantenha exatamente como aparece na fatura.
3. descricao: O nome do estabelecimento limpo e simplificado de forma inteligente (ex: "PG *GOOGLE CRUNCHYROLL" deve virar "Crunchyroll", "UBER *TRIP" deve virar "Uber", "IFOOD *RESTAURANTE" deve virar "iFood"). Tente identificar o serviço ou estabelecimento real por trás da sigla ou nome da fatura.
4. valor: O valor em número decimal positivo (use ponto como separador decimal). Se for parcelada, extraia apenas o valor da parcela individual cobrada nesta fatura.
5. categoria_id: O ID de uma das categorias fornecidas abaixo que melhor se adapta à despesa. Se nenhuma se adaptar perfeitamente, selecione a que mais se assemelha.
6. is_recurring: Um booleano (true/false) indicando se a despesa parece ser recorrente (como assinaturas Netflix, Spotify, telefone, internet, parcelas recorrentes).
7. parcelas_total: Se a compra for parcelada, identifique o número total de parcelas (ex: 10 se for "2/10"). Caso contrário, retorne null.
8. parcela_atual: Se a compra for parcelada, identifique o número da parcela atual (ex: 2 se for "2/10"). Caso contrário, retorne null.

Categorias disponíveis:
${categoriesList}

ATENÇÃO: Mantenha os lançamentos na exata ordem cronológica/original em que aparecem no texto da fatura. Não ordene nem agrupe os itens.

Retorne estritamente um objeto JSON no seguinte formato:
{
  "compras": [
    {
      "date": "YYYY-MM-DD",
      "original_name": "Nome bruto na fatura",
      "description": "Nome simplificado e limpo",
      "amount": 123.45,
      "category_id": "ID_DA_CATEGORIA",
      "is_recurring": true,
      "installments_total": 10,
      "installments_current": 2
    }
  ]
}`

      let result
      try {
        const model = genAI.getGenerativeModel({
          model: "models/gemini-3.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        })
        result = await retryWithBackoff(() => model.generateContent([
          prompt,
          `Abaixo está o texto extraído da fatura do cartão de crédito:\n\n${textContent}`
        ]))
      } catch (firstErr) {
        console.warn("Falha no modelo gemini-3.5-flash. Tentando fallback para gemini-3.1-flash-lite...", firstErr)
        
        try {
          const fallbackModel1 = genAI.getGenerativeModel({
            model: "models/gemini-3.1-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
          })
          result = await retryWithBackoff(() => fallbackModel1.generateContent([
            prompt,
            `Abaixo está o texto extraído da fatura do cartão de crédito:\n\n${textContent}`
          ]))
        } catch (secondErr) {
          console.warn("Falha no modelo gemini-3.1-flash-lite. Tentando fallback para gemini-2.5-flash...", secondErr)
          
          const fallbackModel2 = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
          })
          result = await retryWithBackoff(() => fallbackModel2.generateContent([
            prompt,
            `Abaixo está o texto extraído da fatura do cartão de crédito:\n\n${textContent}`
          ]))
        }
      }

      const responseText = result.response.text()
      const cleanJson = responseText.replace(/```json|```/g, '').trim()
      const parsedData = JSON.parse(cleanJson)
      const rawPurchases = parsedData.compras || []

      // Acha a data de referência da fatura (o maior ano/mês entre as transações)
      let referenceYear = null
      let referenceMonth = null
      
      const dates = rawPurchases
        .map(p => p.date)
        .filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d))
        
      if (dates.length > 0) {
        const sortedDates = [...dates].sort()
        const latestDateStr = sortedDates[sortedDates.length - 1]
        const [year, month] = latestDateStr.split('-').map(Number)
        referenceYear = year
        referenceMonth = month
      } else {
        const now = new Date()
        referenceYear = now.getFullYear()
        referenceMonth = now.getMonth() + 1
      }

      // Atualiza os estados de referência para exibição e controle do usuário
      setReferenceMonth(referenceMonth)
      setReferenceYear(referenceYear)

      const processed = rawPurchases.map((purchase) => {
        // Encontra se já existe uma regra recorrente cadastrada com mesmo valor aproximado e nome similar (aproximado)
        const matchedRule = recurringRules.find((rule) => {
          const matchAmount = Math.abs(rule.amount - purchase.amount) < 0.01
          if (!matchAmount) return false

          const pOriginal = (purchase.original_name || '').toLowerCase().trim()
          const pDesc = (purchase.description || '').toLowerCase().trim()
          const rDesc = (rule.description || '').toLowerCase().trim()
          const rStatement = (rule.statement_name || '').toLowerCase().trim()

          // Se houver statement_name salvo na regra, verifica inclusão mútua com o nome original da fatura
          if (rStatement) {
            if (pOriginal.includes(rStatement) || rStatement.includes(pOriginal)) {
              return true
            }
          }

          // Fallbacks de inclusão mútua com descrição simplificada
          return (
            pOriginal.includes(rDesc) ||
            rDesc.includes(pOriginal) ||
            pDesc.includes(rDesc) ||
            rDesc.includes(pDesc)
          )
        })

        const isRecurring = !!purchase.is_recurring || !!(purchase.installments_total && purchase.installments_total > 0)

        // Se for recorrente/parcelado e a data original for anterior ao mês/ano de referência da fatura,
        // ajustamos a data do item para o mês de referência da fatura, para evitar retroatividade duplicada.
        let adjustedDate = purchase.date
        if (isRecurring && purchase.date && referenceYear && referenceMonth) {
          const [pYear, pMonth] = purchase.date.split('-').map(Number)
          if (pYear < referenceYear || (pYear === referenceYear && pMonth < referenceMonth)) {
            const pDateObj = new Date(purchase.date + 'T00:00:00')
            const pDay = pDateObj.getDate()
            
            // Cria a data no ano e mês de referência da fatura
            const billingDate = new Date(referenceYear, referenceMonth - 1, pDay)
            // Valida estouro de dia (ex: 31 de abril vira 1 de maio)
            if (billingDate.getMonth() !== referenceMonth - 1) {
              const lastDay = new Date(referenceYear, referenceMonth, 0).getDate()
              adjustedDate = `${referenceYear}-${String(referenceMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
            } else {
              adjustedDate = `${referenceYear}-${String(referenceMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`
            }
          }
        }

        // Calcula a data de término do parcelamento se houver
        let calculatedEndDate = null
        if (isRecurring && purchase.installments_total && purchase.installments_current) {
          const monthsRemaining = purchase.installments_total - purchase.installments_current
          if (monthsRemaining >= 0) {
            const dateObj = new Date(adjustedDate + 'T00:00:00')
            dateObj.setMonth(dateObj.getMonth() + monthsRemaining)
            calculatedEndDate = dateObj.toISOString().split('T')[0]
          }
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          date: adjustedDate,
          raw_date: purchase.date, // Preserva a data original crua do Gemini
          original_name: purchase.original_name,
          description: purchase.description,
          amount: purchase.amount,
          category_id: purchase.category_id || '',
          family_member_id: '', // Sempre em branco conforme solicitação
          is_recurring: isRecurring,
          installments_total: purchase.installments_total || null,
          installments_current: purchase.installments_current || null,
          end_date: calculatedEndDate,
          is_already_registered: !!matchedRule,
          matched_rule_id: matchedRule ? matchedRule.id : null,
          should_import: !(isRecurring && matchedRule)
        }
      })

      setImportItems(processed)
      setSelectedImportIds([])
      setIsImportModalOpen(true)
    } catch (err) {
      console.error(err)
      const errorMsg = err?.message || ""
      if (errorMsg.includes("503") || errorMsg.toLowerCase().includes("service unavailable")) {
        alert("O serviço do Gemini está temporariamente indisponível (Erro 503). Por favor, tente novamente em alguns instantes.")
      } else if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("resource exhausted") || errorMsg.toLowerCase().includes("rate limit")) {
        alert("Limite de requisições do Gemini atingido (Erro 429). Por favor, aguarde um momento antes de tentar novamente.")
      } else {
        alert("Ocorreu um erro ao ler o PDF da fatura. Por favor, verifique o console ou tente outro arquivo.")
      }
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

    setSavingImport(true)
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
            frequency: 'monthly',
            statement_name: item.original_name
          })
        } else {
          // Cadastra como transação comum
          // Calcula o billing_date baseado no mês de referência da fatura, mas mantendo o dia da compra original
          let computedBillingDate = item.date
          if (item.date && referenceYear && referenceMonth) {
            const [pYear, pMonth, pDay] = item.date.split('-')
            const billingDateObj = new Date(referenceYear, referenceMonth - 1, parseInt(pDay, 10))
            if (billingDateObj.getMonth() !== referenceMonth - 1) {
              const lastDay = new Date(referenceYear, referenceMonth, 0).getDate()
              computedBillingDate = `${referenceYear}-${String(referenceMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
            } else {
              computedBillingDate = `${referenceYear}-${String(referenceMonth).padStart(2, '0')}-${pDay}`
            }
          }

          await addTransaction({
            description: item.description,
            amount: item.amount,
            type: 'expense',
            category_id: item.category_id || null,
            date: item.date, // Data original da compra
            billing_date: computedBillingDate, // Mês da fatura
            family_member_id: item.family_member_id || null,
            is_future: false,
            statement_name: item.original_name,
            notes: 'Importado via Fatura PDF'
          })
        }
      }
      setIsImportModalOpen(false)
      alert(`${itemsToSave.length} lançamentos importados com sucesso!`)
    } catch (err) {
      console.error(err)
      alert("Ocorreu um erro ao salvar as transações importadas no banco de dados.")
    } finally {
      setSavingImport(false)
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

          {/* Listagem de Recorrências Cadastradas */}
          <div className="lg:col-span-2 overflow-x-auto mt-2">
            <Tabs defaultValue="ativos" className="w-full">
              <TabsList className="mb-4 bg-zinc-100 dark:bg-zinc-900">
                <TabsTrigger value="ativos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
                  Regras Ativas
                </TabsTrigger>
                <TabsTrigger value="concluidos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
                  Concluídas / Encerradas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ativos">
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
                    {recurringRules.filter(r => !r.end_date || r.end_date >= new Date().toISOString().split('T')[0]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-zinc-500 text-center py-6">Nenhum lançamento recorrente ativo.</TableCell>
                      </TableRow>
                    ) : (
                      recurringRules.filter(r => !r.end_date || r.end_date >= new Date().toISOString().split('T')[0]).map((rule) => (
                        <TableRow key={rule.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40">
                          <TableCell className="font-medium text-zinc-900 dark:text-white">{rule.description}</TableCell>
                          <TableCell>
                            <span 
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                              style={{ 
                                backgroundColor: (rule.categories?.color || '#3f3f46') + '15',
                                color: rule.categories?.color || '#a1a1aa'
                              }}
                            >
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
                              onClick={() => handleStartEditRec(rule)}
                              className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 mr-1"
                            >
                              <Edit2 size={16} />
                            </Button>
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
              </TabsContent>

              <TabsContent value="concluidos">
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
                    {recurringRules.filter(r => r.end_date && r.end_date < new Date().toISOString().split('T')[0]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-zinc-500 text-center py-6">Nenhuma regra de recorrência encerrada.</TableCell>
                      </TableRow>
                    ) : (
                      recurringRules.filter(r => r.end_date && r.end_date < new Date().toISOString().split('T')[0]).map((rule) => (
                        <TableRow key={rule.id} className="border-zinc-200 dark:border-zinc-800 opacity-60 bg-zinc-50/30 dark:bg-zinc-950/30">
                          <TableCell className="font-medium text-zinc-900 dark:text-white">
                            {rule.description}
                            <span className="ml-2 inline-flex items-center rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20">
                              Encerrado
                            </span>
                          </TableCell>
                          <TableCell>
                            <span 
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold grayscale"
                              style={{ 
                                backgroundColor: (rule.categories?.color || '#3f3f46') + '15',
                                color: rule.categories?.color || '#a1a1aa'
                              }}
                            >
                              {rule.categories?.name || 'Geral'}
                            </span>
                          </TableCell>
                          <TableCell className="text-zinc-800 dark:text-zinc-300">{rule.family_members?.name || '-'}</TableCell>
                          <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                            De {new Date(rule.start_date).toLocaleDateString('pt-BR')} até {new Date(rule.end_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${rule.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} grayscale`}>
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
              </TabsContent>
            </Tabs>
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
            <div className="space-y-4">
              {/* Filtros de Data */}
              <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">De:</span>
                  <Input 
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-40 h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Até:</span>
                  <Input 
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-40 h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                {(startDateFilter || endDateFilter) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setStartDateFilter('')
                      setEndDateFilter('')
                      setCurrentPage(1)
                    }}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-zinc-500 dark:text-zinc-400 text-center py-6">Nenhuma transação encontrada para o período selecionado.</div>
              ) : (
                <>
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
                        {paginatedTransactions.map((t) => (
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
                                onClick={() => handleStartEditTrans(t)}
                                className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 mr-1"
                              >
                                <Edit2 size={16} />
                              </Button>
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

                  {/* Controles de Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Mostrando {paginatedTransactions.length} de {filteredTransactions.length} transações (Página {activePage} de {totalPages})
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={activePage === 1}
                          className="cursor-pointer"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={activePage === totalPages}
                          className="cursor-pointer"
                        >
                          Próximo
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
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

      <EditRecurringRuleModal
        isOpen={isEditRecOpen}
        onClose={() => setIsEditRecOpen(false)}
        rule={recurringRuleToEdit}
        onSave={handleSaveEditRec}
        categories={categories}
        familyMembers={familyMembers}
      />

      <EditTransactionModal
        isOpen={isEditTransOpen}
        onClose={() => setIsEditTransOpen(false)}
        transaction={transactionToEdit}
        onSave={handleSaveEditTrans}
        categories={categories}
        familyMembers={familyMembers}
      />

      {/* Modal de Tela Cheia para Importação de PDF */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 overflow-y-auto flex flex-col p-6 text-zinc-900 dark:text-zinc-50 animate-in fade-in-0 duration-200">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-6">
            {/* Header do Modal */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div>
                  <h2 className="text-2xl font-bold">Conferir Compras da Fatura</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Verifique e ajuste os dados identificados pela IA antes de salvar no sistema.</p>
                </div>
                {/* Seletores de Data de Referência */}
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg p-2 self-start md:self-auto shadow-xs">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">Mês Ref:</span>
                  
                  <Select 
                    value={String(referenceMonth)} 
                    onValueChange={(val) => handleReferenceDateChange(parseInt(val), referenceYear)}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-emerald-500">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={String(referenceYear)} 
                    onValueChange={(val) => handleReferenceDateChange(referenceMonth, parseInt(val))}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-emerald-500">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                      {Array.from({ length: 6 }, (_, i) => {
                        const y = new Date().getFullYear() - 3 + i
                        return (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setIsImportModalOpen(false)} disabled={savingImport}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveImport} 
                  disabled={savingImport || importItems.filter(i => i.should_import).length === 0} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer flex items-center gap-2"
                >
                  {savingImport ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Importando...
                    </>
                  ) : (
                    `Confirmar e Importar (${importItems.filter(i => i.should_import).length} itens)`
                  )}
                </Button>
              </div>
            </div>

            {/* Ações em Lote e Resumo da Fatura */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Ações em Lote:</span>
                  <span>{selectedImportIds.length} item(ns) selecionado(s)</span>
                </div>
                <div className="hidden md:block w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Total da Tabela:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(importItems.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0))}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
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
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="w-16 text-center">Importar</TableHead>
                    <TableHead className="min-w-[150px]">Nome Fatura</TableHead>
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
                      <TableCell colSpan={10} className="text-center py-8 text-zinc-500">
                        Nenhum item restante para importação.
                      </TableCell>
                    </TableRow>
                  ) : (
                    importItems.map((item) => (
                      <ImportRow
                        key={item.id}
                        item={item}
                        isSelected={selectedImportIds.includes(item.id)}
                        categories={categories}
                        familyMembers={familyMembers}
                        onSelectChange={handleSelectChange}
                        onUpdate={handleUpdateImportItem}
                        onDelete={handleDeleteImportItem}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {importingPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-lg font-semibold animate-pulse">Lendo fatura com Inteligência Artificial...</p>
            <p className="text-sm text-zinc-400">Isso pode levar alguns segundos de acordo com o tamanho do arquivo.</p>
          </div>
        </div>
      )}

      {savingImport && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-lg font-semibold animate-pulse">Salvando lançamentos no banco de dados...</p>
            <p className="text-sm text-zinc-400">Por favor, aguarde enquanto os dados são cadastrados.</p>
          </div>
        </div>
      )}
    </div>
  )
}


