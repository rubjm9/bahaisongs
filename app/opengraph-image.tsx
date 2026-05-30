import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "BahaiSongs – Letras, acordes y vídeos de canciones bahá'ís";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #050b1a 0%, #0d1f3c 50%, #050b1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 300,
            background: 'radial-gradient(ellipse, rgba(0,229,255,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}
        />

        {/* Music note decoration */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 24,
            opacity: 0.9,
            display: 'flex',
          }}
        >
          ♪
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          BahaiSongs
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          Letras, acordes y audio de canciones bahá&apos;ís
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: 'rgba(0,229,255,0.7)',
            display: 'flex',
          }}
        >
          bahaisongs.org
        </div>
      </div>
    ),
    { ...size },
  );
}
