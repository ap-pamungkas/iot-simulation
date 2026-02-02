import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_ACCELERATE_URL!,
});

export default prisma;
