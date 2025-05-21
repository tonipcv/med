import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFormBlocks() {
  try {
    console.log('🔍 Buscando blocos de formulário...');
    
    // Buscar todos os blocos do tipo FORM
    const formBlocks = await prisma.pageBlock.findMany({
      where: {
        type: 'FORM'
      },
      include: {
        page: true
      }
    });

    console.log(`📊 Encontrados ${formBlocks.length} blocos de formulário`);

    // Atualizar cada bloco
    for (const block of formBlocks) {
      const content = block.content as any;
      
      // Verificar se showInModal está definido corretamente
      const showInModal = content.showInModal === undefined ? false : Boolean(content.showInModal);
      
      // Atualizar o bloco apenas se necessário
      if (content.showInModal !== showInModal) {
        console.log(`🔄 Atualizando bloco ${block.id} da página ${block.page.title}`);
        
        await prisma.pageBlock.update({
          where: { id: block.id },
          data: {
            content: {
              ...content,
              showInModal
            }
          }
        });
        
        console.log(`✅ Bloco ${block.id} atualizado com sucesso`);
      } else {
        console.log(`✓ Bloco ${block.id} já está correto`);
      }
    }

    console.log('🎉 Processo finalizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixFormBlocks(); 