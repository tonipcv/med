import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// POST - Adicionar um novo endereço
export async function POST(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const { name, address, isDefault } = await request.json();

    // Validar campos obrigatórios
    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    // Se este endereço for definido como padrão, remover o padrão dos outros
    if (isDefault) {
      await prisma.pageAddress.updateMany({
        where: { pageId: params.pageId },
        data: { isDefault: false }
      });
    }

    // Criar o novo endereço
    const newAddress = await prisma.pageAddress.create({
      data: {
        id: nanoid(),
        pageId: params.pageId,
        name,
        address,
        isDefault: isDefault || false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Error creating address' },
      { status: 500 }
    );
  }
}

// GET - Obter todos os endereços de uma página
export async function GET(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    // Buscar endereços da página
    const pageAddresses = await prisma.pageAddress.findMany({
      where: {
        pageId: params.pageId
      }
    });

    return NextResponse.json(pageAddresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Error fetching addresses' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar todos os endereços de uma página
export async function PUT(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const { addressList } = await request.json();

    if (!Array.isArray(addressList)) {
      return NextResponse.json(
        { error: 'Addresses must be an array' },
        { status: 400 }
      );
    }

    // Validar que cada endereço tem os campos obrigatórios
    for (const addr of addressList) {
      if (!addr.name || !addr.address) {
        return NextResponse.json(
          { error: 'Each address must have name and address fields' },
          { status: 400 }
        );
      }
    }

    // Verificar que há pelo menos um endereço padrão se houver endereços
    let updatedAddressList = [...addressList];
    if (updatedAddressList.length > 0 && !updatedAddressList.some(addr => addr.isDefault)) {
      updatedAddressList[0].isDefault = true;
    }

    // Excluir endereços atuais
    await prisma.pageAddress.deleteMany({
      where: { pageId: params.pageId }
    });

    // Criar novos endereços
    const newAddresses = await Promise.all(
      updatedAddressList.map(addr =>
        prisma.pageAddress.create({
          data: {
            id: nanoid(),
            pageId: params.pageId,
            name: addr.name,
            address: addr.address,
            isDefault: addr.isDefault || false,
            updatedAt: new Date()
          }
        })
      )
    );

    return NextResponse.json(newAddresses);
  } catch (error) {
    console.error('Error updating addresses:', error);
    return NextResponse.json(
      { error: 'Error updating addresses' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    await prisma.pageAddress.deleteMany({
      where: { pageId: params.pageId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting addresses:', error);
    return NextResponse.json(
      { error: 'Error deleting addresses' },
      { status: 500 }
    );
  }
} 