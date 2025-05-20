import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { hash } from 'bcryptjs';

// GET /api/doctors - Lista todos os médicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.type !== 'user') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const doctors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        phone: true,
        image: true,
        slug: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Erro ao listar médicos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// POST /api/doctors - Adiciona um novo médico ou importa vários via CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.type !== 'user') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const csvFile = formData.get('csv') as File;
    const singleDoctor = formData.get('doctor') as string;

    // Se tiver um arquivo CSV, processa a importação em massa
    if (csvFile) {
      const csvText = await csvFile.text();
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
      });

      const results = {
        success: 0,
        errors: [] as Array<{ row: number; error: string }>,
      };

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          // Validar campos obrigatórios
          if (!record.name || !record.email) {
            throw new Error('Nome e email são obrigatórios');
          }

          // Gerar slug a partir do nome
          const slug = record.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

          // Verificar se já existe um usuário com este email
          const existingUser = await prisma.user.findUnique({
            where: { email: record.email },
          });

          if (existingUser) {
            throw new Error('Email já cadastrado');
          }

          // Criar o novo médico
          await prisma.user.create({
            data: {
              name: record.name,
              email: record.email,
              specialty: record.specialty || null,
              phone: record.phone || null,
              slug,
              password: await hash('changeme123', 12), // Default password that should be changed on first login
            },
          });

          results.success++;
        } catch (error) {
          results.errors.push({
            row: i + 2, // +2 porque i começa em 0 e precisamos contar o cabeçalho
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      return NextResponse.json(results);
    }

    // Se não tiver CSV, processa um único médico
    if (singleDoctor) {
      const doctorData = JSON.parse(singleDoctor);

      // Validar campos obrigatórios
      if (!doctorData.name || !doctorData.email) {
        return NextResponse.json(
          { error: 'Nome e email são obrigatórios' },
          { status: 400 }
        );
      }

      // Gerar slug a partir do nome
      const slug = doctorData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Verificar se já existe um usuário com este email
      const existingUser = await prisma.user.findUnique({
        where: { email: doctorData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        );
      }

      // Criar o novo médico
      const newDoctor = await prisma.user.create({
        data: {
          name: doctorData.name,
          email: doctorData.email,
          specialty: doctorData.specialty || null,
          phone: doctorData.phone || null,
          slug,
          password: await hash('changeme123', 12), // Default password that should be changed on first login
        },
      });

      return NextResponse.json(newDoctor);
    }

    return NextResponse.json(
      { error: 'Nenhum dado fornecido' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao adicionar médico:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 