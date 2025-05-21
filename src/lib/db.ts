import { PrismaClient } from '@prisma/client';

// Necessário para forçar o Prisma a reconhecer o modelo LeadForm
declare global {
  var prisma: PrismaClient | undefined
}

export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

export { db as prisma }; 