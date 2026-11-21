'use client';

/**
 * The last line of defence: the root layout itself failed, so none of the app's styles or providers are available.
 * Kept self-contained (inline styles) and plain.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', background: '#f8f9ff', color: '#091426' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 4px 20px rgba(9,20,38,0.08)' }}>
            <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>Shelflyd didn’t load properly. Please try again.</p>
            <button
              type="button"
              onClick={reset}
              style={{ background: '#091426', color: '#fff', border: 0, borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
