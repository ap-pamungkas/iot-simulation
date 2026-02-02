import { PrismaClient } from "@/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as { prisma: any };

// Inisialisasi tanpa argumen karena file kustom kamu menolak 'datasources'
// Prisma akan otomatis mencari variabel lingkungan DATABASE_URL
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;