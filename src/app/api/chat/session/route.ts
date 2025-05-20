import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { doctorId } = await req.json();

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Verify if doctor exists
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Create a new conversation with a unique session ID
    const sessionId = nanoid();
    const conversation = await prisma.conversation.create({
      data: {
        sessionId,
        doctorId,
        status: 'active'
      }
    });

    // Create initial greeting message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: 'Olá! Como posso ajudar você hoje?'
      }
    });

    return NextResponse.json({
      sessionId,
      messageId: message.id
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 