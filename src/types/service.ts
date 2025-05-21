export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  category?: string;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  is_active?: boolean;
} 