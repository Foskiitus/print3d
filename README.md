# Print3D Manager

Dashboard completo para gerenciar estoque, produção e vendas do seu negócio de impressão 3D. Plataforma SaaS multi-tenant com suporte a múltiplos idiomas (Português e Inglês), integração com impressoras 3D, rastreamento de bobinas por QR code, cobrança via Stripe e muito mais.

---

## Stack

### Frontend

- **Next.js 16** (App Router) — React Server Components + Client Components
- **React 19**
- **Tailwind CSS 3 + shadcn/ui** — design system com tema escuro
- **Recharts** — gráficos de linha e barra
- **Lucide React** — ícones
- **Intlayer** — internacionalização (PT/EN)
- **next-themes** — alternância de tema claro/escuro
- **react-colorful** — seletor de cores
- **react-day-picker** — calendário e date picker
- **date-fns** — manipulação de datas

### Backend

- **Prisma ORM 7** — acesso ao banco de dados
- **PostgreSQL** — banco de dados relacional (via `@prisma/adapter-pg`)
- **Supabase** — autenticação e gerenciamento de usuários (`@supabase/supabase-js`, `@supabase/ssr`)
- **Auth.js** — integração de autenticação com Prisma Adapter
- **Stripe** — pagamentos e assinaturas (`stripe`, `@stripe/stripe-js`)
- **Resend + React Email** — envio de e-mails transacionais
- **Cloudflare R2 / AWS S3** — armazenamento de arquivos (`@aws-sdk/client-s3`)
- **jszip + xml2js** — extração e parsing de arquivos `.3mf`
- **qrcode** — geração de QR codes para bobinas

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de dados (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/print3d"

# Autenticação (Auth.js)
AUTH_SECRET="gere-com-openssl-rand-base64-32"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anonima"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Armazenamento de arquivos (Cloudflare R2 / AWS S3)
R2_ACCOUNT_ID="seu-account-id"
R2_ACCESS_KEY_ID="sua-access-key"
R2_SECRET_ACCESS_KEY="sua-secret-key"
R2_BUCKET_NAME="nome-do-bucket"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# E-mail (Resend)
RESEND_API_KEY="re_..."
```

---

## Instalação e execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o banco de dados

Configure o `DATABASE_URL` no `.env` apontando para uma instância PostgreSQL.

### 3. Criar o banco e popular com dados de exemplo

```bash
npm run setup
# equivale a: prisma generate && prisma db push && tsx prisma/seed.ts
```

### 4. Rodar em modo desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Scripts disponíveis

| Script                | Descrição                                      |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento (Webpack)          |
| `npm run build`       | Build de produção (gera i18n + Next.js build)  |
| `npm run start`       | Inicia o servidor de produção                  |
| `npm run lint`        | Executa o ESLint                               |
| `npm run setup`       | Gera Prisma Client + cria banco + seed         |
| `npm run db:generate` | Gera o Prisma Client                           |
| `npm run db:push`     | Sincroniza o schema com o banco sem migrations |
| `npm run db:seed`     | Popula o banco com dados de exemplo            |
| `npm run db:studio`   | Abre o Prisma Studio (GUI do banco)            |

---

## Estrutura do projeto

```
print3d/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados (30+ modelos)
│   └── seed.ts                # Script de seed com dados de exemplo
├── src/
│   ├── app/
│   │   ├── [locale]/          # Roteamento com i18n (PT/EN)
│   │   │   ├── (app)/         # Área autenticada (dashboard e funcionalidades)
│   │   │   │   ├── admin/
│   │   │   │   ├── alerts/
│   │   │   │   ├── billing/
│   │   │   │   ├── catalog/
│   │   │   │   ├── components/
│   │   │   │   ├── customers/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── export/
│   │   │   │   ├── inventory/
│   │   │   │   ├── printer-presets/
│   │   │   │   ├── printers/
│   │   │   │   ├── production/
│   │   │   │   ├── sales/
│   │   │   │   ├── settings/
│   │   │   │   ├── spool/
│   │   │   │   └── users/
│   │   │   ├── auth-error/    # Página de erro de autenticação
│   │   │   ├── contact/       # Formulário de contato
│   │   │   ├── privacy/       # Política de privacidade
│   │   │   ├── sign-in/       # Login
│   │   │   ├── sign-up/       # Cadastro
│   │   │   ├── terms/         # Termos de uso
│   │   │   └── page.tsx       # Landing page
│   │   ├── api/               # 56 rotas de API REST
│   │   ├── actions/           # Server Actions (auth, filamentos)
│   │   └── auth/              # Callbacks de autenticação
│   ├── components/
│   │   ├── charts/            # SalesLineChart, TopProductsChart (Recharts)
│   │   ├── emails/            # Templates de e-mail (React Email)
│   │   ├── forms/             # 30+ dialogs e formulários modais
│   │   ├── layout/            # Sidebar, Header, Footer, LocaleSwitcher
│   │   ├── products/          # PrinterCard, ProductionSummaryCard
│   │   └── ui/                # Componentes base shadcn/ui
│   ├── hooks/
│   │   ├── useSignedUrl.ts    # URLs assinadas do S3/R2
│   │   └── useUploadLimit.ts  # Limite de upload por plano
│   ├── lib/
│   │   ├── auth.ts            # Helpers de autenticação Supabase
│   │   ├── cachedQueries.ts   # Cache de queries com Next.js
│   │   ├── getUserId.ts       # Extração do ID do usuário autenticado
│   │   ├── prisma.ts          # Singleton do Prisma Client
│   │   ├── r2.ts              # Configuração do Cloudflare R2
│   │   ├── refreshAlerts.ts   # Atualização de alertas de estoque
│   │   ├── stripe.ts          # Instância do cliente Stripe
│   │   ├── supabase/
│   │   │   ├── client.ts      # Supabase client-side
│   │   │   └── server.ts      # Supabase server-side
│   │   ├── utils.ts           # cn(), formatCurrency(), formatDate()
│   │   └── preflight/
│   │       ├── extractor.ts   # Extrai requisitos de filamento de arquivos .3mf
│   │       └── matcher.ts     # Relaciona requisitos com bobinas disponíveis
│   └── types/
│       └── index.ts           # Tipos TypeScript compartilhados
├── supabase/                  # Migrations do Supabase
├── intlayer.config.ts         # Configuração de i18n (PT/EN)
├── next.config.js             # Configuração do Next.js
├── prisma.config.ts           # Configuração do Prisma
├── tailwind.config.ts         # Configuração do Tailwind CSS
└── .env.example               # Template de variáveis de ambiente
```

---

## Páginas da aplicação

### Páginas públicas

| Página      | Rota       | Descrição                                           |
| ----------- | ---------- | --------------------------------------------------- |
| Landing     | `/`        | Página de apresentação com funcionalidades e planos |
| Login       | `/sign-in` | Autenticação de usuários                            |
| Cadastro    | `/sign-up` | Registro de novos usuários                          |
| Contato     | `/contact` | Formulário de contato                               |
| Privacidade | `/privacy` | Política de privacidade                             |
| Termos      | `/terms`   | Termos de uso                                       |

### Área autenticada (app)

| Página                     | Rota                  | Descrição                                                                                  |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| **Dashboard**              | `/dashboard`          | Visão geral com KPIs (receita, produção, estoque) e gráficos                               |
| **Inventário**             | `/inventory`          | Gerenciamento de bobinas de filamento com 3 abas: Filamentos, Produtos Acabados, Hardware  |
| **Catálogo**               | `/catalog`            | Catálogo de produtos finais — criar, editar e excluir produtos com precificação            |
| **Componentes**            | `/catalog/components` | Biblioteca de componentes reutilizáveis (peças semi-acabadas usadas nos produtos)          |
| **Produção**               | `/production`         | Workflow de produção com 3 abas: Pedidos, Planejador e Histórico                           |
| **Minha Oficina**          | `/printers`           | Gerenciamento e monitoramento de impressoras 3D                                            |
| **Detalhes da Impressora** | `/printers/[id]`      | Dashboard individual da impressora com estatísticas de uso                                 |
| **Presets de Impressora**  | `/printer-presets`    | Gerenciamento de templates de configuração de impressoras                                  |
| **Pedidos / Vendas**       | `/sales`              | Lançamento e acompanhamento de pedidos de venda                                            |
| **Clientes**               | `/customers`          | Cadastro e gestão de clientes                                                              |
| **Detalhes do Cliente**    | `/customers/[id]`     | Perfil individual do cliente com histórico de pedidos                                      |
| **Configurações**          | `/settings`           | 7 seções: Aparência, Empresa, Financeiro, Licenciamento, Locais, Plataformas e Privacidade |
| **Painel Admin**           | `/admin`              | 3 abas: Presets de Hardware, Presets de Material e Gerenciamento de Usuários               |
| **Alertas**                | `/alerts`             | Alertas de estoque e avisos de reposição                                                   |
| **Faturamento**            | `/billing`            | Gerenciamento de assinatura e pagamentos via Stripe                                        |
| **Exportar**               | `/export`             | Exportação de dados                                                                        |
| **Spool QR**               | `/spool/[qrCodeId]`   | Visualização pública/proprietário de bobina individual por QR code                         |
| **Usuários**               | `/users`              | Gerenciamento de usuários (somente admin)                                                  |

---

## API Routes

### Produtos

| Método           | Rota                             | Descrição                                          |
| ---------------- | -------------------------------- | -------------------------------------------------- |
| GET, POST        | `/api/products`                  | Listar / Criar produtos                            |
| GET, PUT, DELETE | `/api/products/[id]`             | Obter / Atualizar / Excluir produto                |
| GET, POST        | `/api/products/[id]/bom`         | Gerenciar Bill of Materials (lista de componentes) |
| PUT, DELETE      | `/api/products/[id]/bom/[bomId]` | Atualizar / Excluir item do BOM                    |
| GET, POST        | `/api/products/[id]/extras`      | Extras do produto (hardware/acessórios)            |
| GET, POST        | `/api/products/[id]/filaments`   | Requisitos de filamento do produto                 |
| GET              | `/api/products/[id]/sales`       | Histórico de vendas do produto                     |

### Inventário e Filamentos

| Método           | Rota                          | Descrição                             |
| ---------------- | ----------------------------- | ------------------------------------- |
| GET, POST        | `/api/inventory`              | Listar / Criar itens de inventário    |
| GET, PUT         | `/api/inventory/[id]`         | Obter / Atualizar item de inventário  |
| GET              | `/api/inventory/[id]/history` | Histórico de compras do item          |
| GET              | `/api/inventory/available`    | Itens disponíveis (não arquivados)    |
| GET, POST        | `/api/global-filaments`       | Catálogo global de filamentos         |
| GET, PUT, DELETE | `/api/global-filaments/[id]`  | Gerenciar filamento global            |
| GET              | `/api/filaments/catalog`      | Catálogo de filamentos por fornecedor |

### Produção

| Método    | Rota                                  | Descrição                                 |
| --------- | ------------------------------------- | ----------------------------------------- |
| GET, POST | `/api/production/orders`              | Listar / Criar ordens de produção         |
| GET, PUT  | `/api/production/orders/[id]`         | Obter / Atualizar ordem de produção       |
| POST      | `/api/production-orders/[id]/explode` | Gerar jobs de impressão a partir da ordem |
| GET, POST | `/api/production/jobs`                | Listar / Criar jobs de impressão          |
| POST      | `/api/print-jobs/[id]/complete`       | Concluir um job de impressão              |

### Componentes e Perfis

| Método           | Rota                            | Descrição                                           |
| ---------------- | ------------------------------- | --------------------------------------------------- |
| GET, POST        | `/api/components`               | Listar / Criar componentes reutilizáveis            |
| GET, PUT, DELETE | `/api/components/[id]`          | Obter / Atualizar / Excluir componente              |
| GET, POST        | `/api/components/[id]/profiles` | Perfis de impressão do componente (arquivos `.3mf`) |
| GET, PUT         | `/api/components/[id]/stock`    | Estoque do componente (unidades prontas)            |
| POST             | `/api/components/extract`       | Extrair requisitos de filamento de arquivo `.3mf`   |

### Impressoras e Hardware

| Método           | Rota                           | Descrição                                       |
| ---------------- | ------------------------------ | ----------------------------------------------- |
| GET, POST        | `/api/printers`                | Listar / Criar impressoras                      |
| GET, PUT, DELETE | `/api/printers/[id]`           | Obter / Atualizar / Excluir impressora          |
| GET, POST        | `/api/printers/[id]/units`     | Unidades da impressora (extrusoras/ferramentas) |
| GET, POST        | `/api/printer-presets`         | Templates de configuração de impressora         |
| GET, PUT, DELETE | `/api/printer-presets/[id]`    | Gerenciar preset de impressora                  |
| GET, POST        | `/api/admin/unit-presets`      | Presets globais de unidade (admin)              |
| GET, PUT, DELETE | `/api/admin/unit-presets/[id]` | Gerenciar preset de unidade (admin)             |

### Vendas e Clientes

| Método           | Rota                             | Descrição                                  |
| ---------------- | -------------------------------- | ------------------------------------------ |
| GET, POST        | `/api/sales`                     | Listar / Criar vendas                      |
| GET, PUT, DELETE | `/api/sales/[id]`                | Obter / Atualizar / Excluir venda          |
| GET              | `/api/sales/products-with-stock` | Produtos com estoque disponível para venda |
| GET, POST        | `/api/customers`                 | Listar / Criar clientes                    |
| GET, PUT, DELETE | `/api/customers/[id]`            | Obter / Atualizar / Excluir cliente        |

### Categorias e Extras

| Método           | Rota                   | Descrição                                   |
| ---------------- | ---------------------- | ------------------------------------------- |
| GET, POST        | `/api/categories`      | Listar / Criar categorias de produto        |
| GET, PUT, DELETE | `/api/categories/[id]` | Gerenciar categoria                         |
| GET, POST        | `/api/extras`          | Listar / Criar extras (hardware/acessórios) |
| GET, PUT, DELETE | `/api/extras/[id]`     | Gerenciar extra                             |

### Analytics e Alertas

| Método | Rota             | Descrição                                           |
| ------ | ---------------- | --------------------------------------------------- |
| GET    | `/api/analytics` | KPIs consolidados, gráfico de vendas e top produtos |
| GET    | `/api/alerts`    | Alertas de estoque baixo                            |

### Configurações e Administração

| Método           | Rota                   | Descrição                                   |
| ---------------- | ---------------------- | ------------------------------------------- |
| GET, PUT         | `/api/settings`        | Obter / Salvar configurações do usuário     |
| POST             | `/api/settings/export` | Exportar dados do usuário                   |
| GET, POST        | `/api/users`           | Listar / Criar usuários (admin)             |
| GET, PUT, DELETE | `/api/users/[id]`      | Obter / Atualizar / Excluir usuário (admin) |
| GET              | `/api/auth/role`       | Retorna a role do usuário autenticado       |

### Faturamento e Assinaturas (Stripe)

| Método | Rota                        | Descrição                                   |
| ------ | --------------------------- | ------------------------------------------- |
| GET    | `/api/billing`              | Informações da assinatura atual             |
| POST   | `/api/billing/subscribe`    | Criar nova assinatura                       |
| POST   | `/api/billing/setup-intent` | Configurar método de pagamento              |
| POST   | `/api/billing/cancel`       | Cancelar assinatura                         |
| POST   | `/api/webhooks/stripe`      | Webhook do Stripe para eventos de pagamento |

### Utilitários

| Método    | Rota              | Descrição                                |
| --------- | ----------------- | ---------------------------------------- |
| POST      | `/api/contact`    | Enviar mensagem do formulário de contato |
| POST      | `/api/upload`     | Upload de arquivo para S3/R2             |
| POST      | `/api/signed-url` | Obter URL assinada para upload direto    |
| GET, POST | `/api/suppliers`  | Listar / Criar fornecedores              |

---

## Modelo de dados (principais entidades)

### Usuários e Autenticação

- **User** — usuário com role, dados Stripe e assinatura
- **Subscription** — rastreamento de assinatura Stripe

### Produtos e Componentes

- **Product** — produto final para venda, com categoria, margem e imagem
- **Component** — peça reutilizável semi-acabada com flags de risco
- **ProductBOM** — lista de materiais (Product ↔ Component)
- **ComponentPrintProfile** — perfis de impressão (`.3mf`) por componente com tamanho de lote
- **ProfileFilamentReq** — requisitos de filamento por perfil (extraídos do `.3mf`)
- **ComponentStock** — estoque de componentes impressos
- **Category** — categoria de produto
- **Extra** — hardware, ferramentas e acessórios

### Inventário e Materiais

- **InventoryItem** — definição de tipo de filamento (marca, material, cor)
- **InventoryPurchase** — bobina individual com QR code e rastreamento de peso
- **GlobalFilament** — catálogo global de filamentos para sugestões

### Produção

- **ProductionOrder** — agrupador de produtos a produzir
- **OrderItem** — quantidade de produto dentro de uma ordem
- **PrintJob** — tarefa individual de impressão (gerada pela explosão da ordem)
- **PrintJobItem** — componente dentro de um job de impressão
- **PrintJobMaterial** — atribuição de material/bobina por job

### Impressoras e Hardware

- **Printer** — impressora 3D física com QR code e integração de API
- **PrinterUnit** — extrusora/ferramenta da impressora
- **PrinterSlot** — slot de material na unidade
- **PrinterPreset** — template de impressora (global ou por usuário)
- **UnitPreset** — template de unidade (trocadores multi-material, hotends, etc.)
- **MaintenanceTask / MaintenanceLog** — agendamento e histórico de manutenção

### Vendas e CRM

- **Sale** — transação de venda
- **Customer** — perfil de cliente

### Sistema

- **Settings** — preferências do usuário (chave-valor)

---

## Funcionalidades principais

- ✅ **SaaS multi-tenant** com autenticação Supabase + cobrança Stripe
- ✅ **Workflow de produção** completo: Ordens → Jobs de Impressão → Montagem de Componentes
- ✅ **Rastreamento de bobinas** por QR code com monitoramento de peso
- ✅ **Integração com impressoras**: OctoPrint, Moonraker e Bambu
- ✅ **Extração de perfis `.3mf`**: análise de arquivos de impressão para requisitos de filamento
- ✅ **Suporte multi-idioma**: Português e Inglês (Intlayer i18n)
- ✅ **Tema escuro/claro** integrado com Tailwind
- ✅ **Analytics em tempo real**: KPIs, gráficos de vendas, top produtos
- ✅ **Upload de arquivos**: integração com S3/Cloudflare R2
- ✅ **Notificações por e-mail**: integração com Resend
- ✅ **Painel administrativo**: gerenciamento de usuários, presets e sistema
- ✅ **API REST** completa com mais de 50 endpoints e lógica de negócio
