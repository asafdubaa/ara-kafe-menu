import { NextResponse } from 'next/server'
import { getCategoryTitles, saveCategoryTitles } from '@/lib/menu-storage'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const titles = await getCategoryTitles()
    return NextResponse.json(titles, { status: 200 })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to fetch titles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid titles payload' }, { status: 400 })
    }
    const result = await saveCategoryTitles(body)
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: 'Titles saved' })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


