import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function trackPageView(pageId: string, userAgent?: string, ip?: string) {
  try {
    await prisma.event.create({
      data: {
        id: nanoid(),
        type: 'PAGE_VIEW',
        userId: pageId,
        userAgent,
        ip,
      },
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
} 