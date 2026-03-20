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

const params = { params: { id: 'g1' } };

function makeRequest(method: string, body?: any): Request {
  const init: RequestInit = { method };
  if (body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new Request('http://localhost/api/grooming-logs/g1', init);
}

describe('GET /api/grooming-logs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('returns log when owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { id: 'g1', user_id: 'user1' }, error: null });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(200);
  });

  it('returns 403 when not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { id: 'g1', user_id: 'other' }, error: null });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    const res = await GET(makeRequest('GET'), params);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/grooming-logs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('associates pet to log', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null }) // ownership
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null }) // pet check
      .mockResolvedValueOnce({ data: { id: 'g1', pet_id: 'p1' }, error: null }); // update

    const res = await PUT(makeRequest('PUT', { petId: 'p1' }), params);
    const body = await res.json();
    expect(body.pet_id).toBe('p1');
  });

  it('returns 400 when no updates', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null });
    const res = await PUT(makeRequest('PUT', {}), params);
    expect(res.status).toBe(400);
  });

  it('clears pet_id with null petId', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'g1', pet_id: null }, error: null });

    const res = await PUT(makeRequest('PUT', { petId: null }), params);
    const body = await res.json();
    expect(body.pet_id).toBeNull();
  });
});

describe('DELETE /api/grooming-logs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('deletes owned log', async () => {
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

describe('PUT /api/grooming-logs/[id] - pet ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('returns 404 when pet to link not found', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null }) // log ownership
      .mockResolvedValueOnce({ data: null, error: null }); // pet not found

    const res = await PUT(makeRequest('PUT', { petId: 'bad' }), params);
    expect(res.status).toBe(404);
  });

  it('returns 403 when pet not owned by user', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null }) // log ownership
      .mockResolvedValueOnce({ data: { user_id: 'other' }, error: null }); // pet owned by other

    const res = await PUT(makeRequest('PUT', { petId: 'p1' }), params);
    expect(res.status).toBe(403);
  });
});
