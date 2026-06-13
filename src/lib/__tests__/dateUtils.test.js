import { describe, it, expect } from 'vitest'
import { adjustRecurringDate, computeBillingDate, calculateEndDate } from '../dateUtils'

describe('Date Utilities (Fase 4 QA)', () => {
  describe('computeBillingDate', () => {
    it('deve manter o dia igual se o mês de referência suportar', () => {
      // Compra 15 de Março -> fatura de Abril
      const result = computeBillingDate('2026-03-15', 2026, 4)
      expect(result).toBe('2026-04-15')
    })

    it('deve limitar para dia 30 em meses que não têm 31 dias', () => {
      // Compra 31 de Janeiro -> fatura de Abril
      const result = computeBillingDate('2026-01-31', 2026, 4)
      expect(result).toBe('2026-04-30')
    })

    it('deve limitar para 28 ou 29 em Fevereiro', () => {
      // Compra 31 de Janeiro -> fatura de Fevereiro (Não-Bissexto)
      const result1 = computeBillingDate('2026-01-31', 2026, 2)
      expect(result1).toBe('2026-02-28')

      // Compra 31 de Janeiro -> fatura de Fevereiro (Bissexto)
      const result2 = computeBillingDate('2024-01-31', 2024, 2)
      expect(result2).toBe('2024-02-29')
    })
  })

  describe('adjustRecurringDate', () => {
    it('deve manter a data original se for maior ou igual a data de faturamento', () => {
      // Compra no futuro em relação à fatura analisada
      const result = adjustRecurringDate('2026-05-15', 2026, 4)
      expect(result).toBe('2026-05-15')
    })

    it('deve ajustar a data para o mês da fatura se a compra foi retroativa', () => {
      // Compra antiga sendo registrada na fatura atual
      const result = adjustRecurringDate('2025-12-15', 2026, 4)
      expect(result).toBe('2026-04-15')
    })
  })

  describe('calculateEndDate', () => {
    it('deve somar parcelas corretamente no mesmo ano', () => {
      // 10 parcelas, estamos na 2ª. Faltam 8.
      // Maio + 8 meses = Janeiro do ano seguinte
      const result = calculateEndDate('2026-05-10', 10, 2)
      expect(result).toBe('2027-01-10')
    })

    it('deve ajustar o dia da parcela final se cair em um mês sem o dia', () => {
      // Começou dia 31 de Janeiro. Faltam 1 parcela (Cai em Fevereiro)
      const result = calculateEndDate('2026-01-31', 2, 1)
      expect(result).toBe('2026-02-28')
    })

    it('deve retornar nulo se installmentsTotal e Current forem inválidos', () => {
      expect(calculateEndDate('2026-01-01', 0, 0)).toBeNull()
      expect(calculateEndDate('2026-01-01', 5, 6)).toBeNull() // Parcela atual maior que a total
    })
  })

  describe('formatDateBR', () => {
    it('deve formatar corretamente uma data YYYY-MM-DD para DD/MM/YYYY', () => {
      const { formatDateBR } = require('../dateUtils')
      expect(formatDateBR('2026-04-30')).toBe('30/04/2026')
      expect(formatDateBR('2026-05-01')).toBe('01/05/2026')
    })

    it('não deve sofrer alteração de fuso horário (timezone shift)', () => {
      const { formatDateBR } = require('../dateUtils')
      // Se usássemos new Date('2026-05-01') no Brasil, viraria 30/04/2026.
      // O formatDateBR deve garantir que 2026-05-01 permaneça dia 01.
      expect(formatDateBR('2026-05-01')).toBe('01/05/2026')
    })
  })
})
