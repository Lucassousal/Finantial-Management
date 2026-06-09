import React, { useState, useEffect } from 'react'
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
  Area 
} from 'recharts'
import { TrendingUp, Calendar, Filter } from 'lucide-react'

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

  // Coleta histórico de investimentos
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('investment_history')
          .select('date, balance')
          .order('date')
        if (error) throw error

        // Agrupa o saldo acumulado por data
        const grouped = data.reduce((acc, curr) => {
          const key = curr.date
          if (!acc[key]) {
            acc[key] = { date: new Date(key).toLocaleDateString('pt-BR'), total: 0 }
          }
          acc[key].total += parseFloat(curr.balance || 0)
          return acc
        }, {})
        
        setInvestHistory(Object.values(grouped))
      } catch (err) {
        console.error('Erro ao buscar histórico de investimentos:', err)
      }
    }
    fetchHistory()
  }, [investments])

  // Inicializa a seleção de categorias do histórico com as 3 primeiras despesas
  useEffect(() => {
    const expenseCats = categories.filter(c => c.type === 'expense').map(c => c.name)
    if (selectedCats.length === 0 && expenseCats.length > 0) {
      setSelectedCats(expenseCats.slice(0, 3))
    }
  }, [categories])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // ==========================================
  // 1. DADOS DE DESPESAS POR CATEGORIA (PIE)
  // ==========================================
  const expenseData = transactions
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

  // ==========================================
  // 2. DADOS DE RECEITA VS DESPESA (BAR)
  // ==========================================
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const barData = [
    { name: 'Receitas x Despesas', Receitas: totalIncome, Despesas: totalExpense }
  ]

  // ==========================================
  // 3. DADOS DE EVOLUÇÃO MENSAL POR CATEGORIA (LINE)
  // ==========================================
  // Agrupa gastos de despesas por Mês-Ano
  const getMonthlyCategoryData = () => {
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
        const monthKey = t.date.slice(0, 7)
        const catName = t.categories?.name
        if (monthlyMap[monthKey] && selectedCats.includes(catName)) {
          monthlyMap[monthKey][catName] += parseFloat(t.amount)
        }
      }
    })

    return Object.values(monthlyMap)
  }

  const toggleCategorySelection = (catName) => {
    setSelectedCats(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    )
  }

  // ==========================================
  // 4. PREVISÃO E PROJEÇÃO FUTURA (DASHED LINE)
  // ==========================================
  const getForecastData = () => {
    const forecast = []
    
    // Calcula o saldo atual inicial líquido (Saldo em contas + Investimentos)
    const currentContas = transactions
      .reduce((sum, t) => {
        if (t.type === 'income') return sum + parseFloat(t.amount)
        if (t.type === 'expense') return sum - parseFloat(t.amount)
        return sum
      }, 0)
    
    const currentInvestments = investments.reduce((sum, i) => sum + parseFloat(i.current_balance), 0)
    let projectedBalance = currentContas + currentInvestments

    // Adiciona ponto inicial
    forecast.push({
      monthLabel: 'Atual',
      Saldo: projectedBalance
    })

    // Projeta os próximos N meses
    for (let i = 1; i <= forecastMonths; i++) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() + i)
      const monthStr = targetDate.toISOString().slice(0, 7)
      
      const [y, m] = monthStr.split('-')
      const label = `${m}/${y}`

      // A. Lançamentos Futuros agendados para este mês específico
      const futureSum = transactions
        .filter(t => t.is_future && t.date.startsWith(monthStr))
        .reduce((sum, t) => {
          const amt = parseFloat(t.amount)
          if (t.type === 'income') return sum + amt
          if (t.type === 'expense') return sum - amt
          if (t.type === 'investment') return sum - amt // Aporte tira da liquidez da conta (não altera o patrimônio líquido total)
          return sum
        }, 0)

      // B. Regras de Lançamentos Recorrentes aplicáveis neste período
      const recurringSum = recurringRules
        .filter(rule => {
          const start = rule.start_date.slice(0, 7)
          const end = rule.end_date ? rule.end_date.slice(0, 7) : '9999-12'
          return monthStr >= start && monthStr <= end
        })
        .reduce((sum, rule) => {
          const amt = parseFloat(rule.amount)
          return rule.type === 'income' ? sum + amt : sum - amt
        }, 0)

      projectedBalance += futureSum + recurringSum
      
      forecast.push({
        monthLabel: label,
        Saldo: projectedBalance
      })
    }

    return forecast
  }

  const forecastData = getForecastData()
  const monthlyCategoryData = getMonthlyCategoryData()

  // ==========================================
  // 5. PREVISÃO DE GASTOS FUTUROS (PRÓXIMOS 4 MESES - STACKED BAR)
  // ==========================================
  const getExpensesForecastData = () => {
    const data = []
    
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
        
      // A. Lançamentos Futuros agendados para este mês específico
      transactions
        .filter(t => t.is_future && t.type === 'expense' && t.date.startsWith(monthKey))
        .forEach(t => {
          const catName = t.categories?.name || 'Geral'
          if (monthData[catName] !== undefined) {
            monthData[catName] += parseFloat(t.amount || 0)
          } else {
            monthData[catName] = parseFloat(t.amount || 0)
          }
        })
        
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
  }
  
  const expensesForecastData = getExpensesForecastData()

  // Cores estáticas padrão do Recharts para categorias
  const colorPalette = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#8b5cf6']

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-zinc-900 dark:text-white">Previsão e Evolução Patrimonial</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Previsão para os próximos meses baseada em recorrências e agendamentos.</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <TrendingUp size={14} />
                Projeção
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="monthLabel" stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#a1a1aa' : '#71717a'} fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7', borderRadius: '6px', color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                  itemStyle={{ color: theme === 'dark' ? '#f4f4f5' : '#18181b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Saldo" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
