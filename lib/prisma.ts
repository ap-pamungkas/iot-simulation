import { PrismaClient } from "@/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as { prisma: any };

// Inisialisasi dengan memaksa tipe 'any' pada constructor untuk melewati validasi Subset
export const prisma =
  globalForPrisma.prisma ||
  (new (PrismaClient as any)({})).$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;