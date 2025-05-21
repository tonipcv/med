import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Form } from '@/types/forms';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData: Partial<Form> = await request.json();

    // Validate required fields
    if (!formData.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create form with proper JSON serialization
    const form = await prisma.form.create({
      data: {
        id: `form_${Date.now()}`,
        name: formData.name,
        title: formData.name, // Required by schema
        description: formData.description,
        fields: formData.fields ? formData.fields.map(field => ({
          id: field.id,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          order: field.order,
          options: field.type === 'select' ? field.options || [] : undefined,
          validation: field.validation
        })) : [],
        settings: {
          identificationRequired: formData.settings?.identificationRequired || 'whatsapp',
          submitButtonText: formData.settings?.submitButtonText || 'Enviar',
          successMessage: formData.settings?.successMessage || 'Formulário enviado com sucesso!',
          notificationEmail: formData.settings?.notificationEmail || ''
        } satisfies Record<string, any>,
        style: {
          layout: formData.style?.layout || 'stack',
          theme: formData.style?.theme || 'light',
          customColors: formData.style?.customColors || {
            primary: '#000000',
            background: '#ffffff',
            text: '#000000'
          }
        } satisfies Record<string, any>,
        stats: {
          submissions: 0,
          averageCompletionTime: 0,
          lastUsed: new Date()
        },
        createdBy: session.user.id,
        updatedAt: new Date(),
        isPublic: formData.isPublic ?? false
      }
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const forms = await prisma.form.findMany({
      where: {
        createdBy: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 