# Print3D Manager

Dashboard completo para gerenciar estoque, produção e vendas do seu negócio de impressão 3D.

## Stack

- **Next.js 14** (App Router) — React Server Components + Client Components
- **Tailwind CSS + Shadcn/ui** — design system dark-themed
- **Prisma ORM + SQLite** — banco local (pronto para migrar para PostgreSQL)
- **Recharts** — gráficos de linha e barra
- **Lucide React** — ícones

---

## Instalação e execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o banco de dados

O arquivo `.env` já está configurado com SQLite local:

```env
DATABASE_URL="file:./dev.db"
```

### 3. Criar o banco e popular com dados de exemplo

```bash
npm run setup
# equivale a: prisma db push && node prisma/seed.js
```

### 4. Rodar em modo desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/
│   │   ├── products/          # GET, POST, PUT, DELETE /api/products
│   │   │   └── [id]/
│   │   ├── production/        # GET, POST /api/production
│   │   ├── sales/             # GET, POST /api/sales
│   │   └── analytics/         # GET /api/analytics?type=kpi|sales-chart|top-products
│   ├── dashboard/             # Página principal com KPIs e gráficos
│   ├── inventory/             # Tabela de estoque + cadastro de modelos
│   ├── production/            # Log de produção + incremento de estoque
│   └── sales-ledger/          # Registro e histórico de vendas
├── components/
│   ├── charts/                # SalesLineChart, TopProductsChart
│   ├── forms/                 # NewProductDialog, AddProductionDialog, NewSaleDialog
│   ├── layout/                # Sidebar responsiva
│   └── ui/                    # Button, Card, Badge, Dialog, Input, Select, Toaster...
├── lib/
│   ├── prisma.ts              # Singleton do Prisma Client
│   └── utils.ts               # cn(), formatCurrency(), formatDate()
└── types/
    └── index.ts               # Tipos TypeScript compartilhados
```

---

## Modelo de dados (Prisma)

```prisma
model Product {
  id               Int             @id @default(autoincrement())
  name             String
  imageUrl         String?
  productionCost   Float           @default(0)   // custo filamento + eletricidade
  recommendedPrice Float           @default(0)
  stockLevel       Int             @default(0)
  productionLogs   ProductionLog[]
  sales            Sale[]
}

model ProductionLog {
  id        Int      @id @default(autoincrement())
  productId Int
  quantity  Int
  notes     String?
  date      DateTime @default(now())
  product   Product  @relation(...)
}

model Sale {
  id           Int      @id @default(autoincrement())
  productId    Int
  customerName String
  quantity     Int
  salePrice    Float
  date         DateTime @default(now())
  product      Product  @relation(...)
}
```

---

## API Routes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products` | Lista todos os produtos |
| POST | `/api/products` | Cria produto |
| PUT | `/api/products/[id]` | Atualiza produto |
| DELETE | `/api/products/[id]` | Remove produto |
| GET | `/api/production` | Lista logs de produção |
| POST | `/api/production` | Registra produção (incrementa estoque) |
| GET | `/api/sales` | Lista vendas (com filtros `productId`, `from`, `to`) |
| POST | `/api/sales` | Registra venda (decrementa estoque, valida disponibilidade) |
| GET | `/api/analytics?type=kpi` | KPIs consolidados |
| GET | `/api/analytics?type=sales-chart&days=30` | Dados do gráfico de linha |
| GET | `/api/analytics?type=top-products` | Top 5 produtos mais vendidos |

### Regras de negócio na API
- **Venda bloqueada** se `quantity > product.stockLevel` → retorna HTTP 422
- **Produção e estoque** são atualizados em uma única `$transaction` (atomicidade)
- **Delete de produto** com vendas retorna HTTP 409 (integridade referencial)

---

## Migrar para PostgreSQL

1. Altere o `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/print3d"
   ```
2. Altere o `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Rode:
   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

---

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run setup` | Cria banco + seed de dados |
| `npm run db:studio` | Abre o Prisma Studio (GUI do banco) |
| `npm run db:push` | Sincroniza schema sem migrations |
| `npm run db:seed` | Popula banco com dados de exemplo |
