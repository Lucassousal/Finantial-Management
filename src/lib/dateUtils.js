/**
 * Ajusta a data de uma regra recorrente para evitar cobranças retroativas duplicadas,
 * mas mantendo o dia correto (com clamp no último dia do mês se necessário).
 */
export function adjustRecurringDate(originalDate, referenceYear, referenceMonth) {
  if (!originalDate || !referenceYear || !referenceMonth) return originalDate;
  
  const [pYear, pMonth, pDay] = originalDate.split('-').map(Number);
  
  if (pYear < referenceYear || (pYear === referenceYear && pMonth < referenceMonth)) {
    return computeBillingDate(originalDate, referenceYear, referenceMonth);
  }
  
  return originalDate;
}

/**
 * Calcula o faturamento da transação dentro do mês de referência atual.
 * Ex: Compra dia 31 de Março para fatura de Abril (que tem 30 dias) -> vira 30 de Abril.
 */
export function computeBillingDate(originalDate, referenceYear, referenceMonth) {
  if (!originalDate || !referenceYear || !referenceMonth) return originalDate;
  
  const [, , pDay] = originalDate.split('-').map(Number);
  const billingDateObj = new Date(referenceYear, referenceMonth - 1, pDay);
  
  if (billingDateObj.getMonth() !== referenceMonth - 1) {
    const lastDay = new Date(referenceYear, referenceMonth, 0).getDate();
    return `${referenceYear}-${String(referenceMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }
  
  return `${referenceYear}-${String(referenceMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
}

/**
 * Calcula o fim do parcelamento corrigindo bugs de data (onde setMonth gerava meses falsos se o dia fosse > 28).
 */
export function calculateEndDate(startDate, installmentsTotal, installmentsCurrent) {
  if (!startDate || !installmentsTotal || !installmentsCurrent) return null;
  
  const monthsRemaining = installmentsTotal - installmentsCurrent;
  if (monthsRemaining < 0) return null;
  
  const [year, month, day] = startDate.split('-').map(Number);
  let targetMonth = month - 1 + monthsRemaining;
  
  const endYear = year + Math.floor(targetMonth / 12);
  const endMonth = targetMonth % 12; // 0 a 11
  
  let endDay = day;
  const maxDaysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
  if (endDay > maxDaysInEndMonth) {
      endDay = maxDaysInEndMonth;
  }
  
  return `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}
