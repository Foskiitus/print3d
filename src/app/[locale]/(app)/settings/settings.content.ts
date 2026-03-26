import { t, type DeclarationContent } from "intlayer";

const settingsContent = {
  key: "settings",
  content: {
    page: {
      title: t({ pt: "Definições", en: "Settings" }),
      heading: t({ pt: "Definições", en: "Settings" }),
    },
    nav: {
      financial: t({ pt: "Financeiro & Custos", en: "Financial & Costs" }),
      platforms: t({ pt: "Plataformas & Taxas", en: "Platforms & Fees" }),
      licensing: t({ pt: "Licenciamento", en: "Licensing" }),
      company: t({ pt: "Identidade da Empresa", en: "Company Identity" }),
      locations: t({ pt: "Armazém", en: "Warehouse" }),
      privacy: t({ pt: "Privacidade & Dados", en: "Privacy & Data" }),
      appearance: t({ pt: "Aparência", en: "Appearance" }),
    },
    financial: {
      heading: t({ pt: "Financeiro & Custos", en: "Financial & Costs" }),
      energy: t({ pt: "Energia", en: "Energy" }),
      kwhPrice: t({ pt: "Preço do kWh (€)", en: "kWh Price (€)" }),
      kwhHint: t({
        pt: "Usado no cálculo de custo de eletricidade por impressão.",
        en: "Used to calculate electricity cost per print.",
      }),
      postProcessing: t({ pt: "Pós-Processamento", en: "Post-Processing" }),
      fixedCost: t({
        pt: "Custo fixo por produto (€)",
        en: "Fixed cost per product (€)",
      }),
      fixedCostHint: t({
        pt: "Consumíveis de limpeza, embalamento, etc.",
        en: "Cleaning consumables, packaging, etc.",
      }),
      hourlyRate: t({
        pt: "Valor hora de trabalho manual (€/h)",
        en: "Manual labour hourly rate (€/h)",
      }),
      logistics: t({ pt: "Logística", en: "Logistics" }),
      shippingCost: t({
        pt: "Custo padrão de envio (€)",
        en: "Default shipping cost (€)",
      }),
      tax: t({ pt: "Fiscalidade", en: "Tax" }),
      vatRate: t({
        pt: "Taxa de IVA por defeito (%)",
        en: "Default VAT rate (%)",
      }),
      currency: t({ pt: "Moeda", en: "Currency" }),
      save: t({ pt: "Guardar Alterações", en: "Save Changes" }),
      saving: t({ pt: "A guardar...", en: "Saving..." }),
      saved: t({ pt: "Definições guardadas!", en: "Settings saved!" }),
    },
    platforms: {
      heading: t({ pt: "Plataformas & Taxas", en: "Platforms & Fees" }),
      addButton: t({ pt: "Adicionar Plataforma", en: "Add Platform" }),
      name: t({ pt: "Nome da plataforma", en: "Platform name" }),
      commission: t({ pt: "Comissão (%)", en: "Commission (%)" }),
      fixedFee: t({
        pt: "Taxa fixa por venda (€)",
        en: "Fixed fee per sale (€)",
      }),
      empty: t({
        pt: "Nenhuma plataforma configurada.",
        en: "No platforms configured.",
      }),
      emptyHint: t({
        pt: "Adiciona Etsy, Shopify, etc. para calcular as taxas automaticamente.",
        en: "Add Etsy, Shopify, etc. to automatically calculate fees.",
      }),
      examples: t({
        pt: "Ex: Etsy (6.5% + €0.20), Shopify (2% + €0.30)",
        en: "e.g. Etsy (6.5% + €0.20), Shopify (2% + €0.30)",
      }),
      save: t({ pt: "Guardar", en: "Save" }),
      toast: {
        saved: t({ pt: "Plataforma guardada!", en: "Platform saved!" }),
        deleted: t({ pt: "Plataforma eliminada.", en: "Platform deleted." }),
        error: t({ pt: "Erro", en: "Error" }),
      },
    },
    licensing: {
      heading: t({
        pt: "Licenciamento & Royalties",
        en: "Licensing & Royalties",
      }),
      addButton: t({ pt: "Adicionar Licença", en: "Add License" }),
      name: t({ pt: "Nome da licença", en: "License name" }),
      monthlyCost: t({ pt: "Custo mensal (€)", en: "Monthly cost (€)" }),
      royaltyPerUnit: t({
        pt: "Royalty por unidade (€)",
        en: "Royalty per unit (€)",
      }),
      hint: t({
        pt: "Divide o custo mensal pelo nº de unidades vendidas, ou define um valor fixo por peça.",
        en: "Divide monthly cost by units sold, or set a fixed amount per piece.",
      }),
      empty: t({
        pt: "Nenhuma licença configurada.",
        en: "No licenses configured.",
      }),
      save: t({ pt: "Guardar", en: "Save" }),
      toast: {
        saved: t({ pt: "Licença guardada!", en: "License saved!" }),
        deleted: t({ pt: "Licença eliminada.", en: "License deleted." }),
        error: t({ pt: "Erro", en: "Error" }),
      },
    },
    company: {
      heading: t({ pt: "Identidade da Empresa", en: "Company Identity" }),
      logo: t({ pt: "Logotipo", en: "Logo" }),
      logoHint: t({
        pt: "Usado em faturas e relatórios. PNG ou SVG, máx. 2MB.",
        en: "Used in invoices and reports. PNG or SVG, max 2MB.",
      }),
      uploadLogo: t({ pt: "Carregar logotipo", en: "Upload logo" }),
      name: t({ pt: "Nome / Marca", en: "Name / Brand" }),
      address: t({ pt: "Morada", en: "Address" }),
      email: t({ pt: "Email", en: "Email" }),
      phone: t({ pt: "Telemóvel", en: "Phone" }),
      website: t({ pt: "Website", en: "Website" }),
      vatId: t({ pt: "NIF / VAT ID", en: "VAT ID / NIF" }),
      save: t({ pt: "Guardar", en: "Save" }),
      saving: t({ pt: "A guardar...", en: "Saving..." }),
      saved: t({ pt: "Empresa guardada!", en: "Company saved!" }),
    },
    locations: {
      heading: t({ pt: "Logística de Armazém", en: "Warehouse Logistics" }),
      addButton: t({ pt: "Adicionar Localização", en: "Add Location" }),
      name: t({ pt: "Nome da localização", en: "Location name" }),
      namePlaceholder: t({
        pt: "ex: Prateleira A1, Caixa Seca 02",
        en: "e.g. Shelf A1, Dry Box 02",
      }),
      hint: t({
        pt: "Estes nomes aparecem como dropdown no Inventário de Filamentos para saberes onde está cada rolo.",
        en: "These names appear as a dropdown in Filament Inventory so you know where each spool is.",
      }),
      empty: t({
        pt: "Nenhuma localização definida.",
        en: "No locations defined.",
      }),
      save: t({ pt: "Guardar", en: "Save" }),
      toast: {
        saved: t({ pt: "Localização guardada!", en: "Location saved!" }),
        deleted: t({ pt: "Localização eliminada.", en: "Location deleted." }),
        error: t({ pt: "Erro", en: "Error" }),
      },
    },
    appearance: {
      heading: t({ pt: "Aparência", en: "Appearance" }),
      themeLabel: t({ pt: "Tema da interface", en: "Interface theme" }),
      themeDescription: t({
        pt: "Escolhe entre o modo escuro e claro. A preferência é guardada no browser.",
        en: "Choose between dark and light mode. The preference is saved in your browser.",
      }),
      dark: t({ pt: "Escuro", en: "Dark" }),
      light: t({ pt: "Claro", en: "Light" }),
    },
    privacy: {
      heading: t({ pt: "Privacidade & Dados", en: "Privacy & Data" }),
      exportTitle: t({ pt: "Exportar os meus dados", en: "Export my data" }),
      exportDesc: t({
        pt: "Exporta todos os teus dados em formato JSON. Inclui filamentos, produtos, vendas e produções. Requisito RGPD.",
        en: "Export all your data in JSON format. Includes filaments, products, sales and production. GDPR requirement.",
      }),
      exportButton: t({
        pt: "Exportar Tudo (.json)",
        en: "Export All (.json)",
      }),
      exporting: t({ pt: "A exportar...", en: "Exporting..." }),
      linksTitle: t({ pt: "Documentos Legais", en: "Legal Documents" }),
      privacy: t({ pt: "Política de Privacidade", en: "Privacy Policy" }),
      terms: t({ pt: "Termos de Serviço", en: "Terms of Service" }),
    },
    toast: {
      error: t({ pt: "Erro", en: "Error" }),
    },
  },
} satisfies DeclarationContent;

export default settingsContent;
