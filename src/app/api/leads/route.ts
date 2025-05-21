import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Lista leads do usuário com opções de filtro e ordenação
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo para buscar por nome, email ou telefone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, contacted, converted, lost]
 *         description: Filtrar por status do lead
 *       - in: query
 *         name: indication
 *         schema:
 *           type: string
 *         description: ID da indicação para filtrar
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página atual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de registros por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, status]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista de leads obtida com sucesso
 *       401:
 *         description: Não autorizado
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor, faça login novamente.' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    const leads = await prisma.leads.findMany({
      where: {
        user_id: session.user.id,
        pipelineId: pipelineId || undefined,
        status: {
          not: 'Removido'
        }
      },
      include: {
        indication: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!leads || leads.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads:
 *   put:
 *     summary: Atualiza o status de um ou mais leads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [new, contacted, converted, lost]
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { ids, status } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs de leads inválidos' },
        { status: 400 }
      );
    }

    if (!status || !['Novo', 'Contato', 'Convertido', 'Perdido'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    const count = await prisma.leads.count({
      where: {
        id: { in: ids },
        user_id: session.user.id
      }
    });

    if (count !== ids.length) {
      return NextResponse.json(
        { error: 'Um ou mais leads não pertencem ao usuário' },
        { status: 403 }
      );
    }

    const updatedLeads = await prisma.leads.updateMany({
      where: {
        id: { in: ids },
        user_id: session.user.id
      },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      count: updatedLeads.count,
      message: `Status de ${updatedLeads.count} lead(s) atualizado com sucesso`
    });
  } catch (error) {
    console.error('Erro ao atualizar status de leads:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads:
 *   patch:
 *     summary: Atualiza um lead existente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [new, contacted, converted, lost]
 *               interest:
 *                 type: string
 *               source:
 *                 type: string
 *               potentialValue:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *               medicalNotes:
 *                 type: string
 *               pipelineId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Lead não encontrado
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }

    const lead = await prisma.leads.findUnique({
      where: { id },
      select: { user_id: true }
    });

    if (!lead || lead.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    const processedData = {
      ...updateData,
      potentialValue: updateData.potentialValue ? parseFloat(updateData.potentialValue) : undefined,
      appointmentDate: updateData.appointmentDate ? new Date(updateData.appointmentDate) : undefined,
      updatedAt: new Date()
    };

    const updatedLead = await prisma.leads.update({
      where: { id },
      data: processedData,
      include: {
        indication: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lead' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads:
 *   delete:
 *     summary: Exclui um lead específico
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead a ser excluído
 *     responses:
 *       200:
 *         description: Lead excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Lead não encontrado
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do lead não fornecido' },
        { status: 400 }
      );
    }

    const lead = await prisma.leads.findFirst({
      where: {
        id,
        user_id: session.user.id
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    await prisma.leads.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Lead removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover lead:', error);
    return NextResponse.json(
      { error: 'Erro ao remover lead' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Cria um novo lead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [new, contacted, converted, lost]
 *               interest:
 *                 type: string
 *               source:
 *                 type: string
 *               potentialValue:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *               medicalNotes:
 *                 type: string
 *               pipelineId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lead criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      name, 
      phone, 
      email,
      status = 'Novo',
      source,
      potentialValue,
      appointmentDate,
      medicalNotes,
      pipelineId
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    const lead = await prisma.leads.create({
      data: {
        id: nanoid(),
        name,
        phone,
        email,
        status,
        source,
        potentialValue: potentialValue ? parseFloat(potentialValue) : null,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        medicalNotes,
        pipelineId,
        user_id: session.user.id
      },
      include: {
        indication: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 