'use client';

import { FormBuilder } from '@/components/forms/FormBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/types/forms';
import { ArrowLeft, Copy, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function FormPage() {
  const params = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${params.formId}`);
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

    fetchForm();
  }, [params.formId]);

  const handleSaveForm = async (formData: Partial<Form>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/forms/${params.formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      const updatedForm = await response.json();
      setForm(updatedForm);
      toast.success('Formulário salvo com sucesso!');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Erro ao salvar formulário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!form) return;

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          name: `${form.name} (Cópia)`,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate form');
      }

      const newForm = await response.json();
      toast.success('Formulário duplicado com sucesso!');
      // Redirect to the new form
      window.location.href = `/forms/${newForm.id}`;
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Erro ao duplicar formulário');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Formulário não encontrado</h1>
          <Button asChild>
            <Link href="/forms">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para formulários
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/forms">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{form.name}</h1>
        </div>
        <Button variant="outline" onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Formulário</CardTitle>
          <CardDescription>
            Personalize os campos e configurações do seu formulário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormBuilder
            initialData={form}
            onSave={handleSaveForm}
          />
        </CardContent>
      </Card>
    </div>
  );
} 