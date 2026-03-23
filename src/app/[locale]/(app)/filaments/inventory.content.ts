import { t, type DeclarationContent } from "intlayer";

const filamentsContent = {
  key: "filaments",
  content: {
    // ── FilamentsPage (page.tsx) ─────────────────────────────────
    page: {
      title: t({ en: "Filaments", pt: "Filamentos" }),
      description: t({
        en: "Filament inventory management",
        pt: "Gestão do inventário de filamentos",
      }),
    },

    components: {
      addButton: t({ en: "Add filament", pt: "Adicionar filamento" }),
      searchPlaceholder: t({ en: "Search...", pt: "Pesquisar..." }),
      allMaterials: t({ en: "All materials", pt: "Todos os materiais" }),
      emptyTitle: t({
        en: "No filaments in inventory",
        pt: "Nenhum filamento no inventário",
      }),
      emptyDescription: t({
        en: "Add your first spool to get started.",
        pt: "Adiciona o teu primeiro rolo para começar.",
      }),
      spools: t({ en: "spools", pt: "rolos" }),
      lowStock: t({ en: "low stock", pt: "stock baixo" }),
    },

    functions: {
      remainingWeight: t({ en: "g remaining", pt: "g restantes" }),
    },

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      alertSaved: t({ en: "Alert saved!", pt: "Alerta guardado!" }),
      adjustmentDeleted: t({ en: "Adjustment removed", pt: "Ajuste removido" }),
      materialDeleted: t({ en: "Material deleted", pt: "Material eliminado" }),
      spoolDeleted: t({ en: "Spool removed", pt: "Bobine removida" }),
      error: t({ en: "Error", pt: "Erro" }),
      deleteError: t({ en: "Error deleting", pt: "Erro ao eliminar" }),
      confirmDeleteAdjustment: t({
        en: "Delete this adjustment? The spool weight will be reverted.",
        pt: "Apagar este ajuste? O peso da bobine será revertido.",
      }),
      confirmDeleteMaterial: t({
        en: "Are you sure you want to delete this material?",
        pt: "Tens a certeza que queres eliminar este material?",
      }),
      confirmDeleteSpool: t({
        en: "Delete this spool?",
        pt: "Eliminar esta bobine?",
      }),
    },
  },
} satisfies DeclarationContent;

export default filamentsContent;
