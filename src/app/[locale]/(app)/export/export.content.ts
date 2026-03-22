import { t, type DeclarationContent } from "intlayer";

const exportContent = {
  key: "export-page",
  content: {
    // ── Page (page.tsx) ─────────────────────────────────────────
    page: {
      title: t({
        en: "Export",
        pt: "Exportação",
      }),
      heading: t({
        en: "Export",
        pt: "Exportação",
      }),
      description: t({
        en: "Export your data to CSV or PDF.",
        pt: "Exporta os teus dados para CSV ou PDF.",
      }),
    },

    // ── Export options (EXPORT_OPTIONS) ─────────────────────────
    options: {
      sales: {
        label: t({
          en: "Sales",
          pt: "Vendas",
        }),
        description: t({
          en: "Complete sales history with customers and totals",
          pt: "Histórico completo de vendas com clientes e totais",
        }),
      },
      production: {
        label: t({
          en: "Production",
          pt: "Produção",
        }),
        description: t({
          en: "Production records with detailed costs",
          pt: "Registos de produção com custos detalhados",
        }),
      },
      customers: {
        label: t({
          en: "Customers",
          pt: "Clientes",
        }),
        description: t({
          en: "Customer list with contact details",
          pt: "Lista de clientes com contactos",
        }),
      },
    },

    // ── Buttons ──────────────────────────────────────────────────
    buttons: {
      csv: t({
        en: "CSV",
        pt: "CSV",
      }),
      pdf: t({
        en: "PDF",
        pt: "PDF",
      }),
    },

    // ── Footer hint ──────────────────────────────────────────────
    hint: t({
      en: "CSV files can be opened in Excel or Google Sheets. PDF opens a print dialog — save as PDF from your printer settings.",
      pt: "O CSV abre no Excel ou Google Sheets. O PDF abre uma janela de impressão — guarda como PDF nas opções da impressora.",
    }),

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      csvExported: t({
        en: "CSV exported",
        pt: "CSV exportado",
      }),
      records: t({
        en: "record(s)",
        pt: "registo(s)",
      }),
      exportFailed: t({
        en: "Export failed",
        pt: "Erro ao exportar",
      }),
    },

    // ── CSV column headers ───────────────────────────────────────
    csv: {
      sales: {
        date: t({ en: "Date", pt: "Data" }),
        product: t({ en: "Product", pt: "Produto" }),
        customer: t({ en: "Customer", pt: "Cliente" }),
        quantity: t({ en: "Quantity", pt: "Quantidade" }),
        pricePerUnit: t({ en: "Price/unit (€)", pt: "Preço/un (€)" }),
        total: t({ en: "Total (€)", pt: "Total (€)" }),
        notes: t({ en: "Notes", pt: "Notas" }),
      },
      production: {
        date: t({ en: "Date", pt: "Data" }),
        product: t({ en: "Product", pt: "Produto" }),
        printer: t({ en: "Printer", pt: "Impressora" }),
        quantity: t({ en: "Quantity", pt: "Quantidade" }),
        time: t({ en: "Time (min)", pt: "Tempo (min)" }),
        filament: t({ en: "Filament (g)", pt: "Filamento (g)" }),
        filamentCost: t({ en: "Filament Cost (€)", pt: "Custo Filamento (€)" }),
        printerCost: t({ en: "Printer Cost (€)", pt: "Custo Impressora (€)" }),
        energyCost: t({ en: "Energy Cost (€)", pt: "Custo Energia (€)" }),
        extrasCost: t({ en: "Extras Cost (€)", pt: "Custo Extras (€)" }),
        totalCost: t({ en: "Total Cost (€)", pt: "Custo Total (€)" }),
        notes: t({ en: "Notes", pt: "Notas" }),
      },
      customers: {
        name: t({ en: "Name", pt: "Nome" }),
        email: t({ en: "Email", pt: "Email" }),
        phone: t({ en: "Phone", pt: "Telefone" }),
        taxId: t({ en: "Tax ID", pt: "NIF" }),
        address: t({ en: "Address", pt: "Morada" }),
        notes: t({ en: "Notes", pt: "Notas" }),
        sales: t({ en: "Sales", pt: "Vendas" }),
      },
    },

    // ── PDF table headers ────────────────────────────────────────
    pdf: {
      sales: {
        date: t({ en: "Date", pt: "Data" }),
        product: t({ en: "Product", pt: "Produto" }),
        customer: t({ en: "Customer", pt: "Cliente" }),
        qty: t({ en: "Qty", pt: "Qtd" }),
        pricePerUnit: t({ en: "Price/unit", pt: "Preço/un" }),
        total: t({ en: "Total", pt: "Total" }),
        notes: t({ en: "Notes", pt: "Notas" }),
      },
      production: {
        date: t({ en: "Date", pt: "Data" }),
        product: t({ en: "Product", pt: "Produto" }),
        printer: t({ en: "Printer", pt: "Impressora" }),
        qty: t({ en: "Qty", pt: "Qtd" }),
        time: t({ en: "Time", pt: "Tempo" }),
        filament: t({ en: "Filament", pt: "Filamento" }),
        totalCost: t({ en: "Total Cost", pt: "Custo Total" }),
        notes: t({ en: "Notes", pt: "Notas" }),
      },
      customers: {
        name: t({ en: "Name", pt: "Nome" }),
        email: t({ en: "Email", pt: "Email" }),
        phone: t({ en: "Phone", pt: "Telefone" }),
        taxId: t({ en: "Tax ID", pt: "NIF" }),
        address: t({ en: "Address", pt: "Morada" }),
        sales: t({ en: "Sales", pt: "Vendas" }),
      },
      footer: {
        total: t({ en: "Total", pt: "Total" }),
        exportedOn: t({ en: "Exported on", pt: "Exportado em" }),
      },
    },

    // ── Export filenames ─────────────────────────────────────────
    filenames: {
      sales: t({ en: "sales", pt: "vendas" }),
      production: t({ en: "production", pt: "producao" }),
      customers: t({ en: "customers", pt: "clientes" }),
    },
  },
} satisfies DeclarationContent;

export default exportContent;
