export const PLATFORM_ICONS = {
  INSTAGRAM: 'INSTAGRAM',
  YOUTUBE: 'YOUTUBE',
  FACEBOOK: 'FACEBOOK',
  LINKEDIN: 'LINKEDIN',
  TWITTER: 'TWITTER',
  WHATSAPP: 'WHATSAPP',
  TIKTOK: 'TIKTOK',
} as const;

export type BlockType = 'BUTTON' | 'FORM' | 'ADDRESS' | 'AI_CHAT' | 'WHATSAPP' | 'MULTI_STEP' | 'REDIRECT';

export interface BlockContent {
  title?: string;
  label?: string;
  url?: string;
  pipelineId?: string;
  showInModal?: boolean;
  modalTitle?: string;
  successPage?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  buttonTitle?: string;
  greeting?: string;
  whatsappNumber?: string;
  formId?: string;
  hasButton?: boolean;
  buttonLabel?: string;
  buttonUrl?: string;
  redirectUrl?: string;
  redirectDelay?: number;
  showCountdown?: boolean;
  showNavigationButton?: boolean;
  navigationButtonLabel?: string;
  navigationButtonOrigin?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  order: number;
}

export interface TemplateProps {
  page: {
    id: string;
    title: string;
    subtitle: string | null;
    avatarUrl: string | null;
    primaryColor: string;
    blocks: Block[];
    socialLinks: Array<{
      id: string;
      platform: keyof typeof PLATFORM_ICONS;
      url: string;
    }>;
    user: {
      id: string;
      name: string;
      image: string | null;
      specialty: string | null;
      phone: string | null | undefined;
    };
  };
} 