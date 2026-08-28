import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  InputBase,
  Checkbox,
  Tabs,
  Tab,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';

import Swal from 'sweetalert2';

import AddIcon from '@mui/icons-material/Add';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NearMeIcon from '@mui/icons-material/NearMe';
import LayersIcon from '@mui/icons-material/Layers';
import TuneIcon from '@mui/icons-material/Tune';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import SpeedIcon from '@mui/icons-material/Speed';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SearchIcon from '@mui/icons-material/Search';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';

import { useTranslation } from '../common/components/LocalizationProvider';
import { notificationsActions, devicesActions } from '../store';

const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_SIZE_12 = '12px !important';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const PRIMARY_LIGHT = '#f0fdfa';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#f1f5f9';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const fontStyle = {
  fontFamily: FONT_FAMILY,
};

export const playAlertSound = (soundType = 'chime') => {
  if (!soundType || soundType === 'none') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playNote = (freq, startTime, duration, type = 'sine', volume = 0.9) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    switch (soundType) {
      case 'chime':
        playNote(1046.5, 0.0, 0.35, 'sine', 0.85);
        playNote(1567.98, 0.12, 0.5, 'sine', 0.95);
        break;
      case 'bell':
        playNote(1567.98, 0.0, 0.7, 'triangle', 0.9);
        playNote(2093.0, 0.02, 0.8, 'sine', 0.95);
        break;
      case 'radar':
        playNote(1760.0, 0.0, 0.08, 'sine', 0.9);
        playNote(2349.32, 0.1, 0.15, 'sine', 0.95);
        break;
      case 'siren':
        playNote(880.0, 0.0, 0.12, 'sawtooth', 0.75);
        playNote(1318.51, 0.12, 0.12, 'sawtooth', 0.85);
        break;
      default:
        playNote(1046.5, 0.0, 0.3, 'sine', 0.85);
        break;
    }
  } catch (err) {}
};

const ALL_ALERT_TYPES = [
  { id: 'deviceOverspeed', label: 'Over Speed' },
  { id: 'deviceMoving', label: 'Vehicle Moving' },
  { id: 'deviceStopped', label: 'Vehicle Stopped' },
  { id: 'ignitionOn', label: 'Ignition ON' },
  { id: 'ignitionOff', label: 'Ignition OFF' },
  { id: 'geofenceEnter', label: 'Geofence Entry' },
  { id: 'geofenceExit', label: 'Geofence Exit' },
  { id: 'alarm', label: 'SOS / Panic Alarm' },
  { id: 'powerCut', label: 'Power Cut / Tamper' },
  { id: 'lowBattery', label: 'Low Battery' },
  { id: 'tow', label: 'Towing / Movement Alert' },
  { id: 'idleDuration', label: 'Excessive Idling' },
  { id: 'hardAcceleration', label: 'Harsh Acceleration' },
  { id: 'hardBraking', label: 'Harsh Braking' },
  { id: 'hardCornering', label: 'Harsh Cornering' },
  { id: 'maintenance', label: 'Service / Maintenance Due' },
  { id: 'deviceOnline', label: 'Unit Connected (Online)' },
  { id: 'deviceOffline', label: 'Unit Disconnected (Offline)' },
  { id: 'deviceExpiring', label: 'Device Expiring' },
];

const SOUND_PRESETS = [
  { id: 'chime', label: 'Enterprise Chime', desc: 'Pleasant dual-tone airport chime' },
  { id: 'bell', label: 'Crystal Glass Bell', desc: 'Clear high-pitch harmonic ring' },
  { id: 'radar', label: 'Sonar Radar Chirp', desc: 'Double sonar sweep' },
  { id: 'siren', label: 'Emergency Siren', desc: 'Urgent warning sweep' },
  { id: 'none', label: 'Silent (Mute)', desc: 'Visual popup notification only' },
];

const ALERT_COLORS = [
  { label: 'Red', hex: '#ef4444' },
  { label: 'Orange', hex: '#f97316' },
  { label: 'Amber', hex: '#f59e0b' },
  { label: 'Teal', hex: '#00ab8e' },
  { label: 'Blue', hex: '#3b82f6' },
  { label: 'Purple', hex: '#8b5cf6' },
];

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': { width: '4px', height: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
};

const showAlert = (options) => {
  return Swal.fire({
    target: document.body,
    customClass: {
      container: 'swal-top-layer',
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = '999999';
      }
    },
    ...options,
  });
};

const useStyles = makeStyles()(() => ({
  root: {
    height: '100%',
    width: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: SURFACE_SOFT,
    overflow: 'hidden',
    fontFamily: FONT_FAMILY,
    boxSizing: 'border-box',
    padding: '18px 20px',
    gap: '14px',
    '&, & *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
}));

const NotificationTableRow = memo(({
  item,
  assignedDeviceNames,
  onEdit,
  onDelete,
}) => {
  const typeObj = ALL_ALERT_TYPES.find((t) => t.id === item.type);
  const typeLabel = typeObj ? typeObj.label : item.type || 'Alert Event';
  const channels = (item.notificators || '').split(/[, ]+/).filter(Boolean);
  const color = item.attributes?.color || PRIMARY;

  return (
    <TableRow
      hover
      sx={{
        height: '46px',
        '&:hover': { backgroundColor: '#e6f7f5 !important' },
        '& td': {
          py: '9px',
          px: '14px',
          fontSize: '13px',
          fontWeight: 400,
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...fontStyle,
        },
      }}
    >
      <TableCell
        onClick={() => onEdit(item)}
        sx={{
          color: '#0f172a !important',
          fontWeight: '600 !important',
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: PRIMARY, fontWeight: 700 }}>
            {item.name || item.attributes?.ruleName || item.description || typeLabel}
          </span>
        </Box>
      </TableCell>

      <TableCell>
        <Chip
          label={typeLabel}
          size="small"
          sx={{
            height: '22px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: `${color}18`,
            color: color,
            border: `1px solid ${color}40`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell sx={{ color: '#475569' }}>
        {item.speedLimit ? `${item.speedLimit} km/h` : '—'}
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {channels.map((ch, idx) => (
            <Chip
              key={idx}
              label={ch.toUpperCase()}
              size="small"
              sx={{
                height: '20px',
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: '#f1f5f9',
                color: TEXT_SECONDARY,
                borderRadius: '4px',
              }}
            />
          ))}
        </Box>
      </TableCell>

      <TableCell>
        {assignedDeviceNames && assignedDeviceNames.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {assignedDeviceNames.slice(0, 2).map((devName, i) => (
              <Chip
                key={i}
                icon={<DirectionsCarOutlinedIcon style={{ fontSize: 13, color: '#15803d' }} />}
                label={devName}
                size="small"
                sx={{
                  height: '22px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  ...fontStyle,
                }}
              />
            ))}
            {assignedDeviceNames.length > 2 && (
              <Chip
                label={`+${assignedDeviceNames.length - 2} more`}
                size="small"
                sx={{
                  height: '22px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: '#f1f5f9',
                  color: TEXT_SECONDARY,
                  borderRadius: '4px',
                }}
              />
            )}
          </Box>
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
            All Vehicles
          </span>
        )}
      </TableCell>

      <TableCell align="center" sx={{ borderRight: 'none !important', pr: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '12.5px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '12.5px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.color = '#dc2626';
            }}
          >
            Delete
          </button>
        </Box>
      </TableCell>
    </TableRow>
  );
});
NotificationTableRow.displayName = 'NotificationTableRow';

export default function NotificationsPage() {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const server = useSelector((state) => state.session?.server || {});
  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';
  const impersonatedUserId = localStorage.getItem('impersonated_user_id');
  const effectiveUserId = impersonatedUserId ? Number(impersonatedUserId) : currentUser?.id;
  const isSuperAdmin = Boolean((currentUser?.administrator || currentUser?.admin || currentUser?.id === 1) && !impersonatedUserId);

  const rawDevices = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const rawNotifications = useSelector((state) => state.notifications?.items || {}, shallowEqual);
  const geofencesById = useSelector((state) => state.geofences?.items || {}, shallowEqual);

  const devicesList = useMemo(() => {
    return Array.isArray(rawDevices) ? rawDevices : Object.values(rawDevices || {});
  }, [rawDevices]);

  const geofencesList = useMemo(() => {
    return Array.isArray(geofencesById) ? geofencesById : Object.values(geofencesById || {});
  }, [geofencesById]);

  const notificationsList = useMemo(() => {
    return Array.isArray(rawNotifications) ? rawNotifications : Object.values(rawNotifications || {});
  }, [rawNotifications]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 12;
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // AddAlertModal State Synchronized
  const [alertName, setAlertName] = useState('');
  const [selectedType, setSelectedType] = useState('deviceOverspeed');
  const [speedLimit, setSpeedLimit] = useState('');
  const [channels, setChannels] = useState({ inApp: true, email: false, sms: false });
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedSound, setSelectedSound] = useState('chime');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [unitSearch, setUnitSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [emails, setEmails] = useState('');
  const [phones, setPhones] = useState('');
  const [geofenceMode, setGeofenceMode] = useState('in');
  const [selectedGeofences, setSelectedGeofences] = useState([]);
  const [geofenceSearch, setGeofenceSearch] = useState('');
  const [touched, setTouched] = useState(false);

  const filteredUnits = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return devicesList;
    return devicesList.filter((u) => (u.name || '').toLowerCase().includes(q));
  }, [devicesList, unitSearch]);

  const filteredTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    if (!q) return ALL_ALERT_TYPES;
    return ALL_ALERT_TYPES.filter((tp) => tp.label.toLowerCase().includes(q));
  }, [typeSearch]);

  const filteredGeofences = useMemo(() => {
    const q = geofenceSearch.trim().toLowerCase();
    if (!q) return geofencesList;
    return geofencesList.filter((g) => (g.name || '').toLowerCase().includes(q));
  }, [geofencesList, geofenceSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setSyncError(null);
    try {
      const endpoint = isSuperAdmin
        ? '/api/notifications'
        : impersonatedUserId
        ? `/api/notifications?userId=${impersonatedUserId}`
        : `/api/notifications?userId=${effectiveUserId}`;

      const [notifRes, devRes] = await Promise.all([
        fetch(endpoint, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/devices', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }).catch(() => null),
      ]);

      if (notifRes && notifRes.ok) {
        const nData = await notifRes.json();
        const nList = (Array.isArray(nData) ? nData : Object.values(nData || {})).map((n) => ({
          ...n,
          name: n.attributes?.ruleName || n.description || n.type,
          speedLimit: n.attributes?.speedLimit ? Math.round(n.attributes.speedLimit * 1.852) : undefined,
        }));

        if (notificationsActions?.refresh) {
          dispatch(notificationsActions.refresh(nList));
        }
      } else if (notifRes && !notifRes.ok) {
        setSyncError(`Server returned status ${notifRes.status}`);
      }

      if (devRes && devRes.ok) {
        const dData = await devRes.json();
        const dList = Array.isArray(dData) ? dData : Object.values(dData || {});
        if (devicesActions?.refresh) {
          dispatch(devicesActions.refresh(dList));
        }
      }
    } catch (err) {
      setSyncError('Could not sync with the backend. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [dispatch, effectiveUserId, isSuperAdmin, impersonatedUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNotification = () => {
    setSelectedItem(null);
    setAlertName('');
    setSelectedType('deviceOverspeed');
    setSpeedLimit('100');
    setSelectedUnits([]);
    setSelectedGeofences([]);
    setGeofenceMode('in');
    setChannels({ inApp: true, email: false, sms: false });
    setSelectedSound('chime');
    setSelectedColor('#ef4444');
    setEmails('');
    setPhones('');
    setTouched(false);
    setActiveTab(0);
    setDialogOpen(true);
  };

  const handleEditNotification = (item) => {
    setSelectedItem(item);
    setAlertName(item.name || item.attributes?.ruleName || item.description || '');
    setSelectedType(item.type || 'deviceOverspeed');
    setSpeedLimit(item.speedLimit !== undefined ? String(item.speedLimit) : item.attributes?.speedLimit ? String(Math.round(item.attributes.speedLimit * 1.852)) : '');
    setSelectedUnits(item.attributes?.selectedUnits || item.attributes?.deviceIds || []);
    setSelectedGeofences(item.attributes?.selectedGeofences || []);
    setGeofenceMode(item.attributes?.geofenceMode || 'in');
    setChannels({
      inApp: (item.notificators || '').includes('web'),
      email: (item.notificators || '').includes('mail'),
      sms: (item.notificators || '').includes('sms'),
    });
    setSelectedSound(item.attributes?.sound || 'chime');
    setSelectedColor(item.attributes?.color || '#ef4444');
    setEmails(item.attributes?.emails || '');
    setPhones(item.attributes?.phones || '');
    setTouched(false);
    setActiveTab(0);
    setDialogOpen(true);
  };

  const handleSaveNotification = async (e) => {
    if (e) e.preventDefault();
    setTouched(true);

    if (!alertName.trim()) {
      setActiveTab(0);
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter an alert rule title or name.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (selectedUnits.length === 0) {
      setActiveTab(0);
      showAlert({
        icon: 'warning',
        title: 'Select Units',
        text: 'Please select at least one vehicle to apply this alert.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (selectedType === 'deviceOverspeed' && (!speedLimit || Number(speedLimit) <= 0)) {
      setActiveTab(1);
      showAlert({
        icon: 'error',
        title: 'Speed Limit Required',
        text: 'Please enter a valid positive speed threshold in km/h.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if ((selectedType === 'geofenceEnter' || selectedType === 'geofenceExit') && selectedGeofences.length === 0) {
      setActiveTab(2);
      showAlert({
        icon: 'warning',
        title: 'Select Geofence',
        text: 'Please select at least one geofence boundary.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (!channels.inApp && !channels.email && !channels.sms) {
      setActiveTab(3);
      showAlert({
        icon: 'warning',
        title: 'Delivery Channel Required',
        text: 'Please select at least one delivery channel (In-App, Email, SMS).',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setSubmitting(true);

    const isEdit = Boolean(selectedItem?.id);
    const parsedSpeedKph = speedLimit !== '' && !isNaN(Number(speedLimit)) ? Number(speedLimit) : undefined;
    const speedKnots = parsedSpeedKph ? parsedSpeedKph / 1.852 : undefined;

    const notificatorsArray = [];
    if (channels.inApp) notificatorsArray.push('web');
    if (channels.email) notificatorsArray.push('mail');
    if (channels.sms) notificatorsArray.push('sms');

    const isAllUnitsSelected = devicesList.length > 0 && selectedUnits.length === devicesList.length;

    const payload = {
      ...(isEdit ? { id: selectedItem.id } : {}),
      type: selectedType,
      always: isAllUnitsSelected,
      notificators: notificatorsArray.join(','),
      description: alertName.trim(),
      attributes: {
        ...(selectedItem?.attributes || {}),
        ruleName: alertName.trim(),
        speedLimit: speedKnots,
        sound: selectedSound,
        color: selectedColor,
        emails,
        phones,
        geofenceMode,
        selectedGeofences,
        selectedUnits,
        deviceIds: selectedUnits,
        ownerUserId: Number(effectiveUserId),
        updatedAt: new Date().toISOString(),
      },
    };

    const url = isEdit ? `/api/notifications/${selectedItem.id}` : '/api/notifications';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server responded with ${response.status}`);
      }

      const savedItem = await response.json();

      if (!isEdit && currentUser?.id) {
        await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser.id,
            notificationId: savedItem.id,
          }),
        }).catch(() => null);
      }

      if (Array.isArray(selectedUnits) && selectedUnits.length > 0) {
        await Promise.all(
          selectedUnits.map((deviceId) =>
            fetch('/api/permissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                deviceId,
                notificationId: savedItem.id,
              }),
            }).catch(() => null)
          )
        );
      }

      // Sync speed limit attribute back to device objects for hardware-level calculation
      if (selectedType === 'deviceOverspeed' && speedKnots) {
        await Promise.all(
          selectedUnits.map(async (devId) => {
            const currentDev = devicesList.find((u) => u.id === Number(devId));
            if (currentDev) {
              await fetch(`/api/devices/${devId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  ...currentDev,
                  attributes: {
                    ...(currentDev.attributes || {}),
                    speedLimit: speedKnots,
                  },
                }),
              }).catch(() => null);
            }
          })
        );
      }

      const normalizedItem = {
        ...savedItem,
        name: alertName.trim(),
        speedLimit: parsedSpeedKph,
      };

      if (isEdit) {
        if (notificationsActions?.update) dispatch(notificationsActions.update([normalizedItem]));
      } else {
        if (notificationsActions?.add) dispatch(notificationsActions.add(normalizedItem));
      }

      setDialogOpen(false);
      showAlert({
        icon: 'success',
        title: isEdit ? 'Alert Updated' : 'Alert Configured',
        text: `Alert "${alertName.trim()}" has been saved and synced across assigned units.`,
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || 'Could not save alert rule to the server.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotification = async (item) => {
    const itemName = item?.name || item?.attributes?.ruleName || item?.description || 'this alert';
    const itemId = item?.id;

    const result = await showAlert({
      title: 'Delete Alert Rule?',
      html: `Are you sure you want to delete <strong>"${itemName}"</strong>?<br/><span style="font-size: 12.5px; color: #64748b;">Assigned vehicles will no longer trigger this alert.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/notifications/${itemId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        if (notificationsActions?.remove) dispatch(notificationsActions.remove(itemId));
        showAlert({
          icon: 'success',
          title: 'Deleted',
          text: `"${itemName}" was removed from the system.`,
          timer: 1800,
          showConfirmButton: false,
        });
        loadData();
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Failed to remove alert rule.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  const sortedNotifications = useMemo(() => {
    let result = notificationsList.filter(Boolean);
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (n) =>
          (n?.name || '').toLowerCase().includes(q) ||
          (n?.description || '').toLowerCase().includes(q) ||
          (n?.type || '').toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      (a?.name || a?.description || a?.type || '').localeCompare(b?.name || b?.description || b?.type || '')
    );
  }, [notificationsList, searchKeyword]);

  const totalItems = sortedNotifications.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedItems = sortedNotifications.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box className={classes.root}>
      {/* Top Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <NotificationsActiveOutlinedIcon sx={{ color: PRIMARY, fontSize: '24px' }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '17px !important',
                color: TEXT,
                letterSpacing: '-0.02em',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.2,
              }}
            >
              Alerts & Notifications
            </Typography>
          </Box>

          {syncError && (
            <Button
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
              onClick={loadData}
              sx={{
                color: PRIMARY,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              Retry Sync
            </Button>
          )}
        </Box>

        {syncError && (
          <Alert severity="warning" sx={{ py: 0.5, px: 1.5, fontSize: '12px', borderRadius: '6px' }}>
            {syncError}
          </Alert>
        )}

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            boxSizing: 'border-box',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: SURFACE,
                borderRadius: '20px',
                paddingLeft: '14px',
                paddingRight: '8px',
                height: '38px',
                border: `1.5px solid ${BORDER}`,
                width: { xs: '100%', sm: '270px' },
                transition: 'all 0.15s ease',
                '&:focus-within': {
                  borderColor: PRIMARY,
                  backgroundColor: SURFACE,
                  boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
                },
              }}
            >
              <SearchIcon sx={{ color: TEXT_MUTED, fontSize: '17px', marginRight: '8px', flexShrink: 0 }} />
              <InputBase
                placeholder="Search alert rules..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(0);
                }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '13px',
                  fontWeight: 400,
                  color: TEXT,
                  fontFamily: FONT_FAMILY,
                }}
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={handleCreateNotification}
            disableElevation
            sx={{
              height: '38px',
              minWidth: '130px',
              borderRadius: '8px',
              backgroundColor: PRIMARY,
              color: SURFACE,
              textTransform: 'none',
              fontSize: '13px !important',
              fontWeight: '600 !important',
              fontFamily: FONT_FAMILY,
              boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
              ml: 'auto',
              '&:hover': { backgroundColor: PRIMARY_DARK },
            }}
          >
            Set Alert
          </Button>
        </Box>
      </Box>

      {/* Main Table Container */}
      <Paper
        elevation={0}
        sx={{
          flex: '1 1 auto',
          width: '100%',
          height: 0,
          minHeight: 0,
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            ...scrollableSx,
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              width: '100%',
              minWidth: '760px',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontFamily: FONT_FAMILY,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 220,
                    fontWeight: '700 !important',
                    fontSize: '13px !important',
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Alert Name
                </TableCell>
                <TableCell
                  sx={{
                    width: 160,
                    fontWeight: '700 !important',
                    fontSize: '13px !important',
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Trigger Type
                </TableCell>
                <TableCell
                  sx={{
                    width: 140,
                    fontWeight: '700 !important',
                    fontSize: '13px !important',
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Threshold
                </TableCell>
                <TableCell
                  sx={{
                    width: 170,
                    fontWeight: '700 !important',
                    fontSize: '13px !important',
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Channels
                </TableCell>
                <TableCell
                  sx={{
                    width: 200,
                    fontWeight: '700 !important',
                    fontSize: '13px !important',
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Assigned Vehicles
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: 140,
                    fontWeight: '700 !important',
                    fontSize: '13px !important',
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    right: 0,
                    zIndex: 3,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && sortedNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={26} sx={{ color: PRIMARY }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: TEXT_SECONDARY, mt: 1, fontFamily: FONT_FAMILY }}>
                      Loading alert rules...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item) => {
                  const targetIds = item.attributes?.selectedUnits || item.attributes?.deviceIds || [];
                  const assignedDeviceNames = devicesList
                    .filter((d) => targetIds.includes(d.id))
                    .map((d) => d.name);

                  return (
                    <NotificationTableRow
                      key={item.id}
                      item={item}
                      assignedDeviceNames={assignedDeviceNames}
                      onEdit={handleEditNotification}
                      onDelete={handleDeleteNotification}
                    />
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 5,
                      color: '#64748b',
                      fontSize: '13px',
                      fontWeight: 400,
                      ...fontStyle,
                    }}
                  >
                    No alert rules configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination */}
        {totalItems > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              borderTop: '1px solid #cbd5e1',
              backgroundColor: SURFACE,
              flexShrink: 0,
              flexWrap: 'wrap',
              gap: 1,
              ...fontStyle,
            }}
          >
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>
              Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalItems)} of {totalItems} Rules
            </span>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                sx={{
                  color: TEXT_SECONDARY,
                  borderColor: BORDER,
                  minWidth: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  fontSize: '12px !important',
                  fontWeight: 600,
                  textTransform: 'none',
                  ...fontStyle,
                }}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  size="small"
                  variant={page === i ? 'contained' : 'outlined'}
                  onClick={() => setPage(i)}
                  sx={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    fontSize: '12px !important',
                    fontWeight: 600,
                    textTransform: 'none',
                    ...(page === i
                      ? { backgroundColor: PRIMARY, color: '#ffffff', '&:hover': { backgroundColor: PRIMARY_DARK } }
                      : { color: TEXT, borderColor: BORDER }),
                    ...fontStyle,
                  }}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                size="small"
                variant="outlined"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                sx={{
                  color: TEXT_SECONDARY,
                  borderColor: BORDER,
                  minWidth: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  fontSize: '12px !important',
                  fontWeight: 600,
                  textTransform: 'none',
                  ...fontStyle,
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Footer System Status Bar */}
      {isSuperAdmin && (
        <Box
          sx={{
            mt: 'auto',
            pt: '10px',
            pb: '2px',
            px: '6px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #e2e8f0',
            width: '100%',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <DnsOutlinedIcon sx={{ fontSize: '16px', color: '#00ab8e' }} />
              <span style={{ color: '#64748b', fontSize: '12px', ...fontStyle }}>Server:</span>
              <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px', ...fontStyle }}>{serverHostIp}</strong>
            </Box>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <InfoOutlinedIcon sx={{ fontSize: '16px', color: '#00ab8e' }} />
              <span style={{ color: '#64748b', fontSize: '12px', ...fontStyle }}>System Version:</span>
              <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px', ...fontStyle }}>v{serverVersion}</strong>
            </Box>
          </Box>
        </Box>
      )}

      {/* Synchronized Add / Edit Alert Modal Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          if (submitting) return;
          setDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: FONT_FAMILY,
              width: '100%',
              maxWidth: '680px',
              margin: { xs: '8px', sm: '24px' },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            margin: 0,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SURFACE,
            borderBottom: `1px solid ${BORDER_LIGHT}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <NotificationsActiveOutlinedIcon
              sx={{
                color: PRIMARY,
                fontSize: '20px',
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                color: TEXT,
                fontFamily: FONT_FAMILY,
                letterSpacing: '-0.2px',
              }}
            >
              {selectedItem ? 'Edit Alert' : 'Set Alert'}
            </Typography>
          </Box>

          <IconButton
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
            size="small"
            sx={{
              color: TEXT_SECONDARY,
              padding: '4px',
              '&:hover': { backgroundColor: SURFACE_SOFT, color: TEXT },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form noValidate onSubmit={handleSaveNotification} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              borderBottom: `1px solid ${BORDER}`,
              backgroundColor: SURFACE,
              minHeight: '44px',
              px: 1,
              '& .MuiTabs-flexContainer': {
                justifyContent: 'space-between',
                width: '100%',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                color: TEXT_SECONDARY,
                minHeight: '44px',
                minWidth: 'auto',
                padding: '0 8px',
                fontFamily: FONT_FAMILY,
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                gap: '6px',
                '& svg': {
                  margin: 0,
                  fontSize: '16px',
                },
              },
              '& .Mui-selected': {
                color: `${PRIMARY} !important`,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: PRIMARY,
                height: '2.5px',
              },
            }}
          >
            <Tab icon={<NearMeIcon sx={{ transform: 'rotate(45deg)' }} />} iconPosition="start" label={`Units (${selectedUnits.length})`} />
            <Tab icon={<TuneIcon />} iconPosition="start" label="Type" />
            <Tab icon={<LayersIcon />} iconPosition="start" label={`Geofencing (${selectedGeofences.length})`} />
            <Tab icon={<EmailIcon />} iconPosition="start" label="Notifications" />
            <Tab icon={<VolumeUpIcon />} iconPosition="start" label="Sound" />
            <Tab icon={<ColorLensIcon />} iconPosition="start" label="Colors" />
          </Tabs>

          <DialogContent
            sx={{
              padding: '20px 22px',
              minHeight: '340px',
              maxHeight: '480px',
              overflowY: 'auto',
              backgroundColor: SURFACE,
              ...scrollableSx,
            }}
          >
            {/* Tab 0: Units */}
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                    <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>Alert Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    error={touched && !alertName.trim()}
                    helperText={touched && !alertName.trim() ? 'Alert Name is required' : ''}
                    placeholder="Enter alert title..."
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: SURFACE },
                      '& input': { fontSize: FONT_SIZE_12, fontWeight: 700, color: TEXT, fontFamily: FONT_FAMILY, padding: '8.5px 12px' },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                    <TextField
                      size="small"
                      placeholder="Search units..."
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      sx={{
                        width: '240px',
                        '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: SURFACE },
                        '& input': { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_12, fontWeight: 700, padding: '6px 10px' },
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        size="small"
                        onClick={() => setSelectedUnits(devicesList.map((u) => u.id))}
                        sx={{ textTransform: 'none', color: PRIMARY, fontWeight: 700, fontSize: FONT_SIZE_12, fontFamily: FONT_FAMILY, p: 0, minWidth: 0 }}
                      >
                        Select All
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setSelectedUnits([])}
                        sx={{ textTransform: 'none', color: TEXT_SECONDARY, fontWeight: 700, fontSize: FONT_SIZE_12, fontFamily: FONT_FAMILY, p: 0, minWidth: 0 }}
                      >
                        Deselect All
                      </Button>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      maxHeight: '230px',
                      overflowY: 'auto',
                      p: 1.5,
                      backgroundColor: SURFACE_SOFT,
                      borderRadius: '8px',
                      border: touched && selectedUnits.length === 0 ? '1px solid #ef4444' : `1px solid ${BORDER}`,
                      ...scrollableSx,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                        gap: 1.2,
                      }}
                    >
                      {filteredUnits.map((u) => {
                        const isSelected = selectedUnits.includes(u.id);
                        return (
                          <Box
                            key={u.id}
                            onClick={() =>
                              setSelectedUnits(
                                isSelected
                                  ? selectedUnits.filter((id) => id !== u.id)
                                  : [...selectedUnits, u.id]
                              )
                            }
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              border: isSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                              borderRadius: '6px',
                              backgroundColor: isSelected ? '#f0fdfa' : SURFACE,
                              height: '42px',
                              px: 1.5,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:hover': { borderColor: PRIMARY },
                            }}
                          >
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              sx={{ padding: 0, marginRight: '10px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                            />
                            <Typography noWrap sx={{ fontSize: FONT_SIZE_12, color: isSelected ? '#0f172a' : TEXT, fontWeight: 700, fontFamily: FONT_FAMILY }}>
                              {u.name}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Tab 1: Alert Type */}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  placeholder="Search alert type..."
                  size="small"
                  fullWidth
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                    '& input': { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_12, fontWeight: 700, padding: '7px 12px' },
                  }}
                />
                <Box sx={{ maxHeight: '220px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}`, ...scrollableSx }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                    {filteredTypes.map((type) => {
                      const isSelected = selectedType === type.id;
                      return (
                        <Box
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: isSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                            borderRadius: '6px',
                            backgroundColor: isSelected ? '#f0fdfa' : SURFACE,
                            height: '42px',
                            px: 1.5,
                            cursor: 'pointer',
                            '&:hover': { borderColor: PRIMARY },
                          }}
                        >
                          <Radio size="small" checked={isSelected} sx={{ padding: 0, marginRight: '10px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                          <Typography noWrap sx={{ fontSize: FONT_SIZE_12, color: isSelected ? '#0f172a' : TEXT, fontWeight: 700, fontFamily: FONT_FAMILY }}>
                            {type.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {selectedType === 'deviceOverspeed' && (
                  <Box sx={{ p: 1.5, backgroundColor: SURFACE_SOFT, border: touched && (!speedLimit || Number(speedLimit) <= 0) ? '1px solid #ef4444' : `1px solid ${PRIMARY}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                      <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, color: TEXT, fontFamily: FONT_FAMILY }}>Speed Threshold</Typography>
                    </Box>
                    <TextField
                      type="number"
                      size="small"
                      required
                      placeholder="e.g. 80"
                      value={speedLimit}
                      error={touched && (!speedLimit || Number(speedLimit) <= 0)}
                      onChange={(e) => setSpeedLimit(e.target.value)}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">km/h</InputAdornment>,
                          sx: { borderRadius: '6px', width: '120px', fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY },
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 2: Geofencing */}
            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RadioGroup row value={geofenceMode} onChange={(e) => setGeofenceMode(e.target.value)} sx={{ gap: 4, px: 0.5 }}>
                  <FormControlLabel value="in" control={<Radio size="small" sx={{ '&.Mui-checked': { color: PRIMARY } }} />} label={<Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>Zone Entry (In)</Typography>} />
                  <FormControlLabel value="out" control={<Radio size="small" sx={{ '&.Mui-checked': { color: PRIMARY } }} />} label={<Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>Zone Exit (Out)</Typography>} />
                </RadioGroup>
                <TextField
                  placeholder="Search geofences..."
                  size="small"
                  fullWidth
                  value={geofenceSearch}
                  onChange={(e) => setGeofenceSearch(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                    '& input': { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_12, fontWeight: 700, padding: '7px 12px' },
                  }}
                />
                <Box sx={{ maxHeight: '200px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}`, ...scrollableSx }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                    {filteredGeofences.map((gf) => {
                      const isChecked = selectedGeofences.includes(gf.id);
                      return (
                        <Box key={gf.id} onClick={() => setSelectedGeofences(isChecked ? selectedGeofences.filter((id) => id !== gf.id) : [...selectedGeofences, gf.id])} sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: '6px', backgroundColor: SURFACE, height: '42px', px: 1.5, cursor: 'pointer', '&:hover': { borderColor: PRIMARY } }}>
                          <Checkbox size="small" disableRipple checked={isChecked} sx={{ padding: 0, marginRight: '10px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                          <Typography noWrap sx={{ fontSize: FONT_SIZE_12, color: TEXT, fontWeight: 700, fontFamily: FONT_FAMILY }}>{gf.name}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Tab 3: Notifications */}
            {activeTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <PhoneIphoneIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                    <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>In-App Notification</Typography>
                  </Box>
                  <Switch checked={channels.inApp} size="small" onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PRIMARY } }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <EmailIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                    <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>Email Dispatch</Typography>
                  </Box>
                  <Switch checked={channels.email} size="small" onChange={(e) => setChannels({ ...channels, email: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PRIMARY } }} />
                </Box>
                {channels.email && (
                  <TextField
                    fullWidth
                    size="small"
                    required
                    error={touched && channels.email && !emails.trim()}
                    helperText={touched && channels.email && !emails.trim() ? 'Recipient email is required' : ''}
                    placeholder="emails (comma-separated)..."
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    sx={{ '& input': { fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY } }}
                  />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <SmsIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                    <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>SMS Alert</Typography>
                  </Box>
                  <Switch checked={channels.sms} size="small" onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PRIMARY } }} />
                </Box>
                {channels.sms && (
                  <TextField
                    fullWidth
                    size="small"
                    required
                    error={touched && channels.sms && !phones.trim()}
                    helperText={touched && channels.sms && !phones.trim() ? 'Recipient phone number is required' : ''}
                    placeholder="phone numbers (comma-separated)..."
                    value={phones}
                    onChange={(e) => setPhones(e.target.value)}
                    sx={{ '& input': { fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY } }}
                  />
                )}
              </Box>
            )}

            {/* Tab 4: Sound */}
            {activeTab === 4 && (
              <Box sx={{ maxHeight: '260px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}`, ...scrollableSx }}>
                {SOUND_PRESETS.map((snd) => {
                  const isSelected = selectedSound === snd.id;
                  return (
                    <Box key={snd.id} onClick={() => setSelectedSound(snd.id)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '6px', border: isSelected ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`, backgroundColor: isSelected ? '#e6f7f4' : SURFACE, cursor: 'pointer', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {snd.id === 'none' ? <VolumeOffIcon sx={{ color: TEXT_MUTED, fontSize: 20 }} /> : <VolumeUpIcon sx={{ color: PRIMARY, fontSize: 20 }} />}
                        <Box>
                          <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>{snd.label}</Typography>
                          <Typography sx={{ fontSize: '11px', color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>{snd.desc}</Typography>
                        </Box>
                      </Box>
                      {snd.id !== 'none' && (
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); playAlertSound(snd.id); }} sx={{ color: PRIMARY, border: `1px solid ${PRIMARY}`, padding: '4px' }}>
                          <PlayArrowIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Tab 5: Colors */}
            {activeTab === 5 && (
              <Box sx={{ p: 2, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, mb: 1.5, fontFamily: FONT_FAMILY }}>Select Notification Color</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {ALERT_COLORS.map((c) => (
                    <Box
                      key={c.hex}
                      onClick={() => setSelectedColor(c.hex)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        cursor: 'pointer',
                        border: selectedColor === c.hex ? '3px solid #0f172a' : '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ padding: '14px 20px', backgroundColor: SURFACE, borderTop: `1px solid ${BORDER_LIGHT}`, gap: 1.5 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              variant="outlined"
              sx={{
                borderRadius: '8px',
                color: PRIMARY,
                borderColor: PRIMARY,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                px: 2.5,
                py: 0.6,
                fontFamily: FONT_FAMILY,
                '&:hover': { borderColor: PRIMARY_DARK, backgroundColor: '#f0fdfa' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: '8px',
                backgroundColor: PRIMARY,
                color: SURFACE,
                '&:hover': { backgroundColor: PRIMARY_DARK },
                textTransform: 'none',
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                px: 3,
                py: 0.6,
                boxShadow: 'none',
                fontFamily: FONT_FAMILY,
              }}
            >
              {submitting ? <CircularProgress size={18} color="inherit" /> : selectedItem ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}