import { t, type DeclarationContent } from "intlayer";

const productsContent = {
  key: "products",
  content: {
    // ── ProductsPage (page.tsx) ──────────────────────────────────
    page: {
      title: t({ en: "Products", pt: "Produtos" }),
      heading: t({ en: "Products", pt: "Produtos" }),
      description: t({
        en: "Product catalogue — define materials, times and production costs.",
        pt: "Catálogo de produtos — define materiais, tempos e custos de produção.",
      }),
    },

    // ── ProductsClient ───────────────────────────────────────────
    catalogue: {
      allFilter: t({ en: "All", pt: "Todos" }),
      empty: t({ en: "No products found.", pt: "Nenhum produto encontrado." }),
      noPrinter: t({ en: "No printer", pt: "Sem impressora" }),
      productCount: t({ en: "product(s)", pt: "produto(s)" }),
      filamentCount: t({ en: "filament(s)", pt: "filamento(s)" }),
    },

    // ── ProductDetailPage (page.tsx) ─────────────────────────────
    detail: {
      subtitle: t({ en: "Product detail", pt: "Detalhe do produto" }),
    },

    // ── ProductDetailClient — view mode ──────────────────────────
    view: {
      editButton: t({ en: "Edit product", pt: "Editar produto" }),
      downloadModel: t({ en: "Download Model", pt: "Descarregar Modelo" }),
      margin: t({ en: "margin", pt: "margem" }),
      filaments: t({ en: "filament(s)", pt: "filamento(s)" }),
      unitsPerPrint: t({ en: "units/print", pt: "unidades/impressão" }),
      noPrinterWarning: t({
        en: "⚠️ No printer defined — machine and energy costs not included.",
        pt: "⚠️ Sem impressora definida — custos de máquina e energia não incluídos.",
      }),

      costs: {
        heading: t({
          en: "Cost Estimate (FIFO)",
          pt: "Estimativa de Custo (FIFO)",
        }),
        filaments: t({ en: "Filaments", pt: "Filamentos" }),
        extras: t({ en: "Extras", pt: "Extras" }),
        printer: t({ en: "Printer", pt: "Impressora" }),
        energy: t({ en: "Energy", pt: "Energia" }),
        totalPrintCost: t({
          en: "Total print cost",
          pt: "Custo total da impressão",
        }),
        costPerUnit: t({ en: "Cost per unit", pt: "Custo por unidade" }),
        suggestedPrice: t({ en: "Suggested price", pt: "Preço sugerido" }),
        suggestedPricePerUnit: t({
          en: "Suggested price/unit",
          pt: "Preço sugerido/unidade",
        }),
      },

      productionHistory: {
        heading: t({ en: "Production History", pt: "Histórico de Produção" }),
      },

      salesHistory: {
        heading: t({ en: "Sales History", pt: "Histórico de Vendas" }),
        loading: t({ en: "Loading...", pt: "A carregar..." }),
        empty: t({
          en: "No sales recorded yet.",
          pt: "Nenhuma venda registada ainda.",
        }),
      },
    },

    // ── ProductDetailClient — edit mode ──────────────────────────
    edit: {
      modeLabel: t({ en: "Edit mode", pt: "Modo de edição" }),
      cancel: t({ en: "Cancel", pt: "Cancelar" }),
      save: t({ en: "Save", pt: "Guardar" }),
      saving: t({ en: "Saving...", pt: "A guardar..." }),
      uploading: t({ en: "Uploading...", pt: "A fazer upload..." }),

      image: {
        clickToAdd: t({
          en: "Click to add image",
          pt: "Clica para adicionar imagem",
        }),
      },

      file: {
        label: t({ en: "Print file", pt: "Ficheiro de impressão" }),
        optional: t({ en: "(optional)", pt: "(opcional)" }),
        existing: t({ en: "Existing file", pt: "Ficheiro existente" }),
        viewCurrent: t({ en: "View current file", pt: "Ver ficheiro atual" }),
        choose: t({ en: "Choose .3mf or .stl", pt: "Escolher .3mf ou .stl" }),
        sizeLimit: t({
          en: "Maximum size",
          pt: "Limite máximo",
        }),
        formats: t({
          en: "Accepted formats: .3mf, .stl",
          pt: "Formatos aceites: .3mf, .stl",
        }),
        tooLarge: t({ en: "File too large", pt: "Ficheiro demasiado grande" }),
        tooLargeDesc: t({
          en: (limitMb: string, fileSizeMb: string) =>
            `The maximum size is ${limitMb} MB. This file is ${fileSizeMb} MB.`,
          pt: (limitMb: string, fileSizeMb: string) =>
            `O limite máximo é ${limitMb} MB. Este ficheiro tem ${fileSizeMb} MB.`,
        }),
      },

      fields: {
        name: t({ en: "Name", pt: "Nome" }),
        description: t({ en: "Description", pt: "Descrição" }),
        category: t({ en: "Category", pt: "Categoria" }),
        printer: t({ en: "Printer", pt: "Impressora" }),
        printTime: t({ en: "Print time", pt: "Tempo de impressão" }),
        margin: t({ en: "Margin (%)", pt: "Margem (%)" }),
        unitsPerPrint: t({
          en: "Units per print",
          pt: "Unidades por impressão",
        }),
        unitsPerPrintHint: t({
          en: "How many units come out of each print",
          pt: "Quantas unidades saem de cada impressão",
        }),
        alertThreshold: t({
          en: "Minimum stock alert",
          pt: "Alerta de stock mínimo",
        }),
        alertThresholdHint: t({
          en: "Receive an alert when stock drops below this value",
          pt: "Recebe um alerta quando o stock baixar deste valor",
        }),
        selectPlaceholder: t({ en: "Select...", pt: "Selecionar..." }),
        searchCategory: t({
          en: "Search category...",
          pt: "Pesquisar categoria...",
        }),
        searchPrinter: t({
          en: "Search printer...",
          pt: "Pesquisar impressora...",
        }),
      },

      filaments: {
        heading: t({ en: "Filaments", pt: "Filamentos" }),
        add: t({ en: "Add", pt: "Adicionar" }),
        searchPlaceholder: t({
          en: "Search filament...",
          pt: "Pesquisar filamento...",
        }),
        typePlaceholder: t({
          en: "Filament type...",
          pt: "Tipo de filamento...",
        }),
        gramsPlaceholder: t({ en: "grams", pt: "gramas" }),
        addSpool: t({ en: "Register new spool", pt: "Registar nova bobine" }),
        noPrinterWarning: t({
          en: "⚠️ Select a printer to include machine and energy costs.",
          pt: "⚠️ Seleciona uma impressora para incluir custos de máquina e energia.",
        }),
        costHeading: t({
          en: "Cost Estimate (FIFO)",
          pt: "Estimativa de Custo (FIFO)",
        }),
      },

      extras: {
        heading: t({ en: "Extras", pt: "Extras" }),
        add: t({ en: "Add", pt: "Adicionar" }),
        empty: t({ en: "No extras added.", pt: "Nenhum extra adicionado." }),
        searchPlaceholder: t({
          en: "Search extra...",
          pt: "Pesquisar extra...",
        }),
        placeholder: t({ en: "Extra...", pt: "Extra..." }),
        qtyPlaceholder: t({ en: "qty", pt: "qtd" }),
      },
    },

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      productUpdated: t({ en: "Product updated!", pt: "Produto atualizado!" }),
      productDeleted: t({ en: "Product deleted", pt: "Produto eliminado" }),
      noFilament: t({
        en: "Add at least one filament",
        pt: "Adiciona pelo menos um filamento",
      }),
      uploadFailed: t({
        en: "Upload failed",
        pt: "Falha ao gerar link de upload",
      }),
      storageFailed: t({
        en: "Storage upload failed",
        pt: "Falha no upload para o storage",
      }),
      error: t({ en: "Error", pt: "Erro" }),
      confirmDelete: t({
        en: "Delete this product?",
        pt: "Eliminar este produto?",
      }),
    },
  },
} satisfies DeclarationContent;

export default productsContent;
