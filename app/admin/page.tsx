import { Suspense } from 'react';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { Users, Lightbulb, Play } from 'lucide-react';
import { AdminPage } from '@/features/admin/components/AdminPage';
import { CatalogStatCard } from '@/features/admin/components/CatalogStatCard';
import { StatCard } from '@/features/admin/components/StatCard';
import { getAdminStats, getCatalogHistoryByMonth, getNewUsersByMonth, getPlaysByWeek, getRecentSuggestions, getSuggestionsByMonth } from '@/server/data/admin-stats';
import { cssVars, radii } from '@/shared/theme/tokens';

export const metadata = { title: 'Inicio' };
export const dynamic = 'force-dynamic';

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{ color: cssVars.textPrimary, fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 }}
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: cssVars.textMuted, mt: 0.75, lineHeight: 1.6 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

async function StatsGrid() {
  const [stats, catalogHistory, usersByMonth, suggestionsByMonth, playsByWeek] = await Promise.all([
    getAdminStats(),
    getCatalogHistoryByMonth(6),
    getNewUsersByMonth(6),
    getSuggestionsByMonth(6),
    getPlaysByWeek(8),
  ]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: { xs: 2, md: 2.5 },
      }}
    >
      <CatalogStatCard
        totalTracks={stats.totalTracks}
        publishedTracks={stats.publishedTracks}
        tracksWithAudio={stats.tracksWithAudio}
        tracksWithChords={stats.tracksWithChords}
        history={catalogHistory}
      />
      <StatCard
        title="Usuarios"
        value={stats.totalUsers}
        subtitle={`+${stats.newUsersLast7Days} esta semana`}
        Icon={Users}
        accent="success"
        chart={{
          data: usersByMonth,
          ariaLabel: 'Usuarios nuevos por mes, últimos 6 meses',
        }}
      />
      <StatCard
        title="Sugerencias"
        value={stats.pendingSuggestions}
        subtitle="pendientes de revisar"
        Icon={Lightbulb}
        accent={stats.pendingSuggestions > 0 ? 'warning' : 'electric'}
        chart={{
          data: suggestionsByMonth,
          ariaLabel: 'Sugerencias recibidas por mes, últimos 6 meses',
        }}
      />
      <StatCard
        title="Reproducciones"
        value={stats.playsLast7Days}
        subtitle="últimos 7 días"
        Icon={Play}
        accent="cyan"
        chart={{
          data: playsByWeek,
          ariaLabel: 'Reproducciones por semana, últimas 8 semanas',
          variant: 'line',
        }}
      />
    </Box>
  );
}

async function RecentSuggestionsSection() {
  const suggestions = await getRecentSuggestions(5);

  if (suggestions.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          py: 6,
          px: 3,
          borderRadius: `${radii.lg}px`,
          border: `1px dashed ${cssVars.borderSubtle}`,
          background: cssVars.bgElevated,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: `${radii.md}px`,
            display: 'grid',
            placeItems: 'center',
            background: `${cssVars.borderSubtle}`,
            color: cssVars.textMuted,
          }}
        >
          <Lightbulb size={22} strokeWidth={1.75} />
        </Box>
        <Typography variant="body1" sx={{ color: cssVars.textPrimary, fontWeight: 500 }}>
          Sin sugerencias recientes
        </Typography>
        <Typography variant="body2" sx={{ color: cssVars.textMuted, maxWidth: 360, lineHeight: 1.6 }}>
          Cuando lleguen nuevas propuestas del catálogo, aparecerán aquí para revisarlas.
        </Typography>
      </Box>
    );
  }

  const statusColor: Record<string, string> = {
    pending: '#F59E0B',
    approved: '#34D399',
    rejected: '#F87171',
    withdrawn: '#94A3B8',
  };
  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    withdrawn: 'Retirada',
  };

  return (
    <Stack spacing={1.5}>
      {suggestions.map((s) => {
        const title =
          typeof s.payload?.title === 'string'
            ? s.payload.title
            : `Sugerencia ${s.id.slice(0, 8)}`;

        return (
          <Box
            key={s.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: `${radii.md}px`,
              border: `1px solid ${cssVars.borderSubtle}`,
              background: cssVars.bgElevated,
              transition: 'border-color 160ms',
              '&:hover': { borderColor: cssVars.borderStrong },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                background: statusColor[s.status] ?? cssVars.borderStrong,
              }}
            />
            <Typography variant="body2" sx={{ flex: 1, color: cssVars.textPrimary, lineHeight: 1.5 }}>
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: statusColor[s.status] ?? cssVars.textMuted,
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              {statusLabel[s.status] ?? s.status}
            </Typography>
            <Typography variant="caption" sx={{ color: cssVars.textMuted, flexShrink: 0, fontSize: '0.8125rem' }}>
              {new Date(s.created_at).toLocaleDateString('es')}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminPage
      title="Panel de administración"
      description="Vista general del catálogo, usuarios y actividad reciente."
      maxWidth={1200}
      contentSx={{
        px: { xs: 2.5, md: 4 },
        py: { xs: 3, md: 5 },
        pb: { xs: 5, md: 7 },
      }}
    >
        <Box sx={{ mb: { xs: 5, md: 6 } }}>
          <SectionHeading
            title="Resumen general"
            description="Indicadores clave del estado actual de BahaiSongs."
          />
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  gap: { xs: 2, md: 2.5 },
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={i === 0 ? 220 : 148}
                    sx={{ borderRadius: `${radii.lg}px`, gridColumn: i === 0 ? { md: '1 / -1' } : undefined }}
                  />
                ))}
              </Box>
            }
          >
            <StatsGrid />
          </Suspense>
        </Box>

        <Box>
          <SectionHeading
            title="Sugerencias recientes"
            description="Últimas propuestas enviadas por la comunidad."
          />
          <Suspense fallback={<Skeleton variant="rounded" height={200} sx={{ borderRadius: `${radii.lg}px` }} />}>
            <RecentSuggestionsSection />
          </Suspense>
        </Box>
    </AdminPage>
  );
}
