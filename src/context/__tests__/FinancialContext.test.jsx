import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinancialProvider, useFinancial } from '../FinancialContext'
import { supabase } from '../../lib/supabaseClient'

// Mocking useAuth hook directly to bypass Supabase auth complexities
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
  AuthProvider: ({ children }) => <>{children}</>
}))

// Setting up the Supabase chain mock
let mockData = []
let mockError = null

const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  then: vi.fn(function (resolve) {
    resolve({ data: mockData, error: mockError })
  })
}

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => queryBuilder)
  }
}))

// Um componente de teste para consumir o contexto
const TestComponent = () => {
  const { 
    transactions, 
    fetchTransactions, 
    addTransaction, 
    deleteTransaction,
    loading 
  } = useFinancial()

  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="transactions-count">{transactions.length}</div>
      <button 
        data-testid="fetch-btn" 
        onClick={() => fetchTransactions()}
      >
        Fetch
      </button>
      <button 
        data-testid="add-btn" 
        onClick={() => addTransaction({ amount: 150, description: 'Test', date: '2026-06-12' })}
      >
        Add
      </button>
      <button 
        data-testid="delete-btn" 
        onClick={() => deleteTransaction('test-id-1')}
      >
        Delete
      </button>
    </div>
  )
}

describe('FinancialContext - Lógica de Negócio (Mocks)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData = []
    mockError = null
  })

  it('deve buscar transações do banco de dados na inicialização', async () => {
    mockData = [{ id: '1', description: 'Test Fetch', amount: 100 }]
    
    render(
      <FinancialProvider>
        <TestComponent />
      </FinancialProvider>
    )

    // O useEffect do context faz vários fetches na inicialização
    // Esperamos que eventualmente as transações sejam atualizadas
    await act(async () => {
      // Simula uma pequena espera para as promises resolverem
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(supabase.from).toHaveBeenCalledWith('transactions')
    expect(queryBuilder.select).toHaveBeenCalled()
    // Pode haver 1 item inicializado
    expect(screen.getByTestId('transactions-count').textContent).toBe('1')
  })

  it('deve adicionar uma transação chamando o Supabase e atualizando o estado', async () => {
    mockData = [] // Inicial vazio
    
    render(
      <FinancialProvider>
        <TestComponent />
      </FinancialProvider>
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Prepara o mock para retornar a transação recém inserida
    mockData = [{ id: '2', description: 'Test', amount: 150, date: '2026-06-12' }]
    
    await act(async () => {
      screen.getByTestId('add-btn').click()
    })

    expect(supabase.from).toHaveBeenCalledWith('transactions')
    expect(queryBuilder.insert).toHaveBeenCalledWith([
      { amount: 150, description: 'Test', date: '2026-06-12', user_id: 'test-user-id' }
    ])
    
    // O estado local de transações deve ter 1 agora
    expect(screen.getByTestId('transactions-count').textContent).toBe('1')
  })

  it('deve deletar uma transação corretamente via Supabase', async () => {
    // Configura o mock com uma transação já existente
    mockData = [{ id: 'test-id-1', description: 'To delete', amount: 50 }]
    
    render(
      <FinancialProvider>
        <TestComponent />
      </FinancialProvider>
    )

    // Aguarda o fetch inicial
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(screen.getByTestId('transactions-count').textContent).toBe('1')

    // Mock response para o delete
    mockData = [] 
    
    await act(async () => {
      screen.getByTestId('delete-btn').click()
    })

    expect(supabase.from).toHaveBeenCalledWith('transactions')
    expect(queryBuilder.delete).toHaveBeenCalled()
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'test-id-1')

    // Após o delete local, o count deve voltar a 0
    expect(screen.getByTestId('transactions-count').textContent).toBe('0')
  })
})
