import liff from '@line/liff';
import { initLiff } from '../liff';

jest.mock('@line/liff', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    isLoggedIn: jest.fn(),
    getProfile: jest.fn(),
    getAccessToken: jest.fn(),
    login: jest.fn(),
  },
}));

const mockLiff = liff as jest.Mocked<typeof liff>;

describe('initLiff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns logged-in state with profile and accessToken', async () => {
    mockLiff.init.mockResolvedValue(undefined as any);
    mockLiff.isLoggedIn.mockReturnValue(true);
    mockLiff.getProfile.mockResolvedValue({
      userId: 'U123',
      displayName: 'Test',
      pictureUrl: 'https://pic.url',
      statusMessage: '',
    });
    mockLiff.getAccessToken.mockReturnValue('mock-token');

    const result = await initLiff('test-liff-id');

    expect(result.isLoggedIn).toBe(true);
    expect(result.profile.userId).toBe('U123');
    expect(result.accessToken).toBe('mock-token');
    expect(result.error).toBeNull();
  });

  it('returns not-logged-in state', async () => {
    mockLiff.init.mockResolvedValue(undefined as any);
    mockLiff.isLoggedIn.mockReturnValue(false);

    const result = await initLiff('test-liff-id');

    expect(result.isLoggedIn).toBe(false);
    expect(result.profile).toBeNull();
    expect(result.accessToken).toBeNull();
  });

  it('returns error state on init failure', async () => {
    const error = new Error('init failed');
    mockLiff.init.mockRejectedValue(error);

    const result = await initLiff('bad-id');

    expect(result.isLoggedIn).toBe(false);
    expect(result.liff).toBeNull();
    expect(result.error).toBe(error);
    expect(result.accessToken).toBeNull();
  });
});
