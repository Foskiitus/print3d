import { t, type DeclarationContent } from "intlayer";

const productionContent = {
  key: "production",
  content: {
    // ── Página ───────────────────────────────────────────────────
    page: {
      title: t({ pt: "Produção", en: "Production" }),
      heading: t({ pt: "Produção", en: "Production" }),
      description: t({
        pt: "Gere ordens de produção, planeia impressões e analisa o histórico.",
        en: "Manage production orders, plan prints and analyse history.",
      }),
    },

    // ── Tabs ─────────────────────────────────────────────────────
    tabs: {
      orders: t({ pt: "Ordens de Produção", en: "Production Orders" }),
      planner: t({ pt: "Planeador de Mesas", en: "Print Planner" }),
      history: t({ pt: "Histórico", en: "History" }),
    },

    // ── Tab: Ordens de Produção ──────────────────────────────────
    orders: {
      addButton: t({ pt: "Nova Ordem", en: "New Order" }),
      searchPlaceholder: t({ pt: "Pesquisar...", en: "Search..." }),
      allOrigins: t({ pt: "Todas as origens", en: "All origins" }),
      allStatuses: t({ pt: "Todos os estados", en: "All statuses" }),

      origins: {
        sale: t({ pt: "Encomenda", en: "Order" }),
        manual: t({ pt: "Reposição de Stock", en: "Stock Replenishment" }),
      },

      status: {
        draft: t({ pt: "Rascunho", en: "Draft" }),
        pending: t({ pt: "Pendente", en: "Pending" }),
        in_progress: t({ pt: "Em Produção", en: "In Progress" }),
        assembly: t({ pt: "Montagem", en: "Assembly" }),
        done: t({ pt: "Concluída", en: "Done" }),
        cancelled: t({ pt: "Cancelada", en: "Cancelled" }),
      },

      columns: {
        reference: t({ pt: "Referência", en: "Reference" }),
        product: t({ pt: "Produto", en: "Product" }),
        qty: t({ pt: "Qtd", en: "Qty" }),
        origin: t({ pt: "Origem", en: "Origin" }),
        status: t({ pt: "Estado", en: "Status" }),
        needs: t({ pt: "Necessidades", en: "Needs" }),
        created: t({ pt: "Criado", en: "Created" }),
      },

      needs: {
        filament: t({ pt: "kg de filamento", en: "kg of filament" }),
        hardware: t({ pt: "peças de hardware", en: "hardware pieces" }),
      },

      empty: {
        title: t({
          pt: "Nenhuma ordem de produção",
          en: "No production orders",
        }),
        description: t({
          pt: "Cria uma nova OP manualmente ou a partir de uma encomenda de cliente.",
          en: "Create a new order manually or from a customer order.",
        }),
      },

      dialog: {
        titleNew: t({
          pt: "Nova Ordem de Produção",
          en: "New Production Order",
        }),
        product: t({ pt: "Produto", en: "Product" }),
        productPlaceholder: t({
          pt: "Seleciona o produto...",
          en: "Select product...",
        }),
        productSearch: t({
          pt: "Pesquisar produto...",
          en: "Search product...",
        }),
        quantity: t({ pt: "Quantidade a produzir", en: "Quantity to produce" }),
        origin: t({ pt: "Origem", en: "Origin" }),
        notes: t({ pt: "Notas", en: "Notes" }),
        notesPlaceholder: t({
          pt: "Observações opcionais...",
          en: "Optional notes...",
        }),
        submit: t({ pt: "Criar Ordem", en: "Create Order" }),
        submitting: t({ pt: "A criar...", en: "Creating..." }),
        cancel: t({ pt: "Cancelar", en: "Cancel" }),
      },

      toast: {
        created: t({ pt: "Ordem criada!", en: "Order created!" }),
        updated: t({ pt: "Ordem atualizada", en: "Order updated" }),
        deleted: t({ pt: "Ordem eliminada", en: "Order deleted" }),
        error: t({ pt: "Erro", en: "Error" }),
        confirmDelete: t({
          pt: "Eliminar esta ordem de produção?",
          en: "Delete this production order?",
        }),
      },
    },

    // ── Tab: Planeador ───────────────────────────────────────────
    planner: {
      pending: t({ pt: "Peças Pendentes", en: "Pending Parts" }),
      noPending: t({ pt: "Nenhuma peça pendente", en: "No pending parts" }),
      noPendingDesc: t({
        pt: "Cria uma OP na tab anterior para ver peças aqui.",
        en: "Create an order in the previous tab to see parts here.",
      }),
      noprinters: t({
        pt: "Sem impressoras configuradas",
        en: "No printers configured",
      }),
      noPrintersDesc: t({
        pt: "Adiciona impressoras em A Minha Oficina.",
        en: "Add printers in My Workshop.",
      }),
      dragHint: t({
        pt: "Arrasta uma peça para uma impressora para planear a impressão.",
        en: "Drag a part to a printer to plan the print.",
      }),
      urgent: t({ pt: "Urgente", en: "Urgent" }),
      filler: t({ pt: "Enchimento", en: "Filler" }),
      adapterRequired: t({ pt: "Requer Adaptador", en: "Adapter Required" }),
      adapterWarning: t({
        pt: "⚠️ Bloqueio de Segurança: este slot requer Adaptador Físico",
        en: "⚠️ Safety Block: this slot requires a Physical Adapter",
      }),

      confirm: {
        title: t({ pt: "Confirmar Impressão", en: "Confirm Print" }),
        recipe: t({ pt: "Receita", en: "Recipe" }),
        single: t({ pt: "Individual (1 un)", en: "Single (1 unit)" }),
        fullPlate: t({ pt: "Placa Completa", en: "Full Plate" }),
        filament: t({ pt: "Filamento detetado", en: "Filament detected" }),
        estimatedTime: t({ pt: "Tempo estimado", en: "Estimated time" }),
        launch: t({ pt: "Lançar Impressão", en: "Launch Print" }),
        cancel: t({ pt: "Cancelar", en: "Cancel" }),
      },
    },

    // ── Tab: Histórico ───────────────────────────────────────────
    history: {
      searchPlaceholder: t({ pt: "Pesquisar...", en: "Search..." }),
      allStatuses: t({ pt: "Todos os estados", en: "All statuses" }),
      totalCost: t({ pt: "Custo total", en: "Total cost" }),
      units: t({ pt: "unidades produzidas", en: "units produced" }),
      failRate: t({ pt: "Taxa de falha", en: "Fail rate" }),
      columns: {
        date: t({ pt: "Data", en: "Date" }),
        reference: t({ pt: "Referência", en: "Reference" }),
        product: t({ pt: "Produto", en: "Product" }),
        qty: t({ pt: "Qtd", en: "Qty" }),
        filamentUsed: t({ pt: "Filamento", en: "Filament" }),
        cost: t({ pt: "Custo", en: "Cost" }),
        origin: t({ pt: "Origem", en: "Origin" }),
        spool: t({ pt: "Rolo (QR)", en: "Spool (QR)" }),
      },
      empty: {
        title: t({ pt: "Nenhuma OP concluída", en: "No completed orders" }),
        description: t({
          pt: "As ordens concluídas aparecerão aqui com rastreabilidade completa.",
          en: "Completed orders will appear here with full traceability.",
        }),
      },
    },

    // ── Toast geral ───────────────────────────────────────────────
    toast: {
      error: t({ pt: "Erro", en: "Error" }),
    },
  },
} satisfies DeclarationContent;

export default productionContent;
