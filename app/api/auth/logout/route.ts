import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Set the cookie to expire in the past
  response.cookies.set({
    name: 'auth_token',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}
