import { t, type DeclarationContent } from "intlayer";

const inventoryContent = {
  key: "inventory",
  content: {
    // ── Página ───────────────────────────────────────────────────
    page: {
      title: t({ pt: "Inventário", en: "Inventory" }),
      heading: t({ pt: "Inventário", en: "Inventory" }),
      description: t({
        pt: "Gestão de filamentos, hardware e produtos acabados.",
        en: "Manage filaments, hardware and finished goods.",
      }),
    },

    // ── Tabs ─────────────────────────────────────────────────────
    tabs: {
      filaments: t({ pt: "Filamentos", en: "Filaments" }),
      hardware: t({
        pt: "Hardware & Consumíveis",
        en: "Hardware & Consumables",
      }),
      finishedGoods: t({ pt: "Produtos Acabados", en: "Finished Goods" }),
    },

    // ── Tab: Filamentos ──────────────────────────────────────────
    filaments: {
      addButton: t({ pt: "Adicionar Bobine", en: "Add Spool" }),
      searchPlaceholder: t({ pt: "Pesquisar...", en: "Search..." }),
      allMaterials: t({ pt: "Todos os materiais", en: "All materials" }),
      spools: t({ pt: "rolos", en: "spools" }),
      lowStock: t({ pt: "stock baixo", en: "low stock" }),
      remainingWeight: t({ pt: "g restantes", en: "g remaining" }),
      needsAdapter: t({ pt: "Precisa de adaptador", en: "Needs adapter" }),
      loadedIn: t({ pt: "Carregada em", en: "Loaded in" }),
      empty: {
        title: t({
          pt: "Nenhum filamento no inventário",
          en: "No filaments in inventory",
        }),
        description: t({
          pt: "Adiciona o teu primeiro rolo para começar.",
          en: "Add your first spool to get started.",
        }),
      },
    },

    // ── Tab: Hardware & Consumíveis ──────────────────────────────
    hardware: {
      addButton: t({ pt: "Adicionar Item", en: "Add Item" }),
      searchPlaceholder: t({ pt: "Pesquisar...", en: "Search..." }),
      allCategories: t({ pt: "Todas as categorias", en: "All categories" }),
      categories: {
        hardware: t({ pt: "Ferragens", en: "Hardware" }),
        consumable: t({
          pt: "Consumível de Produto",
          en: "Product Consumable",
        }),
        packaging: t({ pt: "Embalamento", en: "Packaging" }),
        maintenance: t({ pt: "Manutenção", en: "Maintenance" }),
      },
      units: {
        un: t({ pt: "un", en: "un" }),
        g: t({ pt: "g", en: "g" }),
        ml: t({ pt: "ml", en: "ml" }),
        m: t({ pt: "m", en: "m" }),
      },
      fields: {
        name: t({ pt: "Nome", en: "Name" }),
        namePlaceholder: t({ pt: "ex: Parafuso M3x8", en: "e.g. M3x8 Screw" }),
        category: t({ pt: "Categoria", en: "Category" }),
        unit: t({ pt: "Unidade", en: "Unit" }),
        quantity: t({ pt: "Quantidade", en: "Quantity" }),
        alertThreshold: t({ pt: "Alerta mínimo", en: "Minimum alert" }),
        alertThresholdHint: t({
          pt: "Aviso quando o stock baixar deste valor",
          en: "Alert when stock drops below this value",
        }),
        unitCost: t({ pt: "Custo unitário (€)", en: "Unit cost (€)" }),
        notes: t({ pt: "Notas", en: "Notes" }),
        optional: t({ pt: "opcional", en: "optional" }),
      },
      lowStock: t({ pt: "stock baixo", en: "low stock" }),
      items: t({ pt: "itens", en: "items" }),
      empty: {
        title: t({ pt: "Nenhum item de hardware", en: "No hardware items" }),
        description: t({
          pt: "Adiciona parafusos, ímanes, embalagens e outros consumíveis.",
          en: "Add screws, magnets, packaging and other consumables.",
        }),
      },
      dialog: {
        titleAdd: t({ pt: "Adicionar Item", en: "Add Item" }),
        titleEdit: t({ pt: "Editar Item", en: "Edit Item" }),
        submit: t({ pt: "Guardar", en: "Save" }),
        submitting: t({ pt: "A guardar...", en: "Saving..." }),
        cancel: t({ pt: "Cancelar", en: "Cancel" }),
      },
      toast: {
        added: t({ pt: "Item adicionado!", en: "Item added!" }),
        updated: t({ pt: "Item atualizado!", en: "Item updated!" }),
        deleted: t({ pt: "Item eliminado", en: "Item deleted" }),
        error: t({ pt: "Erro", en: "Error" }),
        confirmDelete: t({
          pt: "Eliminar este item?",
          en: "Delete this item?",
        }),
      },
    },

    // ── Tab: Produtos Acabados ────────────────────────────────────
    finishedGoods: {
      searchPlaceholder: t({
        pt: "Pesquisar produto...",
        en: "Search product...",
      }),
      totalValue: t({ pt: "Valor total em stock", en: "Total stock value" }),
      units: t({ pt: "unidades", en: "units" }),
      products: t({ pt: "produtos", en: "products" }),
      costPerUnit: t({ pt: "custo/un", en: "cost/unit" }),
      stockValue: t({ pt: "valor em stock", en: "stock value" }),
      origin: t({ pt: "Origem", en: "Origin" }),
      noOrders: t({ pt: "Sem OP registada", en: "No production order" }),
      empty: {
        title: t({ pt: "Nenhum produto em stock", en: "No products in stock" }),
        description: t({
          pt: "O stock é calculado automaticamente a partir das Ordens de Produção e Vendas.",
          en: "Stock is calculated automatically from Production Orders and Sales.",
        }),
      },
    },

    // ── Toast geral ───────────────────────────────────────────────
    toast: {
      error: t({ pt: "Erro", en: "Error" }),
    },
  },
} satisfies DeclarationContent;

export default inventoryContent;
