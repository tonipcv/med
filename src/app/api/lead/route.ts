import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Indication } from '@prisma/client';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      phone, 
      userSlug, 
      indicationSlug,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    } = body;

    if (!name || !phone || !userSlug) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, phone, userSlug' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { slug: userSlug }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    let indication: Indication | null = null;
    if (indicationSlug) {
      indication = await prisma.indication.findFirst({
        where: {
          slug: indicationSlug,
          userId: user.id
        }
      });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const lead = await prisma.leads.create({
      data: {
        id: nanoid(),
        name,
        phone,
        user_id: user.id,
        indicationId: indication?.id || null,
        source,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        status: 'Novo'
      }
    });

    await prisma.event.create({
      data: {
        id: nanoid(),
        type: 'lead',
        userId: user.id,
        indicationId: indication?.id || null,
        ip: ip.toString(),
        userAgent,
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