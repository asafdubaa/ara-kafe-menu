import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '');
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

if (!ADMIN_PASSWORD) {
  throw new Error('NEXT_PUBLIC_ADMIN_PASSWORD is not set in environment variables');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

export async function signIn(password: string) {
  if (password !== ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid credentials' };
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);

  return { success: true, token };
}

export async function verifyToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return { valid: false };

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', '', {
    expires: new Date(0),
    path: '/',
  });
}
