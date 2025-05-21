'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, GripVertical, Trash2, Link2, FormInput, Loader2, CheckSquare, Square, Save, Plus, FileText, MapPin, MessageCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import { Block, BlockType } from '@/types/blocks';
import { Form } from '@/types/forms';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  disabled?: boolean;
}

const blockTypes = [
  { type: 'BUTTON' as const, label: 'Botão' },
  { type: 'MULTI_STEP' as const, label: 'Botão Multi-step' },
  { type: 'FORM' as const, label: 'Formulário' },
  { type: 'ADDRESS' as const, label: 'Endereço' },
  { type: 'AI_CHAT' as const, label: 'Chat de IA' },
  { type: 'WHATSAPP' as const, label: 'WhatsApp Flutuante' },
  { type: 'REDIRECT' as const, label: 'Redirecionamento' }
] as const;

export function BlockEditor({ blocks, onBlocksChange, disabled = false }: BlockEditorProps) {
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<Block['type'] | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [showFormModal, setShowFormModal] = useState<{[key: string]: boolean}>({});
  const [selectedForm, setSelectedForm] = useState<{[key: string]: Form | null}>({});
  const [isModalOpen, setIsModalOpen] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const debouncedUpdateBlocks = useDebouncedCallback(
    (newBlocks: Block[]) => {
      onBlocksChange(newBlocks);
    },
    500
  );

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch('/api/pipelines');
        if (!response.ok) {
          throw new Error('Erro ao buscar pipelines');
        }
        const data = await response.json();
        setPipelines(data);
      } catch (error) {
        console.error('Erro ao buscar pipelines:', error);
        toast.error('Não foi possível carregar os pipelines');
      }
    };

    fetchPipelines();
  }, []);

  useEffect(() => {
    const fetchForms = async () => {
      setIsLoadingForms(true);
      try {
        const response = await fetch('/api/forms');
        if (!response.ok) throw new Error('Failed to load forms');
        const data = await response.json();
        setForms(data);

        // Update selected forms for existing form blocks
        setLocalBlocks(prevBlocks => 
          prevBlocks.map(block => {
            if (block.type === 'FORM' && block.content.formId) {
              const form = data.find(f => f.id === block.content.formId);
              if (form) {
                return {
                  ...block,
                  content: {
                    ...block.content,
                    title: block.content.title || 'Abrir Formulário',
                    modalTitle: block.content.modalTitle || form.name,
                    showInModal: block.content.showInModal || false
                  }
                };
              }
            }
            return block;
          })
        );
      } catch (error) {
        console.error('Error loading forms:', error);
        toast.error('Erro ao carregar formulários');
      } finally {
        setIsLoadingForms(false);
      }
    };

    fetchForms();
  }, []);

  useEffect(() => {
    // Update selected forms for all form blocks
    localBlocks.forEach(block => {
      if (block.type === 'FORM' && block.content.formId) {
        const form = forms.find(f => f.id === block.content.formId);
        setSelectedForm(prev => ({
          ...prev,
          [block.id]: form || null
        }));
      }
    });
  }, [localBlocks, forms]);

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      await onBlocksChange(localBlocks);
      setHasUnsavedChanges(false);
      toast.success('Alterações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = async () => {
    if (!selectedBlockType) return;

    setIsAddingBlock(true);
    try {
      const newBlock: Block = {
        id: Math.random().toString(36).substr(2, 9),
        type: selectedBlockType,
        content:
          selectedBlockType === 'BUTTON'
            ? {
                label: '',
                url: ''
              }
            : selectedBlockType === 'FORM'
            ? {
                formId: '',
                title: 'Abrir Formulário',
                modalTitle: '',
                showInModal: false,
                pipelineId: '',
                successPage: ''
              }
            : selectedBlockType === 'ADDRESS'
            ? {
                address: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
              }
            : selectedBlockType === 'AI_CHAT'
            ? {
                greeting: ''
              }
            : selectedBlockType === 'WHATSAPP'
            ? {
                whatsappNumber: '',
                hasButton: true,
                buttonLabel: 'Fale conosco',
                buttonTitle: 'Iniciar conversa'
              }
            : selectedBlockType === 'MULTI_STEP'
            ? {
                label: 'Multi-step',
                subButtons: [],
                modalSize: 'default',
                modalLayout: 'grid',
                showDescriptions: true,
                showIcons: true
              }
            : selectedBlockType === 'REDIRECT'
            ? {
                redirectUrl: '',
                redirectDelay: 5,
                showCountdown: true
              }
            : {},
        order: blocks.length
      };

      const updatedBlocks = [...localBlocks, newBlock];
      setLocalBlocks(updatedBlocks);
      onBlocksChange(updatedBlocks);

      toast.success('Bloco adicionado!', {
        description: `O ${selectedBlockType === 'BUTTON' ? 'botão' : selectedBlockType === 'MULTI_STEP' ? 'botão multi-step' : selectedBlockType === 'FORM' ? 'formulário' : selectedBlockType === 'ADDRESS' ? 'endereço' : selectedBlockType === 'WHATSAPP' ? 'WhatsApp Flutuante' : 'chat de IA'} foi adicionado com sucesso.`,
        duration: 4000,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Erro ao adicionar bloco', {
        description: 'Ocorreu um erro ao adicionar o bloco. Por favor, tente novamente.',
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setIsAddingBlock(false);
      setSelectedBlockType(null);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId);
    try {
      const blockToDelete = localBlocks.find(block => block.id === blockId);
      if (!blockToDelete) return;

      const newBlocks = localBlocks
        .filter(block => block.id !== blockId)
        .map((block, index) => ({
          ...block,
          order: index
        }));

      setLocalBlocks(newBlocks);
      setHasUnsavedChanges(true);
      
      toast.success('Bloco removido!', {
        description: `O ${blockToDelete.type === 'BUTTON' ? 'botão' : blockToDelete.type === 'FORM' ? 'formulário' : blockToDelete.type === 'ADDRESS' ? 'endereço' : blockToDelete.type === 'WHATSAPP' ? 'WhatsApp Flutuante' : 'chat de IA'} foi excluído com sucesso.`,
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #e2e8f0'
        }
      });
    } finally {
      setDeletingBlockId(null);
    }
  };

  const toggleBlockSelection = (blockId: string) => {
    const newSelection = new Set(selectedBlocks);
    if (newSelection.has(blockId)) {
      newSelection.delete(blockId);
    } else {
      newSelection.add(blockId);
    }
    setSelectedBlocks(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedBlocks.size === 0) return;

    setIsDeletingMultiple(true);
    try {
      const newBlocks = localBlocks
        .filter(block => !selectedBlocks.has(block.id))
        .map((block, index) => ({
          ...block,
          order: index
        }));

      setLocalBlocks(newBlocks);
      setHasUnsavedChanges(true);
      
      toast.success('Blocos removidos!', {
        description: `${selectedBlocks.size} ${selectedBlocks.size === 1 ? 'bloco foi removido' : 'blocos foram removidos'} com sucesso.`,
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #e2e8f0'
        }
      });
      
      setSelectedBlocks(new Set());
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const handleBlockContentChange = useCallback((blockId: string, content: any) => {
    setLocalBlocks(prevBlocks => {
      const newBlocks = prevBlocks.map(block =>
      block.id === blockId ? { ...block, content } : block
    );
      setHasUnsavedChanges(true);
      return newBlocks;
    });
  }, []);

  const handleDragStart = (block: Block) => {
    if (disabled) return;
    setDraggedBlock(block);
  };

  const handleDragOver = (e: React.DragEvent, targetBlock: Block) => {
    if (disabled) return;
    e.preventDefault();
    if (!draggedBlock || draggedBlock.id === targetBlock.id) return;

    setLocalBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      const draggedIndex = prevBlocks.findIndex((b) => b.id === draggedBlock.id);
      const targetIndex = prevBlocks.findIndex((b) => b.id === targetBlock.id);

    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);

    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));

      setHasUnsavedChanges(true);
      return reorderedBlocks;
    });
  };

  const handleDragEnd = () => {
    if (disabled) return;
    setDraggedBlock(null);
  };

  const renderBlockContent = (block: Block) => {
    switch (block.type) {
      case 'BUTTON':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Botão</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`button-label-${block.id}`}>Label</Label>
              <Input
                id={`button-label-${block.id}`}
                value={block.content.label}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    label: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`button-url-${block.id}`}>URL</Label>
              <Input
                id={`button-url-${block.id}`}
                value={block.content.url}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    url: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>
          </div>
        );
      case 'MULTI_STEP':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Botão Multi-step</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`button-label-${block.id}`}>Label do Botão</Label>
              <Input
                id={`button-label-${block.id}`}
                value={block.content.label}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    label: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`modal-title-${block.id}`}>Título do Modal</Label>
              <Input
                id={`modal-title-${block.id}`}
                value={block.content.modalTitle}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    modalTitle: e.target.value,
                  })
                }
                disabled={disabled}
                placeholder="Deixe em branco para usar o label do botão"
              />
            </div>

            <div className="space-y-2">
              <Label>Layout do Modal</Label>
              <Select
                value={block.content.modalLayout || 'list'}
                onValueChange={(value) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    modalLayout: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho do Modal</Label>
              <Select
                value={block.content.modalSize || 'default'}
                onValueChange={(value) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    modalSize: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`show-icons-${block.id}`}
                checked={block.content.showIcons ?? true}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    showIcons: e.target.checked,
                  })
                }
                disabled={disabled}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor={`show-icons-${block.id}`}>Mostrar ícones</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`show-descriptions-${block.id}`}
                checked={block.content.showDescriptions ?? true}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    showDescriptions: e.target.checked,
                  })
                }
                disabled={disabled}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor={`show-descriptions-${block.id}`}>Mostrar descrições</Label>
            </div>

            <div className="space-y-4 border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Sub-botões</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSubButton = {
                      id: Math.random().toString(36).substr(2, 9),
                      label: '',
                      url: '',
                      isExternal: true,
                    };
                    handleBlockContentChange(block.id, {
                      ...block.content,
                      subButtons: [...(block.content.subButtons || []), newSubButton],
                    });
                  }}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-4">
                {block.content.subButtons?.map((subButton, index) => (
                  <Card key={subButton.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              value={subButton.label}
                              onChange={(e) => {
                                const newSubButtons = [...(block.content.subButtons || [])];
                                newSubButtons[index] = {
                                  ...subButton,
                                  label: e.target.value,
                                };
                                handleBlockContentChange(block.id, {
                                  ...block.content,
                                  subButtons: newSubButtons,
                                });
                              }}
                              disabled={disabled}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                              value={subButton.url}
                              onChange={(e) => {
                                const newSubButtons = [...(block.content.subButtons || [])];
                                newSubButtons[index] = {
                                  ...subButton,
                                  url: e.target.value,
                                };
                                handleBlockContentChange(block.id, {
                                  ...block.content,
                                  subButtons: newSubButtons,
                                });
                              }}
                              disabled={disabled}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                              value={subButton.description}
                              onChange={(e) => {
                                const newSubButtons = [...(block.content.subButtons || [])];
                                newSubButtons[index] = {
                                  ...subButton,
                                  description: e.target.value,
                                };
                                handleBlockContentChange(block.id, {
                                  ...block.content,
                                  subButtons: newSubButtons,
                                });
                              }}
                              disabled={disabled}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Ícone (emoji ou símbolo)</Label>
                            <Input
                              value={subButton.icon}
                              onChange={(e) => {
                                const newSubButtons = [...(block.content.subButtons || [])];
                                newSubButtons[index] = {
                                  ...subButton,
                                  icon: e.target.value,
                                };
                                handleBlockContentChange(block.id, {
                                  ...block.content,
                                  subButtons: newSubButtons,
                                });
                              }}
                              disabled={disabled}
                              placeholder="Ex: 📱, 📞, 💬"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`external-${block.id}-${subButton.id}`}
                              checked={subButton.isExternal}
                              onChange={(e) => {
                                const newSubButtons = [...(block.content.subButtons || [])];
                                newSubButtons[index] = {
                                  ...subButton,
                                  isExternal: e.target.checked,
                                };
                                handleBlockContentChange(block.id, {
                                  ...block.content,
                                  subButtons: newSubButtons,
                                });
                              }}
                              disabled={disabled}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor={`external-${block.id}-${subButton.id}`}>
                              Abrir em nova aba
                            </Label>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newSubButtons = block.content.subButtons?.filter(
                              (btn) => btn.id !== subButton.id
                            );
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              subButtons: newSubButtons,
                            });
                          }}
                          disabled={disabled}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );
      case 'FORM':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Formulário</Label>
                <div className="text-sm text-gray-500">
                  {(selectedForm[block.id]?.name) ?? 'Selecione um formulário'}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFormModal(prev => ({ ...prev, [block.id]: true }))}
              >
                {selectedForm[block.id] ? 'Trocar' : 'Selecionar'}
              </Button>
            </div>

            <Dialog 
              open={showFormModal[block.id]} 
              onOpenChange={(open) => setShowFormModal(prev => ({ ...prev, [block.id]: open }))}
            >
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Selecionar Formulário</DialogTitle>
                  <DialogDescription>
                    Escolha um formulário para adicionar à sua página
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {isLoadingForms ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : forms.length === 0 ? (
                    <div className="text-center py-8">
                      <FormInput className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum formulário encontrado
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Crie seu primeiro formulário para começar
                      </p>
                      <Button asChild>
                        <Link href="/formularios">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Criar Formulário
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {forms.map((form) => (
                        <Card
                          key={form.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-gray-100",
                            form.id === block.content.formId && "border-primary"
                          )}
                          onClick={() => {
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              formId: form.id,
                              title: block.content.title || 'Abrir Formulário',
                              modalTitle: block.content.modalTitle || form.name,
                              showInModal: block.content.showInModal || false,
                              pipelineId: block.content.pipelineId,
                              successPage: block.content.successPage
                            });
                            setSelectedForm(prev => ({
                              ...prev,
                              [block.id]: form
                            }));
                            setShowFormModal(prev => ({ ...prev, [block.id]: false }))
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{form.name}</h4>
                                {form.description && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {form.description}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 mt-2">
                                  {form.fields.length} campos
                                </div>
                              </div>
                              {form.id === block.content.formId && (
                                <CheckSquare className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`button-title-${block.id}`}>Título do Botão</Label>
                <Input
                  id={`button-title-${block.id}`}
                  value={block.content.title || 'Abrir Formulário'}
                  onChange={(e) =>
                    handleBlockContentChange(block.id, {
                      ...block.content,
                      title: e.target.value,
                    })
                  }
                  placeholder="Ex: Preencher Formulário"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`modal-title-${block.id}`}>Título do Modal</Label>
                <Input
                  id={`modal-title-${block.id}`}
                  value={block.content.modalTitle || selectedForm[block.id]?.name || ''}
                  onChange={(e) =>
                    handleBlockContentChange(block.id, {
                      ...block.content,
                      modalTitle: e.target.value,
                    })
                  }
                  placeholder="Ex: Formulário de Contato"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`pipeline-id-${block.id}`}>Pipeline</Label>
                <Select
                  value={block.content.pipelineId || ''}
                  onValueChange={(value) =>
                    handleBlockContentChange(block.id, {
                      ...block.content,
                      pipelineId: value,
                    })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger id={`pipeline-id-${block.id}`}>
                    <SelectValue placeholder="Selecione um pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`success-page-${block.id}`}>Página de Sucesso</Label>
                <Input
                  id={`success-page-${block.id}`}
                  value={block.content.successPage || ''}
                  onChange={(e) =>
                    handleBlockContentChange(block.id, {
                      ...block.content,
                      successPage: e.target.value,
                    })
                  }
                  placeholder="Ex: /obrigado"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Configurações</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`modal-${block.id}`}
                  checked={block.content.showInModal || false}
                  onCheckedChange={(checked) => {
                    const updatedContent = {
                      ...block.content,
                      showInModal: checked,
                      // Ensure we have default values when enabling modal
                      title: block.content.title || 'Abrir Formulário',
                      modalTitle: block.content.modalTitle || selectedForm[block.id]?.name || ''
                    };
                    handleBlockContentChange(block.id, updatedContent);
                    // Force save changes when toggling modal
                    setHasUnsavedChanges(true);
                  }}
                />
                <Label htmlFor={`modal-${block.id}`}>Mostrar em modal</Label>
              </div>
            </div>
          </div>
        );
      case 'ADDRESS':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Address Block</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`address-${block.id}`}>Address</Label>
              <Input
                id={`address-${block.id}`}
                value={block.content.address}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    address: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`city-${block.id}`}>City</Label>
              <Input
                id={`city-${block.id}`}
                value={block.content.city}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    city: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`state-${block.id}`}>State</Label>
              <Input
                id={`state-${block.id}`}
                value={block.content.state}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    state: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`zip-code-${block.id}`}>Zip Code</Label>
              <Input
                id={`zip-code-${block.id}`}
                value={block.content.zipCode}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    zipCode: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`country-${block.id}`}>Country</Label>
              <Input
                id={`country-${block.id}`}
                value={block.content.country}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    country: e.target.value,
                  })
                }
                disabled={disabled}
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id={`address-button-${block.id}`}
                checked={block.content.hasButton}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    hasButton: e.target.checked,
                  })
                }
                disabled={disabled}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor={`address-button-${block.id}`}>Adicionar botão</Label>
            </div>

            {block.content.hasButton && (
              <div className="space-y-4 mt-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Botão</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`button-label-${block.id}`}>Texto do botão</Label>
                  <Input
                    id={`button-label-${block.id}`}
                    value={block.content.buttonLabel || ''}
                    onChange={(e) =>
                      handleBlockContentChange(block.id, {
                        ...block.content,
                        buttonLabel: e.target.value,
                      })
                    }
                    placeholder="Ex: Como chegar"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`button-url-${block.id}`}>URL do botão</Label>
                  <Input
                    id={`button-url-${block.id}`}
                    value={block.content.buttonUrl || ''}
                    onChange={(e) =>
                      handleBlockContentChange(block.id, {
                        ...block.content,
                        buttonUrl: e.target.value,
                      })
                    }
                    placeholder="Ex: https://maps.google.com/..."
                    disabled={disabled}
                  />
                </div>
              </div>
            )}
          </div>
        );
      case 'WHATSAPP':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">WhatsApp Flutuante</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`whatsapp-number-${block.id}`}>Número do WhatsApp</Label>
              <Input
                id={`whatsapp-number-${block.id}`}
                value={block.content.whatsappNumber || ''}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    whatsappNumber: e.target.value
                  })
                }
                placeholder="Ex: +5511999999999"
              />
            </div>
          </div>
        );
      case 'AI_CHAT':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">AI Chat Block</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`chat-title-${block.id}`}>Título do Botão</Label>
              <Input
                id={`chat-title-${block.id}`}
                value={block.content.buttonTitle || 'Fale com o Dr.'}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    buttonTitle: e.target.value,
                  })
                }
                placeholder="Ex: Fale com o Dr."
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`chat-greeting-${block.id}`}>Mensagem Inicial</Label>
              <Input
                id={`chat-greeting-${block.id}`}
                value={block.content.greeting || 'Olá! Como posso ajudar?'}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    greeting: e.target.value,
                  })
                }
                placeholder="Ex: Olá! Como posso ajudar?"
                disabled={disabled}
              />
            </div>
          </div>
        );
      case 'REDIRECT':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Redirecionamento</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`redirect-label-${block.id}`}>Texto de exibição</Label>
              <Input
                id={`redirect-label-${block.id}`}
                value={block.content.label}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    label: e.target.value,
                  })
                }
                disabled={disabled}
                placeholder="Ex: Redirecionando para o WhatsApp..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`redirect-url-${block.id}`}>URL de redirecionamento</Label>
              <Input
                id={`redirect-url-${block.id}`}
                value={block.content.redirectUrl}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    redirectUrl: e.target.value,
                  })
                }
                disabled={disabled}
                placeholder="Ex: https://whatsapp.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`redirect-delay-${block.id}`}>Tempo de espera (segundos)</Label>
              <Input
                id={`redirect-delay-${block.id}`}
                type="number"
                min="1"
                max="60"
                value={block.content.redirectDelay}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    redirectDelay: parseInt(e.target.value) || 5,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`show-countdown-${block.id}`}
                checked={block.content.showCountdown}
                onChange={(e) =>
                  handleBlockContentChange(block.id, {
                    ...block.content,
                    showCountdown: e.target.checked,
                  })
                }
                disabled={disabled}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor={`show-countdown-${block.id}`}>Mostrar contagem regressiva</Label>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Unknown Block Type</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Select
            value={selectedBlockType || ''}
            onValueChange={(value: BlockType) => setSelectedBlockType(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUTTON">Botão</SelectItem>
              <SelectItem value="MULTI_STEP">Botão Multi-step</SelectItem>
              <SelectItem value="FORM">Formulário</SelectItem>
              <SelectItem value="ADDRESS">Endereço</SelectItem>
              <SelectItem value="AI_CHAT">Chat com IA</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp Flutuante</SelectItem>
              <SelectItem value="REDIRECT">Redirecionamento</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleAddBlock} 
            disabled={!selectedBlockType || isAddingBlock}
            className="whitespace-nowrap"
          >
            {isAddingBlock ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Adicionar Bloco
          </Button>
        </div>

        <div className="flex items-center gap-2">
        {selectedBlocks.size > 0 && (
            <>
            <span className="text-sm text-gray-500">
              {selectedBlocks.size} {selectedBlocks.size === 1 ? 'bloco selecionado' : 'blocos selecionados'}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeletingMultiple}
            >
              {isDeletingMultiple ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir Selecionados
            </Button>
            </>
          )}

          {hasUnsavedChanges && (
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving || disabled}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          )}
          </div>
      </div>

      <div className="space-y-4">
        {localBlocks.map((block) => (
          <Card
            key={block.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(block)}
            onDragOver={(e) => handleDragOver(e, block)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative group transition-all duration-200",
              selectedBlocks.has(block.id) && "border-blue-500 bg-blue-50/50"
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => toggleBlockSelection(block.id)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  {selectedBlocks.has(block.id) ? (
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                <div
                  className="cursor-move p-2 hover:bg-gray-100 rounded"
                  draggable
                  onDragStart={() => handleDragStart(block)}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex-1">
                  {renderBlockContent(block)}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBlock(block.id)}
                  disabled={disabled || deletingBlockId === block.id}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingBlockId === block.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 