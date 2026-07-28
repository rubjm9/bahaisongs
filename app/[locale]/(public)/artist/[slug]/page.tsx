import { notFound } from 'next/navigation';
import { Stack, Typography, Box } from '@mui/material';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { GradientText } from '@/shared/ui/GradientText';
import { TrackPlaceholder } from '@/features/catalog/components/TrackPlaceholder';
import { TrackList } from '@/features/catalog/components/TrackList';
import { getTracksByArtist } from '@/server/data/catalog';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { languagesAlternates } from '@/shared/lib/seo/hreflang';
import { SITE_URL } from '@/shared/lib/seo/site';
import { ArtistJsonLd, BreadcrumbJsonLd } from '@/shared/lib/seo/JsonLd';
import { accent, cssVars } from '@/shared/theme/tokens';

// Phase 3 ships a single canonical artist; future phases will join this against
// the `artists` table in Postgres for real bios and avatars.
const ARTIST_PROFILES: Record<
  string,
  { name: string; bio: Record<Locale, string> }
> = {
  'comunidad-bahai': {
    name: "Comunidad Bahá'í",
    bio: {
      es: "Música, oraciones y composiciones surgidas dentro de la comunidad bahá'í — un repertorio comunitario que abarca canciones para reuniones, oraciones cantadas, textos sagrados y piezas para clases de niños y jóvenes.",
      en: "Music, prayers and compositions from within the Bahá'í community — a communal repertoire spanning gathering songs, sung prayers, sacred texts and pieces for children's and youth classes.",
      fr: "Musique, prières et compositions issues de la communauté bahá'íe — un répertoire communautaire qui englobe chants de réunion, prières chantées, textes sacrés et pièces pour les classes d'enfants et de jeunes.",
      de: "Musik, Gebete und Kompositionen aus der Bahá'í-Gemeinde — ein gemeinschaftliches Repertoire aus Versammlungsliedern, gesungenen Gebeten, heiligen Texten und Stücken für Kinder- und Jugendklassen.",
      pt: "Música, orações e composições surgidas dentro da comunidade bahá'í — um repertório comunitário que abrange canções para reuniões, orações cantadas, textos sagrados e peças para classes de crianças e jovens.",
      ru: "Музыка, молитвы и сочинения из общины бахаи — общий репертуар: песни для собраний, молитвы в песне, священные тексты и произведения для классов детей и молодёжи.",
      ar: "موسيقى وصلوات وتأليفات من داخل المجتمع البهائي — ذخيرة مجتمعية تشمل أناشيد للاجتماعات وصلوات مغنّاة ونصوصًا مقدسة وقطعًا لصفوف الأطفال والشباب.",
      fa: "موسیقی، دعا و آثاری از درون جامعهٔ بهائی — مجموعه‌ای جمعی شامل سرودهای گردهمایی، دعاهای آهنگین، متون مقدس و قطعات برای کلاس‌های کودکان و جوانان.",
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
  const loc = locale as Locale;
  setRequestLocale(loc);
  const tMeta = await getTranslations({ locale: loc, namespace: 'meta.artist' });
  const canonical = `${SITE_URL}${appPath(loc, `artist/${slug}`)}`;
  return {
    title: tMeta('title', { name: profile.name }),
    description: profile.bio[loc] ?? profile.bio.es,
    alternates: {
      canonical,
      languages: languagesAlternates(`artist/${slug}`),
    },
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
  const artistUrl = `${SITE_URL}${appPath(loc, `artist/${slug}`)}`;
  const bio = profile.bio[loc] ?? profile.bio.es;

  return (
    <Stack spacing={5} sx={{ maxWidth: 1100, mx: 'auto' }}>
      <ArtistJsonLd name={profile.name} bio={bio} url={artistUrl} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: SITE_URL },
          { name: profile.name, url: artistUrl },
        ]}
      />
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
