import { BsWhatsapp } from 'react-icons/bs';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps {
  phoneNumber: string;
  fixed?: boolean;
  variant?: 'default' | 'minimal' | 'dark';
}

export function WhatsAppButton({ phoneNumber, fixed = true, variant = 'default' }: WhatsAppButtonProps) {
  // Remove any non-numeric characters from the phone number
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}`;

  const iconColors = {
    default: "text-[#25D366] hover:text-[#128C7E]",
    minimal: "text-gray-700 hover:text-gray-900",
    dark: "text-white/90 hover:text-white"
  };

  if (fixed) {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] transition-transform duration-300 hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <BsWhatsapp className={cn("w-8 h-8", iconColors[variant])} />
      </a>
    );
  }

  // Para blocos não fixos, mantemos o estilo anterior com fundo e texto
  const blockStyles = {
    default: "bg-[#25D366] hover:bg-[#128C7E] text-white",
    minimal: "bg-gray-700 hover:bg-gray-900 text-white",
    dark: "bg-white/10 hover:bg-white/20 text-white"
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center gap-2 py-4 rounded transition-all duration-200",
        blockStyles[variant]
      )}
      aria-label="Chat on WhatsApp"
    >
      <BsWhatsapp className="w-6 h-6" />
      <span className="font-medium text-white">Fale no WhatsApp</span>
    </a>
  );
} 