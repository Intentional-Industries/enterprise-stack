import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await query<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'hello_world'"
    )
    return NextResponse.json({ value: result.rows[0]?.value ?? null })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'DB error' },
      { status: 500 }
    )
  }
}
