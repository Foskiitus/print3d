import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "kpi";

    // 1. DADOS DOS CARDS PRINCIPAIS (KPIs)
    if (type === "kpi") {
      const now = new Date();
      const monthStart = startOfMonth(now);

      // Removemos o prisma.productionLog.findMany() daqui
      const [allSales, products, monthlySales] = await Promise.all([
        prisma.sale.findMany(),
        prisma.product.findMany(),
        prisma.sale.findMany({ where: { date: { gte: monthStart } } }),
      ]);

      // --- DADOS DUMMY PARA SUBSTITUIR PRODUCTION LOG ---
      const dummyTotalCost = 150.75; // Um valor fixo para o custo total de produção

      const totalRevenue = allSales.reduce(
        (sum, s) => sum + s.salePrice * s.quantity,
        0,
      );

      // Lucro Líquido Real usando o valor dummy
      const totalProfit = totalRevenue - dummyTotalCost;

      // Cálculo simplificado de ROI
      const roi = dummyTotalCost > 0 ? (totalProfit / dummyTotalCost) * 100 : 0;

      // Vendas do mês atual
      const monthlyRevenue = monthlySales.reduce(
        (sum, s) => sum + s.salePrice * s.quantity,
        0,
      );

      return NextResponse.json({
        totalRevenue,
        totalProfit,
        totalCost: dummyTotalCost,
        roi,
        monthlyRevenue,
        productCount: products.length,
        salesCount: allSales.length,
      });
    }

    // 2. EVOLUÇÃO DE VENDAS (Últimos 30 dias)
    if (type === "revenue-chart") {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(new Date(), i);
        return format(d, "yyyy-MM-dd");
      }).reverse();

      const startDate = subDays(new Date(), 30);
      const sales = await prisma.sale.findMany({
        where: { date: { gte: startDate } },
      });

      const grouped: Record<string, { revenue: number; count: number }> = {};
      last30Days.forEach((d) => (grouped[d] = { revenue: 0, count: 0 }));

      for (const sale of sales) {
        const d = format(new Date(sale.date), "yyyy-MM-dd");
        if (grouped[d]) {
          grouped[d].revenue += sale.salePrice * sale.quantity;
          grouped[d].count += sale.quantity;
        }
      }

      return NextResponse.json(
        Object.entries(grouped).map(([date, v]) => ({ date, ...v })),
      );
    }

    // 3. TOP 5 PRODUTOS MAIS VENDIDOS
    if (type === "top-products") {
      // Nota: Adicionei o include: { product: true } que faltava ou que o Prisma exige
      const sales = await prisma.sale.findMany({
        include: { product: true },
      });

      const map: Record<
        string,
        { name: string; totalSold: number; revenue: number }
      > = {};

      for (const sale of sales) {
        if (!map[sale.productId]) {
          map[sale.productId] = {
            name: sale.product.name,
            totalSold: 0,
            revenue: 0,
          };
        }
        map[sale.productId].totalSold += sale.quantity;
        map[sale.productId].revenue += sale.salePrice * sale.quantity;
      }

      const top = Object.values(map)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return NextResponse.json(top);
    }

    return NextResponse.json(
      { error: "Tipo de análise inválido" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Erro Analytics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
