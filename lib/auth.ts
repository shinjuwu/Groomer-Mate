import { NextResponse } from 'next/server';

interface VerifiedUser {
  userId: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Verify LIFF access token by calling LINE Profile API.
 * Falls back to userId query param for backward compatibility.
 */
export async function verifyLiffToken(req: Request): Promise<VerifiedUser> {
  const authHeader = req.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyTokenWithLine(token);
  }

  // Fallback: userId from query params (backward compatibility)
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (userId) {
    return { userId };
  }

  throw new AuthError('Missing authorization token');
}

async function verifyTokenWithLine(token: string): Promise<VerifiedUser> {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new AuthError('Invalid or expired LIFF token');
  }

  const profile = await response.json();

  if (!profile.userId) {
    throw new AuthError('Failed to retrieve user profile');
  }

  return { userId: profile.userId };
}

/**
 * Helper to return a JSON error response from an AuthError.
 */
export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 },
  );
}
