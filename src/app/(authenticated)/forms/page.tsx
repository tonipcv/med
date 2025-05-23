'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PlusCircle, FormInput, ExternalLink, Loader2, Settings } from 'lucide-react';
import { Form } from '@/types/forms';
import { FormBlock } from '@/components/blocks/FormBlock';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    isPublic: true,
    fields: [],
    settings: {
      identificationRequired: 'whatsapp',
      submitButtonText: 'Enviar',
      successMessage: 'Formulário enviado com sucesso!'
    },
    style: {
      layout: 'stack',
      theme: 'light'
    }
  });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }
      const data = await response.json();
      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Erro ao carregar os formulários');
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!newForm.name.trim()) {
      toast.error('Por favor, insira um nome para o formulário');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      const createdForm = await response.json();
      setForms([createdForm, ...forms]);
      setIsCreateModalOpen(false);
      setNewForm({
        name: '',
        description: '',
        isPublic: true,
        fields: [],
        settings: {
          identificationRequired: 'whatsapp',
          submitButtonText: 'Enviar',
          successMessage: 'Formulário enviado com sucesso!'
        },
        style: {
          layout: 'stack',
          theme: 'light'
        }
      });
      toast.success('Formulário criado com sucesso!');
      router.push(`/forms/${createdForm.id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Erro ao criar formulário');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
        <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mt-4 md:mt-0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Meus Formulários</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">
              Crie e gerencie seus formulários personalizados
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Formulário
          </Button>
        </div>

        {forms.length === 0 ? (
          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Nenhum formulário encontrado</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Comece criando seu primeiro formulário personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Formulário
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">{form.name}</CardTitle>
                  {form.description && (
                    <CardDescription className="text-sm text-gray-500">{form.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm sm:text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400/60" />
                      {form.fields.length} {form.fields.length === 1 ? 'campo' : 'campos'}
                    </div>
                    <div className="text-sm sm:text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400/60" />
                      {form.stats?.submissions || 0} {form.stats?.submissions === 1 ? 'submissão' : 'submissões'}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <Link href={`/forms/${form.id}/submissions`}>
                        <FormInput className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      asChild
                      size="sm"
                      className="h-8 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-xl text-gray-700 hover:bg-gray-800/10 text-xs"
                    >
                      <Link href={`/forms/${form.id}`}>Editar</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>Novo Formulário</SheetTitle>
            <SheetDescription>
              Crie um novo formulário para seus pacientes
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-8">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Formulário</Label>
              <Input
                id="name"
                value={newForm.name}
                onChange={(e) => setNewForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Anamnese Inicial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newForm.description}
                onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Formulário para primeira consulta"
              />
            </div>
            <Button 
              onClick={handleCreateForm} 
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Criar Formulário
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 