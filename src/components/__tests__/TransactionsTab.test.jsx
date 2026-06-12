import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TransactionsTab from '../TransactionsTab'
import React from 'react'

// Mocks dos contextos
vi.mock('../../context/FinancialContext', () => ({
  useFinancial: () => ({
    transactions: [
      { id: '1', description: 'Mercado', amount: 150.50, date: '2026-06-10', type: 'expense', categories: { name: 'Alimentação' } }
    ],
    categories: [],
    familyMembers: [],
    recurringRules: [],
    addTransaction: vi.fn(),
  }),
  FinancialProvider: ({ children }) => <>{children}</>
}))

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark' })
}))

// Mock de utilitários
vi.mock('../../lib/utils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    formatCurrencyInput: vi.fn(val => val),
    parseCurrencyToNumber: vi.fn(val => Number(val))
  }
})

describe('TransactionsTab - Renderização e Lógica de Interface', () => {
  it('deve renderizar a tabela com as transações do contexto', () => {
    render(<TransactionsTab />)
    // Verifica se a transação mockada está na tela
    expect(screen.getByText('Mercado')).toBeInTheDocument()
    // Verifica elementos chave da aba
    expect(screen.getByText('Histórico Completo de Transações')).toBeInTheDocument()
  })
})
