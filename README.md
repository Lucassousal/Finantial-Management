# 💰 Gestão Financeira

Uma plataforma premium para controle de finanças pessoais e orçamento familiar. O sistema foi desenvolvido com foco em privacidade, visualização de dados interativa e controle completo de fluxos de caixa, orçamentos, investimentos e metas.

---

## ✨ Funcionalidades Principais

* **📊 Dashboard Interativo**: Visão geral de receitas, despesas, investimentos e saldo mensal com gráficos interativos de distribuição e evolução patrimonial. Inclui cálculo de **Previsão de Evolução Patrimonial** para os meses futuros com explicação detalhada em modal explicativo.
* **💸 Movimentações & Recorrências**: Lançamento de movimentações únicas (imediatas ou agendadas para o futuro) e regras de repetição mensal automática (ex: assinaturas, salários, parcelas).
* **🎯 Metas de Economia (Saving Goals)**: Criação de objetivos financeiros, registro de depósitos e acompanhamento do progresso percentual com barra de progresso visual.
* **🛡️ Limite de Gastos (Orçamentos)**: Definição de tetos de gastos mensais por categoria com avisos visuais automáticos de atenção (75% atingido) e limite excedido (100% atingido).
* **📈 Controle de Investimentos**: Carteira de ativos categorizada por tipo (Renda Fixa, Ações, FIIs, Criptomoedas, Poupança e Outros) com histórico de evolução e saldo acumulado por instituição financeira.
* **👥 Gestão Familiar**: Cadastro prévio de membros da família para associação e rastreamento de quem realizou a despesa ou é responsável pela receita/recorrência.
* **🌙 Tema Escuro & Claro**: Design moderno e elegante utilizando HSL cores e micro-animações, totalmente integrado em ambos os modos.
* **🔒 Segurança & Privacidade**: Autenticação robusta de usuários gerenciada diretamente por políticas de segurança a nível de linha de tabela (Row Level Security - RLS) do Supabase.

---

## 🛠️ Stack Tecnológica

* **Frontend**: React 19, Vite, TailwindCSS (v4), Radix UI (para componentes de diálogo, select, etc.).
* **Ícones**: Lucide React.
* **Gráficos**: Recharts.
* **Backend & Banco de Dados**: Supabase (PostgreSQL, Auth e Row Level Security).

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2. Configurar o Banco de Dados (Supabase)
1. Crie um projeto gratuito no [Supabase](https://supabase.com/).
2. Vá até o menu **SQL Editor** do seu painel Supabase.
3. Copie o conteúdo do arquivo [supabase_schema.sql](file:///c:/Users/Lucas/Desktop/Projetos/Gest%C3%A3o-Financeira/supabase_schema.sql) deste repositório e execute-o para gerar a estrutura de tabelas, restrições e políticas de RLS.

### 3. Configurar as Variáveis de Ambiente
1. Duplique o arquivo `.env.example` da raiz e renomeie-o para `.env.local`.
2. Insira as credenciais do seu projeto Supabase (URL e chave pública anônima):
   ```env
   VITE_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anonima-publica
   ```

### 4. Instalar as Dependências e Rodar
No seu terminal, execute os comandos abaixo na pasta do projeto:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev
```

Abra o navegador em `http://localhost:5173/` para acessar a aplicação.

---

## 📦 Como Gerar o Build de Produção

Para compilar e otimizar a aplicação para distribuição em produção, execute:

```bash
npm run build
```

Os arquivos estáticos otimizados serão gerados na pasta `dist/` e estarão prontos para hospedagem (Vercel, Netlify, etc.).
