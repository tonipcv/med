const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Starting migration process...');

    // 1. Check and add title column
    console.log('Checking title column...');
    const hasTitle = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Form' 
        AND column_name = 'title'
      );
    `;
    
    if (!hasTitle[0].exists) {
      console.log('Adding title column...');
      await prisma.$executeRaw`ALTER TABLE "Form" ADD COLUMN "title" TEXT`;
      await prisma.$executeRaw`UPDATE "Form" SET "title" = "name" WHERE "title" IS NULL`;
      await prisma.$executeRaw`ALTER TABLE "Form" ALTER COLUMN "title" SET NOT NULL`;
    }

    // 2. Create FormBlock table
    console.log('Creating FormBlock table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "FormBlock" (
        "id" TEXT NOT NULL,
        "formId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "content" JSONB NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FormBlock_pkey" PRIMARY KEY ("id")
      )
    `;

    // 3. Add index
    console.log('Adding index...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "FormBlock_formId_idx" ON "FormBlock"("formId")
    `;

    // 4. Add foreign key
    console.log('Adding foreign key...');
    await prisma.$executeRaw`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE constraint_name = 'FormBlock_formId_fkey'
        ) THEN
          ALTER TABLE "FormBlock" 
          ADD CONSTRAINT "FormBlock_formId_fkey" 
          FOREIGN KEY ("formId") 
          REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `;

    console.log('SQL migration completed successfully');

    // 5. Run data migration
    console.log('Running data migration...');
    await require('./migrate-forms');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration(); 