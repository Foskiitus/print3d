import { t, type DeclarationContent } from "intlayer";

const stockContent = {
  key: "stock",
  content: {
    // ── Page (page.tsx) ──────────────────────────────────────────
    page: {
      title: t({ en: "Stock", pt: "Stock" }),
      heading: t({ en: "Stock", pt: "Stock" }),
      description: t({
        en: "Units available per product — calculated from production and sales.",
        pt: "Unidades disponíveis por produto — calculado a partir da produção e vendas.",
      }),
    },

    // ── Summary cards ────────────────────────────────────────────
    summary: {
      totalProducts: t({ en: "Total products", pt: "Produtos totais" }),
      inStock: t({ en: "In stock", pt: "Em stock" }),
      lowStock: t({ en: "Low stock", pt: "Stock baixo" }),
      outOfStock: t({ en: "Out of stock", pt: "Sem stock" }),
    },

    // ── Filters ──────────────────────────────────────────────────
    filters: {
      search: t({ en: "Search product...", pt: "Pesquisar produto..." }),
      all: t({ en: "All", pt: "Todos" }),
      ok: t({ en: "In stock", pt: "Em stock" }),
      low: t({ en: "Low", pt: "Baixo" }),
      out: t({ en: "Out of stock", pt: "Sem stock" }),
    },

    // ── Status labels ────────────────────────────────────────────
    status: {
      out: t({ en: "Out of stock", pt: "Sem stock" }),
      low: t({ en: "Low stock", pt: "Stock baixo" }),
      ok: t({ en: "In stock", pt: "Em stock" }),
    },

    // ── Table ────────────────────────────────────────────────────
    table: {
      product: t({ en: "Product", pt: "Produto" }),
      category: t({ en: "Category", pt: "Categoria" }),
      printer: t({ en: "Printer", pt: "Impressora" }),
      produced: t({ en: "Produced", pt: "Produzido" }),
      sold: t({ en: "Sold", pt: "Vendido" }),
      stock: t({ en: "Stock", pt: "Stock" }),
      status: t({ en: "Status", pt: "Estado" }),
      units: t({ en: "un.", pt: "un." }),
      empty: t({ en: "No products found.", pt: "Nenhum produto encontrado." }),
    },
  },
} satisfies DeclarationContent;

export default stockContent;
