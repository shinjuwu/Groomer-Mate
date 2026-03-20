export interface Pet {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string | null;
  weight_kg: number | null;
  birth_date: string | null;
  notes: string | null;
}

export interface PetFormData {
  customer_id: string;
  name: string;
  species?: string;
  breed?: string;
  weight_kg?: number;
  birth_date?: string;
  notes?: string;
}
