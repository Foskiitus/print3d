import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const sales = await prisma.sale.findMany({
    where: {
      ...(productId ? { productId: Number(productId) } : {}),
      ...(from || to ? {
        date: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        }
      } : {}),
    },
    include: { product: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(sales)
}

export async function POST(req: NextRequest) {
  try {
    const { productId, customerName, quantity, salePrice } = await req.json()
    if (!productId || !customerName || !quantity || quantity <= 0 || !salePrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    if (product.stockLevel < Number(quantity)) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.stockLevel}` },
        { status: 422 }
      )
    }

    const [sale] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          productId: Number(productId),
          customerName: customerName.trim(),
          quantity: Number(quantity),
          salePrice: Number(salePrice),
        },
        include: { product: true }
      }),
      prisma.product.update({
        where: { id: Number(productId) },
        data: { stockLevel: { decrement: Number(quantity) } }
      })
    ])
    return NextResponse.json(sale, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to register sale' }, { status: 500 })
  }
}
