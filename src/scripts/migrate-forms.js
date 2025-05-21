const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateFormsData() {
  try {
    console.log('Starting forms migration...');

    // 1. Get all existing forms
    const forms = await prisma.form.findMany();
    console.log(`Found ${forms.length} forms to migrate`);

    // 2. Update each form
    for (const form of forms) {
      console.log(`Migrating form ${form.id}...`);
      
      // Check if form has any fields that should be blocks
      if (form.fields && Array.isArray(form.fields)) {
        // Check if blocks already exist for this form
        const existingBlocks = await prisma.formBlock.findMany({
          where: { formId: form.id }
        });

        if (existingBlocks.length === 0) {
          const blocks = form.fields.map((field, index) => ({
            type: 'FIELD',
            content: field,
            order: index
          }));

          // Create blocks for the form
          for (const block of blocks) {
            await prisma.formBlock.create({
              data: {
                formId: form.id,
                type: block.type,
                content: block.content,
                order: block.order
              }
            });
          }
          console.log(`Created ${blocks.length} blocks for form ${form.id}`);
        } else {
          console.log(`Form ${form.id} already has blocks, skipping...`);
        }
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateFormsData(); 