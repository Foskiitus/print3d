import { t, type DeclarationContent } from "intlayer";

const featuresContent = {
  key: "features",
  content: {
    inventory_title: t({ en: "Smart Inventory", pt: "Inventário Inteligente" }),
    inventory_desc: t({
      en: "Track every spool in real time. Low stock alerts, cost per gram and automatic consumption estimates.",
      pt: "Rastreia cada bobina em tempo real. Alertas de stock baixo, custos por grama e estimativas automáticas de consumo.",
    }),
    inventory_tag: t({
      en: "Filaments & Hardware",
      pt: "Filamentos & Hardware",
    }),

    printers_title: t({
      en: "Printer Management",
      pt: "Gestão de Impressoras",
    }),
    printers_desc: t({
      en: "Status of each machine, maintenance history with hour or date reminders, and direct association with the filament in use.",
      pt: "Estado de cada máquina, histórico de manutenção com lembretes por horas ou datas, e associação direta ao filamento em uso.",
    }),
    printers_tag: t({ en: "Machinery", pt: "Maquinaria" }),

    costs_title: t({ en: "Real Costs", pt: "Custos Reais" }),
    costs_desc: t({
      en: "Calculate the exact cost of each part — filament, electricity, labour. Set margins and export to invoices.",
      pt: "Calcula o custo exato de cada peça — filamento, eletricidade, mão de obra. Define margens e exporta para faturas.",
    }),
    costs_tag: t({ en: "Financial", pt: "Financeiro" }),

    qr_title: t({ en: "Quick QR Scan", pt: "Scan QR Rápido" }),
    qr_desc: t({
      en: "Scan a spool or printer with your phone. Immediate action in inventory without opening menus. Perfect at the workbench.",
      pt: "Scan uma bobina ou impressora com o telemóvel. Ação imediata no inventário sem abrir menus. Perfeito em bancada.",
    }),
    qr_tag: t({ en: "Mobile / PWA", pt: "Mobile / PWA" }),

    orders_title: t({ en: "Orders & Sales", pt: "Encomendas & Vendas" }),
    orders_desc: t({
      en: "Log customer orders, track production status and automatically calculate the value of each order.",
      pt: "Regista pedidos de clientes, acompanha o estado de produção e calcula automaticamente o valor de cada encomenda.",
    }),
    orders_tag: t({ en: "Commercial", pt: "Comercial" }),

    maintenance_title: t({
      en: "Predictive Maintenance",
      pt: "Manutenção Preditiva",
    }),
    maintenance_desc: t({
      en: "Schedule reviews by printed hours. Receive alerts before breakdowns. Store photos and history of each intervention.",
      pt: "Agenda revisões por horas impressas. Recebe alertas antes de avarias. Guarda fotos e histórico de cada intervenção.",
    }),
    maintenance_tag: t({ en: "Preventive", pt: "Preventivo" }),
  },
} satisfies DeclarationContent;

export default featuresContent;
