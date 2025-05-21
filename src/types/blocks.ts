export type BlockType = 'BUTTON' | 'FORM' | 'ADDRESS' | 'AI_CHAT' | 'WHATSAPP' | 'MULTI_STEP' | 'REDIRECT';

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
    // Multi-step specific properties
    subButtons?: Array<{
      id: string;
      label: string;
      url?: string;
      icon?: string;
      description?: string;
      color?: string;
      isExternal?: boolean;
    }>;
    modalSize?: 'default' | 'large' | 'full';
    modalLayout?: 'grid' | 'list';
    showDescriptions?: boolean;
    showIcons?: boolean;
    // Redirect specific properties
    redirectUrl?: string;
    redirectDelay?: number;
    showCountdown?: boolean;
    // Form specific properties
    formId?: string;
    showInModal?: boolean;
  };
  order: number;
}

export interface SocialLink {
  id: string;
  platform: 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';
  username: string;
  url: string;
} 