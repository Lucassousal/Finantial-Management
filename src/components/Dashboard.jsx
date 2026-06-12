import React, { useState, Suspense, lazy } from 'react'
import { useAuth } from '../context/AuthContext'
import { useFinancial } from '../context/FinancialContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Input } from './ui/input'
import { 
  LogOut, 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  LayoutDashboard, 
  ArrowLeftRight, 
  LineChart, 
  Target, 
  PieChart,
  Sun,
  Moon,
  Settings
} from 'lucide-react'

// Import das Abas Modulares com Lazy Loading
const TransactionsTab = lazy(() => import('./TransactionsTab'))
const InvestmentsTab = lazy(() => import('./InvestmentsTab'))
const GoalsTab = lazy(() => import('./GoalsTab'))
const BudgetsTab = lazy(() => import('./BudgetsTab'))
const AnalyticsTab = lazy(() => import('./AnalyticsTab'))
const SettingsTab = lazy(() => import('./SettingsTab'))

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { transactions, investments, budgets, savingGoals, loading } = useFinancial()
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)) // 'YYYY-MM'

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // ==========================================
  // CÁLCULOS DO DASHBOARD (VISÃO GERAL)
  // ==========================================
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(selectedMonth))
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(selectedMonth))
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  const totalInvested = investments
    .reduce((sum, i) => sum + parseFloat(i.current_balance || 0), 0)

  // Saldo das contas correntes/liquidez (receitas - despesas - aportes)
  const totalContas = transactions
    .reduce((sum, t) => {
      const amt = parseFloat(t.amount || 0)
      if (t.type === 'income') return sum + amt
      if (t.type === 'expense' || t.type === 'investment') return sum - amt
      return sum
    }, 0)

  // Patrimônio líquido total = Dinheiro em conta + Valor Investido
  const netWorth = totalContas + totalInvested

  const getAmountSpentForCategory = (catId, budgetMonth) => {
    return transactions
      .filter((t) => t.category_id === catId && t.type === 'expense' && t.date.startsWith(budgetMonth))
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-4 sm:p-6 transition-colors duration-250">
      {/* Cabeçalho do App */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Wallet className="text-emerald-500 h-8 w-8" />
            Gestão Financeira
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Controle financeiro familiar compartilhado • {user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Seletor de Tema */}
          <Button 
            variant="secondary"
            size="icon"
            onClick={toggleTheme}
            className="bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button 
            variant="secondary" 
            onClick={signOut} 
            className="bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 gap-2 w-fit"
          >
            <LogOut size={16} /> Sair
          </Button>
        </div>
      </header>

      {/* Abas e Navegação */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 p-1 flex flex-row flex-nowrap justify-start overflow-x-auto whitespace-nowrap scrollbar-none w-full h-auto gap-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 hover:text-zinc-900 dark:hover:text-zinc-200 gap-2 py-2 cursor-pointer transition-colors"
          >
            <LayoutDashboard size={16} /> Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 hover:text-zinc-900 dark:hover:text-zinc-200 gap-2 py-2 cursor-pointer transition-colors"
          >
            <ArrowLeftRight size={16} /> Lançamentos
          </TabsTrigger>
          <TabsTrigger 
            value="investments" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 hover:text-zinc-900 dark:hover:text-zinc-200 gap-2 py-2 cursor-pointer transition-colors"
          >
            <LineChart size={16} /> Investimentos
          </TabsTrigger>
          <TabsTrigger 
            value="budgets" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 hover:text-zinc-900 dark:hover:text-zinc-200 gap-2 py-2 cursor-pointer transition-colors"
          >
            <Target size={16} /> Orçamentos
          </TabsTrigger>
          <TabsTrigger 
            value="goals" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 hover:text-zinc-900 dark:hover:text-zinc-200 gap-2 py-2 cursor-pointer transition-colors"
          >
            <PiggyBank size={16} /> Metas
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 hover:text-zinc-900 dark:hover:text-zinc-200 gap-2 py-2 cursor-pointer transition-colors"
          >
            <PieChart size={16} /> Gráficos
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 hover:text-zinc-900 dark:hover:text-zinc-200 gap-2 py-2 cursor-pointer transition-colors"
          >
            <Settings size={16} /> Ajustes
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            ABA 1: VISÃO GERAL (RESUMO RÁPIDO)
            ========================================== */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* Seletor de Período Mensal */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Período de Referência</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Selecione o mês para filtrar receitas, despesas e limites de orçamentos da visão geral.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="dashboard-month" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Mês:</label>
              <Input
                id="dashboard-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ colorScheme: theme }}
                className="w-40 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus-visible:ring-emerald-500 cursor-pointer text-sm"
              />
            </div>
          </div>
          {/* Cartões de Indicadores */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Patrimônio Líquido</CardTitle>
                <Wallet className="text-indigo-400 h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-indigo-500 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {formatCurrency(netWorth)}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Saldo em contas + Investimentos</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Receitas</CardTitle>
                <TrendingUp className="text-emerald-500 h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalIncome)}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Soma de salários e outras rendas</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Despesas</CardTitle>
                <TrendingDown className="text-rose-500 h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalExpense)}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Soma de gastos mensais efetuados</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Valor Investido</CardTitle>
                <LineChart className="text-indigo-500 h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">
                  {formatCurrency(totalInvested)}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Total alocado em renda fixa e variável</p>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Orçamentos e Metas rápidas */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Resumo Orçamentos */}
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
              <CardHeader>
                <CardTitle className="text-lg">Limites de Gastos ({selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]})</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Acompanhe se está dentro do limite planejado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {budgets.filter(b => b.month === selectedMonth).length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-6">Nenhum limite de orçamento definido para este mês.</p>
                ) : (
                  budgets
                    .filter(b => b.month === selectedMonth)
                    .slice(0, 4)
                    .map(b => {
                      const spent = getAmountSpentForCategory(b.category_id, selectedMonth)
                      const pct = Math.min(100, Math.round((spent / b.amount_limit) * 100))
                      const isOver = spent > b.amount_limit

                      return (
                        <div key={b.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.categories?.color }}></span>
                              {b.categories?.name}
                            </span>
                            <span className={isOver ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-zinc-500 dark:text-zinc-400'}>
                              {formatCurrency(spent)} / {formatCurrency(b.amount_limit)}
                            </span>
                          </div>
                          <Progress value={pct} className={`h-1.5 ${isOver ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        </div>
                      )
                    })
                )}
              </CardContent>
            </Card>

            {/* Resumo Metas */}
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
              <CardHeader>
                <CardTitle className="text-lg">Progresso das Metas</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Seus objetivos de poupança ativos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {savingGoals.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-6">Nenhum objetivo poupança ativo.</p>
                ) : (
                  savingGoals.slice(0, 4).map(goal => {
                    const pct = Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100))
                    return (
                      <div key={goal.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-zinc-100 dark:bg-zinc-800 border-none" />
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Últimos Lançamentos */}
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
            <CardHeader>
              <CardTitle className="text-lg">Últimos Lançamentos</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Transações e aportes recentes no banco de dados.</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.filter(t => t.date.startsWith(selectedMonth)).length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">Nenhuma movimentação lançada neste mês.</p>
              ) : (
                <div className="space-y-3">
                  {transactions
                    .filter(t => t.date.startsWith(selectedMonth))
                    .slice(0, 5)
                    .map(t => (
                      <div key={t.id} className="flex justify-between items-center p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm">
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                            {t.description}
                            {t.family_members?.name && (
                              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                {t.family_members.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==========================================
            ABA 2: LANÇAMENTOS (TRANSAÇÕES TAB)
            ========================================== */}
        <TabsContent value="transactions" className="outline-none">
          <Suspense fallback={<div className="flex justify-center items-center h-64 text-zinc-500">Carregando módulo...</div>}>
            <TransactionsTab />
          </Suspense>
        </TabsContent>

        {/* ==========================================
            ABA 3: INVESTIMENTOS (INVESTMENTS TAB)
            ========================================== */}
        <TabsContent value="investments" className="outline-none">
          <Suspense fallback={<div className="flex justify-center items-center h-64 text-zinc-500">Carregando módulo...</div>}>
            <InvestmentsTab />
          </Suspense>
        </TabsContent>

        {/* ==========================================
            ABA 4: ORÇAMENTOS (BUDGETS TAB)
            ========================================== */}
        <TabsContent value="budgets" className="outline-none">
          <Suspense fallback={<div className="flex justify-center items-center h-64 text-zinc-500">Carregando módulo...</div>}>
            <BudgetsTab />
          </Suspense>
        </TabsContent>

        {/* ==========================================
            ABA 5: METAS (GOALS TAB)
            ========================================== */}
        <TabsContent value="goals" className="outline-none">
          <Suspense fallback={<div className="flex justify-center items-center h-64 text-zinc-500">Carregando módulo...</div>}>
            <GoalsTab />
          </Suspense>
        </TabsContent>

        {/* ==========================================
            ABA 6: GRÁFICOS (ANALYTICS TAB)
            ========================================== */}
        <TabsContent value="analytics" className="outline-none">
          <Suspense fallback={<div className="flex justify-center items-center h-64 text-zinc-500">Carregando módulo...</div>}>
            <AnalyticsTab />
          </Suspense>
        </TabsContent>

        {/* ==========================================
            ABA 7: CONFIGURAÇÕES (SETTINGS TAB)
            ========================================== */}
        <TabsContent value="settings" className="outline-none">
          <Suspense fallback={<div className="flex justify-center items-center h-64 text-zinc-500">Carregando módulo...</div>}>
            <SettingsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
