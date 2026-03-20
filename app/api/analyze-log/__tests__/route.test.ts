/**
 * @jest-environment node
 */
import { POST } from '../route';

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerateContent,
    }),
  })),
}));

function makeAudioRequest(content?: string, type?: string): Request {
  const formData = new FormData();
  if (content) {
    const blob = new Blob([content], { type: type || 'audio/webm' });
    formData.append('audio', blob, 'recording.webm');
  }
  return new Request('http://localhost/api/analyze-log', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/analyze-log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when no audio file', async () => {
    const res = await POST(new Request('http://localhost/api/analyze-log', {
      method: 'POST',
      body: new FormData(),
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No audio file');
  });

  it('returns 500 when GEMINI_API_KEY missing', async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await POST(makeAudioRequest('audio'));
    expect(res.status).toBe(500);

    process.env.GEMINI_API_KEY = origKey;
  });

  it('returns parsed AI response on success', async () => {
    const aiResponse = {
      transcription: '測試',
      tags: ['指甲修剪'],
      summary: '美容完成',
      internal_memo: '備註',
    };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(aiResponse) },
    });

    const res = await POST(makeAudioRequest('audio-data'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toBe('美容完成');
    expect(body.tags).toEqual(['指甲修剪']);
  });

  it('handles markdown-wrapped JSON response', async () => {
    const aiResponse = { transcription: 't', tags: [], summary: 's', internal_memo: 'm' };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '```json\n' + JSON.stringify(aiResponse) + '\n```' },
    });

    const res = await POST(makeAudioRequest('audio'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toBe('s');
  });

  it('returns 500 when AI response is not parseable', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'not json at all' },
    });

    const res = await POST(makeAudioRequest('audio'));
    expect(res.status).toBe(500);
  });

  it('returns 500 on Gemini error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Gemini failed'));

    const res = await POST(makeAudioRequest('audio'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Gemini failed');
  });

  it('defaults empty mimeType to audio/webm', async () => {
    const aiResponse = { transcription: 't', tags: [], summary: 's', internal_memo: 'm' };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(aiResponse) },
    });

    const formData = new FormData();
    const blob = new Blob(['audio'], { type: '' });
    formData.append('audio', blob, 'recording');

    const res = await POST(new Request('http://localhost/api/analyze-log', {
      method: 'POST',
      body: formData,
    }));
    expect(res.status).toBe(200);
  });
});
