import type { CatalogTrack } from '@/server/data/catalog';
import { SITE_URL } from './site';

interface MusicRecordingJsonLdProps {
  track: CatalogTrack;
  url: string;
}

export function MusicRecordingJsonLd({ track, url }: MusicRecordingJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    byArtist: { '@type': 'MusicGroup', name: track.artist },
    inLanguage: track.language,
    url,
    ...(track.legacyAudioUrl ? { embedUrl: track.legacyAudioUrl } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArtistJsonLdProps {
  name: string;
  bio: string;
  url: string;
}

export function ArtistJsonLd({ name, bio, url }: ArtistJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name,
    description: bio,
    url,
    sameAs: SITE_URL,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
