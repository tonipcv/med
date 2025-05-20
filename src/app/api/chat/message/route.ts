import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
import { nanoid } from 'nanoid';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface PatientInfo {
  name?: string;
  contact?: string;
}

// Helper function to check if we should ask for patient info
function shouldAskForInfo(messages: any[], patientInfo: PatientInfo) {
  const messageCount = messages.filter(m => m.role === 'user').length;
  
  if (messageCount >= 2 && !patientInfo.name) {
    return { type: 'name' as const, message: 'Para melhor atendê-lo, posso saber seu nome?' };
  }
  
  if (messageCount >= 3 && patientInfo.name && !patientInfo.contact) {
    return { type: 'contact' as const, message: 'Qual o melhor e-mail ou WhatsApp para contato?' };
  }
  
  return null;
}

// Helper function to extract patient info from message
function extractPatientInfo(message: string, type: 'name' | 'contact') {
  if (type === 'name') {
    // Simple name extraction - could be improved with NLP
    const name = message.replace(/meu nome[eé\s]+/i, '').trim();
    return { name };
  }
  
  if (type === 'contact') {
    // Basic email/phone detection
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /(?:\+55)?\s*\(?(\d{2})\)?\s*9?\d{4}[-.\s]?\d{4}/;
    
    const email = message.match(emailRegex)?.[0];
    const phone = message.match(phoneRegex)?.[0];
    
    return { contact: email || phone || message.trim() };
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, patientInfo } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message
      }
    });

    // Check if we should collect patient info
    const infoToCollect = shouldAskForInfo(conversation.messages, patientInfo);
    
    if (infoToCollect) {
      // If we just asked for info, try to extract it from the current message
      const lastAssistantMessage = conversation.messages[conversation.messages.length - 1];
      if (lastAssistantMessage?.content.includes('posso saber seu nome') || 
          lastAssistantMessage?.content.includes('melhor e-mail ou WhatsApp')) {
        const extractedInfo = extractPatientInfo(message, infoToCollect.type);
        
        if (extractedInfo) {
          // If we got patient info, create/update patient record
          if (extractedInfo.name || extractedInfo.contact) {
            // Only create patient when we have both name and contact info
            if (infoToCollect.type === 'contact' && extractedInfo.contact) {
              const isEmail = extractedInfo.contact.includes('@');
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  patient: {
                    create: {
                      name: patientInfo.name || 'Unknown',
                      email: isEmail ? extractedInfo.contact : `${nanoid()}@temp.med1.com`,
                      phone: isEmail ? '0000000000' : extractedInfo.contact,
                      userId: conversation.doctorId,
                      hasPortalAccess: false
                    }
                  }
                }
              });
            }
          }
          
          // Acknowledge the info and ask the next question
          const assistantMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: `Obrigado! ${infoToCollect.message}`,
              metadata: { collectedInfo: extractedInfo }
            }
          });

          return NextResponse.json({
            messageId: assistantMessage.id,
            message: assistantMessage.content,
            collectedInfo: extractedInfo
          });
        }
      }
      
      // Ask for patient info
      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: infoToCollect.message
        }
      });

      return NextResponse.json({
        messageId: assistantMessage.id,
        message: assistantMessage.content
      });
    }

    // Prepare conversation history for AI
    const history = conversation.messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // Add current message
    history.push({
      role: 'user',
      content: message
    });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: 'system',
          content: `Você é um assistente virtual médico. Seu objetivo é ajudar com triagem inicial e dúvidas básicas.
          
          Regras importantes:
          1. NUNCA faça diagnósticos
          2. NUNCA prescreva medicamentos
          3. Em casos graves ou que exijam avaliação médica, sempre oriente a buscar atendimento presencial
          4. Mantenha um tom profissional mas acolhedor
          5. Faça perguntas relevantes para entender melhor a situação
          6. Se perceber sintomas graves, oriente a buscar emergência médica
          
          Você pode:
          1. Fazer perguntas para entender melhor os sintomas
          2. Dar orientações gerais de saúde
          3. Explicar procedimentos médicos de forma simples
          4. Tirar dúvidas sobre prevenção de doenças
          5. Ajudar a decidir se um caso precisa de atendimento presencial
          
          Ao final de cada resposta, avalie se é necessário sugerir agendamento de consulta.`
        },
        ...history
      ] as ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 500
    });

    // Save AI response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: completion.choices[0].message.content || 'Desculpe, não consegui processar sua mensagem.'
      }
    });

    return NextResponse.json({
      messageId: assistantMessage.id,
      message: assistantMessage.content
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 