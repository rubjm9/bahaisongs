export const runtime = 'edge';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: '0 1.5rem',
      }}
    >
      <div>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: 0 }}>404</h1>
        <p style={{ color: 'var(--bs-text-muted)', marginTop: '1rem' }}>
          The page you are looking for does not exist.
        </p>
      </div>
    </main>
  );
}
