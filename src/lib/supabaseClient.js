import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
// Aceita tanto VITE_SUPABASE_ANON_KEY quanto VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  ''

// Verifica se as chaves existem e não são valores padrão do template
const hasCredentials = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://seu-projeto.supabase.co' &&
  supabaseUrl !== ''

export const supabase = hasCredentials ? createClient(supabaseUrl, supabaseAnonKey) : null
