import { PrismaClient } from "@/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as { prisma: any };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Gunakan objek datasources untuk menyuntikkan URL Accelerate
    datasources: {
      db: {
        url: process.env.DATABASE_URL, 
      },
    },
  } as any).$extends(withAccelerate()); // Tambahkan 'as any' jika tipe 'datasources' ditolak

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;