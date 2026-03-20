/**
 * @jest-environment node
 */
import { verifyLiffToken, AuthError, authErrorResponse } from '../auth';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(options: { authHeader?: string; userId?: string } = {}): Request {
  const url = new URL('http://localhost/api/test');
  if (options.userId) url.searchParams.set('userId', options.userId);

  const headers: Record<string, string> = {};
  if (options.authHeader) headers['authorization'] = options.authHeader;

  return new Request(url.toString(), { headers });
}

describe('verifyLiffToken', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('verifies valid Bearer token via LINE Profile API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'U1234', displayName: 'Test' }),
    });

    const result = await verifyLiffToken(makeRequest({ authHeader: 'Bearer valid-token' }));

    expect(result).toEqual({ userId: 'U1234' });
    expect(mockFetch).toHaveBeenCalledWith('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer valid-token' },
    });
  });

  it('throws AuthError for invalid Bearer token', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(
      verifyLiffToken(makeRequest({ authHeader: 'Bearer invalid' })),
    ).rejects.toThrow(AuthError);
  });

  it('throws AuthError when LINE profile has no userId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ displayName: 'NoId' }),
    });

    await expect(
      verifyLiffToken(makeRequest({ authHeader: 'Bearer token' })),
    ).rejects.toThrow('Failed to retrieve user profile');
  });

  it('falls back to userId query param when no Bearer token', async () => {
    const result = await verifyLiffToken(makeRequest({ userId: 'fallback-user' }));
    expect(result).toEqual({ userId: 'fallback-user' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws AuthError when no auth at all', async () => {
    await expect(verifyLiffToken(makeRequest())).rejects.toThrow(
      'Missing authorization token',
    );
  });
});

describe('authErrorResponse', () => {
  it('returns correct status for AuthError', async () => {
    const error = new AuthError('Unauthorized', 401);
    const response = authErrorResponse(error);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 for non-AuthError', async () => {
    const response = authErrorResponse(new Error('random'));
    expect(response.status).toBe(500);
  });
});
