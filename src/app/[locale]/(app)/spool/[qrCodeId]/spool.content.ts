import { t, type DeclarationContent } from "intlayer";

const spoolContent = {
  key: "spool",
  content: {
    functions: {
      remainingWeight: t({ en: "g remaining", pt: "g restantes" }),
      tareLabel: t({ en: "Tare weight", pt: "Peso da tara" }),
      initialGrossLabel: t({
        en: "Initial gross weight",
        pt: "Peso bruto inicial",
      }),
      invalidSpool: t({
        en: "Invalid spool",
        pt: "Bobine inválida",
      }),
    },

    buttons: {
      loadInPrinter: t({ en: "Load in printer", pt: "Carregar na impressora" }),
      updateWeight: t({ en: "Update weight", pt: "Actualizar peso" }),
      finishSpool: t({ en: "Finish spool", pt: "Rolo Acabou" }),
    },

    updateWeightModal: {
      title: t({ en: "Update weight", pt: "Actualizar peso" }),
      currentWeightLabel: t({
        en: "Includes tare weight",
        pt: "Inclui o peso do rolo vazio",
      }),
      tareLabel: t({ en: "Tare", pt: "Tara" }),
      saveButton: t({ en: "Save", pt: "Guardar" }),
    },

    details: {
      title: t({ en: "Spool details", pt: "Detalhes da bobine" }),
      labels: {
        price: t({ en: "Price", pt: "Preço" }),
        costPerGram: t({ en: "Cost/gram", pt: "Custo/grama" }),
        boughtAt: t({ en: "Bought at", pt: "Comprado em" }),
        openedAt: t({ en: "Opened at", pt: "Aberto em" }),
        supplier: t({ en: "Supplier", pt: "Fornecedor" }),
        notes: t({ en: "Notes", pt: "Notas" }),
      },
    },

    history: {
      title: t({ en: "Spool history", pt: "Histórico de uso" }),
      noHistory: t({
        en: "No usage recorded yet",
        pt: "Nenhuma produção registada ainda",
      }),
    },

    loading: {
      loadingSpool: t({ en: "Loading spool...", pt: "A carregar bobine..." }),
    },

    // ── SpoolOwnerPanel ───────────────────────────────────────
    spoolOwnerPanel: {
      title: t({ en: "Spool details", pt: "Detalhes da bobine" }),
    },
    // ── Toast messages ───────────────────────────────────────────
    toast: {
      adjustmentUpdated: t({
        en: "Adjustment updated",
        pt: "Peso actualizado",
      }),
      spoolArchived: t({ en: "Spool archived", pt: "Rolo arquivado" }),
      spoolLoadedIn: t({ en: "Spool loaded in", pt: "Rolo carregado em " }),
      alertSaved: t({ en: "Alert saved!", pt: "Alerta guardado!" }),
      adjustmentDeleted: t({ en: "Adjustment removed", pt: "Ajuste removido" }),
      materialDeleted: t({ en: "Material deleted", pt: "Material eliminado" }),
      spoolDeleted: t({ en: "Spool removed", pt: "Bobine removida" }),
      error: t({ en: "Error", pt: "Erro" }),
      deleteError: t({ en: "Error deleting", pt: "Erro ao eliminar" }),
      confirmDeleteAdjustment: t({
        en: "Mark this roll as consumed? It will be saved in the history.",
        pt: "Marcar este rolo como consumido? Ficará no histórico.",
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

export default spoolContent;
