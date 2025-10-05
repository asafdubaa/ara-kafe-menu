import { NextResponse } from 'next/server'
import { getMenuData, saveMenuData } from '@/lib/menu-storage'

export const runtime = 'nodejs'

// Simple in-memory rate limiting
const rateLimit = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // Max requests per window

export async function GET() {
  try {
    const menuData = await getMenuData()
    
    return NextResponse.json(menuData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error('Error fetching menu data:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  // Simple rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  
  // Clean up old entries
  for (const [ip, timestamp] of rateLimit.entries()) {
    if (timestamp < windowStart) {
      rateLimit.delete(ip)
    }
  }
  
  // Check rate limit
  const requestCount = Array.from(rateLimit.values()).filter(t => t > windowStart).length
  if (requestCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }
  
  // Update rate limit
  rateLimit.set(clientIp, now)
  
  try {
    const menuData = await request.json()
    
    // Basic validation
    if (!menuData || typeof menuData !== 'object' || Object.keys(menuData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid menu data' },
        { status: 400 }
      )
    }
    
    const saveResult = await saveMenuData(menuData)
    
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, message: saveResult.message || 'Failed to save menu data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Menu data saved successfully',
      storageLocation: saveResult.storageLocation
    })
  } catch (error) {
    console.error('Error saving menu data:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
