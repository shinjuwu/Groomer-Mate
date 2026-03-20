import {
  setAccessToken,
  saveGroomingLog,
  fetchGroomingLogs,
  fetchGroomingLog,
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchPets,
  fetchPet,
  createPet,
  updatePet,
  deletePet,
  uploadAudio,
  updateGroomingLog,
  deleteGroomingLog,
} from '../api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  setAccessToken('test-token');
});

describe('auth header injection', () => {
  it('includes Bearer token in requests', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));

    await fetchCustomers();

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });

  it('works without token set', async () => {
    setAccessToken(null);
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));

    await fetchCustomers();

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });
});

describe('saveGroomingLog', () => {
  it('sends POST with correct body', async () => {
    const log = { id: '1', created_at: '', user_id: 'u1', pet_id: null, audio_url: null, transcription: 't', summary: 's', tags: ['a'], internal_memo: 'm' };
    mockFetch.mockResolvedValueOnce(mockJsonResponse(log, 201));

    const result = await saveGroomingLog({
      userId: 'u1',
      transcription: 't',
      summary: 's',
      tags: ['a'],
      internalMemo: 'm',
      petId: 'pet1',
    });

    expect(result.id).toBe('1');
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/grooming-logs');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).petId).toBe('pet1');
  });
});

describe('fetchGroomingLogs', () => {
  it('passes filter params to query string', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));

    await fetchGroomingLogs('u1', { search: 'test', petId: 'p1' }, 20, 10);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('search=test');
    expect(url).toContain('petId=p1');
    expect(url).toContain('limit=20');
    expect(url).toContain('offset=10');
  });
});

describe('customer functions', () => {
  it('fetchCustomers with search param', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));
    await fetchCustomers('王');
    expect(mockFetch.mock.calls[0][0]).toContain('search=%E7%8E%8B');
  });

  it('createCustomer sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: '1', name: '王' }, 201));
    const result = await createCustomer({ name: '王' });
    expect(result.name).toBe('王');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('deleteCustomer sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
    await deleteCustomer('c1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('pet functions', () => {
  it('fetchPets with customerId', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));
    await fetchPets('c1');
    expect(mockFetch.mock.calls[0][0]).toContain('customerId=c1');
  });

  it('createPet sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'p1', name: 'Lucky' }, 201));
    const result = await createPet({ customer_id: 'c1', name: 'Lucky' });
    expect(result.name).toBe('Lucky');
  });
});

describe('uploadAudio', () => {
  it('sends FormData with audio blob', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ url: 'u1/abc.mp3' }, 201));
    const blob = new Blob(['audio'], { type: 'audio/mp3' });

    const result = await uploadAudio(blob);

    expect(result.url).toBe('u1/abc.mp3');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeInstanceOf(FormData);
  });
});

describe('updateGroomingLog', () => {
  it('sends PUT with petId', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'g1', pet_id: 'p1' }));
    await updateGroomingLog('g1', { petId: 'p1' });
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
  });
});

describe('single resource fetches', () => {
  it('fetchCustomer sends GET to /api/customers/:id', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'c1', name: '王' }));
    const result = await fetchCustomer('c1');
    expect(result.id).toBe('c1');
    expect(mockFetch.mock.calls[0][0]).toContain('/api/customers/c1');
  });

  it('fetchPet sends GET to /api/pets/:id', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'p1', name: 'Lucky' }));
    const result = await fetchPet('p1');
    expect(result.name).toBe('Lucky');
  });

  it('fetchGroomingLog sends GET with userId', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'g1' }));
    await fetchGroomingLog('g1', 'u1');
    expect(mockFetch.mock.calls[0][0]).toContain('userId=u1');
  });
});

describe('update functions', () => {
  it('updateCustomer sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'c1', name: '李' }));
    const result = await updateCustomer('c1', { name: '李' });
    expect(result.name).toBe('李');
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
  });

  it('updatePet sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ id: 'p1', name: 'Max' }));
    const result = await updatePet('p1', { name: 'Max' });
    expect(result.name).toBe('Max');
  });
});

describe('delete functions', () => {
  it('deletePet sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
    await deletePet('p1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('deleteGroomingLog sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
    await deleteGroomingLog('g1', 'u1');
    expect(mockFetch.mock.calls[0][0]).toContain('userId=u1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('fetchGroomingLogs filters', () => {
  it('passes tags as JSON', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));
    await fetchGroomingLogs('u1', { tags: ['皮膚'] });
    expect(mockFetch.mock.calls[0][0]).toContain('tags=');
  });

  it('passes customerId filter', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));
    await fetchGroomingLogs('u1', { customerId: 'c1' });
    expect(mockFetch.mock.calls[0][0]).toContain('customerId=c1');
  });

  it('passes date range', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));
    await fetchGroomingLogs('u1', { dateFrom: '2026-01-01', dateTo: '2026-12-31' });
    expect(mockFetch.mock.calls[0][0]).toContain('dateFrom=2026-01-01');
    expect(mockFetch.mock.calls[0][0]).toContain('dateTo=2026-12-31');
  });

  it('works without filters', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: [], total: 0 }));
    await fetchGroomingLogs('u1');
    expect(mockFetch.mock.calls[0][0]).not.toContain('petId');
  });
});

describe('error handling', () => {
  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ error: 'Not found' }, 404));
    await expect(fetchCustomers()).rejects.toThrow('Not found');
  });

  it('throws generic message when body parse fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error(); },
    });
    await expect(fetchCustomers()).rejects.toThrow('Request failed (500)');
  });
});
