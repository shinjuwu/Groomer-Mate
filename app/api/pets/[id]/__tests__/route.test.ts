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
}));

jest.mock('@/lib/supabase-server', () => ({
  getServiceSupabase: () => supabase,
}));

const params = { params: { id: 'p1' } };

function makeRequest(method: string, body?: any): Request {
  const init: RequestInit = { method };
  if (body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new Request('http://localhost/api/pets/p1', init);
}

describe('GET /api/pets/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('returns pet when owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { id: 'p1', name: 'Lucky', user_id: 'user1' }, error: null });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(200);
  });

  it('returns 403 when not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { id: 'p1', user_id: 'other' }, error: null });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/pets/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('updates pet fields', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'p1', name: 'Max', breed: '柴犬' }, error: null });

    const res = await PUT(makeRequest('PUT', { name: 'Max', breed: '柴犬' }), params);
    const body = await res.json();
    expect(body.name).toBe('Max');
  });

  it('returns 400 when name is empty', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null });
    const res = await PUT(makeRequest('PUT', { name: '' }), params);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/pets/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('deletes owned pet', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null });
    const res = await DELETE(makeRequest('DELETE'), params);
    expect(res.status).toBe(204);
  });

  it('returns 403 when not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'other' }, error: null });
    const res = await DELETE(makeRequest('DELETE'), params);
    expect(res.status).toBe(403);
  });
});
