export type FieldType = 'text' | 'email' | 'phone' | 'cpf' | 'select' | 'radio' | 'checkbox' | 'textarea';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: Array<{
    label: string;
    value: string;
  }>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    customMessage?: string;
  };
}

export interface FormSettings {
  identificationRequired: 'whatsapp' | 'cpf' | 'both' | 'none';
  submitButtonText: string;
  successMessage: string;
  notificationEmail?: string;
}

export interface FormStyle {
  layout: 'stack' | 'grid';
  theme: 'light' | 'dark' | 'custom';
  customColors?: {
    primary: string;
    background: string;
    text: string;
  };
}

export interface Form {
  id: string;
  name: string;
  title: string;
  description?: string;
  createdBy: string;
  isPublic: boolean;
  category?: 'anamnese' | 'avaliacao' | 'pos_consulta' | 'custom';
  fields: FormField[];
  settings: FormSettings;
  style: FormStyle;
  stats: {
    submissions: number;
    averageCompletionTime: number;
    lastUsed: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  metadata: {
    submittedAt: Date;
    userAgent?: string;
    ipAddress?: string;
    completionTime?: number;
  };
} 