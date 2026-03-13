import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const logs = await prisma.productionLog.findMany({
    include: { product: true },
    orderBy: { date: 'desc' },
    take: 50,
  })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  try {
    const { productId, quantity, notes } = await req.json()
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'productId and positive quantity required' }, { status: 400 })
    }
    const [log] = await prisma.$transaction([
      prisma.productionLog.create({
        data: { productId: Number(productId), quantity: Number(quantity), notes: notes || null }
      }),
      prisma.product.update({
        where: { id: Number(productId) },
        data: { stockLevel: { increment: Number(quantity) } }
      })
    ])
    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to log production' }, { status: 500 })
  }
}
