import { t, type DeclarationContent } from "intlayer";

const customersContent = {
  key: "customers",
  content: {
    // Page header
    title: t({ pt: "Clientes", en: "Customers" }),
    subtitle: t({
      pt: "Gere a lista de clientes e consulta o histórico de compras.",
      en: "Manage your customer list and view purchase history.",
    }),

    // List
    searchPlaceholder: t({
      pt: "Buscar por nome, email ou telefone...",
      en: "Search by name, email or phone...",
    }),
    emptySearch: t({
      pt: "Nenhum cliente encontrado.",
      en: "No customers found.",
    }),
    emptyList: t({
      pt: "Nenhum cliente adicionado ainda.",
      en: "No customers added yet.",
    }),
    salesSuffix: t({ pt: "venda(s)", en: "sale(s)" }),

    // Edit form
    edit: {
      name: t({ pt: "Nome *", en: "Name *" }),
      email: t({ pt: "Email", en: "Email" }),
      phone: t({ pt: "Telefone", en: "Phone" }),
      nif: t({ pt: "NIF", en: "VAT number" }),
      address: t({ pt: "Morada", en: "Address" }),
      addressPlaceholder: t({
        pt: "Rua, cidade, código postal",
        en: "Street, city, postal code",
      }),
      notes: t({ pt: "Notas", en: "Notes" }),
      notesPlaceholder: t({ pt: "Observações...", en: "Observations..." }),
      cancel: t({ pt: "Cancelar", en: "Cancel" }),
      save: t({ pt: "Guardar", en: "Save" }),
      saving: t({ pt: "A guardar...", en: "Saving..." }),
    },

    // Toasts
    toasts: {
      updated: t({ pt: "Cliente atualizado", en: "Customer updated" }),
      deleted: t({ pt: "Cliente eliminado", en: "Customer deleted" }),
      error: t({ pt: "Erro", en: "Error" }),
    },

    // Confirm
    confirmDelete: t({
      pt: "Eliminar este cliente? As vendas associadas não serão apagadas.",
      en: "Delete this customer? Associated sales will not be deleted.",
    }),

    // Detail page
    detail: {
      customerSince: t({ pt: "Cliente desde", en: "Customer since" }),
      info: t({ pt: "Informação", en: "Information" }),
      noInfo: t({
        pt: "Sem informação adicional.",
        en: "No additional information.",
      }),
      summary: t({ pt: "Resumo", en: "Summary" }),
      totalSpent: t({ pt: "Total gasto", en: "Total spent" }),
      unitsBought: t({ pt: "Unidades compradas", en: "Units purchased" }),
      profitGenerated: t({ pt: "Lucro gerado", en: "Profit generated" }),
      topProducts: t({
        pt: "Produtos mais comprados",
        en: "Most purchased products",
      }),
      noPurchases: t({ pt: "Sem compras", en: "No purchases" }),
      purchaseHistory: t({
        pt: "Histórico de compras",
        en: "Purchase history",
      }),
      noPurchasesRegistered: t({
        pt: "Nenhuma compra registada.",
        en: "No purchases registered.",
      }),
      tableHeaders: {
        date: t({ pt: "Data", en: "Date" }),
        product: t({ pt: "Produto", en: "Product" }),
        qty: t({ pt: "Qtd", en: "Qty" }),
        pricePerUnit: t({ pt: "Preço/un", en: "Price/unit" }),
        total: t({ pt: "Total", en: "Total" }),
        profit: t({ pt: "Lucro", en: "Profit" }),
      },
      units: t({ pt: "un.", en: "units" }),
    },
  },
} satisfies DeclarationContent;

export default customersContent;
