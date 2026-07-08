import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore.toString())

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p className="muted">Your account details sourced from Cognito</p>
      </div>

      <div className="card">
        <div className="stack">
          <div className="profile-field">
            <div className="field-label">Email</div>
            <div className="field-value" data-testid="profile-email">{session.email}</div>
          </div>
          <div className="profile-field">
            <div className="field-label">Cognito Sub (User ID)</div>
            <div className="field-value" data-testid="profile-sub">{session.sub}</div>
          </div>

          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="secondary">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  )
}
