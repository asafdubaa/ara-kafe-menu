import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

export async function GET() {
  const { valid } = await verifyToken();
  return NextResponse.json({ isAuthenticated: valid });
}
