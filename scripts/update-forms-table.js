const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateFormsTable() {
  try {
    // Create Form table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Form" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "createdBy" TEXT NOT NULL,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "category" TEXT,
        "fields" JSONB[] DEFAULT '{}',
        "settings" JSONB NOT NULL DEFAULT '{}',
        "style" JSONB NOT NULL DEFAULT '{}',
        "stats" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create FormSubmission table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "FormSubmission" (
        "id" TEXT PRIMARY KEY,
        "formId" TEXT NOT NULL,
        "data" JSONB NOT NULL,
        "metadata" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Add index on createdBy
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "Form_createdBy_idx" ON "Form"("createdBy");
    `);

    // Add foreign key constraint if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE constraint_name = 'Form_createdBy_fkey'
        ) THEN
          ALTER TABLE "Form"
          ADD CONSTRAINT "Form_createdBy_fkey"
          FOREIGN KEY ("createdBy")
          REFERENCES "User"(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✅ Forms table updated successfully');
  } catch (error) {
    console.error('Error updating forms table:', error);
  } finally {
    await pool.end();
  }
}

updateFormsTable(); 