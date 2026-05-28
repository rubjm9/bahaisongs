'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { DataTable, type Column } from '@/features/admin/components/DataTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { setUserRole } from '@/features/admin/actions/users';
import { cssVars, accent } from '@/shared/theme/tokens';

interface UserRow { id: string; display_name: string | null; role: string; locale: string; created_at: string; email?: string | null }

interface Props {
  initialUsers: UserRow[];
  currentUserId: string;
}

export function UsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<{ user: UserRow; newRole: 'user' | 'admin' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          (u.display_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (u.email ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  function onConfirmRoleChange() {
    if (!confirmTarget) return;
    const { user, newRole } = confirmTarget;
    startTransition(async () => {
      await setUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      setConfirmTarget(null);
    });
  }

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      label: 'Usuario',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.display_name ?? <em style={{ color: cssVars.textMuted }}>Sin nombre</em>}
            {row.id === currentUserId && (
              <Chip label="Tú" size="small" sx={{ ml: 1, height: 16, fontSize: '0.65rem' }} />
            )}
          </Typography>
          <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
            {row.email ?? row.id.slice(0, 12) + '…'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      width: 100,
      render: (row) => (
        <Chip
          label={row.role === 'admin' ? 'Admin' : 'Usuario'}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: 22,
            fontWeight: 600,
            background: row.role === 'admin' ? `${accent.electric}20` : `${cssVars.borderStrong}18`,
            color: row.role === 'admin' ? accent.electric : cssVars.textMuted,
          }}
        />
      ),
    },
    {
      key: 'locale',
      label: 'Idioma',
      width: 80,
      align: 'center',
      render: (row) => <Typography variant="caption" sx={{ color: cssVars.textMuted }}>{row.locale}</Typography>,
    },
    {
      key: 'created',
      label: 'Registrado',
      width: 110,
      render: (row) => (
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
          {new Date(row.created_at).toLocaleDateString('es')}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      align: 'right',
      render: (row) => {
        if (row.id === currentUserId) return null;
        const isAdmin = row.role === 'admin';
        return (
          <Tooltip title={isAdmin ? 'Quitar rol admin' : 'Hacer admin'}>
            <IconButton
              size="small"
              onClick={() => setConfirmTarget({ user: row, newRole: isAdmin ? 'user' : 'admin' })}
              aria-label={isAdmin ? 'Quitar rol admin' : 'Hacer admin'}
              sx={{ color: isAdmin ? 'warning.main' : accent.electric }}
            >
              {isAdmin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: cssVars.textPrimary }}>
          {filtered.length}
          {search ? ` de ${users.length}` : ''} usuarios
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={15} style={{ color: cssVars.textMuted }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        emptyMessage={search ? 'Sin resultados para esa búsqueda' : 'Sin usuarios todavía'}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.newRole === 'admin' ? 'Hacer administrador' : 'Quitar rol de administrador'}
        description={
          confirmTarget?.newRole === 'admin'
            ? `¿Dar acceso de administrador a «${confirmTarget?.user.display_name ?? confirmTarget?.user.email}»?`
            : `¿Revocar acceso de administrador a «${confirmTarget?.user.display_name ?? confirmTarget?.user.email}»?`
        }
        confirmLabel={confirmTarget?.newRole === 'admin' ? 'Hacer admin' : 'Quitar admin'}
        destructive={confirmTarget?.newRole !== 'admin'}
        loading={isPending}
        onConfirm={onConfirmRoleChange}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
