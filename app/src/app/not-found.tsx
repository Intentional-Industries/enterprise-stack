import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h1>404 — Page not found</h1>
      <p className="muted" style={{ marginTop: '1rem' }}>
        <Link href="/">Go home</Link>
      </p>
    </div>
  )
}
