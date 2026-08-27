import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Drawer, Box, Typography, IconButton, Button, TextField, MenuItem,
  Select, FormControl, InputLabel, Chip, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RouteIcon from '@mui/icons-material/Route';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const REPORT_TYPES = [
  { id: 'trips', label: 'Trip History Report', icon: <RouteIcon fontSize="small" /> },
  { id: 'stops', label: 'Stoppage & Idle Report', icon: <AssessmentIcon fontSize="small" /> },
  { id: 'summary', label: 'Daily Fleet Summary', icon: <EqualizerIcon fontSize="small" /> },
  { id: 'events', label: 'Alerts & Events Report', icon: <AssessmentIcon fontSize="small" /> },
];

export const ReportsDrawer = ({ open, onClose }) => {
  const devices = useSelector((state) => state.devices?.items || {});
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [selectedDevice, setSelectedDevice] = useState('all');
  const [reportType, setReportType] = useState('trips');
  const [datePreset, setDatePreset] = useState('today');
  const [loading, setLoading] = useState(false);

  const getDateRange = useCallback((preset) => {
    const now = new Date();
    let from = new Date();

    if (preset === 'today') {
      from.setHours(0, 0, 0, 0);
    } else if (preset === 'yesterday') {
      from.setDate(now.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      now.setDate(now.getDate() - 1);
      now.setHours(23, 59, 59, 999);
    } else if (preset === 'week') {
      from.setDate(now.getDate() - 7);
    }
    return { from: from.toISOString().slice(0, 16), to: now.toISOString().slice(0, 16) };
  }, []);

  const [dates, setDates] = useState(getDateRange('today'));

  const handlePresetClick = (preset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setDates(getDateRange(preset));
    }
  };

  const handleGenerateReport = () => {
    setLoading(true);
    window.dispatchEvent(
      new CustomEvent('generateFleetReport', {
        detail: {
          deviceId: selectedDevice,
          type: reportType,
          from: dates.from,
          to: dates.to,
        },
      })
    );
    setTimeout(() => setLoading(false), 600);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: '380px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
          willChange: 'transform',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
        <Typography sx={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
          Fleet Reports
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#0f172a' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontSize: '13px', fontWeight: 600 }}>Select Device / Group</InputLabel>
          <Select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            label="Select Device / Group"
            sx={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
          >
            <MenuItem value="all">⚡ All Fleet Vehicles</MenuItem>
            {deviceList.map((dev) => (
              <MenuItem key={dev.id} value={dev.id}>{dev.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', mt: 0.5 }}>
          Report Type
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {REPORT_TYPES.map((type) => {
            const isSelected = reportType === type.id;
            return (
              <Box
                key={type.id}
                onClick={() => setReportType(type.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.2,
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #00a896' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#e6f7f5' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  '&:hover': { borderColor: '#00a896' },
                }}
              >
                <Box sx={{ color: isSelected ? '#00a896' : '#64748b' }}>{type.icon}</Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#00a896' : '#1e293b' }}>
                  {type.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', mt: 0.5 }}>
          Date Range Preset
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['today', 'yesterday', 'week', 'custom'].map((preset) => (
            <Chip
              key={preset}
              label={preset === 'week' ? '7 Days' : preset.charAt(0).toUpperCase() + preset.slice(1)}
              clickable
              onClick={() => handlePresetClick(preset)}
              sx={{
                flex: 1,
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: '6px',
                backgroundColor: datePreset === preset ? '#00a896' : '#f1f5f9',
                color: datePreset === preset ? '#ffffff' : '#475569',
                '&:hover': { backgroundColor: datePreset === preset ? '#008f80' : '#e2e8f0' },
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 0.5 }}>
          <TextField
            label="From"
            type="datetime-local"
            size="small"
            value={dates.from}
            onChange={(e) => {
              setDatePreset('custom');
              setDates({ ...dates, from: e.target.value });
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px' } }}
          />
          <TextField
            label="To"
            type="datetime-local"
            size="small"
            value={dates.to}
            onChange={(e) => {
              setDatePreset('custom');
              setDates({ ...dates, to: e.target.value });
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px' } }}
          />
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleGenerateReport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          sx={{
            borderRadius: '8px',
            backgroundColor: '#00a896',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            py: 1,
            fontSize: '14px',
            '&:hover': { backgroundColor: '#008f80' },
          }}
        >
          {loading ? 'Generating...' : 'Run Report'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default React.memo(ReportsDrawer);
