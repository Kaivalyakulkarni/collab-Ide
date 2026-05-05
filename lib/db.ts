import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL!
    const adapter = new PrismaPg({ connectionString })
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  return globalForPrisma.prisma
}

export const prisma = getPrismaClient()