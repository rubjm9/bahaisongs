import { Suspense } from 'react';
import { Box, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { Music2, Users, Lightbulb, Play, Mic2 } from 'lucide-react';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
import { StatCard } from '@/features/admin/components/StatCard';
import { getAdminStats, getRecentSuggestions } from '@/server/data/admin-stats';
import { cssVars, radii } from '@/shared/theme/tokens';

export const metadata = { title: 'Inicio' };
export const dynamic = 'force-dynamic';

async function StatsGrid() {
  const stats = await getAdminStats();

  return (
    <Grid container spacing={2}>
      <Grid xs={6} sm={4} lg={2}>
        <StatCard
          title="Canciones"
          value={stats.totalTracks}
          subtitle={`${stats.publishedTracks} publicadas`}
          Icon={Music2}
          accent="electric"
        />
      </Grid>
      <Grid xs={6} sm={4} lg={2}>
        <StatCard
          title="Con audio"
          value={stats.tracksWithAudio}
          subtitle="fuentes activas"
          Icon={Play}
          accent="cyan"
        />
      </Grid>
      <Grid xs={6} sm={4} lg={2}>
        <StatCard
          title="Con acordes"
          value={stats.tracksWithChords}
          subtitle="letras ChordPro"
          Icon={Mic2}
          accent="indigo"
        />
      </Grid>
      <Grid xs={6} sm={4} lg={2}>
        <StatCard
          title="Usuarios"
          value={stats.totalUsers}
          subtitle={`+${stats.newUsersLast7Days} esta semana`}
          Icon={Users}
          accent="success"
        />
      </Grid>
      <Grid xs={6} sm={4} lg={2}>
        <StatCard
          title="Sugerencias"
          value={stats.pendingSuggestions}
          subtitle="pendientes de revisar"
          Icon={Lightbulb}
          accent={stats.pendingSuggestions > 0 ? 'warning' : 'electric'}
        />
      </Grid>
      <Grid xs={6} sm={4} lg={2}>
        <StatCard
          title="Reproducciones"
          value={stats.playsLast7Days}
          subtitle="últimos 7 días"
          Icon={Play}
          accent="cyan"
        />
      </Grid>
    </Grid>
  );
}

async function RecentSuggestionsSection() {
  const suggestions = await getRecentSuggestions(5);

  if (suggestions.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: cssVars.textMuted, py: 2 }}>
        Sin sugerencias recientes.
      </Typography>
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
    <Stack spacing={1}>
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
              p: 1.5,
              borderRadius: `${radii.md}px`,
              border: `1px solid ${cssVars.borderSubtle}`,
              background: cssVars.bgElevated,
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
            <Typography variant="body2" sx={{ flex: 1, color: cssVars.textPrimary }}>
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: statusColor[s.status] ?? cssVars.textMuted,
                fontWeight: 600,
              }}
            >
              {statusLabel[s.status] ?? s.status}
            </Typography>
            <Typography variant="caption" sx={{ color: cssVars.textMuted, flexShrink: 0 }}>
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
    <>
      <AdminTopBar title="Panel de administración" />

      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        {/* KPIs */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="overline"
            sx={{ color: cssVars.textMuted, fontSize: '0.72rem', letterSpacing: '0.08em', mb: 2, display: 'block' }}
          >
            Resumen general
          </Typography>
          <Suspense
            fallback={
              <Grid container spacing={2}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={i} xs={6} sm={4} lg={2}>
                    <Skeleton variant="rounded" height={120} />
                  </Grid>
                ))}
              </Grid>
            }
          >
            <StatsGrid />
          </Suspense>
        </Box>

        {/* Sugerencias recientes */}
        <Box>
          <Typography
            variant="overline"
            sx={{ color: cssVars.textMuted, fontSize: '0.72rem', letterSpacing: '0.08em', mb: 2, display: 'block' }}
          >
            Sugerencias recientes
          </Typography>
          <Suspense fallback={<Skeleton variant="rounded" height={200} />}>
            <RecentSuggestionsSection />
          </Suspense>
        </Box>
      </Box>
    </>
  );
}
