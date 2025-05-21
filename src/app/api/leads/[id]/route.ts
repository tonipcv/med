import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Obtém detalhes de um lead específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     responses:
 *       200:
 *         description: Detalhes do lead obtidos com sucesso
 *       404:
 *         description: Lead não encontrado
 *       401:
 *         description: Não autorizado
 */
export async function GET(
  req: NextRequest,
  { params }
) {
  try {
    const id = params.id;
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar lead com todas as informações relacionadas
    const lead = await prisma.leads.findUnique({
      where: {
        id,
        user_id: session.user.id
      },
      include: {
        indication: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Erro ao buscar detalhes do lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads/{id}:
 *   patch:
 *     summary: Atualiza informações de um lead
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [new, contacted, converted, lost]
 *     responses:
 *       200:
 *         description: Lead atualizado com sucesso
 *       404:
 *         description: Lead não encontrado
 *       401:
 *         description: Não autorizado
 */
export async function PATCH(
  req: NextRequest,
  { params }
) {
  try {
    const id = params.id;
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const data = await req.json();
    const { 
      name, 
      email, 
      phone, 
      status, 
      appointmentDate, 
      appointmentTime,
      medicalNotes,
      potentialValue,
      source,
      pipelineId
    } = data;

    // Verificar se o lead existe e pertence ao usuário
    const leadExists = await prisma.leads.findUnique({
      where: {
        id,
        user_id: session.user.id
      }
    });

    if (!leadExists) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    // Se um pipelineId foi fornecido, verifica se a pipeline existe e pertence ao usuário
    if (pipelineId) {
      const pipeline = await prisma.pipelines.findFirst({
        where: {
          id: pipelineId,
          user_id: session.user.id
        }
      });

      if (!pipeline) {
        return NextResponse.json({ error: 'Pipeline não encontrada' }, { status: 404 });
      }
    }

    let appointmentDateTime = null;
    if (appointmentDate && appointmentTime) {
      appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (potentialValue !== undefined) updateData.potentialValue = parseFloat(potentialValue);
    if (appointmentDateTime !== undefined) updateData.appointmentDate = appointmentDateTime;
    if (medicalNotes !== undefined) updateData.medicalNotes = medicalNotes;
    if (source !== undefined) updateData.source = source;
    if (pipelineId !== undefined) updateData.pipelineId = pipelineId;
    updateData.updatedAt = new Date();

    // Atualizar o lead
    const updatedLead = await prisma.leads.update({
      where: {
        id
      },
      data: updateData,
      include: {
        indication: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedLead,
      message: 'Lead atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads/{id}:
 *   delete:
 *     summary: Remove um lead
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     responses:
 *       200:
 *         description: Lead removido com sucesso
 *       404:
 *         description: Lead não encontrado
 *       401:
 *         description: Não autorizado
 */
export async function DELETE(
  req: NextRequest,
  { params }
) {
  try {
    const id = params.id;
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o lead existe e pertence ao usuário
    const leadExists = await prisma.leads.findUnique({
      where: {
        id,
        user_id: session.user.id
      }
    });

    if (!leadExists) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    // Remover o lead
    await prisma.leads.delete({
      where: {
        id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lead removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 