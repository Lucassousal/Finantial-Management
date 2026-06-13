const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add goalDeposits to useFinancial
if (content.includes('const { transactions, investments, budgets, savingGoals, loading } = useFinancial()')) {
  content = content.replace(
    'const { transactions, investments, budgets, savingGoals, loading } = useFinancial()',
    'const { transactions, investments, budgets, savingGoals, goalDeposits = [], loading } = useFinancial()'
  );
}

// 2. Add calculation variables above the return statement
const calcMarker = "const getAmountSpentForCategory = (catId, budgetMonth) => {";
const addCalculations = `
  // Cálculos de Metas Consolidadas e Mensais
  const activeConsolidatedGoals = savingGoals.filter(g => !g.target_date || g.target_date >= new Date().toISOString().split('T')[0]);
  
  const activeGoalsForMonth = savingGoals.filter(g => {
    const isNotExpired = !g.target_date || g.target_date >= \`\${selectedMonth}-01\`;
    const createdMonth = g.created_at ? g.created_at.substring(0, 7) : '';
    const isCreatedBeforeOrDuring = !createdMonth || createdMonth <= selectedMonth;
    return isNotExpired && isCreatedBeforeOrDuring;
  });

  const getDepositsForGoal = (goalId, month) => {
    return goalDeposits
      .filter(d => d.goal_id === goalId && d.deposit_date && d.deposit_date.startsWith(month))
      .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  };

  const getAmountSpentForCategory = (catId, budgetMonth) => {`;
if (!content.includes('activeConsolidatedGoals')) {
  content = content.replace(calcMarker, addCalculations);
}

// 3. Move the "Progresso das Metas" card to the consolidated section
// First, extract the old Resumo Metas block
const oldResumoMetasStart = "{/* Resumo Metas */}";
const oldResumoMetasEnd = "</Card>\n          </div>\n\n          {/* Últimos Lançamentos */}";

const startOld = content.indexOf(oldResumoMetasStart);
const endOld = content.indexOf("</Card>", startOld) + 7;

if (startOld > -1) {
  // Remove the old Resumo Metas from the grid
  const oldResumoMetasBlock = content.substring(startOld, endOld);
  content = content.replace(oldResumoMetasBlock, `
            {/* Aportes do Mês em Metas */}
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
              <CardHeader>
                <CardTitle className="text-lg">Aportes do Mês em Metas</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Total poupado para objetivos em {selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {activeGoalsForMonth.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-6">Nenhuma meta ativa elegível neste mês.</p>
                ) : (
                  activeGoalsForMonth.map(goal => {
                    const deposited = getDepositsForGoal(goal.id, selectedMonth);
                    return (
                      <div key={goal.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium flex items-center gap-1.5"><PiggyBank size={14} className="text-emerald-500"/> {goal.name}</span>
                          <span className={deposited > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-zinc-500 dark:text-zinc-400'}>
                            {deposited > 0 ? '+' + formatCurrency(deposited) : 'R$ 0,00'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
  `);

  // Now, insert the new consolidated Metas card right below the 3 cards in the Top Section
  const topSectionEnd = `              </Card>\n            </div>\n          </div>\n\n          <hr className="border-zinc-200 dark:border-zinc-800" />`;
  const consolidatedMetasCard = `
            {/* Progresso Consolidado de Metas */}
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm mt-4">
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Progresso de Metas Ativas</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {activeConsolidatedGoals.length === 0 ? (
                  <p className="text-zinc-500 text-xs">Nenhum objetivo poupança ativo.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {activeConsolidatedGoals.slice(0, 4).map(goal => {
                      const pct = Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100));
                      return (
                        <div key={goal.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium truncate pr-2">{goal.name}</span>
                            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] whitespace-nowrap">
                              {formatCurrency(goal.current_amount)}
                            </span>
                          </div>
                          <Progress value={pct} className="h-1.5 bg-zinc-100 dark:bg-zinc-800 border-none" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />`;

  content = content.replace(topSectionEnd, consolidatedMetasCard);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Dashboard Goals updated successfully.');
