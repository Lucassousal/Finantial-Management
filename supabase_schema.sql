-- ==========================================
-- SCRIPT DE BANCO DE DADOS - GESTÃO FINANCEIRA
-- Execute este script no SQL Editor do seu Supabase
-- ==========================================

-- 1. Tabela de Categorias Customizáveis
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense', 'investment')) not null,
  color text default '#10b981' not null,
  icon text default 'tag' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Membros da Família
create table if not exists public.family_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Regras de Lançamentos Recorrentes
create table if not exists public.recurring_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  amount numeric(12,2) not null,
  type text check (type in ('income', 'expense')) not null,
  category_id uuid references public.categories(id) on delete set null,
  frequency text check (frequency in ('monthly', 'weekly', 'yearly')) default 'monthly' not null,
  start_date date not null,
  end_date date,
  family_member_id uuid references public.family_members(id) on delete set null,
  statement_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Transações Atualizada
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  amount numeric(12,2) not null,
  type text check (type in ('income', 'expense', 'investment')) not null,
  category_id uuid references public.categories(id) on delete set null,
  date date not null,
  family_member_id uuid references public.family_members(id) on delete set null,
  is_recurring boolean default false not null,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  is_future boolean default false not null,
  statement_name text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garante a idempotência das transações recorrentes geradas automaticamente
alter table public.transactions add constraint unique_recurring_transaction unique (recurring_rule_id, date);

-- 4. Tabela de Controle de Investimentos (Saldos Atuais)
create table if not exists public.investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('fixed_income', 'stocks', 'fii', 'crypto', 'savings', 'other')) not null,
  institution text,
  current_balance numeric(12,2) default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Histórico de Evolução de Investimentos (para gráficos de tendência)
create table if not exists public.investment_history (
  id uuid default gen_random_uuid() primary key,
  investment_id uuid references public.investments(id) on delete cascade not null,
  balance numeric(12,2) not null,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabela de Metas de Poupança (Saving Goals)
create table if not exists public.saving_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0.00 not null,
  target_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabela de Limites de Orçamento (Budgets)
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  amount_limit numeric(12,2) not null,
  month text not null, -- formato 'YYYY-MM'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- HABILITAR SEGURANÇA DE LINHA (RLS)
-- ==========================================
alter table public.categories enable row level security;
alter table public.family_members enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;
alter table public.investment_history enable row level security;
alter table public.saving_goals enable row level security;
alter table public.budgets enable row level security;

-- ==========================================
-- POLÍTICAS RLS - CATEGORIAS
-- ==========================================
create policy "Users can modify their own categories"
  on public.categories for all using (auth.uid() = user_id);

-- ==========================================
-- POLÍTICAS RLS - MEMBROS FAMILIARES
-- ==========================================
create policy "Users can modify their own family members"
  on public.family_members for all using (auth.uid() = user_id);

-- ==========================================
-- POLÍTICAS RLS - RECORRÊNCIA
-- ==========================================
create policy "Users can modify their own recurring rules"
  on public.recurring_rules for all using (auth.uid() = user_id);

-- ==========================================
-- POLÍTICAS RLS - TRANSAÇÕES
-- ==========================================
create policy "Users can modify their own transactions"
  on public.transactions for all using (auth.uid() = user_id);

-- ==========================================
-- POLÍTICAS RLS - INVESTIMENTOS
-- ==========================================
create policy "Users can modify their own investments"
  on public.investments for all using (auth.uid() = user_id);

-- ==========================================
-- POLÍTICAS RLS - HISTÓRICO DE INVESTIMENTOS
-- ==========================================
create policy "Users can modify their own investment history"
  on public.investment_history for all 
  using (exists (
    select 1 from public.investments 
    where public.investments.id = public.investment_history.investment_id 
    and public.investments.user_id = auth.uid()
  ));

-- ==========================================
-- POLÍTICAS RLS - METAS DE POUPANÇA
-- ==========================================
create policy "Users can modify their own saving goals"
  on public.saving_goals for all using (auth.uid() = user_id);

-- ==========================================
-- POLÍTICAS RLS - ORÇAMENTOS
-- ==========================================
create policy "Users can modify their own budgets"
  on public.budgets for all using (auth.uid() = user_id);
