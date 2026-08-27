import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

export default function SidebarUserCard({ user, onLogout }) {
  const isAdmin = user?.administrator || user?.admin;
  const userEmail = user?.email || user?.login || 'No email';

  const isImpersonating = localStorage.getItem('isImpersonating') === 'true';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '20px',
        border: isImpersonating ? '1.5px solid #f97316' : '1px solid #f1f5f9',
        backgroundColor: isImpersonating ? '#fff7ed' : '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        boxSizing: 'border-box',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography
          sx={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: isImpersonating ? '#ea580c' : '#64748b',
            letterSpacing: '0.5px',
          }}
        >
          SYSTEM USER
        </Typography>

        {isImpersonating ? (
          <Typography
            sx={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#ffffff',
              backgroundColor: '#f97316',
              px: 0.6,
              py: 0.1,
              borderRadius: '10px',
              lineHeight: 1,
            }}
          >
            Active
          </Typography>
        ) : isAdmin ? (
          <Chip
            label="Admin"
            size="small"
            sx={{
              height: '20px',
              fontSize: '0.68rem',
              fontWeight: 800,
              backgroundColor: '#e0f2fe',
              color: '#00a896',
              borderRadius: '999px',
              letterSpacing: '0.2px',
            }}
          />
        ) : null}
      </Box>

      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#0f172a',
          wordBreak: 'break-all',
          lineHeight: 1.2,
        }}
      >
        {userEmail}
      </Typography>

      {onLogout && (
        <Button
          fullWidth
          variant="outlined"
          onClick={onLogout}
          startIcon={<LogoutIcon sx={{ fontSize: '18px', color: '#00a896' }} />}
          sx={{
            mt: 1,
            borderRadius: '12px',
            borderColor: '#e2e8f0',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.2px',
            py: 1,
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: '#ffffff',
              borderColor: '#00a896',
              color: '#00a896',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Logout
        </Button>
      )}
    </Paper>
  );
}
