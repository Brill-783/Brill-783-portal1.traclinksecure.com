import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IconButton, Paper } from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import TerminalIcon from '@mui/icons-material/Terminal';
import SpeedIcon from '@mui/icons-material/Speed';
import RouteIcon from '@mui/icons-material/Route';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const KNOTS_TO_KMH = 1.852;
const MIN_MOVING_SPEED_KMH = 2.0;

// Persistent memory to anchor stop baseline without external files
const stopTrackingMap = new Map();

const calculateStopBaseline = (deviceId, position) => {
  if (!deviceId || !position) return null;

  const rawKnots = typeof position.speed === 'number' && Number.isFinite(position.speed) ? position.speed : 0;
  const speedKmh = rawKnots * KNOTS_TO_KMH;
  const packetTime = new Date(position.fixTime || position.deviceTime || position.serverTime || Date.now()).getTime();

  let state = stopTrackingMap.get(deviceId);
  if (!state) {
    state = {
      isStopped: false,
      stoppedSince: null,
    };
    stopTrackingMap.set(deviceId, state);
  }

  // 1. Moving: Speed strictly above threshold -> reset anchor
  if (speedKmh > MIN_MOVING_SPEED_KMH) {
    state.isStopped = false;
    state.stoppedSince = null;
    return null;
  }

  // 2. Stopped / Idling: First packet below threshold saves stoppedSince
  if (!state.isStopped || !state.stoppedSince) {
    state.isStopped = true;
    state.stoppedSince = packetTime;
  }

  return state.stoppedSince;
};

const formatStopDuration = (durationMs) => {
  if (!durationMs || durationMs < 0 || !Number.isFinite(durationMs)) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const formatFullTimestamp = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatDistance = (meters) => {
  if (!meters) return '0.00 km';
  return `${(meters / 1000).toFixed(2)} km`;
};

const DeviceDetailsPanel = ({ deviceId, position, onClose }) => {
  const device = useSelector((state) => state.devices?.items?.[deviceId]);
  const [expanded, setExpanded] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Anchor stop baseline with speed threshold logic
  const baselineTime = useMemo(() => calculateStopBaseline(deviceId, position), [deviceId, position]);

  // Live timer tick every second while stopped
  useEffect(() => {
    if (!baselineTime) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [baselineTime]);

  const stopDuration = useMemo(() => {
    if (!baselineTime) return null;
    return formatStopDuration(currentTime - baselineTime);
  }, [baselineTime, currentTime]);

  const speedKph = position?.speed ? Math.round(position.speed * KNOTS_TO_KMH) : 0;
  const totalDistance = position?.attributes?.totalDistance || position?.attributes?.distance || 0;

  const getStatus = useCallback(() => {
    if (!position || !position.id) {
      return { key: 'offline', label: 'Offline', color: '#ef4444' };
    }
    const currentSpeedKph = (position.speed || 0) * KNOTS_TO_KMH;
    const ignition = position.attributes?.ignition === true || position.attributes?.ignition === 1;

    if (currentSpeedKph > MIN_MOVING_SPEED_KMH) {
      return { key: 'moving', label: 'Moving', color: '#22c55e' };
    }
    if (currentSpeedKph <= MIN_MOVING_SPEED_KMH && ignition) {
      return { key: 'idling', label: 'Idling', color: '#f59e0b' };
    }
    if (currentSpeedKph <= MIN_MOVING_SPEED_KMH && !ignition) {
      return { key: 'stopped', label: 'Parked', color: '#0ea5e9' };
    }
    return { key: 'offline', label: 'Offline', color: '#ef4444' };
  }, [position]);

  const status = getStatus();

  const handleSendCommand = async (type) => {
    if (!deviceId) return;
    try {
      await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId, type }),
      });
    } catch (e) {}
  };

  if (!device) return null;

  return (
    <div className="device-details-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ChevronRightIcon sx={{ color: '#00ab8e' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
            {device.name || 'Unnamed Unit'}
          </span>
          <span style={{ backgroundColor: status.color, width: 8, height: 8, borderRadius: '50%', marginLeft: 'auto' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Address</span>
            <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: '180px' }}>
              {position?.address || '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Fix Time</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {formatFullTimestamp(position?.fixTime || position?.deviceTime)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Duration</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {stopDuration ? `${status.label} (${stopDuration})` : '—'}
            </span>
          </div>
        </div>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <SensorsIcon sx={{ color: '#00ab8e' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Sensors</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <SpeedIcon sx={{ fontSize: '0.85rem', color: '#94a3b8' }} /> Speed
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{speedKph} km/h</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RouteIcon sx={{ fontSize: '0.85rem', color: '#94a3b8' }} /> Total Distance
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatDistance(totalDistance)}</span>
          </div>
        </div>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <TerminalIcon sx={{ color: '#00ab8e' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Commands</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleSendCommand('engineResume')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            <span>Engine Resume</span>
            <ChevronRightIcon sx={{ fontSize: '16px' }} />
          </button>
          <button
            type="button"
            onClick={() => handleSendCommand('engineStop')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            <span>Engine Stop</span>
            <ChevronRightIcon sx={{ fontSize: '16px' }} />
          </button>
        </div>
      </Paper>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => setPinned(!pinned)}>
          {pinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
        </IconButton>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        )}
      </div>
    </div>
  );
};

export default React.memo(DeviceDetailsPanel);