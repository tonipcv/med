'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import CollorTemplate from './templates/CollorTemplate';
import LightTemplate from './templates/LightTemplate';
import { BlockType, BlockContent, TemplateProps, PLATFORM_ICONS } from '@/types/templates';

interface ReferralPageProps {
  referral: {
    id: string;
    slug: string;
    page: {
      id: string;
      title: string;
      subtitle?: string;
      avatarUrl?: string;
      primaryColor: string;
      layout: string;
      blocks: Array<{
        id: string;
        type: BlockType;
        content: BlockContent;
        order: number;
      }>;
      socialLinks: Array<{
        id: string;
        platform: keyof typeof PLATFORM_ICONS;
        url: string;
      }>;
      user: {
        image: string;
        name: string;
        specialty?: string;
      };
    };
    patient: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
      image: string | null;
      specialty?: string;
      phone: string | null;
    };
  };
}

const ReferralPage: React.FC<ReferralPageProps> = ({ referral }) => {
  const pageContent: TemplateProps['page'] = {
    id: referral.page.id,
    title: referral.page.title,
    subtitle: referral.page.subtitle || null,
    avatarUrl: referral.page.avatarUrl || null,
    primaryColor: referral.page.primaryColor,
    blocks: referral.page.blocks.sort((a, b) => a.order - b.order).map(block => ({
      ...block,
      type: block.type
    })),
    socialLinks: referral.page.socialLinks.map(link => ({
      id: link.id,
      platform: link.platform,
      url: link.url
    })),
    user: {
      id: referral.user.id,
      name: referral.user.name,
      image: referral.user.image,
      specialty: referral.user.specialty || null,
      phone: referral.user.phone
    },
  };

  // Convert layout to lowercase for case-insensitive comparison
  const layout = referral.page.layout.toLowerCase();

  switch (layout) {
    case 'modern':
      return <ModernTemplate page={pageContent} />;
    case 'minimal':
      return <MinimalTemplate page={pageContent} />;
    case 'collor':
      return <CollorTemplate page={pageContent} />;
    case 'light':
      return <LightTemplate page={pageContent} />;
    case 'classic':
    default:
      return <ClassicTemplate page={pageContent} />;
  }
};

export default ReferralPage; 