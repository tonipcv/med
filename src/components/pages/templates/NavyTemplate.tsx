'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle, MapPin } from 'lucide-react';
import { BsPatchCheckFill } from 'react-icons/bs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/FormModal';
import { LocationMap } from '@/components/ui/location-map';
import { Address } from '@/components/ui/address-manager';
import { AiChatWidget } from '@/components/AiChatWidget';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { MultiStepModal } from '@/components/ui/multi-step-modal';
import { RedirectBlock } from '@/components/blocks/RedirectBlock';
import { toast } from 'sonner';
import { TemplateProps } from '@/types/templates';

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  WHATSAPP: MessageCircle,
  TIKTOK: MessageCircle,
} as const;

export default function NavyTemplate({ page }: TemplateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormBlock, setActiveFormBlock] = useState<typeof page.blocks[0] | null>(null);
  const [activeMultiStepBlock, setActiveMultiStepBlock] = useState<typeof page.blocks[0] | null>(null);

  const handleSubmit = async (formData: any) => {
    if (!formData.pipelineId) {
      toast.error('Pipeline não configurado');
      return;
    }

    try {
      const response = await fetch('/api/public/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar formulário');
      }

      toast.success('Formulário enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar formulário');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#000033] text-white font-[system-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Oxygen,Ubuntu,Cantarell,Open_Sans,Helvetica_Neue,sans-serif] flex flex-col">
      {/* Subtle gradient border */}
      <div className="md:hidden fixed inset-0 p-[1px] pointer-events-none">
        <div className="w-full h-full rounded-none bg-gradient-to-b from-[#000044] via-[#000033] to-[#000022]" />
      </div>
      
      <div className="relative flex-1 py-16 px-4 sm:px-6">
        {/* Only show fixed WhatsApp button if there's no WhatsApp block */}
        {page.user.phone && !page.blocks.some(block => block.type === 'WHATSAPP') && (
          <WhatsAppButton phoneNumber={page.user.phone} fixed={true} />
        )}
        
        <div className="max-w-lg mx-auto w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative w-32 h-32 sm:w-28 sm:h-28 mx-auto mb-6">
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ 
                  background: 'linear-gradient(135deg, #C0C0C040 0%, #70708040 100%)',
                  filter: 'blur(20px)',
                  transform: 'scale(1.1)',
                }}
              />
              <img
                src={page.avatarUrl || page.user.image || '/default-avatar.png'}
                alt={page.user.name}
                className="relative w-full h-full object-cover rounded-full border-2 border-gray-600/30 shadow-2xl"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent">
                {page.user.name}
              </span>
              <div className="rounded-full">
                <BsPatchCheckFill size={20} className="text-gray-400" />
              </div>
            </h1>
            {page.user.specialty && (
              <p className="text-base sm:text-lg text-gray-400/80 font-light tracking-wide">{page.user.specialty}</p>
            )}
            {page.subtitle && (
              <p className="text-sm sm:text-base text-gray-500/60 font-light tracking-wide">{page.subtitle}</p>
            )}
          </div>

          {/* Content Blocks */}
          <div className="space-y-5">
            {page.blocks.map((block) => {
              if (block.type === 'BUTTON') {
                return (
                  <Button
                    key={block.id}
                    className="w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/30 relative overflow-hidden before:absolute before:inset-0 before:border before:border-gray-500/20 before:rounded-2xl before:scale-[1.01]"
                    asChild
                  >
                    <a
                      href={block.content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 text-gray-200"
                    >
                      {block.content.label}
                    </a>
                  </Button>
                );
              }

              if (block.type === 'MULTI_STEP') {
                return (
                  <Button
                    key={block.id}
                    className="w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/30 relative overflow-hidden before:absolute before:inset-0 before:border before:border-gray-500/20 before:rounded-2xl before:scale-[1.01] text-gray-200"
                    onClick={() => setActiveMultiStepBlock(block)}
                  >
                    {block.content.label}
                  </Button>
                );
              }

              if (block.type === 'FORM') {
                if (block.content.showInModal) {
                  return (
                    <Button
                      key={block.id}
                      className="w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/30 relative overflow-hidden before:absolute before:inset-0 before:border before:border-gray-500/20 before:rounded-2xl before:scale-[1.01] text-gray-200"
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
                    className="bg-[#000044] rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl border border-gray-600/30"
                  >
                    <h2 className="text-2xl font-light mb-6 text-gray-300 tracking-wide">
                      {block.content.title}
                    </h2>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleSubmit({
                        name: formData.get('name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        pipelineId: block.content.pipelineId,
                        formId: block.content.formId
                      });
                    }} className="space-y-6">
                      <div>
                        <Label htmlFor="name" className="text-sm text-gray-400/80 font-light">Nome</Label>
                        <Input 
                          id="name" 
                          name="name"
                          placeholder="Seu nome completo"
                          className="mt-2 bg-[#000055] border-gray-600/30 focus:border-gray-500 font-light text-gray-300 placeholder:text-gray-500/30"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm text-gray-400/80 font-light">Email</Label>
                        <Input 
                          id="email" 
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="mt-2 bg-[#000055] border-gray-600/30 focus:border-gray-500 font-light text-gray-300 placeholder:text-gray-500/30"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm text-gray-400/80 font-light">WhatsApp</Label>
                        <Input 
                          id="phone" 
                          name="phone"
                          placeholder="(00) 00000-0000"
                          className="mt-2 bg-[#000055] border-gray-600/30 focus:border-gray-500 font-light text-gray-300 placeholder:text-gray-500/30"
                          required
                        />
                      </div>
                      <Button 
                        type="submit"
                        className="w-full py-6 text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-gray-200"
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
                    className="bg-[#000044] rounded-2xl shadow-xl transform transition-all duration-300 hover:shadow-2xl border border-gray-600/30 overflow-hidden"
                  >
                    <div className="p-4">
                      <h2 className="text-base sm:text-lg font-light mb-2 text-gray-300 tracking-wide flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        {block.content.city || 'Location'}
                      </h2>
                    </div>
                    <div className="h-[150px] sm:h-[180px] w-full">
                      <LocationMap 
                        addresses={[addressObject]} 
                        primaryColor="#A0A0A0"
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
                return (
                  <Button
                    key={block.id}
                    className="w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/30 relative overflow-hidden before:absolute before:inset-0 before:border before:border-gray-500/20 before:rounded-2xl before:scale-[1.01] text-gray-200"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${block.content.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {block.content.buttonTitle || 'Enviar Mensagem'}
                    </a>
                  </Button>
                );
              }

              if (block.type === 'REDIRECT') {
                return (
                  <RedirectBlock block={block} />
                );
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
                    className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/30 transition-all duration-300 hover:scale-110 hover:-translate-y-1 text-gray-300 hover:text-gray-200 shadow-xl hover:shadow-2xl"
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs sm:text-sm text-gray-500/60 pt-4 sm:pt-6">
            <p className="opacity-75">Created with Med1</p>
          </div>
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
          primaryColor="#A0A0A0"
          pipelineId={activeFormBlock.content.pipelineId}
          successPage={activeFormBlock.content.successPage}
          formId={activeFormBlock.content.formId}
          onSubmit={(data) => handleSubmit(data)}
          theme="dark"
        />
      )}

      {/* Multi-step Modal */}
      {activeMultiStepBlock && (
        <MultiStepModal
          isOpen={true}
          onClose={() => setActiveMultiStepBlock(null)}
          block={activeMultiStepBlock}
        />
      )}
    </div>
  );
} 