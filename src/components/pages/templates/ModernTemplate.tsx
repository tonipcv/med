'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle, MapPin, Menu } from 'lucide-react';
import { BsPatchCheckFill } from 'react-icons/bs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/FormModal';
import { LocationMap } from '@/components/ui/location-map';
import { Address } from '@/components/ui/address-manager';
import { AiChatWidget } from '@/components/AiChatWidget';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MultiStepModal } from '@/components/ui/multi-step-modal';
import { RedirectBlock } from '@/components/blocks/RedirectBlock';
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

const VerifiedBadge = () => (
  <svg
    width="22"
    height="22"
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

export default function ModernTemplate({ page }: TemplateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormBlock, setActiveFormBlock] = useState<typeof page.blocks[0] | null>(null);
  const [activeMultiStepBlock, setActiveMultiStepBlock] = useState<typeof page.blocks[0] | null>(null);

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

      // Limpa o formulário
      form.reset();
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  return (
    <div className="relative min-h-screen bg-black md:bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Oxygen,Ubuntu,Cantarell,Open_Sans,Helvetica_Neue,sans-serif] flex flex-col">
      {/* Mobile Gradient Border */}
      <div className="md:hidden fixed inset-0 p-[1px] pointer-events-none">
        <div className="w-full h-full rounded-none bg-gradient-to-b from-white/10 via-zinc-500/5 to-white/10" />
      </div>
      
      <div className="relative flex-1 py-16 px-4 sm:px-6">
        {/* Only show fixed WhatsApp button if there's no WhatsApp block */}
        {page.user.phone && !page.blocks.some(block => block.type === 'WHATSAPP') && (
          <WhatsAppButton phoneNumber={page.user.phone} fixed={true} />
        )}
        
        <div className="max-w-lg mx-auto w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-full opacity-50" />
              <img
                src={page.avatarUrl || page.user.image || '/default-avatar.png'}
                alt={page.user.name}
                className="relative w-full h-full object-cover rounded-full border-4 border-zinc-800"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight bg-gradient-to-b from-white via-gray-300 to-gray-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
              {page.user.name}
              <div className="rounded-full">
                <BsPatchCheckFill size={20} className="text-white/80" />
              </div>
            </h1>
            {page.user.specialty && (
              <p className="text-base sm:text-lg bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent font-light tracking-wide">{page.user.specialty}</p>
            )}
            {page.subtitle && (
              <p className="text-sm sm:text-base text-zinc-400 font-light tracking-wide">{page.subtitle}</p>
            )}
          </div>

          {/* Content Blocks */}
          <div className="space-y-5">
            {page.blocks.map((block) => {
              if (block.type === 'BUTTON') {
                return (
                  <Button
                    key={block.id}
                    className="w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800/50 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:border-2 before:border-white/10 before:rounded-2xl before:scale-[1.01]"
                    asChild
                  >
                    <a
                      href={block.content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3"
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
                    className="w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800/50 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:border-2 before:border-white/10 before:rounded-2xl before:scale-[1.01]"
                    onClick={() => setActiveMultiStepBlock(block)}
                  >
                    {block.content.label}
                  </Button>
                );
              }

              if (block.type === 'FORM') {
                if (Boolean(block.content.showInModal)) {
                  return (
                    <Button
                      key={block.id}
                      className="w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800/50 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:border-2 before:border-white/10 before:rounded-2xl before:scale-[1.01]"
                      onClick={() => {
                        setActiveFormBlock(block);
                        setIsModalOpen(true);
                      }}
                    >
                      {block.content.title || 'Abrir Formulário'}
                    </Button>
                  );
                }

                return (
                  <div
                    key={block.id}
                    className="bg-zinc-900 rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl border border-zinc-800"
                  >
                    <h2 
                      className="text-2xl font-extralight mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-wide"
                    >
                      {block.content.title}
                    </h2>
                    <form onSubmit={(e) => handleSubmit(e, block)} className="space-y-6">
                      <div>
                        <Label htmlFor="name" className="text-sm text-zinc-400 font-light">Nome</Label>
                        <Input 
                          id="name" 
                          name="name"
                          placeholder="Seu nome completo"
                          className="mt-2 bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 font-light"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm text-zinc-400 font-light">Email</Label>
                        <Input 
                          id="email" 
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="mt-2 bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 font-light"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm text-zinc-400 font-light">WhatsApp</Label>
                        <Input 
                          id="phone" 
                          name="phone"
                          placeholder="(00) 00000-0000"
                          className="mt-2 bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 font-light"
                          required
                        />
                      </div>
                      <Button 
                        type="submit"
                        className="w-full py-6 text-lg font-light tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl bg-white text-black hover:bg-zinc-100"
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
                    className="bg-zinc-900 rounded-2xl shadow-xl transform transition-all duration-300 hover:shadow-2xl border border-zinc-800 overflow-hidden"
                  >
                    <div className="p-4">
                      <h2 
                        className="text-base sm:text-lg font-extralight mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2"
                      >
                        <MapPin size={16} className="text-zinc-400" />
                        {block.content.city || 'Location'}
                      </h2>
                    </div>
                    <div className="h-[150px] sm:h-[180px] w-full">
                      <LocationMap 
                        addresses={[addressObject]} 
                        primaryColor="#000000"
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
                return block.content.whatsappNumber ? (
                  <WhatsAppButton key={block.id} phoneNumber={block.content.whatsappNumber} fixed={false} />
                ) : null;
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
            <div className="flex justify-center gap-6 mt-10">
              {page.socialLinks.map((link) => {
                const Icon = PLATFORM_ICONS[link.platform] || MessageCircle;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transform transition-all duration-300 hover:scale-110 text-zinc-400 hover:text-white"
                  >
                    <Icon className="h-7 w-7" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative w-full mt-20 pb-6">
        <div className="text-center text-sm text-zinc-600 font-light tracking-wide">
          <a 
            href="https://med1.app/auth/register" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="opacity-75 hover:opacity-100 transition-opacity"
          >
            Created with Med1
          </a>
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
          primaryColor="#000000"
          pipelineId={activeFormBlock.content.pipelineId}
          successPage={activeFormBlock.content.successPage}
          formId={activeFormBlock.content.formId}
          onSubmit={(data) => handleSubmit(data, activeFormBlock)}
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