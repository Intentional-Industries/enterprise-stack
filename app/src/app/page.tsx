import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let helloValue: string | null = null
  let error: string | null = null

  try {
    const result = await query<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'hello_world'"
    )
    helloValue = result.rows[0]?.value ?? null
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to connect to database'
  }

  return (
    <div>
      <div className="page-header">
        <h1>Welcome</h1>
        <p className="muted">A message from the database:</p>
      </div>

      {error ? (
        <div className="error-msg">Database error: {error}</div>
      ) : helloValue !== null ? (
        <div className="hello-value" data-testid="hello-value">
          {helloValue}
        </div>
      ) : (
        <div className="muted">No value found in database.</div>
      )}
    </div>
  )
}
