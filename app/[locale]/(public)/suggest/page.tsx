import { setRequestLocale } from 'next-intl/server';
import { ComingSoon } from '@/shared/ui/ComingSoon';

type Params = Promise<{ locale: string }>;

export default async function SuggestPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ComingSoon
      title="Sugerir una canción"
      description="¿Conoces una canción bahá'í que no está en el catálogo? Pronto podrás proponerla directamente desde aquí: sube el audio, añade la letra y los acordes, y el equipo la revisará antes de publicarla."
    />
  );
}
