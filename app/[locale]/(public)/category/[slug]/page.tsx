import { notFound } from 'next/navigation';
import { Stack, Typography, Box } from '@mui/material';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { GradientText } from '@/shared/ui/GradientText';
import { TrackList } from '@/features/catalog/components/TrackList';
import {
  categoryLabel,
  categoryKind,
  categoryKindColor,
  knownCategorySlugs,
} from '@/features/catalog/lib/category-labels';
import { getActiveCategorySlugs, getTracksByCategory } from '@/server/data/catalog';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { languagesAlternates } from '@/shared/lib/seo/hreflang';
import { SITE_URL } from '@/shared/lib/seo/site';
import { BreadcrumbJsonLd } from '@/shared/lib/seo/JsonLd';
import { cssVars } from '@/shared/theme/tokens';

type LocalizedCopy = Record<Locale, string>;

const CATEGORY_DESCRIPTIONS: Record<string, LocalizedCopy> = {
  oracion: {
    es: "Aprende a cantar las oraciones bahá'ís. Letra completa y acordes de guitarra para oraciones de Bahá'u'lláh y 'Abdu'l-Bahá en español.",
    en: "Learn to sing Bahá'í prayers. Full lyrics and guitar chords for prayers by Bahá'u'lláh and 'Abdu'l-Bahá.",
    fr: "Apprenez à chanter les prières bahá'íes. Paroles complètes et accords de guitare pour les prières de Bahá'u'lláh et 'Abdu'l-Bahá.",
    de: "Lerne bahá'ísche Gebete zu singen. Vollständiger Text und Gitarrenakkorde für Gebete von Bahá'u'lláh und 'Abdu'l-Bahá.",
    pt: "Aprenda a cantar as orações bahá'ís. Letra completa e acordes de guitarra para orações de Bahá'u'lláh e 'Abdu'l-Bahá.",
    ru: "Учитесь петь бахаийские молитвы. Полный текст и гитарные аккорды молитв Бахауллы и Абдул-Баха.",
    ar: "تعلّم غناء الصلوات البهائية. كلمات كاملة وأوتار جيتار لصلوات بهاءالله وعبدالبهاء.",
    fa: "دعاهای بهائی را با آهنگ بیاموزید. متن کامل و آکورد گیتار برای دعاهای بهاءالله و عبدالبهاء.",
  },
  'con-acordes': {
    es: "Todas las canciones bahá'ís con acordes de guitarra. Letras completas y transposición automática. Aprende a tocarlas paso a paso.",
    en: "All Bahá'í songs with guitar chords. Full lyrics and automatic transposition. Learn to play them step by step.",
    fr: "Tous les chants bahá'ís avec accords de guitare. Paroles complètes et transposition automatique. Apprenez à les jouer pas à pas.",
    de: "Alle bahá'íschen Lieder mit Gitarrenakkorden. Vollständiger Text und automatische Transposition. Lerne sie Schritt für Schritt zu spielen.",
    pt: "Todas as canções bahá'ís com acordes de guitarra. Letras completas e transposição automática. Aprenda a tocá-las passo a passo.",
    ru: "Все бахаийские песни с гитарными аккордами. Полный текст и автоматическая транспозиция. Учитесь играть их шаг за шагом.",
    ar: "كل الأناشيد البهائية مع أوتار الجيتار. كلمات كاملة ونقل طبقة تلقائي. تعلّم عزفها خطوة بخطوة.",
    fa: "همهٔ سرودهای بهائی با آکورد گیتار. متن کامل و جابه‌جایی پردهٔ خودکار. گام‌به‌گام یاد بگیرید بنوازید.",
  },
  tranquila: {
    es: "Canciones bahá'ís tranquilas para reflexionar, meditar o descansar. Letra y acordes en español.",
    en: "Calm Bahá'í songs for reflection, meditation or rest. Lyrics and chords.",
    fr: "Chants bahá'ís calmes pour réfléchir, méditer ou se reposer. Paroles et accords.",
    de: "Ruhige bahá'ísche Lieder zum Nachdenken, Meditieren oder Ausruhen. Text und Akkorde.",
    pt: "Canções bahá'ís calmas para refletir, meditar ou descansar. Letra e acordes.",
    ru: "Спокойные бахаийские песни для размышления, медитации или отдыха. Текст и аккорды.",
    ar: "أناشيد بهائية هادئة للتأمل أو الراحة. كلمات وأوتار.",
    fa: "سرودهای آرام بهائی برای تأمل، مراقبه یا استراحت. متن و آکورد.",
  },
  'muy-ritmica': {
    es: "Canciones bahá'ís rítmicas y animadas para cantar juntos. Letra y acordes para guitarra.",
    en: "Rhythmic and upbeat Bahá'í songs to sing together. Lyrics and guitar chords.",
    fr: "Chants bahá'ís rythmiques et entraînants pour chanter ensemble. Paroles et accords de guitare.",
    de: "Rhythmische und schwungvolle bahá'ísche Lieder zum gemeinsamen Singen. Text und Gitarrenakkorde.",
    pt: "Canções bahá'ís rítmicas e animadas para cantar juntos. Letra e acordes de guitarra.",
    ru: "Ритмичные и оживлённые бахаийские песни для совместного пения. Текст и гитарные аккорды.",
    ar: "أناشيد بهائية إيقاعية وحيوية للغناء معًا. كلمات وأوتار جيتار.",
    fa: "سرودهای ریتمیک و شاد بهائی برای خواندن با هم. متن و آکورد گیتار.",
  },
  'texto-sagrado': {
    es: "Canciones bahá'ís basadas en textos sagrados de Bahá'u'lláh, el Báb y 'Abdu'l-Bahá. Letra y acordes en español.",
    en: "Bahá'í songs based on sacred texts by Bahá'u'lláh, the Báb and 'Abdu'l-Bahá. Lyrics and chords.",
    fr: "Chants bahá'ís basés sur des textes sacrés de Bahá'u'lláh, du Báb et de 'Abdu'l-Bahá. Paroles et accords.",
    de: "Bahá'ísche Lieder nach heiligen Texten von Bahá'u'lláh, dem Báb und 'Abdu'l-Bahá. Text und Akkorde.",
    pt: "Canções bahá'ís baseadas em textos sagrados de Bahá'u'lláh, o Báb e 'Abdu'l-Bahá. Letra e acordes.",
    ru: "Бахаийские песни на основе священных текстов Бахауллы, Баба и Абдул-Баха. Текст и аккорды.",
    ar: "أناشيد بهائية مبنية على نصوص مقدسة لبهاءالله والباب وعبدالبهاء. كلمات وأوتار.",
    fa: "سرودهای بهائی بر پایهٔ متون مقدس بهاءالله، باب و عبدالبهاء. متن و آکورد.",
  },
};

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const active = new Set(await getActiveCategorySlugs());
  return knownCategorySlugs()
    .filter((s) => active.has(s))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params;
  const loc = locale as Locale;
  setRequestLocale(loc);
  const t = await getTranslations({ locale: loc, namespace: 'meta.category' });
  const label = categoryLabel(slug, loc);
  const canonical = `${SITE_URL}${appPath(loc, `category/${slug}`)}`;

  const description = CATEGORY_DESCRIPTIONS[slug]?.[loc] ?? t('descriptionFallback', { label });

  return {
    title: t('title', { label }),
    description,
    alternates: {
      canonical,
      languages: languagesAlternates(`category/${slug}`),
    },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tracks = await getTracksByCategory(slug);
  if (tracks.length === 0) notFound();

  const t = await getTranslations('category');
  const loc = locale as Locale;
  const label = categoryLabel(slug, loc);
  const kind = categoryKind(slug);
  const kindColor = categoryKindColor(slug);
  const categoryUrl = `${SITE_URL}${appPath(loc, `category/${slug}`)}`;

  return (
    <Stack spacing={5} sx={{ maxWidth: 1100, mx: 'auto' }}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: SITE_URL },
          { name: 'Catálogo', url: `${SITE_URL}/library` },
          { name: label, url: categoryUrl },
        ]}
      />
      <Box>
        <Typography
          sx={{
            color: kindColor,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          {t(`kind.${kind}`)}
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 700 }}>
          <GradientText variant="aurora">{label}</GradientText>
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, mt: 1, fontSize: '0.95rem' }}>
          {t('trackCount', { count: tracks.length })}
        </Typography>
      </Box>

      <TrackList tracks={tracks} locale={loc} numbered />
    </Stack>
  );
}
