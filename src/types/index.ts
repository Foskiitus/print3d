export type Product = {
  id: number
  name: string
  imageUrl: string | null
  productionCost: number
  recommendedPrice: number
  stockLevel: number
  createdAt: string
  updatedAt: string
}

export type ProductionLog = {
  id: number
  productId: number
  quantity: number
  notes: string | null
  date: string
  product?: Product
}

export type Sale = {
  id: number
  productId: number
  customerName: string
  quantity: number
  salePrice: number
  date: string
  product?: Product
}

export type KPIData = {
  totalProfit: number
  totalStock: number
  monthlySalesVolume: number
  monthlyRevenue: number
}

export type SalesChartData = {
  date: string
  revenue: number
  count: number
}

export type TopProductData = {
  name: string
  totalSold: number
  revenue: number
}
