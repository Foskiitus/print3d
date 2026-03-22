import { t, type DeclarationContent } from "intlayer";

const productionContent = {
  key: "production",
  content: {
    // ── Page (page.tsx) ──────────────────────────────────────────
    page: {
      title: t({ en: "Production", pt: "Produção" }),
      heading: t({ en: "Production", pt: "Produção" }),
      description: t({
        en: "Log produced batches and track your history.",
        pt: "Registe lotes produzidos e acompanhe o histórico.",
      }),
    },

    // ── Summary cards ────────────────────────────────────────────
    summary: {
      producedThisMonth: t({
        en: "Produced this month",
        pt: "Produzido este mês",
      }),
      units: t({ en: "units", pt: "unidades" }),
      costThisMonth: t({ en: "Cost this month", pt: "Custo este mês" }),
      costSubtitle: t({
        en: "in materials and machine",
        pt: "em materiais e máquina",
      }),
    },

    // ── Table ────────────────────────────────────────────────────
    table: {
      totalRecords: t({ en: "record(s) total", pt: "registo(s) no total" }),
      empty: t({
        en: "No production records yet.",
        pt: "Nenhuma produção registada ainda.",
      }),
      columns: {
        date: t({ en: "Date", pt: "Data" }),
        product: t({ en: "Product", pt: "Produto" }),
        printer: t({ en: "Printer", pt: "Impressora" }),
        qty: t({ en: "Qty", pt: "Qtd" }),
        time: t({ en: "Time", pt: "Tempo" }),
        filament: t({ en: "Filament", pt: "Filamento" }),
        totalCost: t({ en: "Total cost", pt: "Custo total" }),
        costPerUnit: t({ en: "Cost/unit", pt: "Custo/un" }),
        notes: t({ en: "Notes", pt: "Notas" }),
      },
      notesPlaceholder: t({ en: "Notes...", pt: "Notas..." }),
    },

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      updated: t({ en: "Record updated", pt: "Registo atualizado" }),
      deleted: t({ en: "Record deleted", pt: "Registo apagado" }),
      error: t({ en: "Error", pt: "Erro" }),
      confirmDelete: t({
        en: "Delete this record?",
        pt: "Apagar este registo?",
      }),
    },
  },
} satisfies DeclarationContent;

export default productionContent;
