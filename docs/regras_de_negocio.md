# Documentação de Funcionalidades e Regras de Negócio

Este documento centraliza as principais regras de negócio, fluxos de dados e arquitetura de funcionalidades do sistema de Gestão Financeira.

---

## 1. Regras de Negócio (Core Business Logic)

### 1.1 Automação de Lançamentos Recorrentes
A aplicação gerencia transações contínuas (como assinaturas e salários) através de um gerador inteligente.
- **Motor de Geração**: O método `checkAndGenerateRecurringTransactions` varre todas as `recurringRules` ativas e compara as datas desde o `start_date` até o mês atual (ou `end_date`).
- **Prevenção de Duplicidade**: Antes de lançar o item do mês no banco de dados, o algoritmo cruza a lista de `transactions` existentes verificando se já há um lançamento no mesmo mês/ano e associado àquele `recurring_rule_id`.
- **Propagação Otimista**: Alterar uma regra recorrente na aba de configurações atualiza instantaneamente as descrições/valores das transações passadas originárias daquela regra na memória (`FinancialContext`).

### 1.2 Importação de Faturas (PDF)
Para facilitar a inserção de gastos, o sistema faz o "parsing" (leitura) nativa de arquivos PDF no frontend.
- **Regex e Captura**: Extrai o conteúdo do PDF como texto puro e utiliza padrões Regex para identificar formatos monetários (R$) e datas brasileiras (DD/MM/AAAA ou DD/MM).
- **Inteligência Anti-Duplicidade**: Durante a tela de revisão de itens extraídos do PDF, o sistema desmarca por padrão as transações cujas descrições ou combinações de data/valor já existam cadastradas no banco, prevenindo lançamento duplo.

### 1.3 Orçamentos e Limites de Gastos
Os limites mensais atuam como uma camada de observância sobre o comportamento do usuário.
- **Acumulador de Gastos**: A aplicação filtra as transações do mês atual que sejam do tipo `expense` (despesa) e cruza as categorias com a tabela `budgets`.
- **Avisos de Alerta**: 
  - Atingindo **75%** do orçamento: A interface exibe o componente de orçamento na cor amarela/laranja (Atenção).
  - Atingindo ou ultrapassando **100%**: A interface destaca a quebra de limite em vermelho (Alerta Crítico).

### 1.4 Projeção de Evolução Patrimonial (Dashboard Analytics)
Em vez de focar apenas no passado, o gráfico de evolução prevê o crescimento do patrimônio líquido do usuário nos meses futuros.
- **Cálculo da Taxa Mensal**: O algoritmo avalia todas as receitas ativas mensais (via regras recorrentes) subtraídas por todas as despesas mensais ativas.
- **Projeção Futura**: Se o saldo recorrente líquido for positivo, a linha do gráfico continuará a crescer proporcionalmente nos eixos dos meses seguintes.
- **Performance**: Todos esses cálculos iterativos em arrays são encapsulados pelo hook `useMemo` para não onerar o processador (Client-Side Rendering) a cada letra digitada.

### 1.5 Integridade Referencial Cascata na UI
Para poupar requisições desnecessárias (Refetches) e oferecer uma sensação de fluidez:
- Se um *Membro da Família* for apagado, o contexto financeiro navega pela memória local de *Transações* e *Regras Recorrentes* definindo o `family_member_id` atrelado para nulo, refletindo a deleção em tempo real nas tabelas, além de efetivar a exclusão no Supabase.

---

## 2. Estrutura de Funcionalidades (Telas)

### Dashboard e Analytics (`AnalyticsTab.jsx`)
- Gráficos renderizados via `Recharts`.
- Agregações de receitas/despesas agrupadas por categorias e tipos.
- Visão mensal e trimestral de gastos.

### Lançamentos (`TransactionsTab.jsx`)
- Tabela completa com paginação e filtro por intervalos de data.
- Botões de ação rápida para inserir ganhos, despesas e importação de PDF em lote.
- Edição "in-place" através de modais injetados dinamicamente via estado.

### Controle de Ativos (`InvestmentsTab.jsx`)
- Carteira separada das contas correntes.
- Cadastro e rastreamento de aplicações categorizadas em: Ações, FIIs, Renda Fixa, Criptomoedas, Poupança.
- Contabilização no cálculo de "Patrimônio Total".

### Metas de Economia (`GoalsTab.jsx`)
- Sistema de *Saving Goals* (Ex: "Comprar Carro", "Viagem Europa").
- Cadastro com Target Amount (Valor Alvo) e Current Amount (Valor Atual).
- Barra de progresso visual baseada na porcentagem alcançada (%).

### Configurações Globais (`SettingsTab.jsx`)
- Gerenciamento de Membros Familiares.
- Gerenciamento de Categorias de Lançamento e Cores Hex/HSL customizadas.
- Central para gerir as Regras Recorrentes com visualização da carga de faturamento.

---

## 3. Infraestrutura & Qualidade de Código

### Testes Unitários
- **Ferramentas**: Vitest, React Testing Library, JSDOM.
- **Mocks**: Chamadas do cliente *Supabase* são completamente simuladas.
- Scripts de inicialização injetam as funções `matchMedia` e `ResizeObserver` globalmente para suportar bibliotecas complexas na árvore do DOM.

### Banco de Dados & Autenticação
- **Provedor**: Supabase.
- **Autenticação**: Sessões persistidas via Magic Link e Senha baseada no Auth Client do Supabase.
- **Segurança (RLS)**: Cada tabela no banco de dados possui uma restrição que checa se o `auth.uid()` da requisição corresponde à coluna `user_id`, garantindo que um usuário jamais conseguirá ler informações financeiras de outro via API de rede.
