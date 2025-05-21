'use client';

import { useState } from 'react';
import { Form, FormField, FieldType, FormSettings, FormStyle } from '@/types/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusCircle, GripVertical, Trash2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface FormBuilderProps {
  initialData?: Partial<Form>;
  onSave: (form: Partial<Form>) => Promise<void>;
}

export function FormBuilder({ initialData, onSave }: FormBuilderProps) {
  const [formData, setFormData] = useState<Partial<Form>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    fields: initialData?.fields || [],
    settings: {
      identificationRequired: initialData?.settings?.identificationRequired || 'whatsapp',
      submitButtonText: initialData?.settings?.submitButtonText || 'Enviar',
      successMessage: initialData?.settings?.successMessage || 'Formulário enviado com sucesso!',
      notificationEmail: initialData?.settings?.notificationEmail || '',
    },
    style: {
      layout: initialData?.style?.layout || 'stack',
      theme: initialData?.style?.theme || 'light',
      customColors: initialData?.style?.customColors || {
        primary: '#000000',
        background: '#ffffff',
        text: '#000000'
      },
    },
  });

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: `Novo campo ${type}`,
      required: false,
      order: formData.fields?.length || 0,
      placeholder: '',
      validation: {
        minLength: type === 'text' ? 2 : undefined,
        maxLength: type === 'text' ? 100 : undefined,
      }
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleFieldChange = (fieldId: string, updates: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const handleDeleteField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== fieldId).map((field, index) => ({
        ...field,
        order: index
      }))
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const fields = Array.from(formData.fields || []);
    const [reorderedField] = fields.splice(result.source.index, 1);
    fields.splice(result.destination.index, 0, reorderedField);

    setFormData(prev => ({
      ...prev,
      fields: fields.map((field, index) => ({ ...field, order: index }))
    }));
  };

  const handleSettingsChange = (key: keyof FormSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        identificationRequired: prev.settings?.identificationRequired || 'whatsapp',
        submitButtonText: prev.settings?.submitButtonText || 'Enviar',
        successMessage: prev.settings?.successMessage || 'Formulário enviado com sucesso!',
        notificationEmail: prev.settings?.notificationEmail || '',
        [key]: value
      }
    }));
  };

  const handleStyleChange = (key: keyof FormStyle, value: any) => {
    setFormData(prev => ({
      ...prev,
      style: {
        layout: prev.style?.layout || 'stack',
        theme: prev.style?.theme || 'light',
        customColors: prev.style?.customColors || {
          primary: '#000000',
          background: '#ffffff',
          text: '#000000'
        },
        [key]: value
      }
    }));
  };

  const handleCustomColorChange = (key: keyof Required<FormStyle>['customColors'], value: string) => {
    setFormData(prev => ({
      ...prev,
      style: {
        layout: prev.style?.layout || 'stack',
        theme: prev.style?.theme || 'light',
        customColors: {
          primary: prev.style?.customColors?.primary || '#000000',
          background: prev.style?.customColors?.background || '#ffffff',
          text: prev.style?.customColors?.text || '#000000',
          [key]: value
        }
      }
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      toast.error('O nome do formulário é obrigatório');
      return false;
    }

    if (!formData.fields?.length) {
      toast.error('Adicione pelo menos um campo ao formulário');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSave(formData);
      toast.success('Formulário salvo com sucesso!');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Erro ao salvar formulário');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Formulário</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Anamnese Inicial"
          />
        </div>
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Ex: Formulário para primeira consulta"
          />
        </div>
      </div>

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="style">Estilo</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddField('text')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Texto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddField('email')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddField('phone')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Telefone
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddField('cpf')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              CPF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddField('select')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Seleção
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {formData.fields?.map((field, index) => (
                    <Draggable
                      key={field.id}
                      draggableId={field.id}
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="relative group"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <Input
                                  value={field.label}
                                  onChange={(e) => handleFieldChange(field.id, { label: e.target.value })}
                                  placeholder="Nome do campo"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="identificationRequired">Identificação Necessária</Label>
              <select
                id="identificationRequired"
                value={formData.settings?.identificationRequired}
                onChange={(e) => handleSettingsChange('identificationRequired', e.target.value as 'whatsapp' | 'cpf' | 'both' | 'none')}
                className="w-full mt-2 bg-white border border-gray-200 rounded-md p-2"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="cpf">CPF</option>
                <option value="both">Ambos</option>
                <option value="none">Nenhum</option>
              </select>
            </div>
            <div>
              <Label htmlFor="submitButtonText">Texto do Botão</Label>
              <Input
                id="submitButtonText"
                value={formData.settings?.submitButtonText}
                onChange={(e) => handleSettingsChange('submitButtonText', e.target.value)}
                placeholder="Ex: Enviar"
              />
            </div>
            <div>
              <Label htmlFor="successMessage">Mensagem de Sucesso</Label>
              <Input
                id="successMessage"
                value={formData.settings?.successMessage}
                onChange={(e) => handleSettingsChange('successMessage', e.target.value)}
                placeholder="Ex: Formulário enviado com sucesso!"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="layout">Layout</Label>
              <select
                id="layout"
                value={formData.style?.layout}
                onChange={(e) => handleStyleChange('layout', e.target.value as 'stack' | 'grid')}
                className="w-full mt-2 bg-white border border-gray-200 rounded-md p-2"
              >
                <option value="stack">Stack</option>
                <option value="grid">Grid</option>
              </select>
            </div>
            <div>
              <Label htmlFor="theme">Tema</Label>
              <select
                id="theme"
                value={formData.style?.theme}
                onChange={(e) => handleStyleChange('theme', e.target.value as 'light' | 'dark' | 'custom')}
                className="w-full mt-2 bg-white border border-gray-200 rounded-md p-2"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button
        className="w-full"
        onClick={handleSubmit}
      >
        Salvar Formulário
      </Button>
    </div>
  );
} 