'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  XMarkIcon, 
  PhoneIcon, 
  UserIcon, 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  TableCellsIcon
} from "@heroicons/react/24/outline";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CSVImportModal } from "@/components/patients/csv-import-modal";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectGroup as UISelectGroup,
  SelectItem as UISelectItem,
  SelectLabel as UISelectLabel,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
  SelectSeparator as UISelectSeparator,
} from "@/components/ui/select";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  lead: {
    status: string;
    appointmentDate: string | null;
    medicalNotes: string | null;
  };
}

export default function PacientesPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    appointmentDate: "",
    medicalNotes: ""
  });
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "novo",
    appointmentDate: "",
    medicalNotes: "",
    hasPortalAccess: false
  });
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [sendingPortalConfig, setSendingPortalConfig] = useState<{ [key: string]: boolean }>({});
  const [portalConfigSent, setPortalConfigSent] = useState<{ [key: string]: boolean }>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const router = useRouter();

  const fetchPatients = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      
      if (response.ok) {
        const data = await response.json();
        setPatients(Array.isArray(data) ? data : []);
      } else {
        console.error('Erro ao buscar pacientes:', response.statusText);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os pacientes",
          variant: "destructive"
        });
        setPatients([]);
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os pacientes",
        variant: "destructive"
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchPatients();
    }
  }, [session]);

  // Cleanup effect for dropdowns
  useEffect(() => {
    if (!isViewModalOpen && !isEditModalOpen && !isCreateModalOpen) {
      setIsStatusOpen(false);
      setIsCreateStatusOpen(false);
    }
  }, [isViewModalOpen, isEditModalOpen, isCreateModalOpen]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isStatusOpen || isCreateStatusOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[role="combobox"]')) {
          setIsStatusOpen(false);
          setIsCreateStatusOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusOpen, isCreateStatusOpen]);

  // useEffect to clean up state when create modal is closed
  useEffect(() => {
    if (!isCreateModalOpen) {
      setCreateFormData({
        name: "",
        email: "",
        phone: "",
        status: "novo",
        appointmentDate: "",
        medicalNotes: "",
        hasPortalAccess: false
      });
    }
  }, [isCreateModalOpen]);

  // useEffect to clean up state when edit/view modals are closed
  useEffect(() => {
    if (!isViewModalOpen && !isEditModalOpen) {
      setViewingPatient(null);
      setEditingPatient(null);
      setEditFormData({
        name: "",
        email: "",
        phone: "",
        status: "novo",
        appointmentDate: "",
        medicalNotes: ""
      });
    }
  }, [isViewModalOpen, isEditModalOpen]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'novo':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-200 flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            <span>Novo</span>
          </Badge>
        );
      case 'agendado':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-none hover:bg-purple-200 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Agendado</span>
          </Badge>
        );
      case 'concluído':
        return (
          <Badge className="bg-green-100 text-green-800 border-none hover:bg-green-200 flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            <span>Concluído</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-none hover:bg-gray-200 flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            <span>{status || 'Desconhecido'}</span>
          </Badge>
        );
    }
  };

  const filteredPatients = patients.filter(patient => {
    // Filter by status if not "all"
    if (activeTab !== "all" && patient.lead?.status !== activeTab) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        patient.name.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term) ||
        patient.phone.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const handleViewPatient = (patient: Patient) => {
    setViewingPatient(patient);
    setIsViewModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      status: patient.lead?.status || 'novo',
      appointmentDate: patient.lead?.appointmentDate || '',
      medicalNotes: patient.lead?.medicalNotes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleCreateModal = () => {
    setCreateFormData({
      name: "",
      email: "",
      phone: "",
      status: "novo",
      appointmentDate: "",
      medicalNotes: "",
      hasPortalAccess: false
    });
    setIsCreateModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, status: value }));
  };

  const handleCreateStatusChange = (status: string) => {
    setCreateFormData(prev => ({
      ...prev,
      status
    }));
  };

  const handleAppointmentDateChange = (date: Date | null) => {
    setEditFormData(prev => ({ 
      ...prev, 
      appointmentDate: date ? date.toISOString() : "" 
    }));
  };

  const handleCreateAppointmentDateChange = (date: Date | null) => {
    setCreateFormData(prev => ({ 
      ...prev, 
      appointmentDate: date ? date.toISOString() : "" 
    }));
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient) return;

    // Validar dados obrigatórios
    if (!editFormData.name || !editFormData.email || !editFormData.phone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          phone: editFormData.phone.trim(),
          lead: {
            status: editFormData.status,
            appointmentDate: editFormData.appointmentDate || null,
            medicalNotes: editFormData.medicalNotes || null
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Atualiza o paciente na lista local
        setPatients(prevPatients => 
          prevPatients.map(p => 
            p.id === editingPatient.id ? data : p
          )
        );
        
        toast({
          title: "Sucesso",
          description: "As informações do paciente foram atualizadas com sucesso.",
        });
        
        // Fechando o modal depois de atualizar os dados
        setIsEditModalOpen(false);
      } else {
        throw new Error(data.error || 'Erro ao atualizar paciente');
      }
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o paciente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePatient = async () => {
    // Validar dados obrigatórios
    if (!createFormData.name || !createFormData.email || !createFormData.phone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createFormData.name.trim(),
          email: createFormData.email.trim(),
          phone: createFormData.phone.trim(),
          hasPortalAccess: createFormData.hasPortalAccess,
          lead: {
            status: createFormData.status,
            appointmentDate: createFormData.appointmentDate || null,
            medicalNotes: createFormData.medicalNotes || null
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Adiciona o novo paciente à lista local
        setPatients(prevPatients => [data, ...prevPatients]);
        
        toast({
          title: "Sucesso",
          description: "O novo paciente foi criado com sucesso.",
        });
        
        // Fechar modal
        setIsCreateModalOpen(false);
        
        // Limpar formulário
        setCreateFormData({
          name: "",
          email: "",
          phone: "",
          status: "novo",
          appointmentDate: "",
          medicalNotes: "",
          hasPortalAccess: false
        });
      } else {
        throw new Error(data.error || 'Erro ao criar paciente');
      }
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o paciente",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove o paciente da lista local
        setPatients(prevPatients => prevPatients.filter(p => p.id !== patientToDelete.id));
        
        toast({
          title: "Sucesso",
          description: "Paciente excluído com sucesso.",
        });
        
        setIsDeleteModalOpen(false);
        setPatientToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir paciente');
      }
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o paciente",
        variant: "destructive",
      });
    }
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleImportComplete = () => {
    setIsImportModalOpen(false);
    fetchPatients();
  };

  // Update the import modal open handler to close dropdowns
  const handleOpenImportModal = () => {
    setIsStatusOpen(false);
    setIsCreateStatusOpen(false);
    setIsImportModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setCreateFormData({
      name: "",
      email: "",
      phone: "",
      status: "novo",
      appointmentDate: "",
      medicalNotes: "",
      hasPortalAccess: false
    });
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border border-gray-400 border-t-gray-600"></div>
          <p className="text-xs text-gray-500 tracking-[-0.03em] font-inter">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Lista de Pacientes</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus pacientes</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 bg-white text-gray-700 border-gray-200 hover:bg-gray-100">
                <PlusIcon className="h-4 w-4 mr-2" />
                <span>Adicionar</span>
                <ChevronDownIcon className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleOpenCreateModal} className="cursor-pointer">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                <span>Novo Paciente</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)} className="cursor-pointer">
                <TableCellsIcon className="h-4 w-4 mr-2" />
                <span>Import CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardContent className="pt-6 pb-4 sm:pb-3 px-6 sm:px-4">
            {/* Desktop Search and Filter */}
            <div className="hidden md:flex items-center justify-end gap-4 mb-8">
              <UISelect
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <UISelectTrigger className="w-[180px] bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10">
                  <UISelectValue placeholder="Filtrar por status" />
                </UISelectTrigger>
                <UISelectContent>
                  <UISelectGroup>
                    <UISelectLabel>Status</UISelectLabel>
                    <UISelectItem value="all">Todos</UISelectItem>
                    <UISelectItem value="novo">Novos</UISelectItem>
                    <UISelectItem value="agendado">Agendados</UISelectItem>
                    <UISelectItem value="concluído">Concluídos</UISelectItem>
                  </UISelectGroup>
                </UISelectContent>
              </UISelect>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[280px] bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10"
                />
              </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden space-y-4 mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10"
                />
              </div>
              <UISelect
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <UISelectTrigger className="w-full bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10">
                  <UISelectValue placeholder="Filtrar por status" />
                </UISelectTrigger>
                <UISelectContent>
                  <UISelectGroup>
                    <UISelectLabel>Status</UISelectLabel>
                    <UISelectItem value="all">Todos</UISelectItem>
                    <UISelectItem value="novo">Novos</UISelectItem>
                    <UISelectItem value="agendado">Agendados</UISelectItem>
                    <UISelectItem value="concluído">Concluídos</UISelectItem>
                  </UISelectGroup>
                </UISelectContent>
              </UISelect>
            </div>

            {/* Patient List */}
            <div className="overflow-x-auto -mx-4 px-4">
              {/* Mobile view for small screens */}
              <div className="md:hidden space-y-3">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div key={patient.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="font-semibold text-base text-gray-900">{patient.name}</div>
                        <div>
                          {getStatusBadge(patient.lead?.status || 'novo')}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3 text-xs">
                        <div className="flex">
                          <div className="w-20 flex items-center gap-1 text-gray-500">
                            <PhoneIcon className="h-3 w-3" />
                            <span>Telefone:</span>
                          </div>
                          <div className="text-gray-700 font-medium">{patient.phone}</div>
                        </div>
                        
                        <div className="flex">
                          <div className="w-20 flex items-center gap-1 text-gray-500">
                            <EnvelopeIcon className="h-3 w-3" />
                            <span>Email:</span>
                          </div>
                          <div className="text-gray-700 font-medium truncate">{patient.email}</div>
                        </div>
                        
                        <div className="flex">
                          <div className="w-20 flex items-center gap-1 text-gray-500">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Data:</span>
                          </div>
                          <div className="text-gray-700 font-medium">
                            {format(new Date(patient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPatient(patient)}
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs h-7 w-7 p-0"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPatient(patient)}
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs h-7 w-7 p-0"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPatientToDelete(patient);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs h-7 w-7 p-0"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : !loading ? (
                  <div className="bg-white p-4 rounded-xl shadow-sm text-center text-gray-500 text-sm">
                    Nenhum paciente encontrado
                  </div>
                ) : null}
                
                {loading && (
                  <div className="bg-white p-4 rounded-xl shadow-sm text-center text-gray-500 text-sm">
                    <div className="animate-spin rounded-full h-5 w-5 border border-gray-400 border-t-gray-600 mx-auto mb-2"></div>
                    Carregando pacientes...
                  </div>
                )}
              </div>
              
              {/* Desktop table view */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Nome</th>
                      <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Email</th>
                      <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Telefone</th>
                      <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Status</th>
                      <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Data de Cadastro</th>
                      <th className="py-3 sm:py-2 px-4 sm:px-3 text-right text-sm sm:text-xs font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <UserIcon className="h-12 w-12 text-gray-400" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum paciente encontrado</h3>
                          <p className="text-sm text-gray-500">Tente ajustar seus filtros ou adicione um novo paciente.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 sm:py-2 px-4 sm:px-3">
                            <div className="font-medium text-base sm:text-sm text-gray-900">{patient.name}</div>
                          </td>
                          <td className="py-3 sm:py-2 px-4 sm:px-3">
                            <div className="text-gray-600 text-sm sm:text-xs">{patient.email}</div>
                          </td>
                          <td className="py-3 sm:py-2 px-4 sm:px-3">
                            <div className="text-gray-600 text-sm sm:text-xs">{patient.phone}</div>
                          </td>
                          <td className="py-3 sm:py-2 px-4 sm:px-3">
                            {getStatusBadge(patient.lead?.status || 'novo')}
                          </td>
                          <td className="py-3 sm:py-2 px-4 sm:px-3">
                            <div className="text-gray-600 text-sm sm:text-xs">
                              {format(new Date(patient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          </td>
                          <td className="py-3 sm:py-2 px-4 sm:px-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                onClick={() => handleViewPatient(patient)}
                              >
                                <EyeIcon className="h-4 w-4 mr-1.5" />
                                Ver detalhes
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 px-2.5"
                                onClick={() => handleEditPatient(patient)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 px-2.5"
                                onClick={() => {
                                  setPatientToDelete(patient);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View/Edit Modal */}
      <Sheet
        open={isViewModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsStatusOpen(false);
            setIsCreateStatusOpen(false);
            if (isEditModalOpen) {
              setIsEditModalOpen(false);
              setIsViewModalOpen(false);
            } else {
              setIsViewModalOpen(false);
            }
            fetchPatients();
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 bg-gray-50">
          <div className="flex h-full flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <SheetHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-xl font-semibold text-gray-900 truncate">
                      {isEditModalOpen ? 'Editar Paciente' : viewingPatient?.name}
                    </SheetTitle>
                    {!isEditModalOpen && viewingPatient?.lead?.status && (
                      <div className="mt-1">
                        {getStatusBadge(viewingPatient.lead.status)}
                      </div>
                    )}
                  </div>
                </div>
              </SheetHeader>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              {isEditModalOpen ? (
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Informações Básicas */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
                      <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm text-gray-700">Nome</Label>
                          <Input
                            id="name"
                            name="name"
                            value={editFormData.name}
                            onChange={handleFormChange}
                            placeholder="Nome do paciente"
                            className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={editFormData.email}
                            onChange={handleFormChange}
                            placeholder="Email do paciente"
                            className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm text-gray-700">Telefone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={editFormData.phone}
                            onChange={handleFormChange}
                            placeholder="Telefone do paciente"
                            className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status e Consulta */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Status e Consulta</h3>
                      <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-sm text-gray-700">Status</Label>
                          <UISelect
                            value={editFormData.status}
                            onValueChange={handleStatusChange}
                          >
                            <UISelectTrigger className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900">
                              <UISelectValue placeholder="Selecione o status" />
                            </UISelectTrigger>
                            <UISelectContent>
                              <UISelectGroup>
                                <UISelectItem value="novo">Novo</UISelectItem>
                                <UISelectItem value="agendado">Agendado</UISelectItem>
                                <UISelectItem value="concluído">Concluído</UISelectItem>
                              </UISelectGroup>
                            </UISelectContent>
                          </UISelect>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="appointmentDate" className="text-sm text-gray-700">Data da Consulta</Label>
                          <DatePicker
                            date={editFormData.appointmentDate ? new Date(editFormData.appointmentDate) : null}
                            onChange={handleAppointmentDateChange}
                            showTimeSelect={true}
                            dateFormat="dd/MM/yyyy HH:mm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prontuário */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Prontuário</h3>
                      <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="medicalNotes" className="text-sm text-gray-700">Anotações</Label>
                          <Textarea
                            id="medicalNotes"
                            name="medicalNotes"
                            value={editFormData.medicalNotes}
                            onChange={handleFormChange}
                            placeholder="Anotações sobre o paciente"
                            className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditModalOpen(false)}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleUpdatePatient}
                        disabled={isSaving}
                        className="bg-gray-900 text-white hover:bg-gray-800"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2"></div>
                            Salvando...
                          </>
                        ) : (
                          'Salvar Alterações'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : viewingPatient && (
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Informações Básicas</h3>
                      <div className="grid gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nome completo</p>
                          <p className="text-sm text-gray-900">{viewingPatient.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{viewingPatient.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Telefone</p>
                          <p className="text-sm text-gray-900">{viewingPatient.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Data de cadastro</p>
                          <p className="text-sm text-gray-900">
                            {format(new Date(viewingPatient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status e Consulta */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Status e Consulta</h3>
                      <div className="grid gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status atual</p>
                          {getStatusBadge(viewingPatient.lead?.status || 'novo')}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Próxima consulta</p>
                          {viewingPatient.lead?.appointmentDate ? (
                            <p className="text-sm text-gray-900">
                              {format(new Date(viewingPatient.lead.appointmentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhuma consulta agendada</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prontuário */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-medium text-gray-900">Prontuário</h3>
                        {!viewingPatient.lead?.medicalNotes && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-blue-600 hover:text-blue-700 whitespace-nowrap"
                            onClick={() => {
                              setIsViewModalOpen(false);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Adicionar anotação
                          </Button>
                        )}
                      </div>
                      {viewingPatient.lead?.medicalNotes ? (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {viewingPatient.lead.medicalNotes}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                          Nenhuma anotação disponível
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsViewModalOpen(false);
                          handleEditPatient(viewingPatient);
                        }}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsViewModalOpen(false);
                          setPatientToDelete(viewingPatient);
                          setIsDeleteModalOpen(true);
                        }}
                        className="bg-white border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Modal */}
      <Sheet
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setIsStatusOpen(false);
            setIsCreateStatusOpen(false);
            fetchPatients();
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 bg-gray-50">
          <div className="flex h-full flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  Novo Paciente
                </SheetTitle>
                <SheetDescription>
                  Preencha as informações do paciente
                </SheetDescription>
              </SheetHeader>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
                    <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm text-gray-700">Nome</Label>
                        <Input
                          id="name"
                          name="name"
                          value={createFormData.name}
                          onChange={handleCreateFormChange}
                          placeholder="Nome do paciente"
                          className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={createFormData.email}
                          onChange={handleCreateFormChange}
                          placeholder="Email do paciente"
                          className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm text-gray-700">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={createFormData.phone}
                          onChange={handleCreateFormChange}
                          placeholder="Telefone do paciente"
                          className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status e Consulta */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Status e Consulta</h3>
                    <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm text-gray-700">Status</Label>
                        <UISelect
                          value={createFormData.status}
                          onValueChange={handleCreateStatusChange}
                        >
                          <UISelectTrigger className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900">
                            <UISelectValue placeholder="Selecione o status" />
                          </UISelectTrigger>
                          <UISelectContent>
                            <UISelectGroup>
                              <UISelectItem value="novo">Novo</UISelectItem>
                              <UISelectItem value="agendado">Agendado</UISelectItem>
                              <UISelectItem value="concluído">Concluído</UISelectItem>
                            </UISelectGroup>
                          </UISelectContent>
                        </UISelect>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointmentDate" className="text-sm text-gray-700">Data da Consulta</Label>
                        <DatePicker
                          date={createFormData.appointmentDate ? new Date(createFormData.appointmentDate) : null}
                          onChange={handleCreateAppointmentDateChange}
                          showTimeSelect={true}
                          dateFormat="dd/MM/yyyy HH:mm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Prontuário */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Prontuário</h3>
                    <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="medicalNotes" className="text-sm text-gray-700">Anotações</Label>
                        <Textarea
                          id="medicalNotes"
                          name="medicalNotes"
                          value={createFormData.medicalNotes}
                          onChange={handleCreateFormChange}
                          placeholder="Anotações sobre o paciente"
                          className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreatePatient}
                      disabled={isCreating}
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2"></div>
                          Criando...
                        </>
                      ) : (
                        'Criar Paciente'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Sheet
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            setPatientToDelete(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 bg-gray-50">
          <div className="flex h-full flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  Excluir Paciente
                </SheetTitle>
                <SheetDescription>
                  Tem certeza que deseja excluir este paciente?
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="grid gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Nome</p>
                      <p className="text-sm text-gray-900">{patientToDelete?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{patientToDelete?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDeletePatient}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
} 