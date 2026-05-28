import { notFound } from 'next/navigation';
import { Stack, Typography, Box } from '@mui/material';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { GradientText } from '@/shared/ui/GradientText';
import { TrackPlaceholder } from '@/features/catalog/components/TrackPlaceholder';
import { TrackList } from '@/features/catalog/components/TrackList';
import { getTracksByArtist } from '@/server/data/catalog';
import type { Locale } from '@/shared/lib/i18n/config';
import { accent, cssVars } from '@/shared/theme/tokens';

// Phase 3 ships a single canonical artist; future phases will join this against
// the `artists` table in Postgres for real bios and avatars.
const ARTIST_PROFILES: Record<string, { name: string; bio: { es: string; en: string } }> = {
  'comunidad-bahai': {
    name: "Comunidad Bahá'í",
    bio: {
      es: "Música, oraciones y composiciones surgidas dentro de la comunidad bahá'í — un repertorio comunitario que abarca canciones para reuniones, oraciones cantadas, textos sagrados y piezas para clases de niños y jóvenes.",
      en: "Music, prayers and compositions from within the Bahá'í community — a communal repertoire spanning gathering songs, sung prayers, sacred texts and pieces for children's and youth classes.",
    },
  },
};

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return Object.keys(ARTIST_PROFILES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params;
  const profile = ARTIST_PROFILES[slug];
  if (!profile) return { title: 'BahaiSongs' };
  return {
    title: profile.name,
    description: profile.bio[locale === 'en' ? 'en' : 'es'],
  };
}

export default async function ArtistPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const profile = ARTIST_PROFILES[slug];
  if (!profile) notFound();
  const tracks = await getTracksByArtist(slug);
  const t = await getTranslations('artist');
  const loc = locale as Locale;

  return (
    <Stack spacing={5} sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' } }}
      >
        <TrackPlaceholder title={profile.name} size={160} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              color: accent.cyan,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              mb: 1,
            }}
          >
            {t('eyebrow')}
          </Typography>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 700 }}
          >
            <GradientText variant="aurora">{profile.name}</GradientText>
          </Typography>
          <Typography
            sx={{
              color: cssVars.textMuted,
              fontSize: '1rem',
              mt: 2,
              lineHeight: 1.55,
              maxWidth: 640,
            }}
          >
            {profile.bio[loc === 'en' ? 'en' : 'es']}
          </Typography>
          <Typography sx={{ color: cssVars.textMuted, fontSize: '0.85rem', mt: 2 }}>
            {t('trackCount', { count: tracks.length })}
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Typography
          sx={{
            color: cssVars.textMuted,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            mb: 1.5,
          }}
        >
          {t('allTracks')}
        </Typography>
        <TrackList tracks={tracks} locale={loc} numbered />
      </Box>
    </Stack>
  );
}
