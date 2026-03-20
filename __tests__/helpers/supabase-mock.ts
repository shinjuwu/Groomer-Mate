/**
 * Creates a chainable Supabase mock that mimics the query builder pattern.
 * Usage: const { supabase, mockChain } = createSupabaseMock();
 * Then set terminal results: mockChain.single.mockResolvedValue({ data: {...}, error: null });
 */
export function createSupabaseMock() {
  const mockChain: Record<string, jest.Mock> = {};

  const chainMethods = [
    'from', 'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'ilike', 'in', 'gte', 'lte', 'or', 'contains',
    'order', 'range', 'limit',
  ];

  // Terminal methods (return { data, error })
  const terminalMethods = ['single', 'maybeSingle'];

  for (const method of chainMethods) {
    mockChain[method] = jest.fn().mockReturnThis();
  }

  for (const method of terminalMethods) {
    mockChain[method] = jest.fn().mockResolvedValue({ data: null, error: null });
  }

  // Make the chain itself thenable (for queries without terminal method)
  // When awaited directly, returns { data: [], error: null, count: 0 }
  const handler: ProxyHandler<Record<string, jest.Mock>> = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (val: any) => void) =>
          resolve({ data: target._data ?? [], error: target._error ?? null, count: target._count ?? 0 });
      }
      return target[prop as string];
    },
  };

  const proxiedChain = new Proxy(mockChain, handler);

  // Make all chain methods return the proxy
  for (const method of chainMethods) {
    mockChain[method].mockReturnValue(proxiedChain);
  }

  const supabase = {
    from: mockChain.from,
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
  };

  return {
    supabase,
    mockChain,
    /** Set the data returned when the query is awaited */
    setQueryResult(data: any[], count?: number) {
      mockChain._data = data;
      mockChain._count = count ?? data.length;
      mockChain._error = null;
    },
    /** Set error returned when the query is awaited */
    setQueryError(error: { message: string; code?: string }) {
      mockChain._data = null;
      mockChain._error = error;
      mockChain._count = 0;
    },
  };
}
