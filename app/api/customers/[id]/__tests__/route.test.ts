/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '../route';
import { createSupabaseMock } from '../../../../../__tests__/helpers/supabase-mock';

const mockVerify = jest.fn();
const { supabase, mockChain } = createSupabaseMock();

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

const params = { params: { id: 'c1' } };

function makeRequest(method: string, body?: any): Request {
  const url = 'http://localhost/api/customers/c1';
  const init: RequestInit = { method };
  if (body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

describe('GET /api/customers/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('returns customer when owned by user', async () => {
    const customer = { id: 'c1', name: '王', user_id: 'user1' };
    mockChain.single.mockResolvedValueOnce({ data: customer, error: null });

    const res = await GET(makeRequest('GET'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('王');
  });

  it('returns 404 when not found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(404);
  });

  it('returns 403 when not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { id: 'c1', user_id: 'other' }, error: null });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/customers/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('updates customer fields', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null }) // ownership
      .mockResolvedValueOnce({ data: { id: 'c1', name: '李', phone: '09' }, error: null }); // update

    const res = await PUT(makeRequest('PUT', { name: '李', phone: '09' }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('李');
  });

  it('returns 400 when name is empty string', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null });

    const res = await PUT(makeRequest('PUT', { name: '' }), params);
    expect(res.status).toBe(400);
  });

  it('returns 403 when not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'other' }, error: null });
    const res = await PUT(makeRequest('PUT', { name: 'X' }), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: null });
    const res = await PUT(makeRequest('PUT', { name: 'X' }), params);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/customers/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('deletes owned customer', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null });

    const res = await DELETE(makeRequest('DELETE'), params);
    expect(res.status).toBe(204);
  });

  it('returns 403 when not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'other' }, error: null });
    const res = await DELETE(makeRequest('DELETE'), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: null });
    const res = await DELETE(makeRequest('DELETE'), params);
    expect(res.status).toBe(404);
  });
});
