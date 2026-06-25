import { SignJWT, jwtVerify, decodeJwt } from 'jose'

const SESSION_COOKIE = 'session'
const DEV_SECRET = 'dev-secret-change-in-production-min-32-chars'

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? DEV_SECRET
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  email: string
  sub: string
  accessToken: string
}

export async function createSession(
  accessToken: string,
  idToken: string
): Promise<string> {
  const claims = decodeJwt(idToken)
  const email = claims.email as string
  const sub = claims.sub as string

  const jwt = await new SignJWT({ email, sub, accessToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getSecret())

  const expires = new Date(Date.now() + 60 * 60 * 1000)
  return `${SESSION_COOKIE}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`
}

export async function getSession(
  cookieHeader: string | null | undefined
): Promise<SessionPayload | null> {
  if (!cookieHeader) return null

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  if (!match) return null

  try {
    const { payload } = await jwtVerify(match[1], getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
