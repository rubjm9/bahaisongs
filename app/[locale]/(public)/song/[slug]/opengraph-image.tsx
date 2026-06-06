import { ImageResponse } from 'next/og';
import { getTrackBySlug } from '@/server/data/catalog';

export const runtime = 'edge';
export const alt = "BahaiSongs – Canción bahá'í";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const track = await getTrackBySlug(slug);
  const title = track?.title ?? 'BahaiSongs';
  const artist = track?.artist ?? "Comunidad Bahá'í";
  const hasChords = track?.hasChords ?? false;
  const hasAudio = track?.hasAudio ?? false;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #050b1a 0%, #0d1f3c 50%, #050b1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 250,
            background: 'radial-gradient(ellipse, rgba(0,229,255,0.10) 0%, transparent 70%)',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 20,
            color: 'rgba(0,229,255,0.8)',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 24,
            display: 'flex',
          }}
        >
          CANCIÓN BAHÁ&apos;Í
        </div>

        {/* Song title */}
        <div
          style={{
            fontSize: title.length > 30 ? 56 : 72,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: 20,
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          {title}
        </div>

        {/* Artist */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 32,
            display: 'flex',
          }}
        >
          {artist}
        </div>

        {/* Tags row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 0 }}>
          {hasAudio && (
            <div
              style={{
                background: 'rgba(0,229,255,0.15)',
                border: '1px solid rgba(0,229,255,0.3)',
                color: '#00e5ff',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 18,
                fontWeight: 600,
                display: 'flex',
              }}
            >
              ♪ Audio
            </div>
          )}
          {hasChords && (
            <div
              style={{
                background: 'rgba(124,77,255,0.15)',
                border: '1px solid rgba(124,77,255,0.35)',
                color: '#b39ddb',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 18,
                fontWeight: 600,
                display: 'flex',
              }}
            >
              ♬ Acordes
            </div>
          )}
        </div>

        {/* Bottom brand */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 80,
            fontSize: 20,
            color: 'rgba(0,229,255,0.6)',
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
