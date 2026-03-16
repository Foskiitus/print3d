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

      const [allSales, products, monthlySales, allProductionLogs] =
        await Promise.all([
          prisma.sale.findMany(),
          prisma.product.findMany(),
          prisma.sale.findMany({ where: { date: { gte: monthStart } } }),
          prisma.productionLog.findMany(), // Nova tabela para extrair os custos reais
        ]);

      // O total faturado é a soma de (Preço de Venda * Quantidade) de todas as vendas
      const totalRevenue = allSales.reduce(
        (sum, s) => sum + s.salePrice * s.quantity,
        0,
      );

      // O custo real é a soma de todos os gastos registados nas impressoras
      const totalCost = allProductionLogs.reduce(
        (sum, log) => sum + (log.totalCost || 0),
        0,
      );

      // Lucro Líquido Real = Faturação - Gastos de Produção
      const totalProfit = totalRevenue - totalCost;

      // ==========================================
      // NOVO CÁLCULO DE STOCK DINÂMICO AQUI
      // ==========================================
      // 1. Soma tudo o que já fabricaste
      const totalProducedQuantity = allProductionLogs.reduce(
        (sum, log) => sum + log.quantity,
        0,
      );

      // 2. Soma tudo o que já vendeste
      const totalSoldQuantity = allSales.reduce(
        (sum, sale) => sum + sale.quantity,
        0,
      );

      // 3. O stock atual é a diferença
      const totalStock = totalProducedQuantity - totalSoldQuantity;

      const monthlySalesVolume = monthlySales.reduce(
        (sum, s) => sum + s.quantity,
        0,
      );
      const monthlyRevenue = monthlySales.reduce(
        (sum, s) => sum + s.salePrice * s.quantity,
        0,
      );

      return NextResponse.json({
        totalProfit,
        totalStock,
        monthlySalesVolume,
        monthlyRevenue,
      });
    }

    // 2. GRÁFICO DE EVOLUÇÃO DE VENDAS (Linhas/Barras)
    if (type === "sales-chart") {
      const days = Number(searchParams.get("days") || 30);
      const since = subDays(new Date(), days);

      const sales = await prisma.sale.findMany({
        where: { date: { gte: since } },
        orderBy: { date: "asc" },
      });

      // Inicializa um objeto com todos os dias a 0, para que o gráfico não tenha "buracos"
      const grouped: Record<string, { revenue: number; count: number }> = {};
      for (let i = days; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        grouped[d] = { revenue: 0, count: 0 };
      }

      // Preenche os dias com as vendas reais
      for (const sale of sales) {
        const d = format(new Date(sale.date), "yyyy-MM-dd");
        if (grouped[d]) {
          grouped[d].revenue += sale.salePrice * sale.quantity;
          grouped[d].count += sale.quantity;
        }
      }

      // Converte o objeto de volta para um array para o frontend usar no Recharts
      return NextResponse.json(
        Object.entries(grouped).map(([date, v]) => ({ date, ...v })),
      );
    }

    // 3. TOP 5 PRODUTOS MAIS VENDIDOS
    if (type === "top-products") {
      const sales = await prisma.sale.findMany({ include: { product: true } });
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
  } catch (error) {
    console.error("Erro na rota de analytics:", error);
    return NextResponse.json(
      { error: "Falha ao processar os dados analíticos" },
      { status: 500 },
    );
  }
}
