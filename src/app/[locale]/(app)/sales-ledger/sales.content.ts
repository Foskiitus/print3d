import { t, type DeclarationContent } from "intlayer";

const salesContent = {
  key: "sales",
  content: {
    // ── Page (page.tsx) ──────────────────────────────────────────
    page: {
      title: t({ en: "Sales", pt: "Vendas" }),
      heading: t({ en: "Sales", pt: "Vendas" }),
      description: t({
        en: "Log sales and view your transaction history.",
        pt: "Registe vendas e consulte o histórico de transações.",
      }),
    },

    // ── Summary cards ────────────────────────────────────────────
    summary: {
      transactions: t({ en: "Transactions", pt: "Transações" }),
      totalRevenue: t({ en: "Total revenue", pt: "Receita total" }),
      estimatedProfit: t({ en: "Estimated profit", pt: "Lucro estimado" }),
    },

    // ── Search ───────────────────────────────────────────────────
    search: {
      placeholder: t({
        en: "Search by customer or product...",
        pt: "Buscar por cliente ou produto...",
      }),
    },

    // ── Table columns ────────────────────────────────────────────
    table: {
      date: t({ en: "Date", pt: "Data" }),
      product: t({ en: "Product", pt: "Produto" }),
      customer: t({ en: "Customer", pt: "Cliente" }),
      qty: t({ en: "Qty", pt: "Qtd" }),
      pricePerUnit: t({ en: "Price/unit", pt: "Preço/un" }),
      total: t({ en: "Total", pt: "Total" }),
      profit: t({ en: "Profit", pt: "Lucro" }),
      notes: t({ en: "Notes", pt: "Notas" }),
      noData: t({ en: "No data", pt: "sem dados" }),
      emptySearch: t({
        en: "No sales found.",
        pt: "Nenhuma venda encontrada.",
      }),
      emptyAll: t({
        en: "No sales recorded yet.",
        pt: "Nenhuma venda registada ainda.",
      }),
    },

    // ── Edit inline (desktop) ─────────────────────────────────────
    edit: {
      noCustomer: t({ en: "— No customer —", pt: "— Sem cliente —" }),
      selectPlaceholder: t({ en: "Select...", pt: "Selecionar..." }),
      notesPlaceholder: t({ en: "Notes...", pt: "Notas..." }),
    },

    // ── Mobile edit dialog ───────────────────────────────────────
    mobileDialog: {
      title: t({ en: "Edit Sale", pt: "Editar Venda" }),
      stockAvailable: t({ en: "Available stock", pt: "Stock disponível" }),
      units: t({ en: "un.", pt: "un." }),
      quantity: t({ en: "Quantity", pt: "Quantidade" }),
      pricePerUnit: t({ en: "Price/unit (€)", pt: "Preço/un (€)" }),
      customerLabel: t({ en: "Customer", pt: "Cliente" }),
      optional: t({ en: "(optional)", pt: "(opcional)" }),
      noCustomer: t({ en: "— No customer —", pt: "— Sem cliente —" }),
      selectCustomer: t({
        en: "Select customer...",
        pt: "Selecionar cliente...",
      }),
      searchCustomer: t({
        en: "Search customer...",
        pt: "Pesquisar cliente...",
      }),
      notesLabel: t({ en: "Notes", pt: "Notas" }),
      notesPlaceholder: t({ en: "Observations...", pt: "Observações..." }),
      cancel: t({ en: "Cancel", pt: "Cancelar" }),
      save: t({ en: "Save", pt: "Guardar" }),
      saving: t({ en: "Saving...", pt: "A guardar..." }),
    },

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      updated: t({ en: "Sale updated", pt: "Venda atualizada" }),
      deleted: t({ en: "Sale deleted", pt: "Venda apagada" }),
      error: t({ en: "Error", pt: "Erro" }),
      confirmDelete: t({
        en: "Delete this sale?",
        pt: "Apagar esta venda?",
      }),
    },
  },
} satisfies DeclarationContent;

export default salesContent;
