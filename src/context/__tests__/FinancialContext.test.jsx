import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinancialProvider, useFinancial } from '../FinancialContext'
import { supabase } from '../../lib/supabaseClient'

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
  AuthProvider: ({ children }) => <>{children}</>
}))

let mockData = []
let mockError = null

const createChain = () => {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    then: (resolve) => resolve({ data: mockData, error: mockError })
  }
  return chain
}

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => createChain())
  }
}))

const TestComponent = () => {
  const { transactions, fetchTransactions, addTransaction, deleteTransaction, loading } = useFinancial()

  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="transactions-count">{transactions.length}</div>
      <button data-testid="fetch-btn" onClick={() => fetchTransactions()}>Fetch</button>
      <button data-testid="add-btn" onClick={() => addTransaction({ amount: 150, description: 'Test', date: '2026-06-12' })}>Add</button>
      <button data-testid="delete-btn" onClick={() => deleteTransaction('test-id-1')}>Delete</button>
    </div>
  )
}

describe('FinancialContext - Lógica de Negócio (Mocks)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData = [{ id: '99', name: 'Dummy' }] // Para não disparar o seed das categorias
    mockError = null
  })

  it('deve buscar transações', async () => {
    render(<FinancialProvider><TestComponent /></FinancialProvider>)
    await act(async () => { await new Promise(r => setTimeout(r, 10)) })
    expect(screen.getByTestId('transactions-count').textContent).toBe('1')
  })
})
