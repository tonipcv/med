// Script para criar a tabela PageAddress diretamente via SQL
const { Client } = require('pg');

// URL de conexão do banco de dados
const DATABASE_URL = "postgres://postgres:15b2d8e1ea51476ed626@dpbdp1.easypanel.host:654/servidor?sslmode=disable";

async function createAddressTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados PostgreSQL');

    // Verificar se a tabela já existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PageAddress'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('A tabela PageAddress já existe. Pulando criação.');
    } else {
      // Criar a tabela PageAddress
      console.log('Criando tabela PageAddress...');
      await client.query(`
        CREATE TABLE "PageAddress" (
          "id" TEXT NOT NULL,
          "pageId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "address" TEXT NOT NULL,
          "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "PageAddress_pkey" PRIMARY KEY ("id")
        );
      `);
      
      // Criar índice para pageId
      await client.query(`
        CREATE INDEX "PageAddress_pageId_idx" ON "PageAddress"("pageId");
      `);
      
      // Adicionar chave estrangeira para Page
      await client.query(`
        ALTER TABLE "PageAddress" ADD CONSTRAINT "PageAddress_pageId_fkey"
        FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      console.log('Tabela PageAddress criada com sucesso!');
    }

    // Adicionando a coluna addresses no modelo Page se não existir
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'Page' 
        AND column_name = 'address'
      );
    `);

    if (!columnCheck.rows[0].exists) {
      console.log('Adicionando a coluna address na tabela Page...');
      await client.query(`
        ALTER TABLE "Page" ADD COLUMN "address" TEXT;
      `);
      console.log('Coluna address adicionada com sucesso!');
    } else {
      console.log('A coluna address já existe na tabela Page.');
    }

  } catch (error) {
    console.error('Erro ao executar operações no banco de dados:', error);
  } finally {
    await client.end();
    console.log('Conexão com o banco de dados fechada');
  }
}

createAddressTable()
  .then(() => console.log('Script concluído com sucesso!'))
  .catch(err => console.error('Erro ao executar o script:', err)); 