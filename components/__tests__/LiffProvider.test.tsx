import { render, screen, waitFor } from '@testing-library/react';
import { LiffProvider, useLiff } from '../LiffProvider';

const mockInitLiff = jest.fn();
const mockSetAccessToken = jest.fn();

jest.mock('@/lib/liff', () => ({
  initLiff: (...args: any[]) => mockInitLiff(...args),
}));

jest.mock('@/lib/api', () => ({
  setAccessToken: (...args: any[]) => mockSetAccessToken(...args),
}));

function TestConsumer() {
  const { isLoggedIn, profile, accessToken } = useLiff();
  return (
    <div>
      <span data-testid="logged-in">{String(isLoggedIn)}</span>
      <span data-testid="profile">{profile?.displayName || 'none'}</span>
      <span data-testid="token">{accessToken || 'none'}</span>
    </div>
  );
}

describe('LiffProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children', () => {
    mockInitLiff.mockResolvedValue({
      liff: null, isLoggedIn: false, error: null, profile: null, accessToken: null,
    });

    render(
      <LiffProvider liffId="test-id">
        <span>child</span>
      </LiffProvider>,
    );

    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('initializes LIFF and provides state', async () => {
    mockInitLiff.mockResolvedValue({
      liff: {},
      isLoggedIn: true,
      error: null,
      profile: { displayName: 'Test User', userId: 'u1' },
      accessToken: 'token-123',
    });

    render(
      <LiffProvider liffId="test-id">
        <TestConsumer />
      </LiffProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      expect(screen.getByTestId('profile')).toHaveTextContent('Test User');
      expect(screen.getByTestId('token')).toHaveTextContent('token-123');
    });

    expect(mockSetAccessToken).toHaveBeenCalledWith('token-123');
  });

  it('does not init when liffId is empty', () => {
    render(
      <LiffProvider liffId="">
        <span>child</span>
      </LiffProvider>,
    );

    expect(mockInitLiff).not.toHaveBeenCalled();
  });

  it('does not set token when accessToken is null', async () => {
    mockInitLiff.mockResolvedValue({
      liff: {}, isLoggedIn: false, error: null, profile: null, accessToken: null,
    });

    render(
      <LiffProvider liffId="test-id">
        <TestConsumer />
      </LiffProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
    });

    expect(mockSetAccessToken).not.toHaveBeenCalled();
  });
});
