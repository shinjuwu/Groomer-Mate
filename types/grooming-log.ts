export interface AnalysisResult {
  transcription: string;
  tags: string[];
  summary: string;
  internal_memo: string;
}

export interface GroomingLog {
  id: string;
  created_at: string;
  user_id: string;
  pet_id: string | null;
  audio_url: string | null;
  transcription: string | null;
  summary: string | null;
  tags: string[] | null;
  internal_memo: string | null;
  pet_name?: string;
  customer_name?: string;
}

export interface GroomingLogFilters {
  petId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
}
