import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaBetterSqlite3({ url: 'file:prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.sale.deleteMany()
  await prisma.productionLog.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()

  // Create default users
  const adminPassword = await bcrypt.hash('admin123', 12)
  const viewerPassword = await bcrypt.hash('viewer123', 12)

  await prisma.user.create({
    data: { name: 'Administrador', email: 'admin@print3d.com', password: adminPassword, role: 'admin' }
  })
  await prisma.user.create({
    data: { name: 'Visualizador', email: 'viewer@print3d.com', password: viewerPassword, role: 'viewer' }
  })

  console.log('✓ Utilizadores criados:')
  console.log('  admin@print3d.com / admin123')
  console.log('  viewer@print3d.com / viewer123')

  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Suporte Ergonômico', productionCost: 12.50, recommendedPrice: 65.00, stockLevel: 8 } }),
    prisma.product.create({ data: { name: 'Case Headphone', productionCost: 18.00, recommendedPrice: 90.00, stockLevel: 5 } }),
    prisma.product.create({ data: { name: 'Miniatura RPG', productionCost: 8.00, recommendedPrice: 45.00, stockLevel: 14 } }),
    prisma.product.create({ data: { name: 'Peça Mecânica', productionCost: 22.00, recommendedPrice: 110.00, stockLevel: 3 } }),
    prisma.product.create({ data: { name: 'Placa de Nome', productionCost: 5.00, recommendedPrice: 30.00, stockLevel: 20 } }),
    prisma.product.create({ data: { name: 'Case Personalizado', productionCost: 15.00, recommendedPrice: 75.00, stockLevel: 6 } }),
  ])

  const now = new Date()
  const customers = ['Carlos Mendes', 'Ana Souza', 'Julia Ferreira', 'Pedro Costa', 'Maria Santos', 'Rafael Lima', 'Bruno Oliveira', 'Camila Reis']

  for (let i = 89; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const count = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < count; j++) {
      const product = products[Math.floor(Math.random() * products.length)]
      await prisma.sale.create({
        data: {
          productId: product.id,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          quantity: Math.floor(Math.random() * 3) + 1,
          salePrice: product.recommendedPrice * (0.9 + Math.random() * 0.2),
          date,
        }
      })
    }
  }

  for (const product of products) {
    const logDate = new Date(now)
    logDate.setDate(logDate.getDate() - 30)
    await prisma.productionLog.create({
      data: { productId: product.id, quantity: product.stockLevel + 5, notes: 'Estoque inicial', date: logDate }
    })
  }

  console.log('✓ Seed completo!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
