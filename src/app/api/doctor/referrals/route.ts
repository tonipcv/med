import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todas as referências do médico
    const referrals = await prisma.patientReferral.findMany({
      where: {
        page: {
          userId: session.user.id
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        page: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        rewards: {
          select: {
            id: true,
            title: true,
            type: true,
            unlockedAt: true,
            textContent: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatar resposta
    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      slug: referral.slug,
      patient: referral.patient,
      page: referral.page,
      stats: {
        visits: referral.visits,
        leads: referral.leads,
        sales: referral.sales
      },
      rewards: referral.rewards.map(reward => ({
        id: reward.id,
        title: reward.title,
        type: reward.type,
        unlockedAt: reward.unlockedAt,
        content: reward.textContent
      }))
    }));

    // Agrupar estatísticas
    const stats = {
      totalVisits: referrals.reduce((sum, r) => sum + r.visits, 0),
      totalLeads: referrals.reduce((sum, r) => sum + r.leads, 0),
      totalSales: referrals.reduce((sum, r) => sum + r.sales, 0),
      activePatients: referrals.length,
      unlockedRewards: referrals.reduce(
        (sum, r) => sum + r.rewards.filter(rw => rw.unlockedAt).length,
        0
      )
    };

    return NextResponse.json({
      referrals: formattedReferrals,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar referrals:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { pageId, patientId } = await req.json();

    // Validar dados
    if (!pageId || !patientId) {
      return NextResponse.json(
        { error: 'pageId e patientId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a página pertence ao usuário
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        userId: session.user.id
      }
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Página não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe uma referência para este paciente e página
    const existingReferral = await prisma.patientReferral.findFirst({
      where: {
        patientId,
        pageId
      }
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Este paciente já tem acesso a esta página' },
        { status: 400 }
      );
    }

    // Criar referência
    const referral = await prisma.patientReferral.create({
      data: {
        id: nanoid(),
        slug: nanoid(10),
        pageId,
        patientId,
        visits: 0,
        leads: 0,
        sales: 0,
        updatedAt: new Date()
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        page: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      id: referral.id,
      slug: referral.slug,
      patient: referral.patient,
      page: referral.page,
      stats: {
        visits: referral.visits,
        leads: referral.leads,
        sales: referral.sales
      }
    });
  } catch (error) {
    console.error('Erro ao criar referral:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 