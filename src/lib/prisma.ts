import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaMariaDb;
};

const databaseUrl = process.env.DB_URL;

if (!databaseUrl) {
  throw new Error("Missing DB_URL environment variable");
}

function buildAdapterConfig(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port) : 3306,
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    allowPublicKeyRetrieval: true,
    connectTimeout: 30000,
    socketTimeout: 30000,
    connectionLimit: 5,
  };
}

const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaMariaDb(buildAdapterConfig(databaseUrl));

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prisma = prisma;
}
