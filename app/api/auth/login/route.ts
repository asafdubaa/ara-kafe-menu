import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signIn } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const result = await signIn(password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set HTTP-only cookie
    if (!result.token) {
      throw new Error('Token not generated');
    }
    
    const cookieStore = await cookies();
    cookieStore.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
