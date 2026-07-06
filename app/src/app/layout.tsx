import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import './globals.css'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Intentional Enterprise',
  description: 'Enterprise web application',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const session = await getSession(cookieStore.toString())

  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/" className="brand">Intentional Industries</Link>
          <Link href="/">Home</Link>
          {session ? (
            <Link href="/profile">Profile</Link>
          ) : (
            <>
              <Link href="/auth/signin">Sign In</Link>
              <Link href="/auth/signup">Sign Up</Link>
            </>
          )}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
