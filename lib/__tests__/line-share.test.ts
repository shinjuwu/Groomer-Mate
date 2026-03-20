import { shareGroomingSummary } from '../line-share';

function createMockLiff(inClient: boolean) {
  return {
    isInClient: jest.fn().mockReturnValue(inClient),
    shareTargetPicker: jest.fn().mockResolvedValue(undefined),
  } as any;
}

describe('shareGroomingSummary', () => {
  it('returns false when not in LINE client', async () => {
    const liff = createMockLiff(false);
    const result = await shareGroomingSummary(liff, { summary: 'test' });

    expect(result).toBe(false);
    expect(liff.shareTargetPicker).not.toHaveBeenCalled();
  });

  it('calls shareTargetPicker when in LINE client', async () => {
    const liff = createMockLiff(true);
    const result = await shareGroomingSummary(liff, {
      summary: '美容完成',
      petName: 'Lucky',
      date: '2026-03-20T10:00:00Z',
    });

    expect(result).toBe(true);
    expect(liff.shareTargetPicker).toHaveBeenCalledTimes(1);

    const message = liff.shareTargetPicker.mock.calls[0][0][0];
    expect(message.type).toBe('flex');
    expect(message.altText).toContain('Lucky');
  });

  it('builds message without petName', async () => {
    const liff = createMockLiff(true);
    await shareGroomingSummary(liff, { summary: '完成' });

    const message = liff.shareTargetPicker.mock.calls[0][0][0];
    expect(message.altText).toContain('美容紀錄');
  });

  it('returns false when shareTargetPicker throws', async () => {
    const liff = createMockLiff(true);
    liff.shareTargetPicker.mockRejectedValue(new Error('share error'));

    const result = await shareGroomingSummary(liff, { summary: 'test' });
    expect(result).toBe(false);
  });
});
