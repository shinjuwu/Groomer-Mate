export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  phone: string | null;
  line_id: string | null;
  notes: string | null;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
  line_id?: string;
  notes?: string;
}
