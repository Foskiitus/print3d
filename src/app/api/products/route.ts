import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, imageUrl, productionCost, recommendedPrice, stockLevel } = body
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl || null,
        productionCost: Number(productionCost) || 0,
        recommendedPrice: Number(recommendedPrice) || 0,
        stockLevel: Number(stockLevel) || 0,
      }
    })
    return NextResponse.json(product, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
