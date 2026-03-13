import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return <UsersClient users={users} />
}
