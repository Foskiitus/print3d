"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileDown,
  FileText,
  Loader2,
  ShoppingCart,
  Factory,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";

type DataType = "sales" | "production" | "customers";
type Format = "csv" | "pdf";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-PT");
}

// ── Geração de CSV ──────────────────────────────────────────────
function generateCSV(data: any[], type: DataType): string {
  if (type === "sales") {
    const headers = [
      "Data",
      "Produto",
      "Cliente",
      "Quantidade",
      "Preço/un (€)",
      "Total (€)",
      "Notas",
    ];
    const rows = data.map((s) => [
      formatDate(s.date),
      s.product?.name ?? "",
      s.customer?.name ?? s.customerName ?? "",
      s.quantity,
      s.salePrice.toFixed(2),
      (s.salePrice * s.quantity).toFixed(2),
      s.notes ?? "",
    ]);
    return [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
  }

  if (type === "production") {
    const headers = [
      "Data",
      "Produto",
      "Impressora",
      "Quantidade",
      "Tempo (min)",
      "Filamento (g)",
      "Custo Filamento (€)",
      "Custo Impressora (€)",
      "Custo Energia (€)",
      "Custo Extras (€)",
      "Custo Total (€)",
      "Notas",
    ];
    const rows = data.map((p) => [
      formatDate(p.date),
      p.product?.name ?? "",
      p.printer?.name ?? "",
      p.quantity,
      p.printTime ?? "",
      p.filamentUsed ?? "",
      (p.filamentCost ?? 0).toFixed(3),
      (p.printerCost ?? 0).toFixed(3),
      (p.electricityCost ?? 0).toFixed(3),
      (p.extrasCost ?? 0).toFixed(3),
      (p.totalCost ?? 0).toFixed(2),
      p.notes ?? "",
    ]);
    return [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
  }

  if (type === "customers") {
    const headers = [
      "Nome",
      "Email",
      "Telefone",
      "NIF",
      "Morada",
      "Notas",
      "Vendas",
    ];
    const rows = data.map((c) => [
      c.name,
      c.email ?? "",
      c.phone ?? "",
      c.nif ?? "",
      c.address ?? "",
      c.notes ?? "",
      c._count?.sales ?? 0,
    ]);
    return [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
  }

  return "";
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Geração de HTML para PDF ────────────────────────────────────
function generatePrintHTML(data: any[], type: DataType, title: string): string {
  const date = new Date().toLocaleDateString("pt-PT");

  let tableHTML = "";

  if (type === "sales") {
    const totalRevenue = data.reduce((s, x) => s + x.salePrice * x.quantity, 0);
    tableHTML = `
      <table>
        <thead><tr>
          <th>Data</th><th>Produto</th><th>Cliente</th>
          <th>Qtd</th><th>Preço/un</th><th>Total</th><th>Notas</th>
        </tr></thead>
        <tbody>
          ${data
            .map(
              (s) => `<tr>
            <td>${formatDate(s.date)}</td>
            <td>${s.product?.name ?? ""}</td>
            <td>${s.customer?.name ?? s.customerName ?? "—"}</td>
            <td>${s.quantity}</td>
            <td>${formatCurrency(s.salePrice)}</td>
            <td><strong>${formatCurrency(s.salePrice * s.quantity)}</strong></td>
            <td>${s.notes ?? "—"}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
        <tfoot><tr>
          <td colspan="5"><strong>Total</strong></td>
          <td><strong>${formatCurrency(totalRevenue)}</strong></td>
          <td></td>
        </tr></tfoot>
      </table>`;
  }

  if (type === "production") {
    const totalCost = data.reduce((s, x) => s + (x.totalCost ?? 0), 0);
    tableHTML = `
      <table>
        <thead><tr>
          <th>Data</th><th>Produto</th><th>Impressora</th>
          <th>Qtd</th><th>Tempo</th><th>Filamento</th><th>Custo Total</th><th>Notas</th>
        </tr></thead>
        <tbody>
          ${data
            .map(
              (p) => `<tr>
            <td>${formatDate(p.date)}</td>
            <td>${p.product?.name ?? ""}</td>
            <td>${p.printer?.name ?? "—"}</td>
            <td>${p.quantity}</td>
            <td>${p.printTime ? `${Math.floor(p.printTime / 60)}h ${p.printTime % 60}min` : "—"}</td>
            <td>${p.filamentUsed != null ? `${p.filamentUsed}g` : "—"}</td>
            <td><strong>${formatCurrency(p.totalCost ?? 0)}</strong></td>
            <td>${p.notes ?? "—"}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
        <tfoot><tr>
          <td colspan="6"><strong>Total</strong></td>
          <td><strong>${formatCurrency(totalCost)}</strong></td>
          <td></td>
        </tr></tfoot>
      </table>`;
  }

  if (type === "customers") {
    tableHTML = `
      <table>
        <thead><tr>
          <th>Nome</th><th>Email</th><th>Telefone</th><th>NIF</th><th>Morada</th><th>Vendas</th>
        </tr></thead>
        <tbody>
          ${data
            .map(
              (c) => `<tr>
            <td>${c.name}</td>
            <td>${c.email ?? "—"}</td>
            <td>${c.phone ?? "—"}</td>
            <td>${c.nif ?? "—"}</td>
            <td>${c.address ?? "—"}</td>
            <td>${c._count?.sales ?? 0}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
      </table>`;
  }

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 10px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
    td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tfoot td { border-top: 2px solid #e5e7eb; border-bottom: none; padding-top: 8px; }
    tr:last-child td { border-bottom: none; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Exportado em ${date} • ${data.length} registo(s)</p>
  ${tableHTML}
</body>
</html>`;
}

function printHTML(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

// ── Componente principal ────────────────────────────────────────
const EXPORT_OPTIONS = [
  {
    type: "sales" as DataType,
    label: "Vendas",
    description: "Histórico completo de vendas com clientes e totais",
    icon: ShoppingCart,
    endpoint: "/api/export/sales",
    filename: "vendas",
  },
  {
    type: "production" as DataType,
    label: "Produção",
    description: "Registos de produção com custos detalhados",
    icon: Factory,
    endpoint: "/api/export/production",
    filename: "producao",
  },
  {
    type: "customers" as DataType,
    label: "Clientes",
    description: "Lista de clientes com contactos",
    icon: Users,
    endpoint: "/api/export/customers",
    filename: "clientes",
  },
];

export function ExportClient() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (
    option: (typeof EXPORT_OPTIONS)[0],
    format: Format,
  ) => {
    const key = `${option.type}-${format}`;
    setLoading(key);
    try {
      const res = await fetch(option.endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${option.filename}_${dateStr}`;

      if (format === "csv") {
        const csv = generateCSV(data, option.type);
        downloadCSV(csv, `${filename}.csv`);
        toast({
          title: `CSV exportado`,
          description: `${data.length} registo(s)`,
        });
      } else {
        const html = generatePrintHTML(data, option.type, option.label);
        printHTML(html);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {EXPORT_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <Card
            key={option.type}
            className="hover:border-primary/20 transition-colors"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(option, "csv")}
                    disabled={loading !== null}
                  >
                    {loading === `${option.type}-csv` ? (
                      <Loader2 size={13} className="mr-1.5 animate-spin" />
                    ) : (
                      <FileDown size={13} className="mr-1.5" />
                    )}
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(option, "pdf")}
                    disabled={loading !== null}
                  >
                    {loading === `${option.type}-pdf` ? (
                      <Loader2 size={13} className="mr-1.5 animate-spin" />
                    ) : (
                      <FileText size={13} className="mr-1.5" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs text-muted-foreground text-center pt-2">
        O CSV abre no Excel ou Google Sheets. O PDF abre uma janela de impressão
        — guarda como PDF nas opções da impressora.
      </p>
    </div>
  );
}
