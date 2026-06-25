import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/cognito'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await signUp(email, password)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sign-up failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
