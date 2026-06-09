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
  addCategory: () => Promise.resolve(),
  deleteCategory: () => Promise.resolve(),
  addBudget: () => Promise.resolve(),
  deleteBudget: () => Promise.resolve(),
  addInvestment: () => Promise.resolve(),
  deleteInvestment: () => Promise.resolve(),
  updateInvestmentBalance: () => Promise.resolve(),
  addSavingGoal: () => Promise.resolve(),
  deleteSavingGoal: () => Promise.resolve(),
  updateSavingGoalAmount: () => Promise.resolve(),
  addRecurringRule: () => Promise.resolve(),
  deleteRecurringRule: () => Promise.resolve(),
})

export const FinancialProvider = ({ children }) => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [investments, setInvestments] = useState([])
  const [savingGoals, setSavingGoals] = useState([])
  const [recurringRules, setRecurringRules] = useState([])
  const [loading, setLoading] = useState(false)

  // 1. Transactions CRUD
  const fetchTransactions = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .order('date', { ascending: false })
      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error('Erro ao buscar transações:', err.message)
    }
  }

  const addTransaction = async (newTransaction) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...newTransaction, user_id: user.id }])
        .select('*, categories(name, color)')

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
        .select('*, categories(name, color)')
      if (error) throw error
      setRecurringRules(data || [])
    } catch (err) {
      console.error('Erro ao buscar regras recorrentes:', err.message)
    }
  }

  const addRecurringRule = async (rule) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .insert([{ ...rule, user_id: user.id }])
        .select('*, categories(name, color)')
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

  // Inicializa todos os dados ao autenticar
  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchCategories(),
      fetchTransactions(),
      fetchBudgets(),
      fetchInvestments(),
      fetchSavingGoals(),
      fetchRecurringRules()
    ])
    setLoading(false)
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
    }
  }, [user])

  const value = {
    transactions,
    categories,
    budgets,
    investments,
    savingGoals,
    recurringRules,
    loading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    addBudget,
    deleteBudget,
    addInvestment,
    deleteInvestment,
    updateInvestmentBalance,
    addSavingGoal,
    deleteSavingGoal,
    updateSavingGoalAmount,
    addRecurringRule,
    deleteRecurringRule,
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
