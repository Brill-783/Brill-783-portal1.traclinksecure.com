import React, {
  useMemo,
  useState,
  memo,
  useEffect,
} from 'react';

import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';

import SpeedIcon from '@mui/icons-material/Speed';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WifiIcon from '@mui/icons-material/Wifi';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import BuildIcon from '@mui/icons-material/Build';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

import L from 'leaflet';
import { map } from '../../map/core/MapView';
import { playAlertSound } from './AddAlertModal';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const PRIMARY_LIGHT = '#f0fdfa';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const BORDER = '#cbd5e1';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

let eventHistoricalMarker = null;

const toNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const isValidLatitude = (value) => {
  const number = toNumber(value);
  return number !== null && number >= -90 && number <= 90;
};

const isValidLongitude = (value) => {
  const number = toNumber(value);
  return number !== null && number >= -180 && number <= 180;
};

const normalizeCoordinates = (latitude, longitude) => {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lng,
  };
};

const knotsToKph = (value) => {
  const number = toNumber(value, 0);
  return Math.round(number * 1.852);
};

const getEventSpeed = (event) => {
  const attributeSpeed = event?.attributes?.speed;
  if (
    attributeSpeed !== undefined &&
    attributeSpeed !== null &&
    attributeSpeed !== ''
  ) {
    return knotsToKph(attributeSpeed);
  }

  const eventSpeed = toNumber(event?.speed);
  if (eventSpeed !== null) {
    return Math.round(eventSpeed);
  }

  return 0;
};

const getEventSpeedLimit = (event) => {
  const speedLimit = event?.attributes?.speedLimit;
  if (
    speedLimit === undefined ||
    speedLimit === null ||
    speedLimit === ''
  ) {
    return undefined;
  }

  const value = knotsToKph(speedLimit);
  return Number.isFinite(value) ? value : undefined;
};

const formatTimestamp = (timeStr) => {
  if (!timeStr) return '—';
  const d = new Date(timeStr);
  if (Number.isNaN(d.getTime())) return '—';

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const getEventTitle = (event, geofenceMap = new Map()) => {
  if (!event) return 'Object Activity Log';

  // 1. Resolve geofence name if present
  const geofenceId = event.geofenceId || event.attributes?.geofenceId;
  const geofenceName =
    event.attributes?.geofenceName ||
    (geofenceId ? geofenceMap.get(Number(geofenceId))?.name || geofenceMap.get(String(geofenceId))?.name : null);

  if (event.type === 'geofenceEnter') {
    return geofenceName ? `Geofence Entry: ${geofenceName}` : (event.attributes?.ruleName || 'Geofence Zone Entry');
  }

  if (event.type === 'geofenceExit') {
    return geofenceName ? `Geofence Exit: ${geofenceName}` : (event.attributes?.ruleName || 'Geofence Zone Exit');
  }

  if (event.attributes?.ruleName) {
    return event.attributes.ruleName;
  }

  const speedLimit = getEventSpeedLimit(event);

  switch (event.type) {
    case 'deviceExpiring':
      return 'Device Expiring Warning';
    case 'deviceOverspeed':
      return speedLimit ? `Speed Limit exceeded (${speedLimit} kph)` : 'Speed Limit exceeded';
    case 'deviceOnline':
      return 'Unit Connected (Online)';
    case 'deviceOffline':
      return 'Unit Disconnected (Offline)';
    case 'deviceMoving':
      return 'Vehicle Moving';
    case 'deviceStopped':
      return 'Vehicle Stopped';
    case 'ignitionOn':
      return 'Ignition ON';
    case 'ignitionOff':
      return 'Ignition OFF';
    case 'powerCut':
      return 'Power Cut Detected';
    case 'lowBattery':
      return 'Low Battery Warning';
    case 'tow':
      return 'Towing Alert';
    case 'hardAcceleration':
      return 'Harsh Acceleration';
    case 'hardBraking':
      return 'Harsh Braking';
    case 'hardCornering':
      return 'Harsh Cornering';
    case 'idleDuration':
      return 'Excessive Idling';
    case 'maintenance':
      return 'Maintenance Required';
    case 'alarm':
      return 'Emergency Alarm Triggered';
    default:
      return event.type || 'Object Activity Log';
  }
};

const getEventTheme = (type, ruleName) => {
  const normalized = `${type || ''} ${ruleName || ''}`.toLowerCase();

  if (normalized.includes('expir') || normalized.includes('expired')) {
    return {
      icon: <EventBusyIcon sx={{ color: '#dc2626', fontSize: 16 }} />,
      bg: '#fef2f2',
      border: '#dc2626',
      badgeColor: '#dc2626',
    };
  }

  if (normalized.includes('powercut') || normalized.includes('power cut') || normalized.includes('tamper')) {
    return {
      icon: <FlashOffIcon sx={{ color: '#dc2626', fontSize: 16 }} />,
      bg: '#fef2f2',
      border: '#dc2626',
      badgeColor: '#dc2626',
    };
  }

  if (normalized.includes('lowbattery') || normalized.includes('low battery') || normalized.includes('battery')) {
    return {
      icon: <BatteryAlertIcon sx={{ color: '#f59e0b', fontSize: 16 }} />,
      bg: '#fffbeb',
      border: '#f59e0b',
      badgeColor: '#f59e0b',
    };
  }

  if (normalized.includes('maintenance') || normalized.includes('service')) {
    return {
      icon: <BuildIcon sx={{ color: '#3b82f6', fontSize: 16 }} />,
      bg: '#eff6ff',
      border: '#3b82f6',
      badgeColor: '#3b82f6',
    };
  }

  if (normalized.includes('tow') || normalized.includes('towing')) {
    return {
      icon: <TwoWheelerIcon sx={{ color: '#f97316', fontSize: 16 }} />,
      bg: '#fff7ed',
      border: '#f97316',
      badgeColor: '#f97316',
    };
  }

  if (normalized.includes('overspeed') || normalized.includes('speed')) {
    return {
      icon: <SpeedIcon sx={{ color: '#ef4444', fontSize: 16 }} />,
      bg: '#fef2f2',
      border: '#ef4444',
      badgeColor: '#ef4444',
    };
  }

  if (normalized.includes('geofence')) {
    return {
      icon: <LocationOnIcon sx={{ color: '#8b5cf6', fontSize: 16 }} />,
      bg: '#f5f3ff',
      border: '#8b5cf6',
      badgeColor: '#8b5cf6',
    };
  }

  if (normalized.includes('stop') || normalized.includes('stopped')) {
    return {
      icon: <PauseCircleIcon sx={{ color: '#f59e0b', fontSize: 16 }} />,
      bg: '#fffbeb',
      border: '#f59e0b',
      badgeColor: '#f59e0b',
    };
  }

  if (normalized.includes('offline') || normalized.includes('disconnected')) {
    return {
      icon: <WifiOffIcon sx={{ color: '#dc2626', fontSize: 16 }} />,
      bg: '#fef2f2',
      border: '#dc2626',
      badgeColor: '#dc2626',
    };
  }

  if (normalized.includes('online') || normalized.includes('connected')) {
    return {
      icon: <WifiIcon sx={{ color: '#10b981', fontSize: 16 }} />,
      bg: '#ecfdf5',
      border: '#10b981',
      badgeColor: '#10b981',
    };
  }

  if (normalized.includes('ignitionon') || normalized.includes('ignition on')) {
    return {
      icon: <PowerSettingsNewIcon sx={{ color: '#10b981', fontSize: 16 }} />,
      bg: '#ecfdf5',
      border: '#10b981',
      badgeColor: '#10b981',
    };
  }

  if (normalized.includes('ignitionoff') || normalized.includes('ignition off')) {
    return {
      icon: <PowerSettingsNewIcon sx={{ color: '#64748b', fontSize: 16 }} />,
      bg: '#f1f5f9',
      border: '#64748b',
      badgeColor: '#64748b',
    };
  }

  if (normalized.includes('idle')) {
    return {
      icon: <HourglassEmptyIcon sx={{ color: '#d97706', fontSize: 16 }} />,
      bg: '#fffbeb',
      border: '#d97706',
      badgeColor: '#d97706',
    };
  }

  if (normalized.includes('move') || normalized.includes('moving')) {
    return {
      icon: <DirectionsCarIcon sx={{ color: '#059669', fontSize: 16 }} />,
      bg: '#ecfdf5',
      border: '#059669',
      badgeColor: '#059669',
    };
  }

  if (normalized.includes('alarm') || normalized.includes('sos') || normalized.includes('panic')) {
    return {
      icon: <WarningIcon sx={{ color: '#dc2626', fontSize: 16 }} />,
      bg: '#fef2f2',
      border: '#dc2626',
      badgeColor: '#dc2626',
    };
  }

  return {
    icon: <NotificationsActiveIcon sx={{ color: PRIMARY, fontSize: 16 }} />,
    bg: '#e6f7f4',
    border: PRIMARY,
    badgeColor: PRIMARY,
  };
};

export const closeEventMapPopup = () => {
  if (eventHistoricalMarker) {
    try {
      eventHistoricalMarker.closePopup();
    } catch (e) {}

    try {
      eventHistoricalMarker.remove();
    } catch (e) {}

    eventHistoricalMarker = null;
  }
};

const getEventCoordinates = (event) => {
  if (!event) return null;

  const candidates = [
    { latitude: event.latitude, longitude: event.longitude },
    { latitude: event.attributes?.latitude, longitude: event.attributes?.longitude },
    { latitude: event.position?.latitude, longitude: event.position?.longitude },
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCoordinates(candidate.latitude, candidate.longitude);
    if (normalized) return normalized;
  }

  return null;
};

export const showEventMapPopup = async (event, device, geofenceMap = new Map()) => {
  if (!map || !event) return;

  let coordinates = getEventCoordinates(event);
  let address = event.address || event.attributes?.address || '';
  let speed = getEventSpeed(event);

  let altitude = toNumber(event.altitude ?? event.attributes?.altitude);
  altitude = altitude === null ? 0 : Math.round(altitude);

  if (!coordinates && event.positionId) {
    try {
      const res = await fetch(`/api/positions?id=${encodeURIComponent(event.positionId)}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const positions = await res.json();
        if (Array.isArray(positions) && positions.length > 0) {
          const position = positions[0];
          coordinates = normalizeCoordinates(position.latitude, position.longitude);

          if (!address) address = position.address || '';
          if (speed === 0 && position.speed !== undefined) speed = knotsToKph(position.speed);
          if (altitude === 0 && position.altitude !== undefined) {
            altitude = Math.round(toNumber(position.altitude, 0));
          }
        }
      }
    } catch (error) {
      console.warn('Unable to load event position:', error);
    }
  }

  if (!coordinates) return;

  const lat = coordinates.latitude;
  const lng = coordinates.longitude;
  const deviceName = device?.name || `Unit #${event.deviceId}`;
  const resolvedAddress = address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const time = formatTimestamp(
    event.eventTime || event.serverTime || event.createdAt || Date.now()
  );

  const theme = getEventTheme(event.type, event.attributes?.ruleName);
  const alertTitle = getEventTitle(event, geofenceMap);

  closeEventMapPopup();

  const alertPinIcon = L.divIcon({
    className: 'alert-historical-marker-pin',
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:${theme.border}35;animation:alertPulse 1.8s infinite ease-out;"></div>
        <div style="position:relative;width:20px;height:20px;border-radius:50%;background:${theme.border};border:2.5px solid #ffffff;box-shadow:0 2px 7px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -17],
  });

  const safeDeviceName = escapeHtml(deviceName);
  const safeAlertTitle = escapeHtml(alertTitle);
  const safeAddress = escapeHtml(resolvedAddress);
  const safeTime = escapeHtml(time);
  const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${lat},${lng}`)}`;

  const popupHtml = `
    <div style="font-family:'Inter',sans-serif;font-size:12px;color:#1e293b;width:290px;min-width:290px;box-sizing:border-box;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 10px 25px rgba(15,23,42,0.18);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#ffffff;border-bottom:1px solid #f1f5f9;box-sizing:border-box;width:100%;">
        <div style="display:flex;align-items:center;gap:7px;min-width:0;flex:1;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="${PRIMARY}" style="transform:rotate(45deg);flex-shrink:0;">
            <path d="M12 2L21 21L12 17L3 21L12 2Z"/>
          </svg>
          <span style="font-weight:700;font-size:12.5px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;">
            ${safeDeviceName}
          </span>
        </div>
        <button onclick="window.dispatchEvent(new CustomEvent('close-alert-event-popup'))" style="background:#f1f5f9;border:none;cursor:pointer;width:22px;height:22px;min-width:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px;font-weight:bold;line-height:1;padding:0;margin-left:8px;flex-shrink:0;">
          ✕
        </button>
      </div>

      <div style="padding:7px 12px;background:${theme.bg};border-bottom:1px solid ${theme.border}25;display:flex;align-items:center;gap:7px;box-sizing:border-box;width:100%;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${theme.border};flex-shrink:0;"></span>
        <span style="font-size:11.5px;font-weight:700;color:${theme.badgeColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${safeAlertTitle}
        </span>
      </div>

      <div style="padding:10px 12px;box-sizing:border-box;width:100%;">
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;">
          <tbody>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="width:75px;padding:4px 0;color:#64748b;font-weight:600;vertical-align:top;white-space:nowrap;">Address</td>
              <td style="padding:4px 0 4px 8px;color:#1e293b;font-weight:500;text-align:right;vertical-align:top;overflow-wrap:anywhere;line-height:1.35;">${safeAddress}</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="width:75px;padding:4px 0;color:#64748b;font-weight:600;vertical-align:middle;white-space:nowrap;">Preview</td>
              <td style="padding:4px 0 4px 8px;text-align:right;vertical-align:middle;">
                <a href="${googleMapsUrl}" target="_blank" rel="noreferrer" style="color:#00ab8e;font-weight:600;text-decoration:none;">Preview &gt;&gt;</a>
              </td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:4px 0;color:#64748b;font-weight:600;">Latitude</td>
              <td style="padding:4px 0 4px 8px;color:#1e293b;font-weight:600;font-family:monospace;text-align:right;">${lat.toFixed(6)}°</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:4px 0;color:#64748b;font-weight:600;">Longitude</td>
              <td style="padding:4px 0 4px 8px;color:#1e293b;font-weight:600;font-family:monospace;text-align:right;">${lng.toFixed(6)}°</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:4px 0;color:#64748b;font-weight:600;">Altitude</td>
              <td style="padding:4px 0 4px 8px;color:#1e293b;font-weight:600;text-align:right;">${altitude} m</td>
            </tr>
            <tr style="border-bottom:1px solid #f8fafc;">
              <td style="padding:4px 0;color:#64748b;font-weight:600;">Speed</td>
              <td style="padding:4px 0 4px 8px;color:${theme.badgeColor};font-weight:700;text-align:right;">${speed} kph</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-weight:600;">Time</td>
              <td style="padding:4px 0 4px 8px;color:#475569;font-weight:500;font-family:monospace;font-size:11.5px;text-align:right;">${safeTime}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  map.flyTo([lat, lng], 17, { animate: true, duration: 0.65 });

  eventHistoricalMarker = L.marker([lat, lng], {
    icon: alertPinIcon,
    zIndexOffset: 1000,
  }).addTo(map);

  const popup = L.popup({
    className: 'clean-event-leaflet-popup',
    minWidth: 290,
    maxWidth: 320,
    offset: [0, -10],
    closeButton: false,
    autoPan: true,
    autoClose: false,
    closeOnClick: false,
    closeOnEscapeKey: false,
  })
    .setLatLng([lat, lng])
    .setContent(popupHtml);

  eventHistoricalMarker.bindPopup(popup).openPopup();
};

const ActivityView = ({
  events = [],
  devices = [],
  geofences = [],
  searchQuery = '',
  onDeleteEvent,
}) => {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuEvent, setMenuEvent] = useState(null);

  const deviceMap = useMemo(
    () => new Map(devices.map((device) => [device.id, device])),
    [devices]
  );

  const geofenceMap = useMemo(
    () => new Map((geofences || []).map((g) => [g.id, g])),
    [geofences]
  );

  const filteredEvents = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();

    return events.filter((event) => {
      const device = deviceMap.get(event.deviceId);
      const deviceName = (device?.name || '').toLowerCase();
      const title = getEventTitle(event, geofenceMap).toLowerCase();
      const type = (event.attributes?.ruleName || event.type || '').toLowerCase();

      return !q || deviceName.includes(q) || type.includes(q) || title.includes(q);
    });
  }, [events, searchQuery, deviceMap, geofenceMap]);

  useEffect(() => {
    const handleClosePopup = () => {
      closeEventMapPopup();
    };

    window.addEventListener('close-alert-event-popup', handleClosePopup);
    return () => {
      window.removeEventListener('close-alert-event-popup', handleClosePopup);
      closeEventMapPopup();
    };
  }, []);

  const handleAlertClick = async (event) => {
    setSelectedEventId(event.id);
    const device = deviceMap.get(event.deviceId);
    await showEventMapPopup(event, device, geofenceMap);
  };

  if (!filteredEvents || filteredEvents.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          px: 2,
          textAlign: 'center',
          color: TEXT_MUTED,
          width: '100%',
          fontFamily: FONT_FAMILY,
          boxSizing: 'border-box',
        }}
      >
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#334155',
            mb: 0.5,
            fontFamily: FONT_FAMILY,
          }}
        >
          No incoming object activity
        </Typography>

        <Typography
          sx={{
            fontSize: '11.5px',
            color: TEXT_MUTED,
            fontFamily: FONT_FAMILY,
          }}
        >
          Live unit alerts and trigger activities will appear here as they occur.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        flex: '1 1 auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: SURFACE,
        padding: '4px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
        fontFamily: FONT_FAMILY,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
      }}
    >
      {filteredEvents.map((event, index) => {
        const device = deviceMap.get(event.deviceId);
        const deviceName = device?.name || `Unit #${event.deviceId}`;
        const theme = getEventTheme(event.type, event.attributes?.ruleName);
        const currentSpeed = getEventSpeed(event);
        const title = getEventTitle(event, geofenceMap);
        const isSelected = selectedEventId === event.id;
        const eventTime = event.eventTime || event.serverTime || event.createdAt;

        return (
          <React.Fragment key={event.id}>
            <Box
              onClick={() => handleAlertClick(event)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                minHeight: 48,
                borderRadius: '8px',
                backgroundColor: isSelected ? PRIMARY_LIGHT : SURFACE,
                border: isSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                borderLeft: `3.5px solid ${theme.border} !important`,
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
                margin: '2px 0',
                '&:hover': {
                  backgroundColor: isSelected ? PRIMARY_LIGHT : SURFACE_SOFT,
                  borderColor: isSelected ? PRIMARY : '#94a3b8',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: 0,
                  flex: 1,
                  paddingRight: '6px',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: theme.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${theme.border}25`,
                  }}
                >
                  {theme.icon}
                </Box>

                <Box
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontFamily: `${FONT_FAMILY} !important`,
                      fontSize: '12.5px',
                      fontWeight: '700 !important',
                      color: '#0f172a !important',
                      lineHeight: '1.25 !important',
                      letterSpacing: '-0.02em',
                    }}
                    title={title}
                  >
                    {title}
                  </Typography>

                  <Typography
                    noWrap
                    sx={{
                      fontFamily: `${FONT_FAMILY} !important`,
                      fontSize: '12px',
                      fontWeight: '600 !important',
                      color: `${PRIMARY_DARK} !important`,
                      lineHeight: '1.25 !important',
                      marginTop: '2px',
                    }}
                    title={deviceName}
                  >
                    {deviceName}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      marginTop: '2px',
                      minWidth: 0,
                    }}
                  >
                    {currentSpeed > 0 && (
                      <Typography
                        sx={{
                          fontFamily: `${FONT_FAMILY} !important`,
                          fontSize: '11px !important',
                          fontWeight: '700 !important',
                          color: `${theme.badgeColor} !important`,
                          whiteSpace: 'nowrap',
                          lineHeight: 1,
                        }}
                      >
                        {currentSpeed} kph
                      </Typography>
                    )}

                    <Typography
                      noWrap
                      sx={{
                        fontFamily: `${FONT_FAMILY} !important`,
                        fontSize: '11px !important',
                        fontWeight: '500 !important',
                        color: `${TEXT_MUTED} !important`,
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {formatTimestamp(eventTime)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuEvent(event);
                  setMenuAnchor(e.currentTarget);
                }}
                sx={{
                  color: TEXT_MUTED,
                  padding: '4px',
                  borderRadius: '6px',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                  },
                }}
              >
                <MoreVertIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Box>

            {index < filteredEvents.length - 1 && (
              <Divider sx={{ borderColor: '#f1f5f9', my: 0.2 }} />
            )}
          </React.Fragment>
        );
      })}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuEvent(null);
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '8px',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 8px 20px rgba(15,23,42,0.12)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (onDeleteEvent && menuEvent) {
              onDeleteEvent(menuEvent.id);
            }
            setMenuAnchor(null);
            setMenuEvent(null);
          }}
          sx={{
            fontSize: '12px',
            color: '#dc2626',
            gap: 1,
            py: 0.6,
            px: 1.4,
            fontFamily: FONT_FAMILY,
            fontWeight: 600,
          }}
        >
          <DeleteOutlinedIcon sx={{ fontSize: 16, color: '#dc2626' }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default memo(ActivityView);