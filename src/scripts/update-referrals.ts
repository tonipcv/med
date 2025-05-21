import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateReferrals() {
  try {
    // 1. Verificar se as colunas existem
    const hasColumns = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'PatientReferral' 
        AND column_name = 'pageId'
      );
    `;

    if (!hasColumns) {
      // 2. Adicionar colunas necessárias se não existirem
      await prisma.$executeRaw`
        ALTER TABLE "PatientReferral"
        ADD COLUMN IF NOT EXISTS "pageId" TEXT,
        ADD COLUMN IF NOT EXISTS "patientId" TEXT;
      `;

      // 3. Criar índices
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "PatientReferral_pageId_idx" ON "PatientReferral"("pageId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "PatientReferral_patientId_idx" ON "PatientReferral"("patientId");
      `;

      // 4. Adicionar foreign keys
      await prisma.$executeRaw`
        ALTER TABLE "PatientReferral"
        ADD CONSTRAINT "PatientReferral_pageId_fkey"
        FOREIGN KEY ("pageId")
        REFERENCES "Page"("id")
        ON DELETE SET NULL;
      `;

      await prisma.$executeRaw`
        ALTER TABLE "PatientReferral"
        ADD CONSTRAINT "PatientReferral_patientId_fkey"
        FOREIGN KEY ("patientId")
        REFERENCES "Patient"("id")
        ON DELETE SET NULL;
      `;
    }

    console.log('✅ Database schema updated successfully');
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateReferrals(); 