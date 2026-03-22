import { t, type DeclarationContent } from "intlayer";

const filamentsContent = {
  key: "filaments",
  content: {
    // ── FilamentsPage (page.tsx) ─────────────────────────────────
    page: {
      title: t({ en: "Filaments", pt: "Filamentos" }),
      heading: t({ en: "Filaments", pt: "Filamentos" }),
      description: t({
        en: "Manage material types and physical spool stock.",
        pt: "Controla os tipos de material e o stock físico de bobines.",
      }),
    },

    // ── SpoolDetailPage (page.tsx) ───────────────────────────────
    spoolDetail: {
      subtitle: t({ en: "Spool detail", pt: "Detalhe da bobine" }),
    },

    // ── FilamentsClient ──────────────────────────────────────────
    catalogue: {
      heading: t({ en: "Material Catalogue", pt: "Catálogo de Materiais" }),
      empty: t({
        en: "No materials created yet.",
        pt: "Nenhum material criado ainda.",
      }),
      spoolsInStock: t({ en: "spool(s) in stock", pt: "bobine(s) em stock" }),
      spoolCount: t({ en: "spool(s)", pt: "rolo(s)" }),
    },

    spoolHistory: {
      heading: t({ en: "Spool History", pt: "Histórico de Bobines" }),
    },

    // ── SpoolDetailClient ────────────────────────────────────────
    spool: {
      remaining: t({ en: "remaining", pt: "restantes" }),
      of: t({ en: "of", pt: "de" }),
      percentRemaining: t({ en: "% remaining", pt: "% restante" }),
      purchase: t({ en: "Purchase", pt: "Compra" }),
      alertLabel: t({ en: "Alert below", pt: "Alerta abaixo de" }),

      wasted: {
        label: t({ en: "Wasted", pt: "Desperdiçado" }),
        adjustments: t({ en: "adjustment(s)", pt: "ajuste(s)" }),
      },

      inProduction: {
        label: t({ en: "In Production", pt: "Em Produção" }),
        productions: t({ en: "production(s)", pt: "produção(ões)" }),
      },

      adjustmentHistory: {
        heading: t({ en: "Adjustment History", pt: "Histórico de Ajustes" }),
        empty: t({
          en: "No adjustments recorded yet.",
          pt: "Nenhum ajuste registado ainda.",
        }),
      },

      productionUsage: {
        heading: t({ en: "Production Usage", pt: "Uso em Produção" }),
        empty: t({
          en: "This filament type has not been used in any production yet.",
          pt: "Este tipo de filamento ainda não foi usado em nenhuma produção.",
        }),
      },
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
