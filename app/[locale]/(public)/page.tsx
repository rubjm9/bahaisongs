import { Stack } from '@mui/material';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { HeroAtmosphere } from '@/features/home/components/HeroAtmosphere';
import { TrackSection } from '@/features/catalog/components/TrackSection';
import { getAllTracks, getRecentTracks, getTracksByCategory } from '@/server/data/catalog';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { SITE_URL } from '@/shared/lib/seo/site';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale !== 'en';
  const canonical = isEs ? SITE_URL : `${SITE_URL}/en`;
  return {
    title: isEs
      ? "BahaiSongs – Letras, acordes y vídeos de canciones bahá'ís"
      : "BahaiSongs – Bahá'í Songs, Lyrics & Chords",
    description: isEs
      ? "Descubre más de 140 canciones bahá'ís con letra, acordes y audio. El cancionero bahá'í digital en español."
      : "Discover 140+ Bahá'í songs with lyrics, guitar chords and integrated audio. The digital Bahá'í songbook.",
    alternates: {
      canonical,
      languages: { es: SITE_URL, en: `${SITE_URL}/en` },
    },
  };
}

export default async function HomePage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tSections = await getTranslations('sections');

  const [allTracks, recent, withChords, prayers, calm] = await Promise.all([
    getAllTracks(),
    getRecentTracks(8),
    getTracksByCategory('con-acordes').then((t) => t.slice(0, 8)),
    getTracksByCategory('oracion').then((t) => t.slice(0, 8)),
    getTracksByCategory('tranquila').then((t) => t.slice(0, 8)),
  ]);

  return (
    <Stack spacing={{ xs: 6, md: 8 }} sx={{ maxWidth: 1100, mx: 'auto' }}>
      <HeroAtmosphere
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        cta={t('cta')}
        ctaSuggest={t('ctaSuggest')}
        ctaHref={appPath(locale as Locale, 'discover')}
        ctaSuggestHref={appPath(locale as Locale, 'suggest')}
        heroStatCount={allTracks.length}
        heroStatLabel={t('heroStatLabel')}
      />

      <TrackSection
        eyebrow={tSections('recentEyebrow')}
        title={tSections('recentTitle')}
        description={tSections('recentDescription')}
        tracks={recent}
        locale={locale as Locale}
        seeAllHref={appPath(locale as Locale, 'discover')}
        seeAllLabel={tSections('seeAll')}
      />

      <TrackSection
        eyebrow={tSections('chordsEyebrow')}
        title={tSections('chordsTitle')}
        description={tSections('chordsDescription')}
        tracks={withChords}
        locale={locale as Locale}
        seeAllHref={appPath(locale as Locale, 'category/con-acordes')}
        seeAllLabel={tSections('seeAll')}
      />

      <TrackSection
        eyebrow={tSections('prayersEyebrow')}
        title={tSections('prayersTitle')}
        description={tSections('prayersDescription')}
        tracks={prayers}
        locale={locale as Locale}
        seeAllHref={appPath(locale as Locale, 'category/oracion')}
        seeAllLabel={tSections('seeAll')}
      />

      <TrackSection
        eyebrow={tSections('calmEyebrow')}
        title={tSections('calmTitle')}
        description={tSections('calmDescription')}
        tracks={calm}
        locale={locale as Locale}
        seeAllHref={appPath(locale as Locale, 'category/tranquila')}
        seeAllLabel={tSections('seeAll')}
      />
    </Stack>
  );
}
