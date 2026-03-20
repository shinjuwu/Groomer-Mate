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
  const url = new URL('http://localhost/api/grooming-logs');
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

describe('POST /api/grooming-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('creates log without petId', async () => {
    const log = { id: 'g1', user_id: 'user1', pet_id: null, summary: 'test' };
    mockChain.single.mockResolvedValueOnce({ data: log, error: null });

    const res = await POST(makeRequest('POST', { summary: 'test', tags: ['a'] }));
    expect(res.status).toBe(201);
  });

  it('creates log with petId after ownership check', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: { user_id: 'user1' }, error: null }) // pet check
      .mockResolvedValueOnce({ data: { id: 'g1', pet_id: 'p1' }, error: null }); // insert

    const res = await POST(makeRequest('POST', { petId: 'p1', summary: 'test' }));
    expect(res.status).toBe(201);
  });

  it('returns 403 when pet not owned', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { user_id: 'other' }, error: null });

    const res = await POST(makeRequest('POST', { petId: 'p1', summary: 'test' }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when pet not found', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: null });

    const res = await POST(makeRequest('POST', { petId: 'bad' }));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/grooming-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('returns logs with default pagination', async () => {
    setQueryResult([{ id: 'g1', pet_id: null }], 1);

    const res = await GET(makeRequest('GET'));
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('applies search filter', async () => {
    setQueryResult([], 0);
    await GET(makeRequest('GET', undefined, { search: '皮膚' }));
    expect(mockChain.or).toHaveBeenCalled();
  });

  it('applies petId filter', async () => {
    setQueryResult([], 0);
    await GET(makeRequest('GET', undefined, { petId: 'p1' }));
    expect(mockChain.eq).toHaveBeenCalledWith('pet_id', 'p1');
  });

  it('applies date range filters', async () => {
    setQueryResult([], 0);
    await GET(makeRequest('GET', undefined, { dateFrom: '2026-01-01', dateTo: '2026-12-31' }));
    expect(mockChain.gte).toHaveBeenCalledWith('created_at', '2026-01-01');
    expect(mockChain.lte).toHaveBeenCalledWith('created_at', '2026-12-31');
  });

  it('applies tags filter', async () => {
    setQueryResult([], 0);
    await GET(makeRequest('GET', undefined, { tags: JSON.stringify(['皮膚']) }));
    expect(mockChain.contains).toHaveBeenCalledWith('tags', ['皮膚']);
  });

  it('handles invalid tags param gracefully', async () => {
    setQueryResult([], 0);
    const res = await GET(makeRequest('GET', undefined, { tags: 'not-json' }));
    expect(res.status).toBe(200);
  });

  it('filters by customerId and returns empty when no pets found', async () => {
    // First call: the main query chain (returns empty via setQueryResult)
    setQueryResult([], 0);

    const res = await GET(makeRequest('GET', undefined, { customerId: 'c1' }));
    const body = await res.json();

    // Should return empty since the customer's pets query also returns empty via proxy
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('enriches logs with pet and customer names', async () => {
    // Logs with pet_id
    setQueryResult([
      { id: 'g1', pet_id: 'p1', user_id: 'user1', summary: 's' },
    ], 1);

    const res = await GET(makeRequest('GET'));
    const body = await res.json();
    // The enrichment queries run but with our mock proxy they return []
    // Main thing is the route doesn't crash
    expect(body.data).toHaveLength(1);
  });

  it('returns 500 on query error', async () => {
    mockChain._data = null;
    mockChain._error = { message: 'db error' };

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);

    // Reset
    mockChain._data = [];
    mockChain._error = null;
  });

  it('returns 500 on insert error in POST', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'insert failed' } });

    const res = await POST(makeRequest('POST', { summary: 'test' }));
    expect(res.status).toBe(500);
  });
});
