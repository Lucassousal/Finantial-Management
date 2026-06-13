import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const FinancialContext = createContext({
  transactions: [],
  categories: [],
  budgets: [],
  investments: [],
  savingGoals: [],
  recurringRules: [],
  loading: false,
  fetchTransactions: () => Promise.resolve(),
  addTransaction: () => Promise.resolve(),
  deleteTransaction: () => Promise.resolve(),
  updateTransaction: () => Promise.resolve(),
  addCategory: () => Promise.resolve(),
  deleteCategory: () => Promise.resolve(),
  updateCategory: () => Promise.resolve(),
  addBudget: () => Promise.resolve(),
  deleteBudget: () => Promise.resolve(),
  updateBudget: () => Promise.resolve(),
  addInvestment: () => Promise.resolve(),
  deleteInvestment: () => Promise.resolve(),
  updateInvestment: () => Promise.resolve(),
  updateInvestmentBalance: () => Promise.resolve(),
  addSavingGoal: () => Promise.resolve(),
  deleteSavingGoal: () => Promise.resolve(),
  updateSavingGoal: () => Promise.resolve(),
  updateSavingGoalAmount: () => Promise.resolve(),
  addRecurringRule: () => Promise.resolve(),
  deleteRecurringRule: () => Promise.resolve(),
  updateRecurringRule: () => Promise.resolve(),
  familyMembers: [],
  fetchFamilyMembers: () => Promise.resolve(),
  addFamilyMember: () => Promise.resolve(),
  deleteFamilyMember: () => Promise.resolve(),
  updateFamilyMember: () => Promise.resolve(),
})

export const FinancialProvider = ({ children }) => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [investments, setInvestments] = useState([])
  const [savingGoals, setSavingGoals] = useState([])
  const [recurringRules, setRecurringRules] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(false)

  // 1. Transactions CRUD
  const fetchTransactions = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, color), family_members(name)')
        .order('date', { ascending: false })
      if (error) throw error
      setTransactions(data || [])
      return data || []
    } catch (err) {
      console.error('Erro ao buscar transações:', err.message)
      return []
    }
  }

  const addTransaction = async (newTransaction) => {
    if (!user) return
    try {
      const payload = {
        ...newTransaction,
        billing_date: newTransaction.billing_date || newTransaction.date,
        user_id: user.id
      }
      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select('*, categories(name, color), family_members(name)')

      if (error) throw error
      setTransactions((prev) => [data[0], ...prev])
      return data[0]
    } catch (err) {
      console.error('Erro ao adicionar transação:', err.message)
      throw err
    }
  }

  const deleteTransaction = async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      if (error) throw error
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Erro ao deletar transação:', err.message)
      throw err
    }
  }

  // 2. Categories CRUD
  const fetchCategories = async () => {
    if (!user) return
    try {
      let { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error

      if (data.length === 0) {
        // Semeia as categorias iniciais automáticas se o usuário não tiver nenhuma
        const defaultCats = [
          { name: 'Alimentação', type: 'expense', color: '#f59e0b', icon: 'utensils' },
          { name: 'Transporte', type: 'expense', color: '#3b82f6', icon: 'car' },
          { name: 'Moradia', type: 'expense', color: '#ef4444', icon: 'home' },
          { name: 'Lazer', type: 'expense', color: '#ec4899', icon: 'smile' },
          { name: 'Salário', type: 'income', color: '#10b981', icon: 'dollar-sign' },
          { name: 'Investimentos', type: 'investment', color: '#6366f1', icon: 'trending-up' }
        ]
        const catsWithUser = defaultCats.map(c => ({ ...c, user_id: user.id }))
        const { data: seeded, error: seedError } = await supabase
          .from('categories')
          .insert(catsWithUser)
          .select()
        if (seedError) throw seedError
        data = seeded
      }
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao buscar categorias:', err.message)
    }
  }

  const addCategory = async (category) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
      if (error) throw error
      setCategories(prev => [...prev, data[0]].sort((a,b) => a.name.localeCompare(b.name)))
      return data[0]
    } catch (err) {
      console.error('Erro ao adicionar categoria:', err.message)
      throw err
    }
  }

  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      if (error) throw error
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Erro ao deletar categoria:', err.message)
      throw err
    }
  }

  // 3. Budgets CRUD
  const fetchBudgets = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(name, color)')
      if (error) throw error
      setBudgets(data || [])
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err.message)
    }
  }

  const addBudget = async (budget) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id }])
        .select('*, categories(name, color)')
      if (error) throw error
      setBudgets(prev => [data[0], ...prev])
      return data[0]
    } catch (err) {
      console.error('Erro ao adicionar orçamento:', err.message)
      throw err
    }
  }

  const deleteBudget = async (id) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
      if (error) throw error
      setBudgets(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      console.error('Erro ao deletar orçamento:', err.message)
      throw err
    }
  }

  // 4. Investments CRUD
  const fetchInvestments = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('name')
      if (error) throw error
      setInvestments(data || [])
    } catch (err) {
      console.error('Erro ao buscar investimentos:', err.message)
    }
  }

  const addInvestment = async (investment) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('investments')
        .insert([{ ...investment, user_id: user.id }])
        .select()
      if (error) throw error
      
      // Cria a entrada de histórico inicial do saldo do investimento
      await supabase.from('investment_history').insert({
        investment_id: data[0].id,
        balance: data[0].current_balance,
        date: new Date().toISOString().split('T')[0]
      })

      setInvestments(prev => [...prev, data[0]])
      return data[0]
    } catch (err) {
      console.error('Erro ao adicionar investimento:', err.message)
      throw err
    }
  }

  const deleteInvestment = async (id) => {
    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)
      if (error) throw error
      setInvestments(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Erro ao deletar investimento:', err.message)
      throw err
    }
  }

  const updateInvestmentBalance = async (id, newBalance, date) => {
    try {
      const { error } = await supabase
        .from('investments')
        .update({ current_balance: newBalance })
        .eq('id', id)
      if (error) throw error

      // Salva no histórico de investimentos para alimentar gráficos
      await supabase.from('investment_history').insert({
        investment_id: id,
        balance: newBalance,
        date: date || new Date().toISOString().split('T')[0]
      })

      setInvestments(prev => prev.map(i => i.id === id ? { ...i, current_balance: newBalance } : i))
    } catch (err) {
      console.error('Erro ao atualizar saldo do investimento:', err.message)
      throw err
    }
  }

  // 5. Saving Goals CRUD
  const fetchSavingGoals = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('saving_goals')
        .select('*')
        .order('created_at')
      if (error) throw error
      setSavingGoals(data || [])
    } catch (err) {
      console.error('Erro ao buscar metas:', err.message)
    }
  }

  const addSavingGoal = async (goal) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('saving_goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
      if (error) throw error
      setSavingGoals(prev => [...prev, data[0]])
      return data[0]
    } catch (err) {
      console.error('Erro ao adicionar meta:', err.message)
      throw err
    }
  }

  const deleteSavingGoal = async (id) => {
    try {
      const { error } = await supabase
        .from('saving_goals')
        .delete()
        .eq('id', id)
      if (error) throw error
      setSavingGoals(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error('Erro ao deletar meta:', err.message)
      throw err
    }
  }

  const updateSavingGoalAmount = async (id, newAmount) => {
    try {
      const { error } = await supabase
        .from('saving_goals')
        .update({ current_amount: newAmount })
        .eq('id', id)
      if (error) throw error
      setSavingGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount: newAmount } : g))
    } catch (err) {
      console.error('Erro ao atualizar valor da meta:', err.message)
      throw err
    }
  }

  // 6. Recurring Rules CRUD
  const fetchRecurringRules = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select('*, categories(name, color), family_members(name)')
      if (error) throw error
      setRecurringRules(data || [])
      return data || []
    } catch (err) {
      console.error('Erro ao buscar regras recorrentes:', err.message)
      return []
    }
  }

  const addRecurringRule = async (rule) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .insert([{ ...rule, user_id: user.id }])
        .select('*, categories(name, color), family_members(name)')
      if (error) throw error
      setRecurringRules(prev => [data[0], ...prev])
      return data[0]
    } catch (err) {
      console.error('Erro ao adicionar regra recorrente:', err.message)
      throw err
    }
  }

  const deleteRecurringRule = async (id) => {
    try {
      const { error } = await supabase
        .from('recurring_rules')
        .delete()
        .eq('id', id)
      if (error) throw error
      setRecurringRules(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Erro ao deletar regra recorrente:', err.message)
      throw err
    }
  }

  // Gera transações recorrentes passadas e atuais que ainda não foram inseridas no banco
  const checkAndGenerateRecurringTransactions = async (currentRules, currentTrans) => {
    if (!user || !currentRules || currentRules.length === 0) return

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // 0-11
    
    const newTransactionsToInsert = []

    for (const rule of currentRules) {
      const startDate = new Date(rule.start_date)
      const endDate = rule.end_date ? new Date(rule.end_date) : null

      const startYear = startDate.getFullYear()
      const startMonth = startDate.getMonth()
      const startDay = startDate.getDate()

      const limitDate = (endDate && endDate < today) ? endDate : today
      const limitYear = limitDate.getFullYear()
      const limitMonth = limitDate.getMonth()

      // Total de meses de diferença
      const diffMonths = (limitYear - startYear) * 12 + (limitMonth - startMonth)

      for (let i = 0; i <= diffMonths; i++) {
        let targetMonth = startMonth + i
        let targetYear = startYear + Math.floor(targetMonth / 12)
        targetMonth = targetMonth % 12

        const monthStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`

        // Verifica se já existe uma transação correspondente a esta regra neste mês/ano
        const alreadyExists = currentTrans.some(t => 
          t.recurring_rule_id === rule.id && 
          t.date.startsWith(monthStr)
        )

        if (!alreadyExists) {
          const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
          const targetDay = Math.min(startDay, lastDayOfTargetMonth)
          const targetDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`

          newTransactionsToInsert.push({
            user_id: user.id,
            description: rule.description,
            amount: parseFloat(rule.amount),
            type: rule.type,
            category_id: rule.category_id,
            date: targetDateStr,
            billing_date: targetDateStr,
            family_member_id: rule.family_member_id || null,
            is_recurring: true,
            recurring_rule_id: rule.id,
            is_future: false,
            statement_name: rule.statement_name || null,
            notes: 'Gerado automaticamente a partir da regra de recorrência.'
          })
        }
      }
    }

    if (newTransactionsToInsert.length > 0) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert(newTransactionsToInsert)
          .select('*, categories(name, color), family_members(name)')
          
        if (error) {
          // 23505 = unique_violation. Significa que outra sessão/dispositivo inseriu as faturas ao mesmo tempo
          if (error.code === '23505') {
            console.warn('Transações recorrentes geradas por outra sessão. Sincronizando...')
            await fetchTransactions()
            return
          }
          throw error
        }

        if (data && data.length > 0) {
          setTransactions(prev => [...data, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
        }
      } catch (err) {
        console.error('Erro ao gerar transações recorrentes automáticas:', err.message)
      }
    }
  }

  // Inicializa todos os dados ao autenticar
  // 7. Family Members CRUD
  const fetchFamilyMembers = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('name')
      if (error) throw error
      setFamilyMembers(data || [])
      return data || []
    } catch (err) {
      console.error('Erro ao buscar membros da família:', err.message)
      return []
    }
  }

  const addFamilyMember = async (name) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert([{ name, user_id: user.id }])
        .select()
      if (error) throw error
      setFamilyMembers(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
      return data[0]
    } catch (err) {
      console.error('Erro ao adicionar membro da família:', err.message)
      throw err
    }
  }

  const deleteFamilyMember = async (id) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)
      if (error) throw error
      setFamilyMembers(prev => prev.filter(m => m.id !== id))
      
      // Update local state to set null to associations
      setTransactions(prev => prev.map(t => t.family_member_id === id ? { ...t, family_member_id: null, family_members: null } : t))
      setRecurringRules(prev => prev.map(r => r.family_member_id === id ? { ...r, family_member_id: null, family_members: null } : r))
    } catch (err) {
      console.error('Erro ao deletar membro da família:', err.message)
      throw err
    }
  }

  const updateTransaction = async (id, updatedTransaction) => {
    try {
      const payload = {
        ...updatedTransaction,
        billing_date: updatedTransaction.billing_date || updatedTransaction.date
      }
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .select('*, categories(name, color), family_members(name)')
      if (error) throw error
      setTransactions(prev => prev.map(t => t.id === id ? data[0] : t))
      return data[0]
    } catch (err) {
      console.error('Erro ao atualizar transação:', err.message)
      throw err
    }
  }

  const updateRecurringRule = async (id, updatedRule) => {
    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .update(updatedRule)
        .eq('id', id)
        .select('*, categories(name, color), family_members(name)')
      if (error) throw error
      setRecurringRules(prev => prev.map(r => r.id === id ? data[0] : r))
      
      // Também atualiza localmente as transações associadas a esta regra na lista local para sincronizar nome/valor/etc.
      setTransactions(prev => prev.map(t => t.recurring_rule_id === id ? {
        ...t,
        description: data[0].description,
        amount: data[0].amount,
        category_id: data[0].category_id,
        categories: data[0].categories,
        family_member_id: data[0].family_member_id,
        family_members: data[0].family_members
      } : t))
      
      return data[0]
    } catch (err) {
      console.error('Erro ao atualizar regra recorrente:', err.message)
      throw err
    }
  }

  const updateInvestment = async (id, updatedInvestment) => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .update(updatedInvestment)
        .eq('id', id)
        .select()
      if (error) throw error

      // Registra no histórico se o saldo mudou
      const oldInvestment = investments.find(i => i.id === id)
      if (oldInvestment && Number(oldInvestment.current_balance) !== Number(updatedInvestment.current_balance)) {
        await supabase.from('investment_history').insert({
          investment_id: id,
          balance: updatedInvestment.current_balance,
          date: new Date().toISOString().split('T')[0]
        })
      }

      setInvestments(prev => prev.map(i => i.id === id ? data[0] : i))
      return data[0]
    } catch (err) {
      console.error('Erro ao atualizar investimento:', err.message)
      throw err
    }
  }

  const updateBudget = async (id, updatedBudget) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updatedBudget)
        .eq('id', id)
        .select('*, categories(name, color)')
      if (error) throw error
      setBudgets(prev => prev.map(b => b.id === id ? data[0] : b))
      return data[0]
    } catch (err) {
      console.error('Erro ao atualizar orçamento:', err.message)
      throw err
    }
  }

  const updateSavingGoal = async (id, updatedGoal) => {
    try {
      const { data, error } = await supabase
        .from('saving_goals')
        .update(updatedGoal)
        .eq('id', id)
        .select()
      if (error) throw error
      setSavingGoals(prev => prev.map(g => g.id === id ? data[0] : g))
      return data[0]
    } catch (err) {
      console.error('Erro ao atualizar meta:', err.message)
      throw err
    }
  }

  const updateCategory = async (id, updatedCategory) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updatedCategory)
        .eq('id', id)
        .select()
      if (error) throw error
      setCategories(prev => prev.map(c => c.id === id ? data[0] : c).sort((a, b) => a.name.localeCompare(b.name)))

      // Propaga a atualização nas transações, recorrências e orçamentos que referenciam essa categoria
      setTransactions(prev => prev.map(t => t.category_id === id ? { ...t, categories: data[0] } : t))
      setRecurringRules(prev => prev.map(r => r.category_id === id ? { ...r, categories: data[0] } : r))
      setBudgets(prev => prev.map(b => b.category_id === id ? { ...b, categories: data[0] } : b))

      return data[0]
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err.message)
      throw err
    }
  }

  const updateFamilyMember = async (id, name) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update({ name })
        .eq('id', id)
        .select()
      if (error) throw error
      setFamilyMembers(prev => prev.map(m => m.id === id ? data[0] : m).sort((a, b) => a.name.localeCompare(b.name)))

      // Propaga a atualização nas transações e recorrências que referenciam esse membro
      setTransactions(prev => prev.map(t => t.family_member_id === id ? { ...t, family_members: data[0] } : t))
      setRecurringRules(prev => prev.map(r => r.family_member_id === id ? { ...r, family_members: data[0] } : r))

      return data[0]
    } catch (err) {
      console.error('Erro ao atualizar membro da família:', err.message)
      throw err
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [cats, trans, bgts, invs, goals, rules, members] = await Promise.all([
        fetchCategories(),
        fetchTransactions(),
        fetchBudgets(),
        fetchInvestments(),
        fetchSavingGoals(),
        fetchRecurringRules(),
        fetchFamilyMembers()
      ])

      if (trans && rules) {
        await checkAndGenerateRecurringTransactions(rules, trans)
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadAllData()
    } else {
      setTransactions([])
      setCategories([])
      setBudgets([])
      setInvestments([])
      setSavingGoals([])
      setRecurringRules([])
      setFamilyMembers([])
    }
  }, [user])

  const value = {
    transactions,
    categories,
    budgets,
    investments,
    savingGoals,
    recurringRules,
    familyMembers,
    loading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    addCategory,
    deleteCategory,
    updateCategory,
    addBudget,
    deleteBudget,
    updateBudget,
    addInvestment,
    deleteInvestment,
    updateInvestment,
    updateInvestmentBalance,
    addSavingGoal,
    deleteSavingGoal,
    updateSavingGoal,
    updateSavingGoalAmount,
    addRecurringRule,
    deleteRecurringRule,
    updateRecurringRule,
    fetchFamilyMembers,
    addFamilyMember,
    deleteFamilyMember,
    updateFamilyMember,
    loadAllData
  }

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  )
}

export const useFinancial = () => {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error('useFinancial deve ser usado dentro de um FinancialProvider')
  }
  return context
}
