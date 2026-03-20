/**
 * @jest-environment node
 */
import { POST, GET } from '../route';
import { createSupabaseMock } from '../../../../__tests__/helpers/supabase-mock';

const mockVerify = jest.fn();
const { supabase, mockChain, setQueryResult } = createSupabaseMock();

jest.mock('@/lib/auth', () => ({
  verifyLiffToken: (...args: any[]) => mockVerify(...args),
  authErrorResponse: jest.fn().mockImplementation((err: any) => {
    const { NextResponse } = require('next/server');
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }),
}));

jest.mock('@/lib/supabase-server', () => ({
  getServiceSupabase: () => supabase,
}));

function makeRequest(method: string, body?: any, searchParams?: Record<string, string>): Request {
  const url = new URL('http://localhost/api/pets');
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v);
  }
  const init: RequestInit = { method };
  if (body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new Request(url.toString(), init);
}

describe('POST /api/pets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('creates pet successfully', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null }) // customer check
      .mockResolvedValueOnce({ data: { id: 'p1', name: 'Lucky' }, error: null }); // insert

    const res = await POST(makeRequest('POST', { customer_id: 'c1', name: 'Lucky', species: '狗' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe('Lucky');
  });

  it('returns 400 when name missing', async () => {
    const res = await POST(makeRequest('POST', { customer_id: 'c1' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when customer_id missing', async () => {
    const res = await POST(makeRequest('POST', { name: 'Lucky' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when customer not found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: null });
    const res = await POST(makeRequest('POST', { customer_id: 'bad', name: 'Lucky' }));
    expect(res.status).toBe(404);
  });

  it('returns 403 when customer not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'other' }, error: null });
    const res = await POST(makeRequest('POST', { customer_id: 'c1', name: 'Lucky' }));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/pets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('returns pet list', async () => {
    setQueryResult([{ id: 'p1', name: 'Lucky' }], 1);
    const res = await GET(makeRequest('GET'));
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('filters by customerId', async () => {
    setQueryResult([], 0);
    await GET(makeRequest('GET', undefined, { customerId: 'c1' }));
    expect(mockChain.eq).toHaveBeenCalledWith('customer_id', 'c1');
  });
});
