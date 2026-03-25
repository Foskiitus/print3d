import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/production/orders
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const orders = await prisma.productionOrder.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              bom: {
                include: {
                  component: {
                    include: {
                      profiles: { include: { filaments: true }, take: 1 },
                      stock: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      printJobs: {
        include: {
          printer: { include: { preset: true } },
          items: {
            include: {
              component: true,
              profile: { include: { filaments: true } },
            },
          },
          materials: { include: { spool: { include: { item: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST /api/production/orders
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const { items, origin, notes } = await req.json();

    if (!items?.length) {
      return NextResponse.json(
        { error: "Adiciona pelo menos um produto" },
        { status: 400 },
      );
    }

    // Gerar referência única
    const count = await prisma.productionOrder.count({ where: { userId } });
    const reference = `OP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const order = await prisma.productionOrder.create({
      data: {
        userId,
        reference,
        notes: notes ?? null,
        status: "pending",
        items: {
          create: items.map(
            (item: { productId: string; quantity: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              completed: 0,
            }),
          ),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                bom: {
                  include: {
                    component: {
                      include: {
                        profiles: { include: { filaments: true }, take: 1 },
                        stock: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        printJobs: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/production/orders]", err);
    return NextResponse.json(
      { error: "Falha ao criar ordem", details: err.message },
      { status: 500 },
    );
  }
}
