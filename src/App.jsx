import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinancialProvider } from './context/FinancialContext'
import { ThemeProvider } from './context/ThemeContext'
import { supabase } from './lib/supabaseClient'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">
        <p className="text-lg">Carregando painel...</p>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}

export default function App() {
  // Se as chaves do Supabase não estiverem prontas, exibe tela de ajuda amigável
  if (!supabase) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-50 text-center">
        <div className="max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-rose-400">Configuração Necessária</h2>
          <p className="text-sm text-zinc-400">
            O cliente do Supabase não pôde ser inicializado porque as chaves de conexão estão ausentes ou não foram preenchidas.
          </p>
          <div className="text-left bg-zinc-950 p-4 rounded border border-zinc-800 text-xs font-mono text-zinc-300 space-y-2">
            <p className="font-semibold text-emerald-400">Como resolver:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Abra o arquivo <code className="text-amber-400">.env.local</code> (que você já abriu no editor).</li>
              <li>Insira as credenciais do seu projeto Supabase nas variáveis de ambiente.</li>
              <li>**Importante**: Pare o servidor de desenvolvimento do Vite no seu terminal pressionando <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-400">Ctrl + C</kbd>.</li>
              <li>Execute <code className="text-amber-400">npm.cmd run dev</code> (ou <code className="text-amber-400">npm run dev</code>) novamente para forçar o Vite a carregar as novas variáveis.</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <FinancialProvider>
          <AppContent />
        </FinancialProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
