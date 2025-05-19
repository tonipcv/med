'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  phone: string | null;
  image: string | null;
  slug: string;
  createdAt: string;
}

export function DoctorManager() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    specialty: '',
    phone: '',
  });

  // Carregar lista de médicos
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (!response.ok) throw new Error('Falha ao carregar médicos');
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      toast.error('Erro ao carregar lista de médicos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar um único médico
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('doctor', JSON.stringify(newDoctor));

      const response = await fetch('/api/doctors', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar médico');
      }

      toast.success('Médico adicionado com sucesso');
      setAddDialogOpen(false);
      setNewDoctor({ name: '', email: '', specialty: '', phone: '' });
      fetchDoctors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar médico');
    }
  };

  // Importar médicos via CSV
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const response = await fetch('/api/doctors', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao importar médicos');
      }

      const result = await response.json();
      
      if (result.errors.length > 0) {
        toast.error(`Importação concluída com ${result.errors.length} erros. Verifique o console para detalhes.`);
        console.error('Erros na importação:', result.errors);
      } else {
        toast.success(`${result.success} médicos importados com sucesso`);
      }

      fetchDoctors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao importar médicos');
    } finally {
      // Limpar o input file
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Médicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Adicionar Médico</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Médico</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDoctor} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newDoctor.name}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDoctor.email}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Input
                      id="specialty"
                      value={newDoctor.specialty}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, specialty: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newDoctor.phone}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, phone: e.target.value })
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Adicionar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="hidden"
                id="csv-upload"
              />
              <Label
                htmlFor="csv-upload"
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150 cursor-pointer"
              >
                Importar CSV
              </Label>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>{doctor.specialty || '-'}</TableCell>
                    <TableCell>{doctor.phone || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(doctor.createdAt), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 