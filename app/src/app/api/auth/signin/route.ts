import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/cognito'
import { createSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const authResult = await signIn(email, password)

    if (!authResult.AccessToken || !authResult.IdToken) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    const cookieHeader = await createSession(authResult.AccessToken, authResult.IdToken)

    const response = NextResponse.json({ ok: true })
    response.headers.set('Set-Cookie', cookieHeader)
    return response
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sign-in failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
