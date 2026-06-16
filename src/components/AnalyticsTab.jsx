import React, { useState, useEffect, useMemo } from 'react'
import { useFinancial } from '../context/FinancialContext'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from '../context/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  ComposedChart
} from 'recharts'
import { TrendingUp, Calendar, Filter, HelpCircle, X } from 'lucide-react'

export default function AnalyticsTab() {
  const { theme } = useTheme()
  const { 
    transactions, 
    categories, 
    investments, 
    recurringRules 
  } = useFinancial()

  // Estados dos Gráficos
  const [investHistory, setInvestHistory] = useState([])
  const [selectedCats, setSelectedCats] = useState([]) // Categorias selecionadas para histórico
  const [forecastMonths, setForecastMonths] = useState(6)
  const [trendPeriod, setTrendPeriod] = useState(6)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRenderCharts(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  // Coleta histórico de investimentos
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Ordena por data crescente para garantir a cronologia absoluta
        const { data, error } = await supabase
          .from('investment_history')
          .select('investment_id, date, balance')
          .order('date', { ascending: true })
        
        if (error) throw error

        // Filtra apenas históricos de ativos que ainda existem na carteira
        const activeInvestmentIds = new Set(investments.map(i => i.id))
        const validData = data.filter(curr => activeInvestmentIds.has(curr.investment_id))

        // Aplica lógica de Carry-Forward Absoluto (Última "Foto" Conhecida do Saldo)
        const balancesMemo = {}
        const datesMap = {}

        validData.forEach(curr => {
          const targetDate = curr.date // YYYY-MM-DD
          
          // Atualiza a "memória" com a foto mais recente do saldo para este ativo nesta data
          balancesMemo[curr.investment_id] = parseFloat(curr.balance || 0)

          // O total do portfólio no final daquele dia é a soma das fotos de todos os ativos
          const totalPortfolio = Object.values(balancesMemo).reduce((sum, val) => sum + val, 0)

          // Sobrescreve o total do dia. Se houverem múltiplos lançamentos no mesmo dia,
          // o último processado definirá o saldo final daquele dia.
          datesMap[targetDate] = { 
            date: new Date(targetDate + 'T12:00:00').toLocaleDateString('pt-BR'), 
            total: totalPortfolio 
          }
        })
        
        // Converte o mapa de datas em um array ordenado
        const finalHistory = Object.keys(datesMap)
          .sort()
          .map(dateKey => datesMap[dateKey])

        setInvestHistory(finalHistory)
      } catch (err) {
        console.error('Erro ao buscar histórico de investimentos:', err)
      }
    }
    
    fetchHistory()
  }, [investments])

  // Inicializa a seleção de categorias do histórico com todas as despesas
  useEffect(() => {
    const expenseCats = categories.filter(c => c.type === 'expense').map(c => c.name)
    if (selectedCats.length === 0 && expenseCats.length > 0) {
      setSelectedCats(expenseCats)
    }
  }, [categories])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // ==========================================
  // 1. DADOS DE DESPESAS POR CATEGORIA (PIE)
  // ==========================================
  const expenseData = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        const catName = curr.categories?.name || 'Geral'
        const catColor = curr.categories?.color || '#3f3f46'
        const existing = acc.find(item => item.name === catName)
        if (existing) {
          existing.value += parseFloat(curr.amount)
        } else {
          acc.push({ name: catName, value: parseFloat(curr.amount), color: catColor })
        }
        return acc
      }, [])
  }, [transactions])

  // ==========================================
  // 2. DADOS DE RECEITA VS DESPESA (BAR)
  // ==========================================
  const barData = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    return [
      { name: 'Receitas x Despesas', Receitas: totalIncome, Despesas: totalExpense }
    ]
  }, [transactions])

  // ==========================================
  // 3. DADOS DE EVOLUÇÃO MENSAL POR CATEGORIA (LINE)
  // ==========================================
  // Agrupa gastos de despesas por Mês-Ano
  const monthlyCategoryData = useMemo(() => {
    const monthlyMap = {}
    
    // Obtém os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toISOString().slice(0, 7) // 'YYYY-MM'
      
      const [y, m] = monthStr.split('-')
      const label = `${m}/${y}`
      
      monthlyMap[monthStr] = { monthLabel: label }
      // Inicializa categorias com zero
      selectedCats.forEach(cat => {
        monthlyMap[monthStr][cat] = 0
      })
    }

    transactions.forEach(t => {
      if (t.type === 'expense') {
        const targetDate = t.billing_date || t.date
        const monthKey = targetDate.slice(0, 7)
        const catName = t.categories?.name
        if (monthlyMap[monthKey] && selectedCats.includes(catName)) {
          monthlyMap[monthKey][catName] += parseFloat(t.amount)
        }
      }
    })

    return Object.values(monthlyMap)
  }, [transactions, selectedCats])

  const toggleCategorySelection = (catName) => {
    setSelectedCats(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    )
  }

  // ==========================================
  // 4. PREVISÃO E PROJEÇÃO FUTURA (DASHED LINE)
  // ==========================================
  const forecastData = useMemo(() => {
    const forecast = []
    
    // 1. Calcular o saldo atual inicial líquido (Saldo em contas + Investimentos)
    const currentContas = transactions
      .reduce((sum, t) => {
        if (t.is_future) return sum // ignora futuros para o saldo atual
        if (t.type === 'income' || t.type === 'redemption') return sum + parseFloat(t.amount || 0)
        if (t.type === 'expense' || t.type === 'investment') return sum - parseFloat(t.amount || 0)
        return sum
      }, 0)
    
    const currentInvestments = investments.reduce((sum, i) => sum + parseFloat(i.current_balance || 0), 0)
    let projectedBalance = currentContas + currentInvestments

    forecast.push({
      monthLabel: 'Atual',
      Saldo: projectedBalance
    })

    // 2. Calcular a Tendência Variável do Passado (Últimos `trendPeriod` meses)
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - trendPeriod)
    const cutoffIso = cutoffDate.toISOString().slice(0, 10)
    const todayIso = new Date().toISOString().slice(0, 10)

    let variableIncome = 0
    let variableExpense = 0

    transactions.forEach(t => {
      if (t.is_future || t.is_recurring) return
      
      const tDate = t.date
      if (tDate >= cutoffIso && tDate <= todayIso) {
        if (t.type === 'income') variableIncome += parseFloat(t.amount || 0)
        if (t.type === 'expense') variableExpense += parseFloat(t.amount || 0)
      }
    })

    // Média Mensal Variável
    const avgVariableDelta = (variableIncome - variableExpense) / trendPeriod

    // 3. O(N) Agrupamento: Lançamentos futuros agendados por mês
    const futureByMonth = {}
    transactions.forEach(t => {
      if (t.is_future) {
        const monthStr = (t.billing_date || t.date).slice(0, 7)
        if (!futureByMonth[monthStr]) futureByMonth[monthStr] = 0
        const amt = parseFloat(t.amount || 0)
        if (t.type === 'income' || t.type === 'redemption') futureByMonth[monthStr] += amt
        else if (t.type === 'expense' || t.type === 'investment') futureByMonth[monthStr] -= amt
      }
    })

    // 4. Projeta os próximos N meses
    for (let i = 1; i <= forecastMonths; i++) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() + i)
      const monthStr = targetDate.toISOString().slice(0, 7)
      
      const [y, m] = monthStr.split('-')
      const label = `${m}/${y}`

      // A. Lançamentos Futuros agendados para este mês
      const futureSum = futureByMonth[monthStr] || 0

      // B. Regras de Lançamentos Recorrentes aplicáveis neste período
      const recurringSum = recurringRules
        .filter(rule => {
          const start = rule.start_date.slice(0, 7)
          const end = rule.end_date ? rule.end_date.slice(0, 7) : '9999-12'
          return monthStr >= start && monthStr <= end
        })
        .reduce((sum, rule) => {
          const amt = parseFloat(rule.amount || 0)
          return rule.type === 'income' ? sum + amt : sum - amt
        }, 0)

      // C. A tendência variável projetada para todos os meses futuros
      projectedBalance += futureSum + recurringSum + avgVariableDelta
      
      forecast.push({
        monthLabel: label,
        Saldo: projectedBalance
      })
    }

    return forecast
  }, [transactions, investments, recurringRules, forecastMonths, trendPeriod])

  // ==========================================
  // 5. PREVISÃO DE GASTOS FUTUROS (PRÓXIMOS 4 MESES - STACKED BAR)
  // ==========================================
  const expensesForecastData = useMemo(() => {
    const data = []
    
    // O(N) Agrupamento: Despesas futuras por mês e categoria
    const futureExpensesByMonth = {}
    transactions.forEach(t => {
      if (t.is_future && t.type === 'expense') {
        const monthKey = (t.billing_date || t.date).slice(0, 7)
        if (!futureExpensesByMonth[monthKey]) futureExpensesByMonth[monthKey] = {}
        
        const catName = t.categories?.name || 'Geral'
        if (!futureExpensesByMonth[monthKey][catName]) {
          futureExpensesByMonth[monthKey][catName] = 0
        }
        futureExpensesByMonth[monthKey][catName] += parseFloat(t.amount || 0)
      }
    })
    
    // Obtém os próximos 4 meses (excluindo o mês atual)
    for (let i = 1; i <= 4; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() + i)
      const monthKey = date.toISOString().slice(0, 7) // 'YYYY-MM'
      const [y, m] = monthKey.split('-')
      const label = `${m}/${y}`
      
      const monthData = { monthLabel: label, monthKey }
      
      // Inicializa todas as categorias de despesa ativas com zero
      categories
        .filter(c => c.type === 'expense')
        .forEach(cat => {
          monthData[cat.name] = 0
        })
        
      // A. Lançamentos Futuros agendados para este mês
      if (futureExpensesByMonth[monthKey]) {
        Object.entries(futureExpensesByMonth[monthKey]).forEach(([catName, amount]) => {
          if (monthData[catName] !== undefined) {
            monthData[catName] += amount
          } else {
            monthData[catName] = amount
          }
        })
      }
        
      // B. Regras de Lançamentos Recorrentes aplicáveis neste período
      recurringRules
        .filter(rule => {
          if (rule.type !== 'expense') return false
          const start = rule.start_date.slice(0, 7)
          const end = rule.end_date ? rule.end_date.slice(0, 7) : '9999-12'
          return monthKey >= start && monthKey <= end
        })
        .forEach(rule => {
          const catName = rule.categories?.name || 'Geral'
          if (monthData[catName] !== undefined) {
            monthData[catName] += parseFloat(rule.amount || 0)
          } else {
            monthData[catName] = parseFloat(rule.amount || 0)
          }
        })
        
      data.push(monthData)
    }
    
    return data
  }, [categories, transactions, recurringRules])

  // Cores estáticas padrão do Recharts para categorias
  const colorPalette = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#8b5cf6']

  if (!shouldRenderCharts) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-zinc-500 dark:text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <span className="text-sm font-medium animate-pulse">Carregando painel de métricas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
      {/* Grid Superior */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Receita vs Despesa */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-900 dark:text-white">Receitas vs Despesas Acumuladas</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Visão geral entre totais de entrada e saída.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)} 
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '6px', color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                  itemStyle={{ color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Gastos */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-900 dark:text-white">Despesas por Categoria</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Distribuição percentual dos seus gastos.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center">
            {expenseData.length === 0 ? (
              <p className="text-center text-zinc-500 text-sm">Sem despesas registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '6px', color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                    itemStyle={{ color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico Mensal por Categoria (Multiselect) */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-zinc-900 dark:text-white">Evolução Histórica por Categoria</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Selecione uma ou mais categorias para comparar os gastos mensais.</CardDescription>
            </div>
            {/* Seletor/Filtro Visual */}
            <div className="flex flex-wrap gap-2">
              {categories.filter(c => c.type === 'expense').map(cat => {
                const isSelected = selectedCats.includes(cat.name)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategorySelection(cat.name)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          {selectedCats.length === 0 ? (
            <div className="text-zinc-500 text-center py-12 flex items-center justify-center gap-2">
              <Filter size={18} />
              Selecione pelo menos uma categoria acima para visualizar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCategoryData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="monthLabel" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '6px', color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                  itemStyle={{ color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                {selectedCats.map((cat, index) => {
                  // Procura a cor da categoria
                  const catColor = categories.find(c => c.name === cat)?.color || colorPalette[index % colorPalette.length]
                  return (
                    <Line 
                      key={cat} 
                      type="monotone" 
                      dataKey={cat} 
                      stroke={catColor} 
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Previsão de Gastos Futuros (Stacked Bar) */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900 dark:text-white">Previsão de Gastos Futuros (Próximos 4 Meses)</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Projeção detalhada por categoria de despesas recorrentes ativas e lançamentos futuros agendados.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expensesForecastData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="monthLabel" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} />
              <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '6px', color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                itemStyle={{ color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              {categories
                .filter(c => c.type === 'expense')
                .map((cat, index) => (
                  <Bar 
                    key={cat.id} 
                    dataKey={cat.name} 
                    stackId="a" 
                    fill={cat.color || colorPalette[index % colorPalette.length]} 
                    radius={[2, 2, 0, 0]}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grid Inferior - Evolução e Previsão */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Evolução de Investimentos */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-900 dark:text-white">Evolução dos Investimentos</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Histórico de valor acumulado em aplicações financeiras.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {investHistory.length === 0 ? (
              <div className="text-zinc-500 text-center py-12">
                Nenhum histórico registrado. Atualize o saldo dos seus ativos na aba Investimentos.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={investHistory} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="date" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} />
                  <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '6px', color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                    itemStyle={{ color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" fillOpacity={0.15} fill="url(#colorTotal)" strokeWidth={2.5} />
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Previsão Futura */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-zinc-900 dark:text-white flex items-center gap-1.5 font-bold">
                  Previsão Híbrida de Patrimônio
                  <button 
                    onClick={() => setIsHelpOpen(true)}
                    className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-0.5 rounded transition-colors cursor-pointer"
                    title="Como funciona a previsão?"
                  >
                    <HelpCircle size={16} />
                  </button>
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
                  Projeção futura baseada nos seus agendamentos, regras recorrentes e na sua média de estilo de vida variável do passado.
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 hidden sm:block">Tendência:</span>
                  <button 
                    onClick={() => setTrendPeriod(3)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${trendPeriod === 3 ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    3 Meses
                  </button>
                  <button 
                    onClick={() => setTrendPeriod(6)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${trendPeriod === 6 ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    6 Meses
                  </button>
                  <button 
                    onClick={() => setTrendPeriod(12)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${trendPeriod === 12 ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    1 Ano
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="monthLabel" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '6px', color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                  itemStyle={{ color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar 
                  dataKey="Saldo" 
                  name="Patrimônio Projetado" 
                  fill="#10b981" 
                  fillOpacity={0.8}
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
                <Line 
                  type="monotone" 
                  dataKey="Saldo" 
                  name="Linha de Tendência"
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Ajuda da Previsão */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in-0">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-50">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="text-emerald-500 h-5 w-5" />
                Como funciona a Previsão?
              </h3>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed">
              <p>
                Este gráfico estima quanto dinheiro você terá no futuro (linha verde pontilhada) somando tudo o que você ganha e subtraindo tudo o que você gasta ao longo do tempo.
              </p>
              
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md space-y-2 border border-zinc-100 dark:border-zinc-850">
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">O que entra na conta?</h4>
                <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <li><strong>Seu saldo hoje:</strong> O dinheiro total que você tem disponível (contas + investimentos).</li>
                  <li><strong>Entradas e Saídas fixas:</strong> Contas recorrentes mensais (ex: salário, aluguel, assinaturas).</li>
                  <li><strong>Gastos programados:</strong> Compras ou despesas únicas agendadas para um mês específico.</li>
                </ul>
              </div>

              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-md space-y-1 border border-emerald-500/10 text-xs">
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">Exemplo prático simples:</h4>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Se hoje você tem <strong>R$ 1.000</strong> guardados, e todo mês recebe <strong>R$ 3.000</strong> (salário) e gasta <strong>R$ 2.000</strong> (contas), no final do próximo mês a previsão é que você tenha:
                </p>
                <p className="font-mono text-center font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  R$ 1.000 + R$ 3.000 - R$ 2.000 = R$ 2.000
                </p>
                <p className="text-zinc-500 dark:text-zinc-500 mt-1 text-[11px]">
                  Se você tiver algum gasto extra agendado, como IPVA de R$ 300, ele também é deduzido automaticamente da projeção daquele mês.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button 
                onClick={() => setIsHelpOpen(false)}
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium px-4 py-1.5 cursor-pointer text-xs"
              >
                Entendi!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
