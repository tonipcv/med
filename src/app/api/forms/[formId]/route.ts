import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { formId: string } }
) {
  try {
    const form = await prisma.form.findUnique({
      where: { id: params.formId }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { formId: string } }
) {
  try {
    const formData = await request.json();

    // Validate required fields
    if (!formData.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Update form with proper JSON serialization
    const form = await prisma.form.update({
      where: { id: params.formId },
      data: {
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
        updatedAt: new Date()
      }
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 