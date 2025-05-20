'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import { BsPatchCheckFill } from 'react-icons/bs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/FormModal';
import { LocationMap } from '@/components/ui/location-map';
import { Address } from '@/components/ui/address-manager';
import { AiChatWidget } from '@/components/AiChatWidget';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { cn } from '@/lib/utils';

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  WHATSAPP: MessageCircle,
  TIKTOK: MessageCircle,
};

const VerifiedBadge = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="9" cy="9" r="9" fill="#0095F6"/>
    <path
      d="M13.093 6.436a.75.75 0 0 0-1.036-.248l-3.144 2.115-1.17-1.635a.75.75 0 0 0-1.222.873l1.75 2.444a.75.75 0 0 0 1.129.076l3.75-3.125a.75.75 0 0 0-.057-1.5z"
      fill="#fff"
    />
  </svg>
);

interface ClassicTemplateProps {
  page: {
    id: string;
    title: string;
    subtitle: string | null;
    avatarUrl: string | null;
    primaryColor: string;
    blocks: Array<{
      id: string;
      type: 'BUTTON' | 'FORM' | 'ADDRESS' | 'AI_CHAT' | 'WHATSAPP';
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
        showNavigationButton?: boolean;
        navigationButtonLabel?: string;
        navigationButtonOrigin?: string;
        hasButton?: boolean;
        buttonLabel?: string;
        buttonUrl?: string;
      };
      order: number;
    }>;
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
      phone?: string;
    };
  };
}

export default function ClassicTemplate({ page }: ClassicTemplateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormBlock, setActiveFormBlock] = useState<typeof page.blocks[0] | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, block: typeof page.blocks[0]) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          pipelineId: block.content.pipelineId,
          status: 'Novo'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar formulário');
      }

      form.reset();
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white py-8 sm:py-12 px-4 sm:px-6 font-[SF Pro Display,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif]">
      {page.user.phone && !page.blocks.some(block => block.type === 'WHATSAPP') && (
        <WhatsAppButton phoneNumber={page.user.phone} fixed={true} />
      )}
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4">
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-50 to-white opacity-80 blur-xl"
              style={{ transform: 'scale(1.2)' }}
            />
            <img
              src={page.avatarUrl || page.user.image || '/default-avatar.png'}
              alt={page.user.name}
              className="relative w-full h-full object-cover rounded-full ring-2 ring-blue-50 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-gray-900">
              {page.user.name}
              {page.user.specialty && (
                <span className="block text-sm sm:text-base font-normal text-blue-600 mt-1">
                  {page.user.specialty}
                </span>
              )}
            </h1>
            {page.subtitle && (
              <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed mt-2">{page.subtitle}</p>
            )}
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-4">
          {page.blocks.map((block) => {
            if (block.type === 'BUTTON') {
              return (
                <Button
                  key={block.id}
                  className={cn(
                    "w-full py-4 sm:py-5 text-sm sm:text-base font-normal tracking-wide",
                    "bg-white hover:bg-gray-50 border border-gray-200 text-gray-900",
                    "shadow-sm hover:shadow-md",
                    "transition-all duration-300",
                    "transform hover:scale-[1.01] active:scale-[0.99]"
                  )}
                  asChild
                >
                  <a
                    href={block.content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    {block.content.label}
                  </a>
                </Button>
              );
            }

            if (block.type === 'FORM') {
              if (block.content.isModal) {
                return (
                  <Button
                    key={block.id}
                    className={cn(
                      "w-full py-5 sm:py-6 text-base sm:text-lg font-normal tracking-wide",
                      "bg-white hover:bg-gray-50 border border-gray-200 text-gray-900",
                      "shadow-sm hover:shadow-md",
                      "transition-all duration-300",
                      "transform hover:scale-[1.01] active:scale-[0.99]"
                    )}
                    onClick={() => {
                      setActiveFormBlock(block);
                      setIsModalOpen(true);
                    }}
                  >
                    {block.content.title}
                  </Button>
                );
              }

              return (
                <div
                  key={block.id}
                  className="bg-white rounded-xl p-6 sm:p-8 space-y-4 sm:space-y-6 shadow-sm border border-gray-100"
                >
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-gray-900">
                    {block.content.title}
                  </h2>
                  <form onSubmit={(e) => handleSubmit(e, block)} className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Nome
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          className="mt-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="mt-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          required
                          className="mt-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className={cn(
                        "w-full py-4 sm:py-5 text-base sm:text-lg font-normal tracking-wide",
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        "shadow-sm hover:shadow-md",
                        "transition-all duration-300"
                      )}
                    >
                      Enviar
                    </Button>
                  </form>
                </div>
              );
            }

            if (block.type === 'ADDRESS') {
              const addressObject: Address = {
                id: block.id,
                name: block.content.city || 'Location',
                address: `${block.content.address}, ${block.content.city}, ${block.content.state} ${block.content.zipCode}, ${block.content.country}`,
                isDefault: true
              };
              
              return (
                <div
                  key={block.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {block.content.city || 'Location'}
                      </h2>
                      {block.content.hasButton && block.content.buttonLabel && block.content.buttonUrl && (
                        <a
                          href={block.content.buttonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-normal",
                            "bg-white hover:bg-gray-50 border border-gray-200 text-gray-900",
                            "shadow-sm hover:shadow-md",
                            "transition-all duration-300",
                            "transform hover:scale-[1.02] active:scale-[0.98]",
                            "rounded-lg"
                          )}
                        >
                          {block.content.buttonLabel}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="h-[200px] sm:h-[250px] w-full">
                    <LocationMap 
                      addresses={[addressObject]} 
                      primaryColor={page.primaryColor}
                      hasButton={block.content.hasButton}
                      buttonLabel={block.content.buttonLabel}
                      buttonUrl={block.content.buttonUrl}
                    />
                  </div>
                </div>
              );
            }

            if (block.type === 'AI_CHAT') {
              return (
                <div key={block.id}>
                  <AiChatWidget 
                    doctorId={page.user.id} 
                    doctorName={page.user.name}
                    buttonTitle={block.content.buttonTitle}
                    initialGreeting={block.content.greeting}
                  />
                </div>
              );
            }

            if (block.type === 'WHATSAPP') {
              const whatsappNumber = block.content.whatsappNumber || page.user.phone;
              return whatsappNumber ? (
                <WhatsAppButton 
                  key={block.id}
                  phoneNumber={whatsappNumber} 
                  fixed={false} 
                />
              ) : null;
            }

            return null;
          })}
        </div>

        {/* Social Links */}
        {page.socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 sm:gap-6 pt-4 sm:pt-6">
            {page.socialLinks.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform];
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:p-3 rounded-full bg-white border border-gray-100 transition-all duration-300 hover:scale-110 hover:-translate-y-1 text-gray-600 hover:text-gray-900 shadow-sm hover:shadow-md"
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-400 pt-4 sm:pt-6">
          <p className="opacity-75">Created with Med1</p>
        </div>
      </div>

      {/* Modal Form */}
      {activeFormBlock && (
        <FormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setActiveFormBlock(null);
          }}
          title={activeFormBlock.content.modalTitle || activeFormBlock.content.title || ''}
          primaryColor={page.primaryColor}
          pipelineId={activeFormBlock.content.pipelineId}
          successPage={activeFormBlock.content.successPage}
        />
      )}
    </div>
  );
} 