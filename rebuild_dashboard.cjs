const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. We need to add the monthlyBalance calculation around line 68
const netWorthRegex = /const netWorth = totalContas \+ totalInvested/;
if (content.includes('const netWorth = totalContas + totalInvested') && !content.includes('const monthlyBalance = totalIncome - totalExpense')) {
  content = content.replace(
    'const netWorth = totalContas + totalInvested',
    'const netWorth = totalContas + totalInvested\n\n  const monthlyBalance = totalIncome - totalExpense'
  );
}

// 2. We need to replace the TabsContent overview block up to the budgets grid
const startMarker = '<TabsContent value="overview" className="space-y-6 outline-none">';
const endMarker = '{/* Grid de Orçamentos e Metas rápidas */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex > -1 && endIndex > -1) {
  const replacement = `<TabsContent value="overview" className="space-y-8 outline-none">
          
          {/* SEÇÃO 1: PATRIMÔNIO CONSOLIDADO (GLOBAL) */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-500" />
              Patrimônio Consolidado
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Saldo em Contas</CardTitle>
                  <PiggyBank className="text-emerald-500 h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className={\`text-2xl font-bold \${totalContas >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-500 dark:text-rose-400'}\`}>
                    {formatCurrency(totalContas)}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Dinheiro disponível (Receitas - Despesas)</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Investido</CardTitle>
                  <LineChart className="text-indigo-500 h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">
                    {formatCurrency(totalInvested)}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Alocado em renda fixa e variável</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Patrimônio Líquido</CardTitle>
                  <Wallet className="text-indigo-500 h-4 w-4" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className={\`text-2xl font-bold \${netWorth >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}\`}>
                    {formatCurrency(netWorth)}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Soma de todo o seu capital</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* SEÇÃO 2: FLUXO MENSAL */}
          <div className="space-y-4">
            {/* Seletor de Período Mensal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Fluxo Mensal</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Métricas referentes ao mês selecionado.</p>
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

            {/* Cartões do Mês */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Receitas do Mês</CardTitle>
                  <TrendingUp className="text-emerald-500 h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalIncome)}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Ganhos no mês selecionado</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Despesas do Mês</CardTitle>
                  <TrendingDown className="text-rose-500 h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(totalExpense)}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Gastos no mês selecionado</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Balanço do Mês</CardTitle>
                  <ArrowLeftRight className="text-zinc-400 h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className={\`text-2xl font-bold \${monthlyBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}\`}>
                    {formatCurrency(monthlyBalance)}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Receitas - Despesas (Sobra/Falta)</p>
                </CardContent>
              </Card>
            </div>
          </div>

          `;
  
  const chunkToReplace = content.slice(startIndex, endIndex);
  content = content.replace(chunkToReplace, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Dashboard refactored successfully.');
} else {
  console.error('Could not find markers.');
}
