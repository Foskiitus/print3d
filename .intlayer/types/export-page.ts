/* eslint-disable */
export default {
  "key": "export-page",
  "content": {
    "nodeType": "translation",
    "translation": {
      "pt": {
        "page": {
          "title": "Exportação",
          "heading": "Exportação",
          "description": "Exporta os teus dados para CSV ou PDF."
        },
        "options": {
          "sales": {
            "label": "Vendas",
            "description": "Histórico completo de vendas com clientes e totais"
          },
          "production": {
            "label": "Produção",
            "description": "Registos de produção com custos detalhados"
          },
          "customers": {
            "label": "Clientes",
            "description": "Lista de clientes com contactos"
          }
        },
        "buttons": {
          "csv": "CSV",
          "pdf": "PDF"
        },
        "hint": "O CSV abre no Excel ou Google Sheets. O PDF abre uma janela de impressão — guarda como PDF nas opções da impressora.",
        "toast": {
          "csvExported": "CSV exportado",
          "records": "registo(s)",
          "exportFailed": "Erro ao exportar"
        },
        "csv": {
          "sales": {
            "date": "Data",
            "product": "Produto",
            "customer": "Cliente",
            "quantity": "Quantidade",
            "pricePerUnit": "Preço/un (€)",
            "total": "Total (€)",
            "notes": "Notas"
          },
          "production": {
            "date": "Data",
            "product": "Produto",
            "printer": "Impressora",
            "quantity": "Quantidade",
            "time": "Tempo (min)",
            "filament": "Filamento (g)",
            "filamentCost": "Custo Filamento (€)",
            "printerCost": "Custo Impressora (€)",
            "energyCost": "Custo Energia (€)",
            "extrasCost": "Custo Extras (€)",
            "totalCost": "Custo Total (€)",
            "notes": "Notas"
          },
          "customers": {
            "name": "Nome",
            "email": "Email",
            "phone": "Telefone",
            "taxId": "NIF",
            "address": "Morada",
            "notes": "Notas",
            "sales": "Vendas"
          }
        },
        "pdf": {
          "sales": {
            "date": "Data",
            "product": "Produto",
            "customer": "Cliente",
            "qty": "Qtd",
            "pricePerUnit": "Preço/un",
            "total": "Total",
            "notes": "Notas"
          },
          "production": {
            "date": "Data",
            "product": "Produto",
            "printer": "Impressora",
            "qty": "Qtd",
            "time": "Tempo",
            "filament": "Filamento",
            "totalCost": "Custo Total",
            "notes": "Notas"
          },
          "customers": {
            "name": "Nome",
            "email": "Email",
            "phone": "Telefone",
            "taxId": "NIF",
            "address": "Morada",
            "sales": "Vendas"
          },
          "footer": {
            "total": "Total",
            "exportedOn": "Exportado em"
          }
        },
        "filenames": {
          "sales": "vendas",
          "production": "producao",
          "customers": "clientes"
        }
      },
      "en": {
        "page": {
          "title": "Export",
          "heading": "Export",
          "description": "Export your data to CSV or PDF."
        },
        "options": {
          "sales": {
            "label": "Sales",
            "description": "Complete sales history with customers and totals"
          },
          "production": {
            "label": "Production",
            "description": "Production records with detailed costs"
          },
          "customers": {
            "label": "Customers",
            "description": "Customer list with contact details"
          }
        },
        "buttons": {
          "csv": "CSV",
          "pdf": "PDF"
        },
        "hint": "CSV files can be opened in Excel or Google Sheets. PDF opens a print dialog — save as PDF from your printer settings.",
        "toast": {
          "csvExported": "CSV exported",
          "records": "record(s)",
          "exportFailed": "Export failed"
        },
        "csv": {
          "sales": {
            "date": "Date",
            "product": "Product",
            "customer": "Customer",
            "quantity": "Quantity",
            "pricePerUnit": "Price/unit (€)",
            "total": "Total (€)",
            "notes": "Notes"
          },
          "production": {
            "date": "Date",
            "product": "Product",
            "printer": "Printer",
            "quantity": "Quantity",
            "time": "Time (min)",
            "filament": "Filament (g)",
            "filamentCost": "Filament Cost (€)",
            "printerCost": "Printer Cost (€)",
            "energyCost": "Energy Cost (€)",
            "extrasCost": "Extras Cost (€)",
            "totalCost": "Total Cost (€)",
            "notes": "Notes"
          },
          "customers": {
            "name": "Name",
            "email": "Email",
            "phone": "Phone",
            "taxId": "Tax ID",
            "address": "Address",
            "notes": "Notes",
            "sales": "Sales"
          }
        },
        "pdf": {
          "sales": {
            "date": "Date",
            "product": "Product",
            "customer": "Customer",
            "qty": "Qty",
            "pricePerUnit": "Price/unit",
            "total": "Total",
            "notes": "Notes"
          },
          "production": {
            "date": "Date",
            "product": "Product",
            "printer": "Printer",
            "qty": "Qty",
            "time": "Time",
            "filament": "Filament",
            "totalCost": "Total Cost",
            "notes": "Notes"
          },
          "customers": {
            "name": "Name",
            "email": "Email",
            "phone": "Phone",
            "taxId": "Tax ID",
            "address": "Address",
            "sales": "Sales"
          },
          "footer": {
            "total": "Total",
            "exportedOn": "Exported on"
          }
        },
        "filenames": {
          "sales": "sales",
          "production": "production",
          "customers": "customers"
        }
      }
    }
  },
  "localIds": [
    "export-page::local::src/app/[locale]/(app)/export/export.content.ts"
  ]
} as const;
