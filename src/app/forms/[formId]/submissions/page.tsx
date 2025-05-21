'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormSubmission } from '@/types/forms';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function FormSubmissionsPage() {
  const params = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formResponse, submissionsResponse] = await Promise.all([
          fetch(`/api/forms/${params.formId}`),
          fetch(`/api/forms/${params.formId}/submissions`)
        ]);

        if (!formResponse.ok || !submissionsResponse.ok) {
          throw new Error('Failed to load data');
        }

        const [formData, submissionsData] = await Promise.all([
          formResponse.json(),
          submissionsResponse.json()
        ]);

        setForm(formData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.formId]);

  const handleExportCSV = () => {
    if (!form || !submissions.length) return;

    // Get all unique fields from submissions
    const fields = new Set<string>();
    submissions.forEach(submission => {
      Object.keys(submission.data).forEach(key => fields.add(key));
    });

    // Create CSV header
    const header = ['ID', 'Data', ...Array.from(fields)];
    const csv = [header.join(',')];

    // Add rows
    submissions.forEach(submission => {
      const row = [
        submission.id,
        new Date(submission.metadata.submittedAt).toLocaleString(),
        ...Array.from(fields).map(field => {
          const value = submission.data[field];
          // Escape commas and quotes
          return value ? `"${String(value).replace(/"/g, '""')}"` : '';
        })
      ];
      csv.push(row.join(','));
    });

    // Download file
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${form.name}-submissoes.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            <Link href={`/forms/${params.formId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{form.name}</h1>
            <p className="text-gray-500">Submissões</p>
          </div>
        </div>
        {submissions.length > 0 && (
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissões ({submissions.length})</CardTitle>
          <CardDescription>
            Visualize todas as submissões do formulário
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma submissão encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500 mb-4">
                      Enviado em {new Date(submission.metadata.submittedAt).toLocaleString()}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(submission.data).map(([key, value]) => (
                        <div key={key}>
                          <div className="font-medium">{key}</div>
                          <div className="text-gray-600">{value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 