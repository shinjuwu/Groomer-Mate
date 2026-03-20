import type { GroomingLog, GroomingLogFilters } from '@/types/grooming-log';
import type { Customer, CustomerFormData } from '@/types/customer';
import type { Pet, PetFormData } from '@/types/pet';

// --- Auth token management ---

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }
  return headers;
}

function getAuthHeadersNoContent(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }
  return headers;
}

// --- Response handler ---

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

async function handleVoidResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
}

// --- Grooming Logs ---

export async function saveGroomingLog(params: {
  userId: string;
  transcription: string;
  summary: string;
  tags: string[];
  internalMemo: string;
  petId?: string;
  audioUrl?: string;
}): Promise<GroomingLog> {
  const response = await fetch('/api/grooming-logs', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  return handleResponse<GroomingLog>(response);
}

export async function fetchGroomingLogs(
  userId: string,
  filters?: GroomingLogFilters,
  limit = 50,
  offset = 0,
): Promise<{ data: GroomingLog[]; total: number }> {
  const params = new URLSearchParams({
    userId,
    limit: String(limit),
    offset: String(offset),
  });
  if (filters?.petId) params.set('petId', filters.petId);
  if (filters?.customerId) params.set('customerId', filters.customerId);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tags?.length) params.set('tags', JSON.stringify(filters.tags));

  const response = await fetch(`/api/grooming-logs?${params}`, {
    headers: getAuthHeadersNoContent(),
  });
  return handleResponse<{ data: GroomingLog[]; total: number }>(response);
}

export async function fetchGroomingLog(
  id: string,
  userId: string,
): Promise<GroomingLog> {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`/api/grooming-logs/${id}?${params}`, {
    headers: getAuthHeadersNoContent(),
  });
  return handleResponse<GroomingLog>(response);
}

export async function deleteGroomingLog(
  id: string,
  userId: string,
): Promise<void> {
  const response = await fetch(`/api/grooming-logs/${id}?userId=${userId}`, {
    method: 'DELETE',
    headers: getAuthHeadersNoContent(),
  });
  await handleVoidResponse(response);
}

export async function updateGroomingLog(
  id: string,
  data: { petId?: string },
): Promise<GroomingLog> {
  const response = await fetch(`/api/grooming-logs/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<GroomingLog>(response);
}

// --- Customers ---

export async function fetchCustomers(
  search?: string,
): Promise<{ data: Customer[]; total: number }> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);

  const response = await fetch(`/api/customers?${params}`, {
    headers: getAuthHeadersNoContent(),
  });
  return handleResponse<{ data: Customer[]; total: number }>(response);
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`, {
    headers: getAuthHeadersNoContent(),
  });
  return handleResponse<Customer>(response);
}

export async function createCustomer(data: CustomerFormData): Promise<Customer> {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Customer>(response);
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerFormData>,
): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Customer>(response);
}

export async function deleteCustomer(id: string): Promise<void> {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeadersNoContent(),
  });
  await handleVoidResponse(response);
}

// --- Pets ---

export async function fetchPets(
  customerId?: string,
): Promise<{ data: Pet[]; total: number }> {
  const params = new URLSearchParams();
  if (customerId) params.set('customerId', customerId);

  const response = await fetch(`/api/pets?${params}`, {
    headers: getAuthHeadersNoContent(),
  });
  return handleResponse<{ data: Pet[]; total: number }>(response);
}

export async function fetchPet(id: string): Promise<Pet> {
  const response = await fetch(`/api/pets/${id}`, {
    headers: getAuthHeadersNoContent(),
  });
  return handleResponse<Pet>(response);
}

export async function createPet(data: PetFormData): Promise<Pet> {
  const response = await fetch('/api/pets', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Pet>(response);
}

export async function updatePet(
  id: string,
  data: Partial<PetFormData>,
): Promise<Pet> {
  const response = await fetch(`/api/pets/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Pet>(response);
}

export async function deletePet(id: string): Promise<void> {
  const response = await fetch(`/api/pets/${id}`, {
    method: 'DELETE',
    headers: getAuthHeadersNoContent(),
  });
  await handleVoidResponse(response);
}

// --- Audio Upload ---

export async function uploadAudio(blob: Blob): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.mp3');

  const response = await fetch('/api/audio-upload', {
    method: 'POST',
    headers: getAuthHeadersNoContent(),
    body: formData,
  });
  return handleResponse<{ url: string }>(response);
}
