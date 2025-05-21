-- Add title column to Form table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Form' AND column_name = 'title') THEN
        ALTER TABLE "Form" ADD COLUMN "title" TEXT;
        -- Set title to name for existing records
        UPDATE "Form" SET "title" = "name" WHERE "title" IS NULL;
        -- Make title NOT NULL after migration
        ALTER TABLE "Form" ALTER COLUMN "title" SET NOT NULL;
    END IF;
END $$;

-- Create FormBlock table if it doesn't exist
CREATE TABLE IF NOT EXISTS "FormBlock" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormBlock_pkey" PRIMARY KEY ("id")
);

-- Add index on formId if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'FormBlock' AND indexname = 'FormBlock_formId_idx') THEN
        CREATE INDEX "FormBlock_formId_idx" ON "FormBlock"("formId");
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
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