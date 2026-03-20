/**
 * @jest-environment node
 */
import { POST } from '../route';
import { createSupabaseMock } from '../../../../__tests__/helpers/supabase-mock';

const mockVerify = jest.fn();
const { supabase } = createSupabaseMock();

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

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-uuid' },
});

function makeUploadRequest(audioContent?: string): Request {
  const formData = new FormData();
  if (audioContent) {
    const blob = new Blob([audioContent], { type: 'audio/mpeg' });
    formData.append('audio', blob, 'recording.mp3');
  }
  return new Request('http://localhost/api/audio-upload', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/audio-upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ userId: 'user1' });
  });

  it('uploads audio and returns path', async () => {
    const res = await POST(makeUploadRequest('audio-data'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.url).toBe('user1/test-uuid.mp3');
  });

  it('returns 400 when no audio file', async () => {
    const req = new Request('http://localhost/api/audio-upload', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when storage upload fails', async () => {
    supabase.storage.from('audio_uploads').upload.mockResolvedValueOnce({
      error: { message: 'storage error' },
    });

    const res = await POST(makeUploadRequest('data'));
    expect(res.status).toBe(500);
  });
});
