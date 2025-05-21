'use client';

import { Block } from '@/types/blocks';
import { Form, FormField } from '@/types/forms';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface FormBlockProps {
  block: Block;
  theme?: 'light' | 'dark';
}

export function FormBlock({ block, theme = 'dark' }: FormBlockProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    const fetchForm = async () => {
      if (!block.content.formId) {
        setIsLoading(false);
        setError('ID do formulário não encontrado');
        return;
      }

      try {
        setError(null);
        const response = await fetch(`/api/forms/${block.content.formId}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Formulário não encontrado' : 'Erro ao carregar formulário');
        }
        const data = await response.json();
        if (!data) {
          throw new Error('Formulário não encontrado');
        }
        setForm(data);
      } catch (error) {
        console.error('Error loading form:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar formulário');
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchForm();
  }, [block.content.formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          data: formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit form');

      toast.success(form.settings.successMessage || 'Formulário enviado com sucesso!');
      setFormData({});
      if (block.content.showInModal) {
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseInputClasses = cn(
      "w-full mt-2",
      isLight ? (
        "bg-white border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400"
      ) : (
        "bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-white placeholder:text-zinc-500"
      ),
      "font-light"
    );
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'cpf':
        return (
          <Input
            id={field.id}
            type={field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
            required={field.required}
            className={baseInputClasses}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
          />
        );
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            className={baseInputClasses}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
          />
        );
      case 'select':
        return (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
            required={field.required}
            className={cn(baseInputClasses, "rounded-md p-2")}
          >
            <option value="" className={isLight ? "bg-white" : "bg-zinc-900"}>Selecione...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value} className={isLight ? "bg-white" : "bg-zinc-900"}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const renderForm = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className={cn("h-8 w-8 animate-spin", isLight ? "text-gray-400" : "text-zinc-400")} />
        </div>
      );
    }

    if (error || !form) {
      return (
        <div className={cn(
          "text-center p-8 space-y-2",
          isLight ? "text-gray-500" : "text-zinc-400"
        )}>
          <div className="font-medium">{error || 'Formulário não encontrado'}</div>
          <div className="text-sm opacity-75">
            Verifique se o ID do formulário está correto e tente novamente
          </div>
        </div>
      );
    }

    const gridCols = form.style.layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1';

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`grid ${gridCols} gap-4`}>
          {form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label 
                htmlFor={field.id} 
                className={cn(
                  "text-sm font-light",
                  isLight ? "text-gray-700" : "text-zinc-400"
                )}
              >
                {field.label}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className={cn(
            "w-full py-6 text-lg font-light tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl",
            isLight 
              ? "bg-gray-900 text-white hover:bg-gray-800" 
              : "bg-white text-black hover:bg-zinc-100"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            form.settings.submitButtonText || 'Enviar'
          )}
        </Button>
      </form>
    );
  };

  if (block.content.showInModal) {
    return (
      <>
        <Button 
          onClick={() => setShowModal(true)} 
          className={cn(
            "w-full py-5 sm:py-6 text-base sm:text-lg font-light tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl backdrop-blur-sm relative overflow-hidden",
            isLight 
              ? "bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200/50"
              : "bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-800/50 before:absolute before:inset-0 before:border-2 before:border-white/10 before:rounded-2xl before:scale-[1.01]"
          )}
        >
          {form?.name || 'Abrir Formulário'}
        </Button>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent 
            className={cn(
              "sm:max-w-[600px] p-0 border shadow-2xl",
              isLight 
                ? "bg-white border-gray-200 text-gray-900"
                : "bg-zinc-900 border-zinc-800/50 text-white"
            )}
          >
            <DialogHeader className="p-6 pb-0">
              <DialogTitle 
                className={cn(
                  "text-2xl tracking-tight",
                  isLight 
                    ? "font-medium text-gray-900"
                    : "font-extralight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent"
                )}
              >
                {form?.name}
              </DialogTitle>
              {form?.description && (
                <DialogDescription 
                  className={cn(
                    "font-light",
                    isLight ? "text-gray-500" : "text-zinc-400"
                  )}
                >
                  {form.description}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="p-6">
              {renderForm()}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return renderForm();
} 