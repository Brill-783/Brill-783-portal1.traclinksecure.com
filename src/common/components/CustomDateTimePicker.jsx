import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Popover,
  Button,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function CustomDateTimePicker({ value, onChange, label = 'Expiration date' }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedHour, setSelectedHour] = useState(
    initialDate.getHours() % 12 || 12
  );
  const [selectedMinute, setSelectedMinute] = useState(
    initialDate.getMinutes().toString().padStart(2, '0')
  );
  const [selectedPeriod, setSelectedPeriod] = useState(
    initialDate.getHours() >= 12 ? 'PM' : 'AM'
  );

  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSetDate = () => {
    let hours = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && hours < 12) hours += 12;
    if (selectedPeriod === 'AM' && hours === 12) hours = 0;

    const finalDate = new Date(
      year,
      month,
      selectedDay,
      hours,
      parseInt(selectedMinute, 10)
    );

    onChange(finalDate.toISOString());
    handleClose();
  };

  const formatDisplay = () => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const dayStr = d.getDate().toString().padStart(2, '0');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
    const yrStr = d.getFullYear();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dayStr}-${monthStr}-${yrStr} ${timeStr}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, width: '100%' }}>
      {label && (
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
          {label}
        </Typography>
      )}

      <TextField
        fullWidth
        readOnly
        onClick={handleOpen}
        placeholder="Select expiration date..."
        value={formatDisplay()}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CalendarTodayIcon sx={{ color: '#00a896', fontSize: '20px', cursor: 'pointer' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          cursor: 'pointer',
          '& .MuiOutlinedInput-root': {
            borderRadius: '24px',
            backgroundColor: '#ffffff',
            height: '42px',
            fontSize: '0.86rem',
            cursor: 'pointer',
            '& fieldset': { borderColor: '#00a896' },
            '&:hover fieldset': { borderColor: '#008f80' },
            '&.Mui-focused fieldset': { borderColor: '#00a896' },
          },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2.5,
            width: '360px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton size="small" onClick={handlePrevMonth} sx={{ color: '#00a896' }}>
            <ChevronLeftIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>
              {monthNames[month]}
            </Typography>

            <Select
              size="small"
              value={year}
              onChange={(e) => setViewDate(new Date(e.target.value, month, 1))}
              sx={{
                fontSize: '0.90rem',
                fontWeight: 700,
                color: '#0f172a',
                height: '30px',
                '& fieldset': { border: 'none' },
              }}
            >
              {[2026, 2027, 2028, 2029, 2030].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </Box>

          <IconButton size="small" onClick={handleNextMonth} sx={{ color: '#00a896' }}>
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: 1 }}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <Typography key={d} sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
              {d}
            </Typography>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 2.5 }}>
          {Array.from({ length: startDay }).map((_, i) => (
            <Typography
              key={`prev-${i}`}
              sx={{
                textAlign: 'center',
                py: 0.8,
                fontSize: '0.82rem',
                color: '#cbd5e1',
              }}
            >
              {daysInPrevMonth - startDay + i + 1}
            </Typography>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected = dayNum === selectedDay;

            return (
              <Box
                key={`day-${dayNum}`}
                onClick={() => setSelectedDay(dayNum)}
                sx={{
                  textAlign: 'center',
                  py: 0.8,
                  fontSize: '0.84rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#ffffff' : '#0f172a',
                  backgroundColor: isSelected ? '#00a896' : 'transparent',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    backgroundColor: isSelected ? '#008f80' : '#f0fdfa',
                  },
                }}
              >
                {dayNum}
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.2,
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            mb: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ color: '#00a896', fontSize: '20px' }} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              Time:
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Select
              size="small"
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              sx={{
                height: '32px',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                borderRadius: '8px',
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <MenuItem key={h} value={h}>{h.toString().padStart(2, '0')}</MenuItem>
              ))}
            </Select>

            <Typography sx={{ fontWeight: 700 }}>:</Typography>

            <Select
              size="small"
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
              sx={{
                height: '32px',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                borderRadius: '8px',
              }}
            >
              {['00', '15', '30', '45', '59'].map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              sx={{
                height: '32px',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                borderRadius: '8px',
              }}
            >
              <MenuItem value="AM">AM</MenuItem>
              <MenuItem value="PM">PM</MenuItem>
            </Select>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderRadius: '20px',
              borderColor: '#00a896',
              color: '#00a896',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 2.5,
              py: 0.6,
              '&:hover': { backgroundColor: '#f0fdfa', borderColor: '#008f80' },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSetDate}
            variant="contained"
            sx={{
              borderRadius: '20px',
              backgroundColor: '#00a896',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 2.5,
              py: 0.6,
              '&:hover': { backgroundColor: '#008f80' },
            }}
          >
            Set date
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}
