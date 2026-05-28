import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTrackBySlug, getAllTracks } from '@/server/data/catalog';
import { PresentationViewer } from '@/features/lyrics/components/PresentationViewer';

type Params = Promise<{ locale: string; songSlug: string }>;

export async function generateStaticParams() {
  const tracks = await getAllTracks();
  return tracks.map((t) => ({ songSlug: t.slug }));
}

export default async function PresentationPage({ params }: { params: Params }) {
  const { locale, songSlug } = await params;
  setRequestLocale(locale);

  const track = await getTrackBySlug(songSlug);
  if (!track) notFound();

  return (
    <PresentationViewer
      lyrics={track.lyrics}
      hasChords={track.hasChords}
      trackTitle={track.title}
      artistName={track.artist}
      locale={locale}
    />
  );
}
