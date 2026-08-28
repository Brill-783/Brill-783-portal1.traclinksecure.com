import React from 'react';
import { Box, Typography, IconButton, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';
import VisibilityIcon from '@mui/icons-material/Visibility';

const formatTimestamp = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const EventPopup = ({ event, device, position, onClose }) => {
  if (!event) return null;

  const unitName = device ? device.name : `Unit #${event.deviceId}`;
  const alertText = event.attributes?.message || event.attributes?.ruleName || event.type || 'Alert Event';
  const speed = Math.round(position?.speed ? position.speed * 1.852 : event.attributes?.speed ? event.attributes.speed * 1.852 : event.speed || 0);
  const lat = position?.latitude !== undefined ? Number(position.latitude).toFixed(6) : event.latitude !== undefined ? Number(event.latitude).toFixed(6) : '—';
  const lng = position?.longitude !== undefined ? Number(position.longitude).toFixed(6) : event.longitude !== undefined ? Number(event.longitude).toFixed(6) : '—';
  const altitude = position?.altitude !== undefined ? Math.round(position.altitude) : event.altitude !== undefined ? Math.round(event.altitude) : '0';
  const address = position?.address || event.address || event.attributes?.address || 'Address loading...';
  const eventTime = formatTimestamp(event.eventTime || event.serverTime || event.createdAt);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1200,
        width: '320px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.22)',
        fontFamily: "'Roboto', -apple-system, sans-serif",
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <NavigationIcon sx={{ color: '#00a896', fontSize: '16px', transform: 'rotate(45deg)', flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
            {unitName}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', p: 0.2, ml: 1, '&:hover': { color: '#0f172a' } }}>
          <CloseIcon sx={{ fontSize: '18px' }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 1.5, py: 0.8, backgroundColor: '#f0fdfa', borderBottom: '1px solid #e6f7f5' }}>
        <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#00a896', lineHeight: 1.3 }}>
          ⚠️ {alertText}
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, py: 1.2, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 1, alignItems: 'flex-start' }}>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Address</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            <Typography sx={{ fontSize: '11.5px', color: '#1e293b', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {address}
            </Typography>
            <VisibilityIcon sx={{ fontSize: '13px', color: '#94a3b8', flexShrink: 0 }} />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Preview</Typography>
          <Link href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" underline="hover" sx={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 700 }}>
            Preview &gt;&gt;
          </Link>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Latitude</Typography>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>{lat}°</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Longitude</Typography>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>{lng}°</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Altitude</Typography>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b' }}>{altitude} m</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Speed</Typography>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#00a896' }}>{speed} kph</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Time</Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>{eventTime}</Typography>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '16px',
          height: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '4px 4px 8px rgba(0,0,0,0.08)',
        }}
      />
    </Box>
  );
};

export default EventPopup;