import { t, type DeclarationContent } from "intlayer";

const productsContent = {
  key: "products",
  content: {
    // ── ProductsPage (page.tsx) ──────────────────────────────────
    page: {
      title: t({ en: "Products", pt: "Produtos" }),
      heading: t({ en: "Products", pt: "Produtos" }),
      description: t({
        en: "Product catalogue — define components (BOM) and production costs.",
        pt: "Catálogo de produtos — define componentes (BOM) e custos de produção.",
      }),
    },

    // ── ProductsClient ───────────────────────────────────────────
    catalogue: {
      allFilter: t({ en: "All", pt: "Todos" }),
      empty: t({ en: "No products found.", pt: "Nenhum produto encontrado." }),
      productCount: t({ en: "product(s)", pt: "produto(s)" }),

      // Estado do stock de componentes
      bomEmpty: t({ en: "BOM empty", pt: "BOM vazia" }),
      stockReady: t({
        en: "Components in stock",
        pt: "Componentes em stock",
      }),
      needsPrinting: t({
        en: "Needs printing",
        pt: "Necessita impressão",
      }),
    },

    // ── ProductDetailPage (page.tsx) ─────────────────────────────
    detail: {
      subtitle: t({ en: "Product detail", pt: "Detalhe do produto" }),
    },

    // ── ProductDetailClient — view mode ──────────────────────────
    view: {
      editButton: t({ en: "Edit product", pt: "Editar produto" }),
      margin: t({ en: "margin", pt: "margem" }),
      components: t({ en: "component(s)", pt: "componente(s)" }),
      pieces: t({ en: "piece(s)", pt: "peça(s)" }),

      bom: {
        heading: t({ en: "Bill of Materials", pt: "Lista de Materiais" }),
        empty: t({
          en: "No components defined yet.",
          pt: "Ainda não foram definidos componentes.",
        }),
        addComponent: t({
          en: "Add component to BOM",
          pt: "Adicionar componente à BOM",
        }),
        stockStatus: t({
          en: "Stock status",
          pt: "Estado do stock",
        }),
      },

      costs: {
        heading: t({
          en: "Cost Estimate",
          pt: "Estimativa de Custo",
        }),
        filaments: t({ en: "Filaments", pt: "Filamentos" }),
        extras: t({ en: "Extras", pt: "Extras" }),
        totalCost: t({ en: "Total cost", pt: "Custo total" }),
        suggestedPrice: t({ en: "Suggested price", pt: "Preço sugerido" }),
        fallbackNote: t({
          en: "Estimated at €0.025/g. Add spools with real prices for accurate values.",
          pt: "Estimado a €0.025/g. Adiciona bobines com preço real para valores precisos.",
        }),
      },

      salesHistory: {
        heading: t({ en: "Sales History", pt: "Histórico de Vendas" }),
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

      image: {
        clickToAdd: t({
          en: "Click to add image",
          pt: "Clica para adicionar imagem",
        }),
      },

      fields: {
        name: t({ en: "Name", pt: "Nome" }),
        description: t({ en: "Description", pt: "Descrição" }),
        category: t({ en: "Category", pt: "Categoria" }),
        margin: t({ en: "Margin (%)", pt: "Margem (%)" }),
        alertThreshold: t({
          en: "Minimum stock alert",
          pt: "Alerta de stock mínimo",
        }),
        alertThresholdHint: t({
          en: "Alert when stock drops below this value",
          pt: "Alerta quando o stock baixar deste valor",
        }),
        selectPlaceholder: t({ en: "Select...", pt: "Selecionar..." }),
        searchCategory: t({
          en: "Search category...",
          pt: "Pesquisar categoria...",
        }),
      },

      extras: {
        heading: t({ en: "Extras", pt: "Extras" }),
        add: t({ en: "Add", pt: "Adicionar" }),
        empty: t({ en: "No extras added.", pt: "Nenhum extra adicionado." }),
      },
    },

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      productUpdated: t({ en: "Product updated!", pt: "Produto atualizado!" }),
      productDeleted: t({ en: "Product deleted", pt: "Produto eliminado" }),
      componentAdded: t({
        en: "Component added to BOM",
        pt: "Componente adicionado à BOM",
      }),
      componentRemoved: t({
        en: "Component removed from BOM",
        pt: "Componente removido da BOM",
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
