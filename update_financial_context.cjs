const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'FinancialContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add goalDeposits to context definition
if (!content.includes('goalDeposits: [],')) {
  content = content.replace(
    'savingGoals: [],',
    'savingGoals: [],\n  goalDeposits: [],'
  );
}

// 2. Add goalDeposits state
if (!content.includes('const [goalDeposits, setGoalDeposits] = useState([])')) {
  content = content.replace(
    'const [savingGoals, setSavingGoals] = useState([])',
    'const [savingGoals, setSavingGoals] = useState([])\n  const [goalDeposits, setGoalDeposits] = useState([])'
  );
}

// 3. Add fetchGoalDeposits
if (!content.includes('const fetchGoalDeposits = async () => {')) {
  const savingGoalsFetchRegex = /const fetchSavingGoals = async \(\) => \{[\s\S]*?\}\n\s*\}/;
  content = content.replace(savingGoalsFetchRegex, (match) => {
    return match + `\n\n  const fetchGoalDeposits = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('goal_deposits')
        .select('*')
        .order('deposit_date', { ascending: false })
      if (error) throw error
      setGoalDeposits(data || [])
    } catch (err) {
      console.error('Erro ao buscar depósitos de metas:', err.message)
    }
  }`;
  });
}

// 4. Update updateSavingGoalAmount to record deposit
if (content.includes('const updateSavingGoalAmount = async (id, newAmount) => {') && !content.includes('depositAmount = 0')) {
  content = content.replace(
    'const updateSavingGoalAmount = async (id, newAmount) => {',
    'const updateSavingGoalAmount = async (id, newAmount, depositAmount = 0) => {'
  );
  
  // Insert the deposit logic right after updating the saving goal amount
  const savingGoalUpdateSuccess = "setSavingGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount: newAmount } : g))";
  content = content.replace(
    savingGoalUpdateSuccess,
    `${savingGoalUpdateSuccess}\n\n      if (depositAmount > 0) {
        const { data: depositData, error: depositError } = await supabase
          .from('goal_deposits')
          .insert([{
            goal_id: id,
            user_id: user.id,
            amount: depositAmount,
            deposit_date: new Date().toISOString().split('T')[0]
          }])
          .select()
        if (!depositError && depositData) {
          setGoalDeposits(prev => [depositData[0], ...prev])
        }
      }`
  );
}

// 5. Call fetchGoalDeposits in the initial load useEffect
if (!content.includes('await fetchGoalDeposits()')) {
  content = content.replace(
    'await fetchSavingGoals()',
    'await fetchSavingGoals()\n        await fetchGoalDeposits()'
  );
}

// 6. Export goalDeposits in the Provider
if (!content.includes('goalDeposits,')) {
  content = content.replace(
    'savingGoals,',
    'savingGoals,\n    goalDeposits,'
  );
}

// 7. Update memo dependency array
if (content.includes('[transactions, categories, budgets, investments, savingGoals, recurringRules, familyMembers, loading]') && !content.includes('goalDeposits')) {
  content = content.replace(
    '[transactions, categories, budgets, investments, savingGoals, recurringRules, familyMembers, loading]',
    '[transactions, categories, budgets, investments, savingGoals, goalDeposits, recurringRules, familyMembers, loading]'
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('FinancialContext.jsx updated successfully.');
