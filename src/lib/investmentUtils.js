export const calculatePropagationUpdates = (targetDate, newBalance, delta, futureHistory) => {
  const existingTarget = futureHistory.find(h => h.date === targetDate);
  const needsInsert = !existingTarget;
  
  const updates = [];
  futureHistory.forEach(row => {
    if (row.date === targetDate) {
      // Se for a própria data alvo, cravamos o novo saldo absoluto
      updates.push({ ...row, balance: newBalance });
    } else {
      // Se for no futuro, pegamos a foto que já existia lá e somamos a variação
      updates.push({ ...row, balance: parseFloat(row.balance) + delta });
    }
  });

  return { needsInsert, updates };
};
