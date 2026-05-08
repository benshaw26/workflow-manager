import { prisma } from './prisma'

export interface Brand {
  id: string
  name: string
  email: string
}

export async function loadBrand(clientId: string): Promise<Brand> {
  const user = await prisma.user.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, email: true },
  })
  if (!user) throw new Error(`Client not found: ${clientId}`)
  return {
    id: user.id,
    name: user.name ?? 'Unknown',
    email: user.email,
  }
}
