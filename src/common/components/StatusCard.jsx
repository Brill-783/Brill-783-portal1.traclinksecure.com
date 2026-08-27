import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import ReactDOM from 'react-dom';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Checkbox,
  Button,
  Box,
  Snackbar,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import CloseIcon from '@mui/icons-material/Close';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AirportShuttleOutlinedIcon from '@mui/icons-material/AirportShuttleOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import DirectionsBoatOutlinedIcon from '@mui/icons-material/DirectionsBoatOutlined';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import NavigationIcon from '@mui/icons-material/Navigation';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { sessionActions } from '../../store';
import { getNetworkName } from '../../networks/mobileNetworks';

const ROBOTO_FONT =
  "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

export const STATUS_COLORS = {
  moving: '#15803D',       // 🟢 Deep Green
  parked: '#1D4ED8',       // 🔵 Deep Blue
  offline: '#dc2626',      // 🔴 Deep Red
  notConnected: '#dc2626', // 🔴 Deep Red
  expired: '#991B1B',
  unknown: '#64748B',
};

export const STATUS_LABELS = {
  moving: 'MOVING',
  parked: 'PARKED',
  offline: 'OFFLINE',
  notConnected: 'NOT CONNECTED',
  expired: 'EXPIRED',
  unknown: 'UNKNOWN',
};

export const DEFAULT_ENABLED_CARDS = [
  'identity',
  'location_detail',
  'sensors',
  'gps',
  'driver',
  'maintenance',
];

export const ALL_CARDS = [
  { id: 'identity', label: 'Identity & Address' },
  { id: 'location_detail', label: 'Location' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'gps', label: 'Network' },
  { id: 'driver', label: 'Driver Information' },
  { id: 'gprs', label: 'GPRS Command' },
  { id: 'security', label: 'Security & Anti-Theft' },
  { id: 'temperature', label: 'Temperature & Thermal' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'summary', label: 'Summary Today' },
  { id: 'power', label: 'Power & Electrical' },
  { id: 'fuel', label: 'Fuel & Consumption' },
];

const COUNTRY_CODE_MAP = {
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
  ZA: 'South Africa',
  BW: 'Botswana',
  NA: 'Namibia',
  MZ: 'Mozambique',
  MW: 'Malawi',
  TZ: 'Tanzania',
  CD: 'DR Congo',
  AO: 'Angola',
  KE: 'Kenya',
  UG: 'Uganda',
  RW: 'Rwanda',
  GB: 'United Kingdom',
  US: 'United States',
  CN: 'China',
  IN: 'India',
  AE: 'United Arab Emirates',
};

const KNOTS_TO_KMH = 1.852;
const OFFLINE_THRESHOLD_MS = 3 * 60 * 60 * 1000;

export const evaluateLiveStatus = (device, position, now = Date.now()) => {
  if (!device) {
    return {
      status: 'notConnected',
      label: STATUS_LABELS.notConnected,
      color: STATUS_COLORS.notConnected,
      dot: STATUS_COLORS.notConnected,
      speedKph: 0,
      isExpired: false,
      isOffline: true,
      lastUpdateTimestamp: 0,
      packetTimestamp: 0,
    };
  }

  const expirationTimestamp = device.expirationTime ? new Date(device.expirationTime).getTime() : null;
  if (expirationTimestamp && !Number.isNaN(expirationTimestamp) && now > expirationTimestamp) {
    return {
      status: 'expired',
      label: STATUS_LABELS.expired,
      color: STATUS_COLORS.expired,
      dot: STATUS_COLORS.expired,
      speedKph: 0,
      isExpired: true,
      isOffline: true,
      lastUpdateTimestamp: 0,
      packetTimestamp: 0,
    };
  }

  const serverUpdateRaw = device.lastUpdate || position?.serverTime || null;
  const lastUpdateTimestamp = serverUpdateRaw ? new Date(serverUpdateRaw).getTime() : 0;

  const packetRaw = position?.fixTime || position?.deviceTime || position?.serverTime || device.lastUpdate || null;
  const packetTimestamp = packetRaw ? new Date(packetRaw).getTime() : 0;

  const hasEverConnected = Boolean(
    lastUpdateTimestamp > 0 || packetTimestamp > 0 || (position && (position.latitude !== 0 || position.longitude !== 0))
  );

  if (!hasEverConnected) {
    return {
      status: 'notConnected',
      label: STATUS_LABELS.notConnected,
      color: STATUS_COLORS.notConnected,
      dot: STATUS_COLORS.notConnected,
      speedKph: 0,
      isExpired: false,
      isOffline: true,
      lastUpdateTimestamp: 0,
      packetTimestamp: 0,
    };
  }

  const effectiveCommunicationTime = lastUpdateTimestamp || packetTimestamp;
  const updateAge = now - effectiveCommunicationTime;
  const isCommunicationOffline = updateAge >= OFFLINE_THRESHOLD_MS || device.status === 'offline';

  const rawSpeedKnots = typeof position?.speed === 'number' && Number.isFinite(position.speed) ? position.speed : 0;
  const speedKph = Math.round(rawSpeedKnots * KNOTS_TO_KMH);

  if (isCommunicationOffline) {
    return {
      status: 'offline',
      label: STATUS_LABELS.offline,
      color: STATUS_COLORS.offline,
      dot: STATUS_COLORS.offline,
      speedKph: 0,
      isExpired: false,
      isOffline: true,
      lastUpdateTimestamp: effectiveCommunicationTime,
      packetTimestamp,
    };
  }

  if (speedKph >= 1) {
    return {
      status: 'moving',
      label: STATUS_LABELS.moving,
      color: STATUS_COLORS.moving,
      dot: STATUS_COLORS.moving,
      speedKph,
      isExpired: false,
      isOffline: false,
      lastUpdateTimestamp: effectiveCommunicationTime,
      packetTimestamp,
    };
  }

  return {
    status: 'parked',
    label: STATUS_LABELS.parked,
    color: STATUS_COLORS.parked,
    dot: STATUS_COLORS.parked,
    speedKph: 0,
    isExpired: false,
    isOffline: false,
    lastUpdateTimestamp: effectiveCommunicationTime,
    packetTimestamp,
  };
};

const DAY_ODO_STORAGE_PREFIX = 'tracklink_dayodo_';

const readDayOdometerAnchor = (deviceId) => {
  if (!deviceId) return { day: null, startOdometerKm: null };
  try {
    const raw = localStorage.getItem(`${DAY_ODO_STORAGE_PREFIX}${deviceId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return { day: null, startOdometerKm: null };
};

const writeDayOdometerAnchor = (deviceId, state) => {
  if (!deviceId) return;
  try {
    localStorage.setItem(`${DAY_ODO_STORAGE_PREFIX}${deviceId}`, JSON.stringify(state));
  } catch (e) {}
};

const getLocalDayKey = (timeStrOrMs) => {
  const d = timeStrOrMs ? new Date(timeStrOrMs) : new Date();
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const getCardinalDirectionFull = (course, isConnected = true) => {
  if (!isConnected || course === undefined || course === null || Number.isNaN(Number(course))) {
    return '-';
  }
  const directions = [
    'North',
    'North-East',
    'East',
    'South-East',
    'South',
    'South-West',
    'West',
    'North-West',
  ];
  const normalized = ((Number(course) % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
};

const getCategoryIcon = (category, name, color = '#00a79d') => {
  const text = `${category || ''} ${name || ''}`.toLowerCase();
  const iconStyle = { fontSize: '1.35rem', color };

  if (text.includes('daf') || text.includes('truck') || text.includes('trailer') || text.includes('logistics')) {
    return <LocalShippingOutlinedIcon sx={iconStyle} />;
  }
  if (text.includes('bus') || text.includes('van') || text.includes('shuttle')) {
    return <AirportShuttleOutlinedIcon sx={iconStyle} />;
  }
  if (text.includes('bike') || text.includes('motorcycle') || text.includes('scooter')) {
    return <TwoWheelerOutlinedIcon sx={iconStyle} />;
  }
  if (text.includes('boat') || text.includes('ship')) {
    return <DirectionsBoatOutlinedIcon sx={iconStyle} />;
  }
  if (text.includes('tractor') || text.includes('agriculture')) {
    return <AgricultureOutlinedIcon sx={iconStyle} />;
  }
  if (text.includes('animal') || text.includes('pet')) {
    return <PetsOutlinedIcon sx={iconStyle} />;
  }

  return <DirectionsCarOutlinedIcon sx={iconStyle} />;
};

const formatTemp = (val) => {
  if (val === undefined || val === null || val > 150 || val < -50) {
    return '- °C';
  }
  return `${Number(val).toFixed(1)} °C`;
};

export const formatDigitalTimer = (ms) => {
  if (!ms || ms <= 0 || !Number.isFinite(ms)) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (v) => String(v).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatTimestamp = (timeStrOrMs) => {
  if (!timeStrOrMs) return '-';
  const date = new Date(timeStrOrMs);
  if (isNaN(date.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(
    date.getMonth() + 1
  )}-${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
};

const StatusPill = memo(({ label, color }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      fontFamily: ROBOTO_FONT,
      color: '#334155',
    }}
  >
    <span
      style={{
        width: '7.5px',
        height: '7.5px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
    {label}
  </span>
));
StatusPill.displayName = 'StatusPill';

const useStyles = makeStyles()((theme, { dynamicPrimary, dynamicButton }) => ({
  rootContainer: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    zIndex: 1,
    pointerEvents: 'none',
    boxSizing: 'border-box',
    fontFamily: `${ROBOTO_FONT} !important`,
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 0,
    margin: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
    WebkitFontSmoothing: 'antialiased',
    '&, & *': {
      fontFamily: `${ROBOTO_FONT} !important`,
      boxSizing: 'border-box',
    },
  },
  portalFab: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    left: 'auto',
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: `1.5px solid ${dynamicPrimary}`,
    boxShadow: `0 4px 16px ${dynamicPrimary}33`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: dynamicPrimary,
    cursor: 'pointer',
    zIndex: 999999,
    pointerEvents: 'all !important',
    touchAction: 'manipulation',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      transform: 'scale(1.04)',
    },
    '&:active': {
      transform: 'scale(0.96)',
    },
  },
  panelPaper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100% !important',
    maxWidth: '100% !important',
    minWidth: '0 !important',
    height: '205px',
    minHeight: '205px',
    maxHeight: '205px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
    borderRadius: '16px',
    overflow: 'hidden',
    padding: '8px',
    margin: '0 !important',
    position: 'relative',
    pointerEvents: 'auto',
    gap: '8px',
    '@media (max-width: 768px)': {
      height: '190px',
      minHeight: '190px',
      maxHeight: '190px',
      padding: '6px',
      gap: '6px',
      borderRadius: '16px',
    },
  },
  collapsedPaper: {
    display: 'none !important',
  },
  cardsScrollWrap: {
    position: 'relative',
    flex: '1 1 auto',
    minWidth: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  cardsScrollArea: {
    display: 'flex',
    alignItems: 'stretch',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
    margin: 0,
    padding: '0 0 2px 0',
    gap: '8px',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    touchAction: 'pan-x pan-y',
    WebkitOverflowScrolling: 'touch',
    '&::-webkit-scrollbar': {
      height: '3.5px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#cbd5e1',
      borderRadius: '4px',
    },
    '@media (max-width: 768px)': {
      scrollSnapType: 'x mandatory',
      gap: '6px',
    },
  },
  cardSection: {
    flex: '0 0 auto',
    width: '345px',
    minWidth: '345px',
    maxWidth: '345px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    border: '1.2px solid #cbd5e1',
    borderRadius: '12px',
    padding: '10px 12px',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    '@media (max-width: 768px)': {
      flex: '0 0 calc(100% - 4px)',
      width: 'calc(100% - 4px)',
      minWidth: 'calc(100% - 4px)',
      maxWidth: 'calc(100% - 4px)',
      scrollSnapAlign: 'start',
      padding: '8px 10px',
    },
  },
  locationDetailCard: {
    width: '490px',
    minWidth: '490px',
    maxWidth: '490px',
    '@media (max-width: 768px)': {
      flex: '0 0 calc(100% - 4px)',
      width: 'calc(100% - 4px)',
      minWidth: 'calc(100% - 4px)',
      maxWidth: 'calc(100% - 4px)',
      scrollSnapAlign: 'start',
    },
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1.2px solid #cbd5e1',
    backgroundColor: 'transparent',
    flexShrink: 0,
    width: '100%',
  },
  unitNameHeader: {
    fontSize: '14px !important',
    fontWeight: '700 !important',
    color: '#0f172a',
    lineHeight: '1.3 !important',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    '& > div:first-of-type': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      minWidth: 0,
      flex: 1,
      gap: '6px',
    },
  },
  navArrowIcon: {
    fontSize: '1.05rem',
    color: dynamicPrimary,
    transform: 'rotate(45deg)',
    flexShrink: 0,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginLeft: '6px',
    flexShrink: 0,
  },
  cardContentScrollable: {
    flex: '1 1 auto',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    padding: 0,
    paddingTop: '2px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: '3px',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  locationContentScrollable: {
    flexGrow: 1,
    maxHeight: '145px',
    paddingTop: '2px',
    paddingRight: '2px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
  },
  rowItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '3px 0',
    fontSize: '12px',
    boxSizing: 'border-box',
    gap: '8px',
    flexShrink: 0,
    borderBottom: '1px solid #cbd5e1',
    '&:last-of-type': {
      borderBottom: 'none',
    },
  },
  addressRowItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '3px 0 5px 0',
    fontSize: '12px',
    boxSizing: 'border-box',
    gap: '8px',
    flexShrink: 0,
    borderBottom: '1px solid #cbd5e1',
  },
  addressIconPill: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    borderRadius: '7px',
    backgroundColor: '#f0fdfa',
    border: `1.2px solid ${dynamicPrimary}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addressCenterText: {
    color: '#334155',
    fontWeight: '500 !important',
    textAlign: 'left',
    flex: '1 1 auto',
    minWidth: 0,
    fontSize: '12px',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
  },
  eyeIconButton: {
    padding: '3px',
    color: dynamicPrimary,
    borderRadius: '5px',
    flexShrink: 0,
    marginLeft: '4px',
    touchAction: 'manipulation',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      filter: 'brightness(0.92)',
    },
  },
  rowLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#475569',
    fontWeight: '600 !important',
    width: '105px',
    minWidth: '105px',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    fontSize: '12px',
    lineHeight: 1.3,
  },
  rowValueRight: {
    color: '#1e293b',
    fontWeight: '500 !important',
    textAlign: 'right',
    flex: '1 1 auto',
    minWidth: 0,
    fontSize: '12px',
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
  },
  locationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    columnGap: '16px',
    rowGap: '4px',
    width: '100%',
    border: 'none',
    minWidth: 0,
    backgroundColor: 'transparent',
    alignContent: 'start',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      rowGap: '3px',
    },
  },
  locationGridItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2.5px 0',
    borderBottom: '1px solid #cbd5e1',
    minWidth: 0,
    gap: '6px',
  },
  gridLabelGroup: {
    color: '#475569',
    fontWeight: '600 !important',
    width: '74px',
    minWidth: '74px',
    flexShrink: 0,
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  gridValue: {
    color: '#1e293b',
    fontWeight: '500 !important',
    textAlign: 'right',
    flex: '1 1 auto',
    minWidth: 0,
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '12px',
  },
  expiredAlertBox: {
    fontSize: '11px',
    fontWeight: '700 !important',
    color: '#991B1B',
    margin: '0 0 4px 0',
    padding: '3px 6px',
    backgroundColor: '#fee2e2',
    borderRadius: '5px',
    border: '1px solid #fecaca',
    textAlign: 'center',
    flexShrink: 0,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  commandButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5px 8px',
    margin: '1px 0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    minHeight: '28px',
    minWidth: 0,
    touchAction: 'manipulation',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: dynamicPrimary,
    },
  },
  commandLabel: {
    fontSize: '12px',
    fontWeight: '600 !important',
    color: '#334155',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  customTextarea: {
    width: '100%',
    minHeight: '46px',
    maxHeight: '46px',
    padding: '5px 7px',
    fontSize: '16px !important',
    fontFamily: `${ROBOTO_FONT} !important`,
    color: '#0f172a !important',
    backgroundColor: '#f8fafc !important',
    border: '1px solid #cbd5e1 !important',
    borderRadius: '6px !important',
    outline: 'none !important',
    resize: 'none !important',
    boxSizing: 'border-box !important',
    pointerEvents: 'auto !important',
    '@media (min-width: 769px)': {
      fontSize: '12px !important',
    },
    '&:focus': {
      borderColor: `${dynamicPrimary} !important`,
      backgroundColor: '#ffffff !important',
    },
  },
  rightActionDock: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 2px',
    height: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    border: '1.2px solid #cbd5e1',
    borderRadius: '10px',
    flex: '0 0 28px',
    width: '28px',
    minWidth: '28px',
    maxWidth: '28px',
    flexShrink: 0,
    boxSizing: 'border-box',
    zIndex: 60,
  },
  topDockActionGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  bottomDockActionGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
  },
  dockIconButton: {
    padding: '2px',
    borderRadius: '5px',
    color: '#64748b',
    minWidth: '22px',
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      color: dynamicPrimary,
    },
  },
  dialogTopPosition: {
    '& .MuiDialog-container': {
      alignItems: 'flex-start',
      paddingTop: '6vh',
    },
    '& .MuiPaper-root': {
      borderRadius: '10px',
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
      border: '1px solid #cbd5e1',
      overflow: 'hidden',
      maxWidth: '380px',
      width: 'calc(100% - 24px)',
      margin: '8px auto',
      fontFamily: `${ROBOTO_FONT} !important`,
      '&, & *': {
        fontFamily: `${ROBOTO_FONT} !important`,
      },
    },
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '6px',
    padding: '4px 0',
    '@media (max-width: 600px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '4px',
    },
  },
  filterTile: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 6px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    overflow: 'hidden',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      borderColor: dynamicPrimary,
    },
  },
  filterTileActive: {
    backgroundColor: '#e6f7f4',
    borderColor: dynamicPrimary,
  },
  toastBannerRoot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    backgroundColor: dynamicPrimary,
    color: '#ffffff',
    borderRadius: '14px',
    padding: '5px 12px',
    boxShadow: `0 4px 14px ${dynamicPrimary}4D`,
    fontFamily: `${ROBOTO_FONT} !important`,
    minWidth: '210px',
    maxWidth: '330px',
    position: 'relative',
    overflow: 'hidden',
  },
}));

const StatusCard = ({ deviceId, position, devicesOpen, onExpandedChange }) => {
  const dispatch = useDispatch();

  const server = useSelector((state) => state.session?.server, shallowEqual) || {};
  const serverAttributes = server?.attributes || {};
  const dynamicPrimary = serverAttributes.colorPrimary || serverAttributes.color || '#00ab8e';
  const dynamicButton = serverAttributes.buttonColor || dynamicPrimary;

  const { classes, cx } = useStyles({ devicesOpen, dynamicPrimary, dynamicButton });

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const isAdminOrSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    return Boolean(
      currentUser.administrator === true ||
      currentUser.admin === true ||
      currentUser.id === 1 ||
      currentUser.userLimit === -1 ||
      currentUser.attributes?.superAdmin === true ||
      currentUser.attributes?.admin === true ||
      currentUser.attributes?.role === 'admin' ||
      currentUser.attributes?.role === 'superadmin'
    );
  }, [currentUser]);

  const device = useSelector((state) => state.devices?.items?.[deviceId], shallowEqual);
  const storePosition = useSelector(
    (state) =>
      state.session?.positions?.[deviceId] || state.positions?.items?.[deviceId],
    shallowEqual
  );
  const rawDriversMap = useSelector((state) => state.drivers?.items || {}, shallowEqual);
  const geofencesMap = useSelector((state) => state.geofences?.items || {}, shallowEqual);
  const maintenancesMap = useSelector((state) => state.maintenances?.items || {}, shallowEqual);

  const driversList = useMemo(() => {
    return Array.isArray(rawDriversMap) ? rawDriversMap : Object.values(rawDriversMap || {});
  }, [rawDriversMap]);

  const [livePosition, setLivePosition] = useState(position || storePosition);
  const [isExpanded, setIsExpanded] = useState(true);

  const [sendingResume, setSendingResume] = useState(false);
  const [sendingStop, setSendingStop] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const [sendSuccess, setSendSuccess] = useState({
    open: false,
    text: 'Command sent successfully',
  });

  const [replyPopup, setReplyPopup] = useState({
    open: false,
    text: '',
    deviceName: '',
  });

  const commandTimeoutRef = useRef(null);
  const lastCheckedResultRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const locationScrollRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [deviceId]);

  useEffect(() => {
    if (locationScrollRef.current) {
      locationScrollRef.current.scrollTop = 0;
    }
  }, [deviceId]);

  useEffect(() => {
    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!livePosition) return;
    const currentResult =
      livePosition?.attributes?.result ||
      livePosition?.attributes?.response ||
      livePosition?.attributes?.commandResult ||
      livePosition?.attributes?.smsReply;

    if (currentResult && currentResult !== lastCheckedResultRef.current) {
      lastCheckedResultRef.current = currentResult;
      setReplyPopup({
        open: true,
        text: String(currentResult),
        deviceName: device?.name || 'Device',
      });
    }
  }, [livePosition, device?.name]);

  const handleCollapse = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setIsExpanded(false);
    if (onExpandedChange) onExpandedChange(false);
  };

  const handleExpand = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setIsExpanded(true);
    if (onExpandedChange) onExpandedChange(true);
  };

  const userAccountSavedCards = useMemo(() => {
    const userPref = currentUser?.attributes?.cardPreferences;
    if (userPref && typeof userPref === 'object') {
      return userPref;
    }
    try {
      const savedLocal = localStorage.getItem(
        `tracklink_user_${currentUser?.id || 'guest'}_card_preferences`
      );
      if (savedLocal) return JSON.parse(savedLocal);
    } catch (e) {}

    const initial = {};
    ALL_CARDS.forEach((c) => {
      initial[c.id] = DEFAULT_ENABLED_CARDS.includes(c.id);
    });
    return initial;
  }, [currentUser]);

  const [visibleCards, setVisibleCards] = useState(userAccountSavedCards);
  const [tempVisibleCards, setTempVisibleCards] = useState(userAccountSavedCards);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    setVisibleCards(userAccountSavedCards);
    setTempVisibleCards(userAccountSavedCards);
  }, [userAccountSavedCards]);

  const handleOpenParametersModal = () => {
    setTempVisibleCards(visibleCards);
    setFilterOpen(true);
  };

  const toggleTempCardVisibility = (cardId) => {
    setTempVisibleCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleSelectAllTempCards = () => {
    const all = {};
    ALL_CARDS.forEach((c) => {
      all[c.id] = true;
    });
    setTempVisibleCards(all);
  };

  const handleDeselectAllTempCards = () => {
    const none = {};
    ALL_CARDS.forEach((c) => {
      none[c.id] = false;
    });
    setTempVisibleCards(none);
  };

  const handleSaveParameters = async () => {
    setSavingPreferences(true);
    setVisibleCards(tempVisibleCards);

    try {
      if (currentUser?.id) {
        localStorage.setItem(
          `tracklink_user_${currentUser.id}_card_preferences`,
          JSON.stringify(tempVisibleCards)
        );

        const updatedUser = {
          ...currentUser,
          attributes: {
            ...currentUser.attributes,
            cardPreferences: tempVisibleCards,
          },
        };

        const response = await fetch(`/api/users/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });

        if (response.ok) {
          const savedData = await response.json();
          dispatch(sessionActions.updateUser(savedData));
        }
      }

      setSendSuccess({
        open: true,
        text: 'Successfully saved',
      });
    } catch (e) {
      console.error('Failed to sync card parameters to user account', e);
    } finally {
      setSavingPreferences(false);
      setFilterOpen(false);
    }
  };

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const current = position || storePosition;
    setLivePosition(current);
  }, [deviceId, position, storePosition]);

  useEffect(() => {
    const current = storePosition || position;
    if (current && current.deviceId === deviceId) {
      setLivePosition((prev) => {
        if (!prev || prev.deviceId !== current.deviceId) {
          return current;
        }
        return {
          ...current,
          address: current.address || prev.address,
          protocol: current.protocol || prev.protocol,
          attributes: {
            ...prev.attributes,
            ...current.attributes,
          },
        };
      });
    }
  }, [deviceId, position, storePosition]);

  const isUnitExpired = useMemo(() => {
    if (!device?.expirationTime) return false;
    const expTime = new Date(device.expirationTime).getTime();
    return !isNaN(expTime) && now > expTime;
  }, [device?.expirationTime, now]);

  const attrs = livePosition?.attributes || {};

  const effectiveDeviceTime =
    livePosition?.fixTime ||
    livePosition?.deviceTime ||
    livePosition?.serverTime ||
    device?.lastUpdate ||
    null;

  const evaluatedStatus = useMemo(
    () => evaluateLiveStatus(device, livePosition, now),
    [device, livePosition, now]
  );

  const speedKph = evaluatedStatus.speedKph;
  const isConnected = !evaluatedStatus.isOffline;

  const vehicleStatus = useMemo(() => {
    return {
      label: evaluatedStatus.label,
      color: evaluatedStatus.color,
      dot: evaluatedStatus.color,
    };
  }, [evaluatedStatus]);

  const durationTracker = useMemo(() => {
    if (!deviceId || isUnitExpired || evaluatedStatus.status === 'notConnected') {
      return {
        label: 'Stop duration',
        color: '#1D4ED8',
        time: '00:00:00',
      };
    }

    const currentStatus = evaluatedStatus.status;
    const packetTimestamp = evaluatedStatus.packetTimestamp || (effectiveDeviceTime ? new Date(effectiveDeviceTime).getTime() : now);
    const elapsedMs = Math.max(0, now - packetTimestamp);
    const timeFormatted = formatDigitalTimer(elapsedMs);

    if (currentStatus === 'offline') {
      return {
        label: 'Inactive duration',
        color: '#B91C1C',
        time: timeFormatted,
      };
    }

    if (currentStatus === 'moving') {
      return {
        label: 'Motion duration',
        color: '#15803D',
        time: timeFormatted,
      };
    }

    return {
      label: 'Stop duration',
      color: '#1D4ED8',
      time: timeFormatted,
    };
  }, [deviceId, effectiveDeviceTime, now, isUnitExpired, evaluatedStatus]);

  const durationMetrics = useMemo(() => {
    const isOnline = isConnected;
    return {
      driveTime: isOnline && evaluatedStatus.status === 'moving' ? durationTracker.time : '00:00:00',
      idleTime: '00:00:00',
      stopTime: isOnline && evaluatedStatus.status === 'parked' ? durationTracker.time : '00:00:00',
    };
  }, [evaluatedStatus.status, durationTracker.time, isConnected]);

  const driverTag = attrs.driverUniqueId || attrs.card || attrs.rfid;
  const assignedDriverId = device?.attributes?.driverId || attrs.driverId;

  const driver = useMemo(() => {
    if (!driversList.length) return null;

    if (assignedDriverId) {
      const match = driversList.find((d) => String(d?.id) === String(assignedDriverId));
      if (match) return match;
    }

    if (driverTag) {
      const match = driversList.find(
        (d) => String(d?.uniqueId) === String(driverTag) || String(d?.attributes?.rfid) === String(driverTag)
      );
      if (match) return match;
    }

    return null;
  }, [driversList, assignedDriverId, driverTag]);

  const driverDisplayName = useMemo(() => {
    if (driver?.name) return driver.name;
    if (driver?.attributes?.fullName) return driver.attributes.fullName;
    if (device?.attributes?.driverName) return device.attributes.driverName;
    return driverTag || '-';
  }, [driver, device?.attributes?.driverName, driverTag]);

  const currentGeofence = useMemo(() => {
    const geofenceIds =
      attrs.geofenceIds ||
      livePosition?.geofenceIds ||
      (attrs.geofenceId ? [attrs.geofenceId] : []) ||
      (livePosition?.geofenceId ? [livePosition.geofenceId] : []);

    const geofenceList = Array.isArray(geofenceIds) ? geofenceIds : [geofenceIds].filter(Boolean);

    if (geofenceList.length > 0) {
      const names = geofenceList
        .map((gId) => {
          const match = geofencesMap[gId] || geofencesMap[String(gId)] || geofencesMap[Number(gId)];
          return match?.name || (typeof gId === 'string' && isNaN(Number(gId)) ? gId : null);
        })
        .filter(Boolean);

      if (names.length > 0) {
        return `Inside (${names.join(', ')})`;
      }
    }

    if (attrs.geofenceName || livePosition?.geofenceName) {
      const name = attrs.geofenceName || livePosition.geofenceName;
      return `Inside (${name})`;
    }

    if (attrs.geofenceStatus) {
      return String(attrs.geofenceStatus);
    }

    if (attrs.geofenceEnter) {
      const match = geofencesMap[attrs.geofenceEnter];
      return `Entered (${match?.name || attrs.geofenceEnter})`;
    }

    if (attrs.geofenceExit) {
      const match = geofencesMap[attrs.geofenceExit];
      return `Exited (${match?.name || attrs.geofenceExit})`;
    }

    return 'Outside (None)';
  }, [attrs.geofenceIds, attrs.geofenceId, attrs.geofenceName, attrs.geofenceStatus, attrs.geofenceEnter, attrs.geofenceExit, livePosition, geofencesMap]);

  const resolvedNetworkName = useMemo(() => {
    let name = getNetworkName(livePosition, device);
    if (name && name !== '-') return name;
    name = getNetworkName(storePosition, device);
    if (name && name !== '-') return name;
    return getNetworkName(position, device);
  }, [livePosition, storePosition, position, device]);

  const rawOdometerKm = useMemo(() => {
    const rawOdo =
      attrs.odometer ?? device?.attributes?.odometer ?? attrs.totalDistance ?? attrs.distance;
    return rawOdo !== undefined && rawOdo !== null ? Number(rawOdo) / 1000 : null;
  }, [attrs.odometer, attrs.totalDistance, attrs.distance, device?.attributes?.odometer]);

  const formattedOdometer = useMemo(() => {
    if (isUnitExpired) return '- km';
    if (rawOdometerKm === null) return '- km';
    return `${rawOdometerKm.toFixed(2)} Km`;
  }, [rawOdometerKm, isUnitExpired]);

  const formattedTotalDistance = useMemo(() => {
    if (!livePosition || isUnitExpired) return '0.00 Km';

    const dailyDistanceRaw = attrs.todayDistance ?? attrs.dayDistance ?? attrs.tripOdometer;
    if (dailyDistanceRaw !== undefined && dailyDistanceRaw !== null) {
      const km = Number(dailyDistanceRaw) / 1000;
      return `${km.toFixed(2)} Km`;
    }

    if (rawOdometerKm === null) return '0.00 Km';

    const todayKey = getLocalDayKey(effectiveDeviceTime);
    const anchor = readDayOdometerAnchor(deviceId);

    if (anchor.day !== todayKey || anchor.startOdometerKm == null) {
      anchor.day = todayKey;
      anchor.startOdometerKm = rawOdometerKm;
      writeDayOdometerAnchor(deviceId, anchor);
    }

    const deltaKm = Math.max(0, rawOdometerKm - anchor.startOdometerKm);
    return `${deltaKm.toFixed(2)} Km`;
  }, [
    livePosition,
    isUnitExpired,
    attrs.todayDistance,
    attrs.dayDistance,
    attrs.tripOdometer,
    rawOdometerKm,
    effectiveDeviceTime,
    deviceId,
  ]);

  const assignedMaintenanceItems = useMemo(() => {
    const list = Array.isArray(maintenancesMap) ? maintenancesMap : Object.values(maintenancesMap || {});
    const matchingRules = list.filter((m) => {
      if (!m) return false;
      const attachedDevIds = m.attributes?.deviceIds || [];
      return attachedDevIds.length === 0 || attachedDevIds.map(String).includes(String(deviceId));
    });

    const curOdoMeters = rawOdometerKm !== null ? rawOdometerKm * 1000 : Number(attrs.totalDistance || 0);
    const curEngineHoursMs = Number(attrs.hours || 0);

    return matchingRules.map((rule) => {
      const name = rule.name || 'Maintenance';
      const type = rule.type;
      const start = Number(rule.start || 0);
      const period = Number(rule.period || 0);

      let statusText = 'Valid';

      if (type === 'serviceDate' || String(type).endsWith('Time')) {
        if (period > 0) {
          const expiryMs = start + period;
          const diffDays = Math.ceil((expiryMs - now) / (1000 * 60 * 60 * 24));
          if (diffDays <= 0) {
            statusText = 'Expired';
          } else if (diffDays <= 30) {
            statusText = `Due ${diffDays}d`;
          } else {
            statusText = `${diffDays}d left`;
          }
        }
      } else if (type === 'totalDistance') {
        if (period > 0) {
          const delta = curOdoMeters - start;
          const remainingMeters = period - (delta % period);
          const remKm = Math.round(remainingMeters / 1000);
          if (remKm <= 0) {
            statusText = 'Overdue';
          } else if (remKm <= 500) {
            statusText = `Due ${remKm}km`;
          } else {
            statusText = `In ${remKm}km`;
          }
        }
      } else if (type === 'hours') {
        if (period > 0) {
          const delta = curEngineHoursMs - start;
          const remainingMs = period - (delta % period);
          const remHours = Math.round(remainingMs / 3600000);
          if (remHours <= 0) {
            statusText = 'Overdue';
          } else if (remHours <= 25) {
            statusText = `Due ${remHours}h`;
          } else {
            statusText = `In ${remHours}h`;
          }
        }
      }

      return {
        id: rule.id,
        name,
        statusText,
      };
    });
  }, [maintenancesMap, deviceId, rawOdometerKm, attrs.totalDistance, attrs.hours, now]);

  const locationBreakdown = useMemo(() => {
    const rawAddress = livePosition?.address || '';
    const parts = rawAddress ? rawAddress.split(',').map((p) => p.trim()).filter(Boolean) : [];

    const rawCountry =
      attrs.country ||
      attrs.countryName ||
      (parts.length > 0 ? parts[parts.length - 1] : '-');

    const countryClean = (rawCountry || '').trim();
    const resolvedCountry =
      COUNTRY_CODE_MAP[countryClean.toUpperCase()] || countryClean || '-';

    const rawProvince =
      attrs.province ||
      attrs.state ||
      (parts.length > 2 ? parts[parts.length - 2] : parts.length === 2 ? parts[0] : '-');

    const provinceCandidate = (rawProvince || '').trim();
    const resolvedProvince =
      provinceCandidate.length <= 3 && COUNTRY_CODE_MAP[provinceCandidate.toUpperCase()]
        ? (parts.length > 3 ? parts[parts.length - 3] : '-')
        : (provinceCandidate || '-');

    const rawCity =
      attrs.city ||
      attrs.town ||
      attrs.village ||
      attrs.municipality ||
      (parts.length >= 3 ? parts[1] : parts.length === 2 ? parts[0] : '-');

    const cityCandidate = (rawCity || '').trim();
    const resolvedCity =
      cityCandidate.length <= 3 && COUNTRY_CODE_MAP[cityCandidate.toUpperCase()]
        ? (parts[0] || '-')
        : (cityCandidate || '-');

    const rawRoad =
      attrs.road ||
      attrs.street ||
      attrs.streetName ||
      (parts.length > 0 ? parts[0] : '-');

    const explicitArea =
      attrs.suburb ||
      attrs.neighbourhood ||
      attrs.neighborhood ||
      attrs.residential ||
      attrs.quarter ||
      attrs.hamlet ||
      attrs.area ||
      attrs.houseNumber;

    let resolvedArea = '-';

    if (explicitArea) {
      resolvedArea = explicitArea;
    } else {
      for (let i = 0; i < parts.length; i += 1) {
        const candidate = parts[i];
        if (
          candidate !== rawRoad &&
          candidate !== resolvedCity &&
          candidate !== resolvedProvince &&
          candidate !== resolvedCountry
        ) {
          resolvedArea = candidate;
          break;
        }
      }
    }

    const rawCourse = livePosition?.course ?? attrs.course;
    const resolvedDirection = getCardinalDirectionFull(rawCourse, isConnected);

    const lat = livePosition?.latitude ?? position?.latitude;
    const lng = livePosition?.longitude ?? position?.longitude;
    const resolvedCoordinates =
      isConnected && typeof lat === 'number' && typeof lng === 'number'
        ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        : '-';

    return {
      road: rawRoad || '-',
      city: resolvedCity || '-',
      area: resolvedArea || '-',
      province: resolvedProvince || '-',
      country: resolvedCountry || '-',
      coordinates: resolvedCoordinates,
      direction: resolvedDirection,
      fullAddress: rawAddress,
    };
  }, [livePosition, attrs, position, isConnected]);

  const handleSendCommand = async (commandType) => {
    if (isUnitExpired || !isAdminOrSuperAdmin) return;

    if (commandType === 'engineResume') setSendingResume(true);
    if (commandType === 'engineStop') setSendingStop(true);

    try {
      await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          type: commandType === 'engineStop' ? 'engineStop' : 'engineResume',
        }),
      });
      setSendSuccess({
        open: true,
        text: 'Command sent successfully',
      });
    } catch (e) {
      console.error('Failed to execute command', e);
    } finally {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = setTimeout(() => {
        setSendingResume(false);
        setSendingStop(false);
      }, 1200);
    }
  };

  const handleSendMessage = async () => {
    if (isUnitExpired || !isAdminOrSuperAdmin || !smsText.trim()) return;
    setSendingMessage(true);

    try {
      const res = await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          type: 'custom',
          attributes: {
            data: smsText.trim(),
          },
        }),
      });

      if (res.ok) {
        setSmsText('');
        setMessageOpen(false);
        setSendSuccess({
          open: true,
          text: 'Message sent successfully',
        });
      }
    } catch (e) {
      console.error('Failed to send SMS command', e);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleOpenGoogleMaps = (lat, lng) => {
    if (isUnitExpired) return;
    const targetLat = lat || livePosition?.latitude;
    const targetLng = lng || livePosition?.longitude;

    if (targetLat && targetLng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const activeTempCardCount = useMemo(
    () =>
      ALL_CARDS.filter(
        (c) => tempVisibleCards[c.id] && (c.id !== 'gprs' || isAdminOrSuperAdmin)
      ).length,
    [tempVisibleCards, isAdminOrSuperAdmin]
  );

  if (!device) return null;

  return (
    <>
      {!isExpanded &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <Tooltip title="Expand status cards" placement="top" arrow>
            <button
              type="button"
              className={classes.portalFab}
              onClick={handleExpand}
              aria-label="Expand status cards"
            >
              <DirectionsCarIcon sx={{ fontSize: '1.25rem' }} />
            </button>
          </Tooltip>,
          document.body
        )}

      <Snackbar
        open={sendSuccess.open}
        autoHideDuration={4000}
        onClose={() => setSendSuccess((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 999999, top: '14px !important', right: '14px !important' }}
      >
        <div className={classes.toastBannerRoot}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon sx={{ color: '#ffffff', fontSize: '1.05rem' }} />
            <Typography sx={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}>
              {sendSuccess.text}
            </Typography>
          </div>
          <IconButton
            size="small"
            onClick={() => setSendSuccess((prev) => ({ ...prev, open: false }))}
            sx={{ color: '#ffffff', p: 0.2 }}
          >
            <CloseIcon sx={{ fontSize: '0.85rem' }} />
          </IconButton>
        </div>
      </Snackbar>

      <Snackbar
        open={replyPopup.open}
        autoHideDuration={9000}
        onClose={() => setReplyPopup((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 999999, top: '14px !important', right: '14px !important' }}
      >
        <div
          className={classes.toastBannerRoot}
          style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            borderRadius: '8px',
            padding: '8px 10px',
            backgroundColor: dynamicPrimary,
            maxWidth: '340px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckIcon sx={{ color: '#ffffff', fontSize: '1.0rem' }} />
              <Typography sx={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}>
                {replyPopup.deviceName} Reply
              </Typography>
            </div>
            <IconButton
              size="small"
              onClick={() => setReplyPopup((prev) => ({ ...prev, open: false }))}
              sx={{ color: '#ffffff', p: 0.2 }}
            >
              <CloseIcon sx={{ fontSize: '0.85rem' }} />
            </IconButton>
          </div>
          <Typography
            sx={{
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 500,
              lineHeight: 1.35,
              wordBreak: 'break-word',
              backgroundColor: 'rgba(0, 0, 0, 0.20)',
              padding: '6px 8px',
              borderRadius: '4px',
            }}
          >
            {replyPopup.text}
          </Typography>
        </div>
      </Snackbar>

      <div
        className={classes.rootContainer}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`${classes.panelPaper} ${
            !isExpanded ? classes.collapsedPaper : ''
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className={classes.cardsScrollWrap}>
            <div className={classes.cardsScrollArea} ref={scrollAreaRef}>
              {visibleCards.identity && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <div className={classes.unitNameHeader}>
                      <div>
                        <NavigationIcon className={classes.navArrowIcon} />
                        <span>{device.name}</span>
                      </div>
                      <span
                        className={classes.statusDot}
                        style={{
                          backgroundColor: vehicleStatus.dot,
                        }}
                      />
                    </div>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    {isUnitExpired && (
                      <div className={classes.expiredAlertBox}>
                        <span>Unit Expired</span>
                      </div>
                    )}

                    <div className={classes.addressRowItem}>
                      <div className={classes.addressIconPill}>
                        {getCategoryIcon(device.category, device.name, dynamicPrimary)}
                      </div>
                      <span
                        className={classes.addressCenterText}
                        title={livePosition?.address || ''}
                      >
                        {isUnitExpired
                          ? 'Unit Expired'
                          : livePosition?.address || 'Updating location...'}
                      </span>
                      <Tooltip title="View in Google Maps" arrow placement="top">
                        <IconButton
                          size="small"
                          className={classes.eyeIconButton}
                          onClick={() => handleOpenGoogleMaps()}
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>
                        Time
                      </span>
                      <span className={classes.rowValueRight}>
                        {isUnitExpired
                          ? 'Unit Expired'
                          : !evaluatedStatus.packetTimestamp
                          ? 'Not yet connected'
                          : formatTimestamp(evaluatedStatus.packetTimestamp)}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>
                        {durationTracker.label}
                      </span>
                      <span className={classes.rowValueRight}>
                        {durationTracker.time}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>
                        Driver
                      </span>
                      <span className={classes.rowValueRight} title={driverDisplayName}>
                        {driverDisplayName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.sensors && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>
                      <WifiTetheringIcon sx={{ color: dynamicPrimary, fontSize: '1.05rem' }} />
                      Sensors
                    </span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>
                        Speed
                      </span>
                      <span className={classes.rowValueRight}>
                        {isUnitExpired ? '0 km/h' : `${speedKph} km/h`}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>
                        Distance
                      </span>
                      <span className={classes.rowValueRight}>
                        {formattedTotalDistance}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>
                        Odometer
                      </span>
                      <span className={classes.rowValueRight}>
                        {formattedOdometer}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>
                        Status
                      </span>
                      <span className={classes.rowValueRight}>
                        <StatusPill
                          label={vehicleStatus.label}
                          color={vehicleStatus.color}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.location_detail && (
                <div className={`${classes.cardSection} ${classes.locationDetailCard}`}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>
                      <PlaceOutlinedIcon sx={{ color: dynamicPrimary, fontSize: '1.05rem' }} />
                      Location
                    </span>
                  </div>

                  <div
                    className={cx(classes.cardContentScrollable, classes.locationContentScrollable)}
                    ref={locationScrollRef}
                  >
                    <div className={classes.locationGrid}>
                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>City</span>
                        <span className={classes.gridValue} title={locationBreakdown.city}>{locationBreakdown.city}</span>
                      </div>
                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>Country</span>
                        <span className={classes.gridValue} title={locationBreakdown.country}>{locationBreakdown.country}</span>
                      </div>

                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>Road</span>
                        <span className={classes.gridValue} title={locationBreakdown.road}>{locationBreakdown.road}</span>
                      </div>
                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>Area</span>
                        <span className={classes.gridValue} title={locationBreakdown.area}>{locationBreakdown.area}</span>
                      </div>

                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>Coords</span>
                        <span className={classes.gridValue} title={locationBreakdown.coordinates}>{locationBreakdown.coordinates}</span>
                      </div>
                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>Province</span>
                        <span className={classes.gridValue} title={locationBreakdown.province}>{locationBreakdown.province}</span>
                      </div>

                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>Direction</span>
                        <span className={classes.gridValue} title={locationBreakdown.direction}>{locationBreakdown.direction}</span>
                      </div>
                      <div className={classes.locationGridItem}>
                        <span className={classes.gridLabelGroup}>Address</span>
                        <span
                          className={classes.gridValue}
                          title={locationBreakdown.fullAddress || '-'}
                        >
                          {locationBreakdown.fullAddress || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.driver && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>
                      <PersonOutlinedIcon sx={{ color: dynamicPrimary, fontSize: '1.05rem' }} />
                      Driver
                    </span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Name</span>
                      <span className={classes.rowValueRight} title={driverDisplayName}>{driverDisplayName}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>RFID / Tag</span>
                      <span className={classes.rowValueRight} title={driver?.attributes?.rfid || driver?.uniqueId || driverTag || '-'}>
                        {driver?.attributes?.rfid || driver?.uniqueId || driverTag || '-'}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Phone</span>
                      <span className={classes.rowValueRight} title={driver?.attributes?.phone || '-'}>
                        {driver?.attributes?.phone || '-'}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Email</span>
                      <span className={classes.rowValueRight} title={driver?.attributes?.email || '-'}>
                        {driver?.attributes?.email || '-'}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>License</span>
                      <span className={classes.rowValueRight} title={driver?.attributes?.licenseNumber || '-'}>
                        {driver?.attributes?.licenseNumber || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.gps && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>
                      Network
                    </span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Network</span>
                      <span className={classes.rowValueRight} title={resolvedNetworkName}>{resolvedNetworkName}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Satellites</span>
                      <span className={classes.rowValueRight}>{attrs.sat ?? attrs.satVisible ?? '-'}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>GSM Signal</span>
                      <span className={classes.rowValueRight}>
                        {attrs.rssi !== undefined ? `${Math.round((attrs.rssi / 31) * 100)}%` : '-'}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Connection</span>
                      <span className={classes.rowValueRight}>
                        {isUnitExpired ? 'Expired' : isConnected ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.gprs && isAdminOrSuperAdmin && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>
                      <ElectricalServicesIcon sx={{ color: dynamicPrimary, fontSize: '1.05rem' }} />
                      GPRS Command
                    </span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    {!messageOpen ? (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
                        <div className={classes.commandButton} onClick={() => handleSendCommand('engineResume')}>
                          <span className={classes.commandLabel}>
                            <PowerSettingsNewIcon sx={{ fontSize: '0.8rem', color: '#16a34a' }} />
                            Engine Resume
                          </span>
                          {sendingResume ? (
                            <CircularProgress size={11} sx={{ color: dynamicPrimary }} />
                          ) : (
                            <ChevronRightIcon sx={{ color: dynamicPrimary, fontSize: '0.95rem' }} />
                          )}
                        </div>

                        <div className={classes.commandButton} onClick={() => handleSendCommand('engineStop')}>
                          <span className={classes.commandLabel}>
                            <PowerSettingsNewIcon sx={{ fontSize: '0.8rem', color: '#dc2626' }} />
                            Engine Stop
                          </span>
                          {sendingStop ? (
                            <CircularProgress size={11} sx={{ color: '#dc2626' }} />
                          ) : (
                            <ChevronRightIcon sx={{ color: '#dc2626', fontSize: '0.95rem' }} />
                          )}
                        </div>

                        <div className={classes.commandButton} onClick={() => setMessageOpen(true)}>
                          <span className={classes.commandLabel}>
                            <MessageOutlinedIcon sx={{ fontSize: '0.8rem', color: dynamicPrimary }} />
                            Send Message
                          </span>
                          <ChevronRightIcon sx={{ color: dynamicPrimary, fontSize: '0.95rem' }} />
                        </div>
                      </Box>
                    ) : (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '3px' }}>
                        <textarea
                          className={classes.customTextarea}
                          rows={2}
                          placeholder="Type command / SMS message..."
                          value={smsText}
                          onChange={(e) => setSmsText(e.target.value)}
                          autoFocus
                        />
                        <Box sx={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button
                            size="small"
                            onClick={() => {
                              setMessageOpen(false);
                              setSmsText('');
                            }}
                            sx={{ fontSize: '11.5px', textTransform: 'none', py: '2px', px: '5px', color: '#64748b' }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={sendingMessage || !smsText.trim()}
                            onClick={handleSendMessage}
                            startIcon={sendingMessage ? <CircularProgress size={10} color="inherit" /> : <SendIcon sx={{ fontSize: '0.75rem' }} />}
                            sx={{
                              backgroundColor: `${dynamicButton} !important`,
                              color: '#ffffff !important',
                              fontSize: '11.5px',
                              textTransform: 'none',
                              py: '2px',
                              px: '7px',
                              borderRadius: '4px',
                              boxShadow: 'none',
                              '&:hover': { filter: 'brightness(0.92)', boxShadow: 'none' },
                            }}
                          >
                            Send
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </div>
                </div>
              )}

              {visibleCards.security && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>Security</span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Geofence</span>
                      <span className={classes.rowValueRight} title={currentGeofence}>
                        {currentGeofence}
                      </span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Doors</span>
                      <span className={classes.rowValueRight}>{attrs.door !== undefined ? (attrs.door ? 'Open' : 'Closed') : '-'}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Immobilizer</span>
                      <span className={classes.rowValueRight}>
                        <StatusPill
                          label={attrs.blocked !== undefined ? (attrs.blocked ? 'Cut' : 'Active') : 'Active'}
                          color={attrs.blocked ? '#B91C1C' : '#15803D'}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.temperature && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>Temperature</span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Coolant</span>
                      <span className={classes.rowValueRight}>{formatTemp(attrs.coolantTemp)}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Device</span>
                      <span className={classes.rowValueRight}>{formatTemp(attrs.deviceTemp)}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Cargo 1</span>
                      <span className={classes.rowValueRight}>{formatTemp(attrs.temp1)}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Cargo 2</span>
                      <span className={classes.rowValueRight}>{formatTemp(attrs.temp2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Card */}
              {visibleCards.maintenance && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>Maintenance</span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Odometer</span>
                      <span className={classes.rowValueRight}>
                        {attrs.serviceOdometer !== undefined ? `${attrs.serviceOdometer} km` : formattedOdometer}
                      </span>
                    </div>

                    {assignedMaintenanceItems.length > 0 ? (
                      assignedMaintenanceItems.map((item) => (
                        <div key={item.id} className={classes.rowItem}>
                          <span className={classes.rowLabelGroup} title={item.name}>
                            {item.name}
                          </span>
                          <span className={classes.rowValueRight} style={{ fontWeight: 600 }}>
                            {item.statusText}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className={classes.rowItem}>
                          <span className={classes.rowLabelGroup}>Service</span>
                          <span className={classes.rowValueRight} style={{ fontWeight: 600 }}>
                            Valid
                          </span>
                        </div>

                        <div className={classes.rowItem}>
                          <span className={classes.rowLabelGroup}>Insurance</span>
                          <span className={classes.rowValueRight} style={{ fontWeight: 600 }}>
                            Valid
                          </span>
                        </div>

                        <div className={classes.rowItem}>
                          <span className={classes.rowLabelGroup}>Road Tax</span>
                          <span className={classes.rowValueRight} style={{ fontWeight: 600 }}>
                            Valid
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {visibleCards.summary && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>Summary Today</span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Distance</span>
                      <span className={classes.rowValueRight}>{formattedTotalDistance}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Driving</span>
                      <span className={classes.rowValueRight}>{durationMetrics.driveTime}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Stop Time</span>
                      <span className={classes.rowValueRight}>{durationMetrics.stopTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.power && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>Power</span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Vehicle Batt</span>
                      <span className={classes.rowValueRight}>{attrs.power !== undefined ? `${Number(attrs.power).toFixed(1)} V` : '- V'}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Device Batt</span>
                      <span className={classes.rowValueRight}>{attrs.batteryLevel !== undefined ? `${attrs.batteryLevel}%` : '-'}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Power Cut</span>
                      <span className={classes.rowValueRight}>{attrs.alarm === 'powerCut' ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              )}

              {visibleCards.fuel && (
                <div className={classes.cardSection}>
                  <div className={classes.sectionTitleRow}>
                    <span className={classes.sectionTitleText}>Fuel</span>
                  </div>

                  <div className={classes.cardContentScrollable}>
                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Level</span>
                      <span className={classes.rowValueRight}>{attrs.fuel !== undefined ? `${Number(attrs.fuel).toFixed(1)}%` : '- %'}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Volume</span>
                      <span className={classes.rowValueRight}>{attrs.fuelLiters !== undefined ? `${Number(attrs.fuelLiters).toFixed(1)} L` : '- L'}</span>
                    </div>

                    <div className={classes.rowItem}>
                      <span className={classes.rowLabelGroup}>Consump.</span>
                      <span className={classes.rowValueRight}>{attrs.fuelConsumption !== undefined ? `${Number(attrs.fuelConsumption).toFixed(1)} L` : '- L'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={classes.rightActionDock}>
            <div className={classes.topDockActionGroup}>
              <Tooltip title="Collapse status panel" placement="left" arrow>
                <IconButton
                  className={classes.dockIconButton}
                  size="small"
                  onClick={handleCollapse}
                  aria-label="Collapse status panel"
                  type="button"
                >
                  <ExpandMoreIcon sx={{ fontSize: '1.2rem', color: '#0f172a' }} />
                </IconButton>
              </Tooltip>
            </div>

            <div className={classes.bottomDockActionGroup}>
              <Tooltip title="Card Parameters" placement="left" arrow>
                <IconButton
                  className={classes.dockIconButton}
                  size="small"
                  onClick={handleOpenParametersModal}
                >
                  <SettingsOutlinedIcon sx={{ fontSize: '1.1rem', color: '#64748b' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={filterOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setFilterOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
        className={classes.dialogTopPosition}
      >
        <Box
          sx={{
            p: 1.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TuneIcon sx={{ color: dynamicPrimary, fontSize: '1.05rem' }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '13px !important',
                color: '#0f172a',
                fontFamily: ROBOTO_FONT,
              }}
            >
              Parameters
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setFilterOpen(false)} sx={{ p: 0.2 }}>
            <CloseIcon sx={{ fontSize: '0.85rem', color: '#64748b' }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 1.5, py: 1.2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: '11.5px',
                color: '#64748b',
                fontFamily: ROBOTO_FONT,
                fontWeight: 600,
              }}
            >
              {activeTempCardCount} of {ALL_CARDS.length} selected
            </Typography>
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Typography
                onClick={handleSelectAllTempCards}
                sx={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: dynamicPrimary,
                  cursor: 'pointer',
                  fontFamily: ROBOTO_FONT,
                }}
              >
                Select all
              </Typography>
              <Typography
                onClick={handleDeselectAllTempCards}
                sx={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: dynamicPrimary,
                  cursor: 'pointer',
                  fontFamily: ROBOTO_FONT,
                }}
              >
                Deselect all
              </Typography>
            </Box>
          </Box>

          <div className={classes.filterGrid}>
            {ALL_CARDS.filter(
              (c) => c.id !== 'gprs' || isAdminOrSuperAdmin
            ).map((c) => {
              const checked = Boolean(tempVisibleCards[c.id]);
              return (
                <div
                  key={c.id}
                  className={cx(
                    classes.filterTile,
                    checked && classes.filterTileActive
                  )}
                  onClick={() => toggleTempCardVisibility(c.id)}
                >
                  <Checkbox
                    size="small"
                    checked={checked}
                    sx={{
                      p: 0.2,
                      '&.Mui-checked': {
                        color: dynamicPrimary,
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                      fontFamily: ROBOTO_FONT,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.label}
                  </Typography>
                </div>
              );
            })}
          </div>
        </DialogContent>

        <DialogActions
          sx={{
            p: 1,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '6px',
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => setFilterOpen(false)}
            disabled={savingPreferences}
            sx={{
              textTransform: 'none',
              px: 1.5,
              py: 0.3,
              fontWeight: 600,
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b',
              borderColor: '#cbd5e1',
              fontFamily: ROBOTO_FONT,
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f8fafc',
              },
            }}
          >
            Cancel
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={handleSaveParameters}
            disabled={savingPreferences}
            sx={{
              backgroundColor: `${dynamicButton} !important`,
              color: '#ffffff !important',
              textTransform: 'none',
              px: 1.8,
              py: 0.3,
              fontWeight: 700,
              borderRadius: '6px',
              fontSize: '12px',
              boxShadow: 'none',
              fontFamily: ROBOTO_FONT,
              '&:hover': {
                filter: 'brightness(0.92)',
                boxShadow: 'none',
              },
            }}
          >
            {savingPreferences ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default memo(StatusCard);