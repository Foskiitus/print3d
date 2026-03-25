"use client";

import { useState } from "react";
import { useIntlayer, useLocale } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale);
}

export function ExportClient() {
  const { locale } = useLocale();
  const content = useIntlayer("export-page");
  const [loading, setLoading] = useState<string | null>(null);

  // ── CSV Generation ────────────────────────────────────────────
  function generateCSV(data: any[], type: DataType): string {
    if (type === "sales") {
      const headers = [
        content.csv.sales.date.value,
        content.csv.sales.product.value,
        content.csv.sales.customer.value,
        content.csv.sales.quantity.value,
        content.csv.sales.pricePerUnit.value,
        content.csv.sales.total.value,
        content.csv.sales.notes.value,
      ];
      const rows = data.map((s) => [
        formatDate(s.date, locale),
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
        content.csv.production.date.value,
        content.csv.production.product.value,
        content.csv.production.printer.value,
        content.csv.production.quantity.value,
        content.csv.production.time.value,
        content.csv.production.filament.value,
        content.csv.production.filamentCost.value,
        content.csv.production.printerCost.value,
        content.csv.production.energyCost.value,
        content.csv.production.extrasCost.value,
        content.csv.production.totalCost.value,
        content.csv.production.notes.value,
      ];
      const rows = data.map((p) => [
        formatDate(p.date, locale),
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
        content.csv.customers.name.value,
        content.csv.customers.email.value,
        content.csv.customers.phone.value,
        content.csv.customers.taxId.value,
        content.csv.customers.address.value,
        content.csv.customers.notes.value,
        content.csv.customers.sales.value,
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
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── HTML Generation for PDF ───────────────────────────────────
  function generatePrintHTML(
    data: any[],
    type: DataType,
    title: string,
  ): string {
    const date = new Date().toLocaleDateString(locale);
    const p = content.pdf;

    let tableHTML = "";

    if (type === "sales") {
      const totalRevenue = data.reduce(
        (s, x) => s + x.salePrice * x.quantity,
        0,
      );
      tableHTML = `
        <table>
          <thead><tr>
            <th>${p.sales.date.value}</th><th>${p.sales.product.value}</th><th>${p.sales.customer.value}</th>
            <th>${p.sales.qty.value}</th><th>${p.sales.pricePerUnit.value}</th><th>${p.sales.total.value}</th><th>${p.sales.notes.value}</th>
          </tr></thead>
          <tbody>
            ${data
              .map(
                (s) => `<tr>
              <td>${formatDate(s.date, locale)}</td>
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
            <td colspan="5"><strong>${p.footer.total.value}</strong></td>
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
            <th>${p.production.date.value}</th><th>${p.production.product.value}</th><th>${p.production.printer.value}</th>
            <th>${p.production.qty.value}</th><th>${p.production.time.value}</th><th>${p.production.filament.value}</th><th>${p.production.totalCost.value}</th><th>${p.production.notes.value}</th>
          </tr></thead>
          <tbody>
            ${data
              .map(
                (prod) => `<tr>
              <td>${formatDate(prod.date, locale)}</td>
              <td>${prod.product?.name ?? ""}</td>
              <td>${prod.printer?.name ?? "—"}</td>
              <td>${prod.quantity}</td>
              <td>${prod.printTime ? `${Math.floor(prod.printTime / 60)}h ${prod.printTime % 60}min` : "—"}</td>
              <td>${prod.filamentUsed != null ? `${prod.filamentUsed}g` : "—"}</td>
              <td><strong>${formatCurrency(prod.totalCost ?? 0)}</strong></td>
              <td>${prod.notes ?? "—"}</td>
            </tr>`,
              )
              .join("")}
          </tbody>
          <tfoot><tr>
            <td colspan="6"><strong>${p.footer.total.value}</strong></td>
            <td><strong>${formatCurrency(totalCost)}</strong></td>
            <td></td>
          </tr></tfoot>
        </table>`;
    }

    if (type === "customers") {
      tableHTML = `
        <table>
          <thead><tr>
            <th>${p.customers.name.value}</th><th>${p.customers.email.value}</th><th>${p.customers.phone.value}</th><th>${p.customers.taxId.value}</th><th>${p.customers.address.value}</th><th>${p.customers.sales.value}</th>
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
<html lang="${locale}">
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
  <p class="meta">${p.footer.exportedOn.value} ${date} • ${data.length} ${content.toast.records.value}</p>
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

  // ── Export options config ─────────────────────────────────────
  const EXPORT_OPTIONS = [
    {
      type: "sales" as DataType,
      label: content.options.sales.label.value,
      description: content.options.sales.description.value,
      icon: ShoppingCart,
      endpoint: "/api/export/sales",
      filename: content.filenames.sales.value,
    },
    {
      type: "production" as DataType,
      label: content.options.production.label.value,
      description: content.options.production.description.value,
      icon: Factory,
      endpoint: "/api/export/production",
      filename: content.filenames.production.value,
    },
    {
      type: "customers" as DataType,
      label: content.options.customers.label.value,
      description: content.options.customers.description.value,
      icon: Users,
      endpoint: "/api/export/customers",
      filename: content.filenames.customers.value,
    },
  ];

  const handleExport = async (
    option: (typeof EXPORT_OPTIONS)[0],
    format: Format,
  ) => {
    const key = `${option.type}-${format}`;
    setLoading(key);
    try {
      const res = await fetch(option.endpoint, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${option.filename}_${dateStr}`;

      if (format === "csv") {
        const csv = generateCSV(data, option.type);
        downloadCSV(csv, `${filename}.csv`);
        toast({
          title: content.toast.csvExported.value,
          description: `${data.length} ${content.toast.records.value}`,
        });
      } else {
        const html = generatePrintHTML(data, option.type, option.label);
        printHTML(html);
      }
    } catch (error: any) {
      toast({
        title: content.toast.exportFailed.value,
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
                    {content.buttons.csv.value}
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
                    {content.buttons.pdf.value}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs text-muted-foreground text-center pt-2">
        {content.hint.value}
      </p>
    </div>
  );
}
