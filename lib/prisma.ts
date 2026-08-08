import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Configurable connection-pool size. The pg default is 10, which queues
// the tail of a concurrent registration burst (800 concurrent writes had
// ~5s p95 latency in load tests). 20-30 keeps throughput high while
// staying well under Neon's connection limit (100 on the free tier).
// Tune via DB_POOL_MAX.
const poolMax = parseInt(process.env.DB_POOL_MAX || "20", 10) || 20;

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({ connectionString, max: poolMax });
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };