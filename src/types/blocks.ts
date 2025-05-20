export type BlockType = 'BUTTON' | 'FORM' | 'ADDRESS' | 'AI_CHAT' | 'WHATSAPP';

export interface Block {
  id: string;
  type: BlockType;
  content: {
    title?: string;
    label?: string;
    url?: string;
    pipelineId?: string;
    isModal?: boolean;
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
    hasButton?: boolean;
    buttonLabel?: string;
    buttonUrl?: string;
  };
  order: number;
}

export interface SocialLink {
  id: string;
  platform: 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';
  username: string;
  url: string;
} 