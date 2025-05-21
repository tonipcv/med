'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormBlock } from '@/components/blocks/FormBlock';
import { Form } from '@/types/forms';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  primaryColor: string;
  pipelineId?: string;
  successPage?: string;
  formId?: string;
  onSubmit?: (data: any) => Promise<void>;
  theme?: 'light' | 'dark';
}

export function FormModal({ 
  isOpen, 
  onClose, 
  title, 
  primaryColor, 
  pipelineId, 
  successPage,
  formId,
  onSubmit,
  theme = 'dark'
}: FormModalProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/forms/${formId}`);
        if (!response.ok) throw new Error('Failed to load form');
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error('Error loading form:', error);
        toast.error('Erro ao carregar formulário');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      setIsLoading(true);
      fetchForm();
    }
  }, [formId, isOpen]);

  const handleSubmit = async (formData: any) => {
    if (!pipelineId) {
      toast.error('Pipeline não configurado');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit({
          ...formData,
          pipelineId,
          formId
        });
      } else {
        const response = await fetch('/api/public/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            pipelineId,
            formId
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao enviar formulário');
        }
      }

      onClose();
      toast.success('Formulário enviado com sucesso!');

      if (successPage) {
        window.location.href = successPage;
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[600px] p-6",
        theme === 'light' 
          ? "bg-white border-gray-200 text-gray-900" 
          : "bg-zinc-900 border-zinc-800 text-white"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-xl font-light tracking-tight",
            theme === 'light' 
              ? "text-gray-900" 
              : "text-white"
          )}>
            {title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className={cn(
              "h-8 w-8 animate-spin",
              theme === 'light' ? "text-gray-400" : "text-zinc-400"
            )} />
          </div>
        ) : form ? (
          <FormBlock
            block={{
              id: formId || '',
              type: 'FORM',
              content: {
                formId: formId,
                showInModal: false,
                pipelineId: pipelineId,
                title: title,
                modalTitle: title
              },
              order: 0
            }}
            theme={theme}
          />
        ) : (
          <div className={cn(
            "text-center py-8",
            theme === 'light' ? "text-gray-500" : "text-zinc-400"
          )}>
            Formulário não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 