import { Box, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        px: 3,
      }}
    >
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700 }}>
          404
        </Typography>
        <Typography sx={{ color: 'var(--bs-text-muted)', mt: 2 }}>
          The page you are looking for does not exist.
        </Typography>
      </Box>
    </Box>
  );
}
