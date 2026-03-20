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
  AuthError: class extends Error {
    statusCode: number;
    constructor(msg: string, code = 401) { super(msg); this.statusCode = code; }
  },
}));

jest.mock('@/lib/supabase-server', () => ({
  getServiceSupabase: () => supabase,
}));

function makeRequest(method: string, body?: any, searchParams?: Record<string, string>): Request {
  const url = new URL('http://localhost/api/customers');
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

describe('POST /api/customers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('creates customer successfully', async () => {
    const customer = { id: 'c1', name: '王小明', user_id: 'user1' };
    mockChain.single.mockResolvedValueOnce({ data: customer, error: null });

    const res = await POST(makeRequest('POST', { name: '王小明', phone: '0912345678' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe('王小明');
  });

  it('returns 400 when name is empty', async () => {
    const res = await POST(makeRequest('POST', { name: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest('POST', {}));
    expect(res.status).toBe(400);
  });

  it('returns 500 on supabase error', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'db error' } });
    const res = await POST(makeRequest('POST', { name: 'Test' }));
    expect(res.status).toBe(500);
  });
});

describe('GET /api/customers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('returns customer list', async () => {
    const customers = [{ id: 'c1', name: '王' }];
    setQueryResult(customers, 1);

    const res = await GET(makeRequest('GET'));
    const body = await res.json();

    expect(body.data).toEqual(customers);
    expect(body.total).toBe(1);
  });

  it('passes search filter', async () => {
    setQueryResult([], 0);
    await GET(makeRequest('GET', undefined, { search: '王' }));

    expect(mockChain.ilike).toHaveBeenCalledWith('name', '%王%');
  });

  it('returns 500 on supabase error', async () => {
    const { setQueryError } = createSupabaseMock();
    // Override for this test - trigger error path
    mockChain._data = null;
    mockChain._error = { message: 'fail' };

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);
  });
});
