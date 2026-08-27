import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
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
  Box,
  Paper,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ConstructionIcon from '@mui/icons-material/Construction';
import PersonIcon from '@mui/icons-material/Person';

import Swal from 'sweetalert2';

import { useTranslation } from '../common/components/LocalizationProvider';
import fetchOrThrow from '../common/util/fetchOrThrow';
import BaseCommandView from './components/BaseCommandView';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#f1f5f9';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const fontStyle = {
  fontFamily: FONT_FAMILY,
};

const unitPrimaryTypographySx = {
  fontFamily: FONT_FAMILY,
  fontSize: '13px',
  fontWeight: 600,
  color: '#1e293b',
  lineHeight: 1.3,
};

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': {
    width: '4px',
    height: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#cbd5e1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#94a3b8',
  },
};

const showAlert = (options) =>
  Swal.fire({
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

const getCategoryIcon = (category) => {
  const cat = String(category || 'default').toLowerCase();
  const sx = { fontSize: 16, color: PRIMARY, flexShrink: 0 };

  switch (cat) {
    case 'motorcycle':
    case 'scooter':
    case 'bicycle':
      return <TwoWheelerIcon sx={sx} />;
    case 'truck':
    case 'pickup':
      return <LocalShippingIcon sx={sx} />;
    case 'bus':
      return <DirectionsBusIcon sx={sx} />;
    case 'van':
      return <AirportShuttleIcon sx={sx} />;
    case 'tractor':
      return <AgricultureIcon sx={sx} />;
    case 'construction':
      return <ConstructionIcon sx={sx} />;
    case 'person':
      return <PersonIcon sx={sx} />;
    case 'car':
    case 'auto':
    case 'default':
    default:
      return <DirectionsCarFilledIcon sx={sx} />;
  }
};

const formatTimeWithSeconds = (value) => {
  if (!value) return 'Just now';
  let date;
  if (typeof value === 'string' && !value.endsWith('Z') && !value.includes('+') && !value.includes('T')) {
    date = new Date(`${value.replace(' ', 'T')}Z`);
  } else if (typeof value === 'string' && !value.endsWith('Z') && !value.includes('+')) {
    date = new Date(`${value}Z`);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
    padding: '16px',
    gap: '12px',
    '@media (max-width: 600px)': {
      padding: '10px 8px',
      gap: '8px',
    },
    '&, & *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
}));

const CommandTableRow = memo(({ item, device, onResend, onDelete }) => {
  const isSms = Boolean(item.textChannel || item.channel === 'sms');
  const isFailed = Boolean(item.error || item.status === 'failed');
  const hasReply = Boolean(item.reply || item.result || item.response);

  return (
    <TableRow
      hover
      sx={{
        height: { xs: '42px', sm: '46px' },
        '&:hover': {
          backgroundColor: '#e6f7f5 !important',
        },
        '& td': {
          py: { xs: '6px', sm: '9px' },
          px: { xs: '8px', sm: '14px' },
          fontSize: { xs: '12px', sm: '13px' },
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
      <TableCell sx={{ color: '#0f172a !important', fontWeight: '600 !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsCarOutlinedIcon sx={{ fontSize: 16, color: PRIMARY }} />
          <span>{device?.name || `Device #${item.deviceId}`}</span>
        </Box>
      </TableCell>

      <TableCell sx={{ color: '#0f172a' }}>
        <Typography sx={{ fontSize: '12.5px', fontWeight: 600 }}>
          {item.description || item.type || 'Custom Command'}
        </Typography>
      </TableCell>

      <TableCell align="center">
        <Chip
          icon={isSms ? <SmsOutlinedIcon sx={{ fontSize: '13px !important' }} /> : <GpsFixedIcon sx={{ fontSize: '13px !important' }} />}
          label={isSms ? 'GSM / SMS' : 'GPS'}
          size="small"
          sx={{
            height: '20px',
            fontSize: '10.5px',
            fontWeight: 700,
            backgroundColor: isSms ? '#eff6ff' : '#f0fdfa',
            color: isSms ? '#1d4ed8' : PRIMARY_DARK,
            border: `1.5px solid ${isSms ? '#bfdbfe' : '#ccfbf1'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell sx={{ color: '#475569', fontSize: { xs: '11px !important', sm: '12.5px !important' }, fontWeight: 500 }}>
        {formatTimeWithSeconds(item.time || item.sentTime || item.createdAt || item.eventTime)}
      </TableCell>

      <TableCell>
        <Box sx={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {hasReply ? (
            <span style={{ color: '#15803d', fontWeight: 600, fontSize: '12px' }}>
              {String(item.reply || item.result || item.response)}
            </span>
          ) : isFailed ? (
            <span style={{ color: '#dc2626', fontSize: '12px' }}>
              {String(item.error || 'Delivery Failed')}
            </span>
          ) : (
            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
              Awaiting confirmation...
            </span>
          )}
        </Box>
      </TableCell>

      <TableCell align="center">
        <Chip
          label={isFailed ? 'FAILED' : hasReply ? 'EXECUTED' : 'SENT'}
          size="small"
          sx={{
            height: '20px',
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: isFailed ? '#fee2e2' : hasReply ? '#dcfce7' : '#fef3c7',
            color: isFailed ? '#991b1b' : hasReply ? '#15803d' : '#92400e',
            border: `1.5px solid ${isFailed ? '#fca5a5' : hasReply ? '#86efac' : '#fde68a'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell align="center" sx={{ borderRight: 'none !important', pr: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResend(item);
            }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '5px',
              border: `1.5px solid ${BORDER}`,
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
            Resend
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '5px',
              border: '1.5px solid #fecaca',
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

CommandTableRow.displayName = 'CommandTableRow';

export default function CommandsPage() {
  const { classes } = useStyles();
  const t = useTranslation();

  const devicesMap = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const server = useSelector((state) => state.session?.server || {}, shallowEqual);
  const livePositions = useSelector((state) => state.session?.positions || {}, shallowEqual);

  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';
  const textEnabled = Boolean(server?.textEnabled !== false);

  const devicesList = useMemo(() => {
    const list = Array.isArray(devicesMap) ? devicesMap : Object.values(devicesMap || {});
    return [...list].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [devicesMap]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalUnitSearch, setModalUnitSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [commandItem, setCommandItem] = useState({ type: 'custom', attributes: {} });
  const [savedId, setSavedId] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [commandLog, setCommandLog] = useState([]);

  // Websocket telemetries update for instant device reply rendering
  useEffect(() => {
    if (!livePositions || Object.keys(livePositions).length === 0) return;

    setCommandLog((prev) => {
      let updated = false;
      const nextLog = prev.map((entry) => {
        const devPos = livePositions[entry.deviceId];
        if (!devPos) return entry;

        const liveReply =
          devPos.attributes?.result ||
          devPos.attributes?.response ||
          devPos.attributes?.commandResult ||
          devPos.attributes?.smsReply;

        if (liveReply && !entry.reply && !entry.result) {
          updated = true;
          return {
            ...entry,
            reply: String(liveReply),
            status: 'completed',
          };
        }
        return entry;
      });

      return updated ? nextLog : prev;
    });
  }, [livePositions]);

  // Load persistent history from database reports
  const fetchCommandHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const fromIso = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const toIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

      const [eventsRes, queuedRes] = await Promise.all([
        fetch(`/api/reports/events?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}&type=queuedCommand&type=commandResult`, {
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/commands/send', { credentials: 'include' }).catch(() => null),
      ]);

      const logList = [];

      if (eventsRes && eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) {
          eventsData.forEach((evt) => {
            logList.push({
              id: evt.id || `evt-${evt.eventTime}-${evt.deviceId}`,
              deviceId: evt.deviceId,
              type: evt.attributes?.type || evt.type || 'Custom Command',
              textChannel: Boolean(evt.attributes?.textChannel),
              time: evt.eventTime,
              description: evt.attributes?.description || evt.attributes?.data || evt.type,
              reply: evt.attributes?.result || evt.attributes?.response || null,
              error: null,
            });
          });
        }
      }

      if (queuedRes && queuedRes.ok) {
        const queuedData = await queuedRes.json();
        if (Array.isArray(queuedData)) {
          queuedData.forEach((q) => {
            logList.push({
              id: q.id || `q-${q.deviceId}-${Date.now()}`,
              deviceId: q.deviceId,
              type: q.type,
              textChannel: Boolean(q.textChannel),
              time: q.attributes?.time || new Date().toISOString(),
              description: q.description || q.type,
              reply: q.attributes?.result || null,
              error: null,
            });
          });
        }
      }

      devicesList.forEach((dev) => {
        if (dev.attributes?.lastCommand) {
          logList.push({
            id: `dev-cmd-${dev.id}`,
            deviceId: dev.id,
            type: dev.attributes.lastCommand.type || 'Command',
            textChannel: Boolean(dev.attributes.lastCommand.textChannel),
            time: dev.attributes.lastCommand.time || dev.lastUpdate,
            description: dev.attributes.lastCommand.description || 'Command',
            reply: dev.attributes.lastCommand.result || dev.attributes.result || null,
            error: null,
          });
        }
      });

      const byKey = new Map();
      logList.forEach((it) => {
        const key = `${it.deviceId}-${it.time}-${it.type}`;
        if (!byKey.has(key)) {
          byKey.set(key, it);
        }
      });

      const sorted = Array.from(byKey.values()).sort(
        (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
      );

      setCommandLog((prev) => {
        const merged = [...prev];
        sorted.forEach((item) => {
          if (!merged.some((m) => m.id === item.id || (m.deviceId === item.deviceId && m.time === item.time))) {
            merged.push(item);
          }
        });
        return merged.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      });
    } catch {
      // Retain memory logs safely
    } finally {
      setLoadingHistory(false);
    }
  }, [devicesList]);

  useEffect(() => {
    fetchCommandHistory();
  }, [fetchCommandHistory]);

  const filteredModalDevices = useMemo(() => {
    const q = modalUnitSearch.trim().toLowerCase();
    if (!q) return devicesList;

    return devicesList.filter(
      (device) =>
        String(device.name || '').toLowerCase().includes(q) ||
        String(device.uniqueId || '').toLowerCase().includes(q)
    );
  }, [devicesList, modalUnitSearch]);

  const handleToggleUnit = useCallback((id) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllUnits = useCallback(() => {
    setSelectedDeviceIds(filteredModalDevices.map((d) => d.id));
  }, [filteredModalDevices]);

  const handleDeselectAllUnits = useCallback(() => {
    const visibleIds = new Set(filteredModalDevices.map((d) => d.id));
    setSelectedDeviceIds((prev) => prev.filter((id) => !visibleIds.has(id)));
  }, [filteredModalDevices]);

  const handleOpenDialog = () => {
    setSelectedDeviceIds([]);
    setModalUnitSearch('');
    setCommandItem({ type: 'custom', attributes: { data: '' }, textChannel: false });
    setSavedId(0);
    setActiveTab(0);
    setDialogOpen(true);
  };

  const handleResend = (entry) => {
    setSelectedDeviceIds([entry.deviceId]);
    setCommandItem({
      type: entry.type || 'custom',
      attributes: entry.attributes || {},
      textChannel: Boolean(entry.textChannel),
    });
    setSavedId(0);
    setActiveTab(1);
    setDialogOpen(true);
  };

  const handleDeleteLog = async (item) => {
    const dev = devicesMap[item.deviceId];
    const devName = dev?.name || `Device #${item.deviceId}`;

    const result = await showAlert({
      title: 'Delete Command Record?',
      html: `Are you sure you want to remove the command record for <strong>${devName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    if (item.id && typeof item.id === 'number') {
      try {
        await fetchOrThrow(`/api/commands/send/${item.id}`, {
          method: 'DELETE',
        }).catch(() => {});
      } catch {}
    }

    setCommandLog((prev) => prev.filter((log) => log.id !== item.id));

    showAlert({
      icon: 'success',
      title: 'Deleted',
      text: 'Command record removed from history.',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleSendCommand = async (e) => {
    if (e) e.preventDefault();

    if (selectedDeviceIds.length === 0) {
      setActiveTab(0);
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select at least one vehicle.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (!commandItem.type) {
      setActiveTab(1);
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please choose a command type.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setSubmitting(true);
    const nowIso = new Date().toISOString();

    try {
      const results = await Promise.all(
        selectedDeviceIds.map(async (deviceId) => {
          const payload = {
            deviceId: Number(deviceId),
            type: commandItem.type,
            textChannel: Boolean(commandItem.textChannel),
            attributes: {
              ...(commandItem.attributes || {}),
            },
          };

          const response = await fetch('/api/commands/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errText = await response.text();
            return {
              id: `cmd-${Date.now()}-${deviceId}`,
              deviceId: Number(deviceId),
              type: commandItem.type,
              textChannel: Boolean(commandItem.textChannel),
              attributes: commandItem.attributes,
              time: nowIso,
              description: commandItem.description || commandItem.type,
              result: null,
              error: errText || 'Failed',
            };
          }

          const resData = await response.json().catch(() => null);
          const dev = devicesMap[deviceId];

          if (dev) {
            try {
              await fetch(`/api/devices/${deviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  ...dev,
                  attributes: {
                    ...(dev.attributes || {}),
                    lastCommand: {
                      type: commandItem.type,
                      textChannel: Boolean(commandItem.textChannel),
                      time: nowIso,
                      description: commandItem.description || commandItem.type,
                      result: resData?.attributes?.result || resData?.result || null,
                    },
                  },
                }),
              });
            } catch {}
          }

          return {
            id: `cmd-${Date.now()}-${deviceId}`,
            deviceId: Number(deviceId),
            type: commandItem.type,
            textChannel: Boolean(commandItem.textChannel),
            attributes: commandItem.attributes,
            time: nowIso,
            description: commandItem.description || commandItem.type,
            result: resData?.attributes?.result || resData?.result || null,
            error: null,
          };
        })
      );

      setCommandLog((prev) => [...results, ...prev]);
      setDialogOpen(false);

      showAlert({
        icon: 'success',
        title: 'Command Dispatched',
        text: commandItem.textChannel
          ? `SMS command sent to ${selectedDeviceIds.length} vehicle(s).`
          : `GPS command queued for ${selectedDeviceIds.length} vehicle(s).`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Command Failed',
        text: err.message || 'Unable to deliver commands to devices.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return commandLog;

    return commandLog.filter((entry) => {
      const dev = devicesMap[entry.deviceId];
      return (
        String(dev?.name || '').toLowerCase().includes(q) ||
        String(entry.type || '').toLowerCase().includes(q) ||
        String(entry.reply || entry.result || '').toLowerCase().includes(q)
      );
    });
  }, [commandLog, devicesMap, searchKeyword]);

  return (
    <Box className={classes.root}>
      {/* Top Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 } }}>
            <ElectricalServicesIcon sx={{ color: PRIMARY, fontSize: { xs: '20px', sm: '24px' } }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px !important', sm: '17px !important' },
                color: TEXT,
                letterSpacing: '-0.02em',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.2,
              }}
            >
              Send Commands & GSM Control
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            boxSizing: 'border-box',
            flexWrap: { xs: 'nowrap', sm: 'wrap' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: SURFACE,
              borderRadius: '20px',
              paddingLeft: { xs: '10px', sm: '14px' },
              paddingRight: { xs: '6px', sm: '8px' },
              height: { xs: '34px', sm: '38px' },
              border: `1.5px solid ${BORDER}`,
              flex: { xs: 1, sm: 'none' },
              width: { xs: 'auto', sm: '270px' },
              minWidth: 0,
              transition: 'all 0.15s ease',
              '&:focus-within': {
                borderColor: PRIMARY,
                backgroundColor: SURFACE,
                boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
              },
            }}
          >
            <SearchIcon sx={{ color: TEXT_MUTED, fontSize: { xs: '15px', sm: '17px' }, marginRight: { xs: '4px', sm: '8px' }, flexShrink: 0 }} />
            <InputBase
              placeholder="Search command log..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 400,
                color: TEXT,
                fontFamily: FONT_FAMILY,
              }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<SendIcon sx={{ fontSize: { xs: '15px !important', sm: '17px !important' } }} />}
            onClick={handleOpenDialog}
            disableElevation
            sx={{
              height: { xs: '34px', sm: '38px' },
              minWidth: { xs: '110px', sm: '140px' },
              px: { xs: 1.2, sm: 2 },
              borderRadius: '8px',
              backgroundColor: PRIMARY,
              color: SURFACE,
              textTransform: 'none',
              fontSize: { xs: '12px !important', sm: '13px !important' },
              fontWeight: '600 !important',
              fontFamily: FONT_FAMILY,
              boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
              flexShrink: 0,
              '&:hover': { backgroundColor: PRIMARY_DARK },
            }}
          >
            New Command
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
          borderRadius: { xs: '6px', sm: '8px' },
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
              minWidth: '840px',
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
                    width: { xs: 160, sm: 190 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Device
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: 160, sm: 190 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Command
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: { xs: 100, sm: 120 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '8px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Channel
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: 155, sm: 175 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Sent Time
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: 180, sm: 220 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Device Reply / Result
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: { xs: 95, sm: 110 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '8px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: { xs: 140, sm: 160 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
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
              {loadingHistory && filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={24} sx={{ color: PRIMARY }} />
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: TEXT_SECONDARY, mt: 1, fontFamily: FONT_FAMILY }}>
                      Loading commands...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((item) => (
                  <CommandTableRow
                    key={item.id}
                    item={item}
                    device={devicesMap[item.deviceId]}
                    onResend={handleResend}
                    onDelete={handleDeleteLog}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      py: 4,
                      color: '#64748b',
                      fontSize: '12.5px',
                      fontWeight: 400,
                      ...fontStyle,
                    }}
                  >
                    No command transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Footer System Status Bar */}
      <Box
        sx={{
          mt: 'auto',
          pt: { xs: '6px', sm: '10px' },
          pb: '2px',
          px: { xs: '2px', sm: '6px' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          borderTop: '1px solid #e2e8f0',
          width: '100%',
          flexShrink: 0,
          gap: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DnsOutlinedIcon sx={{ fontSize: '14px', color: '#00ab8e' }} />
            <span style={{ color: '#64748b', fontSize: '11.5px', ...fontStyle }}>Server:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '11.5px', ...fontStyle }}>{serverHostIp}</strong>
          </Box>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: '14px', color: '#00ab8e' }} />
            <span style={{ color: '#64748b', fontSize: '11.5px', ...fontStyle }}>Version:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '11.5px', ...fontStyle }}>v{serverVersion}</strong>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            px: { xs: 1, sm: 1.4 },
            py: 0.4,
            borderRadius: '20px',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
            }}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#047857', letterSpacing: '0.2px', ...fontStyle }}>
            Live Command Channel Active
          </span>
        </Box>
      </Box>

      {/* FULLY RESPONSIVE DISPATCH DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={(_, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown' || submitting) return;
          setDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: { xs: '10px', sm: '14px' },
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: FONT_FAMILY,
              width: { xs: 'calc(100% - 16px)', sm: '100%' },
              maxWidth: { xs: '100%', sm: '580px' },
              margin: { xs: '8px auto', sm: '24px auto' },
              maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 48px)' },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            margin: 0,
            padding: { xs: '12px 14px', sm: '14px 18px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SURFACE,
            borderBottom: `1px solid ${BORDER_LIGHT}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ElectricalServicesIcon
              sx={{
                color: PRIMARY,
                fontSize: { xs: '18px', sm: '20px' },
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '14px !important', sm: '15px !important' },
                color: TEXT,
                fontFamily: FONT_FAMILY,
              }}
            >
              Dispatch Command
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
            <CloseIcon sx={{ fontSize: { xs: '18px', sm: '20px' } }} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSendCommand} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${BORDER}`,
              backgroundColor: SURFACE,
              minHeight: { xs: '38px', sm: '42px' },
              px: 0.5,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '11px !important', sm: '12px !important' },
                color: TEXT_SECONDARY,
                minHeight: { xs: '38px', sm: '42px' },
                padding: { xs: '4px 6px', sm: '6px 10px' },
                fontFamily: FONT_FAMILY,
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                gap: '4px',
                '& svg': {
                  margin: 0,
                  fontSize: { xs: '14px', sm: '16px' },
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
            <Tab icon={<DirectionsCarOutlinedIcon />} iconPosition="start" label={`Units (${selectedDeviceIds.length})`} />
            <Tab icon={<ElectricalServicesIcon />} iconPosition="start" label="Parameters" />
            <Tab icon={<SmsOutlinedIcon />} iconPosition="start" label="Channel Mode" />
          </Tabs>

          <DialogContent
            sx={{
              padding: { xs: '14px', sm: '18px 20px' },
              minHeight: { xs: '260px', sm: '300px' },
              overflowY: 'auto',
              backgroundColor: SURFACE,
              boxSizing: 'border-box',
              ...scrollableSx,
            }}
          >
            {/* Tab 0: Target Vehicles (Multi-Select Card Grid) */}
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: TEXT, fontFamily: FONT_FAMILY }}>
                    Select Target Vehicles ({selectedDeviceIds.length}/{devicesList.length})
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: SURFACE_SOFT,
                        borderRadius: '20px',
                        paddingLeft: '10px',
                        paddingRight: '6px',
                        height: '32px',
                        border: `1px solid ${BORDER}`,
                        width: { xs: '100%', sm: '180px' },
                        '&:focus-within': {
                          borderColor: PRIMARY,
                        },
                      }}
                    >
                      <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 15, marginRight: '4px' }} />
                      <InputBase
                        placeholder="Search units..."
                        value={modalUnitSearch}
                        onChange={(e) => setModalUnitSearch(e.target.value)}
                        sx={{
                          fontSize: '12px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                        }}
                      />
                    </Box>
                    <Button
                      size="small"
                      onClick={handleSelectAllUnits}
                      sx={{ textTransform: 'none', color: PRIMARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      onClick={handleDeselectAllUnits}
                      sx={{ textTransform: 'none', color: TEXT_SECONDARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}
                    >
                      Deselect All
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: '8px',
                    p: 1,
                    backgroundColor: SURFACE_SOFT,
                    ...scrollableSx,
                  }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1 }}>
                    {filteredModalDevices.map((device) => {
                      const isChecked = selectedDeviceIds.includes(device.id);
                      return (
                        <Box
                          key={device.id}
                          onClick={() => handleToggleUnit(device.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: isChecked ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                            borderRadius: '6px',
                            backgroundColor: isChecked ? '#f0fdfa' : SURFACE,
                            height: '38px',
                            px: 1,
                            cursor: 'pointer',
                            minWidth: 0,
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: PRIMARY },
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={isChecked}
                            sx={{ p: 0.2, mr: 0.5, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.8 }}>
                            {getCategoryIcon(device.category)}
                          </Box>
                          <Typography
                            noWrap
                            sx={{
                              ...unitPrimaryTypographySx,
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isChecked ? '#0f172a' : TEXT,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {device.name}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Tab 1: Parameters */}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedDeviceIds.length > 0 ? (
                  <BaseCommandView
                    deviceId={selectedDeviceIds[0]}
                    item={commandItem}
                    setItem={setCommandItem}
                    includeSaved
                    savedId={savedId}
                    setSavedId={setSavedId}
                  />
                ) : (
                  <Typography sx={{ fontSize: '12.5px', color: TEXT_SECONDARY, py: 4, textAlign: 'center' }}>
                    Please select at least one vehicle from the "Units" tab first.
                  </Typography>
                )}
              </Box>
            )}

            {/* Tab 2: Channel Mode */}
            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    border: `1.5px solid ${commandItem.textChannel ? PRIMARY : BORDER}`,
                    borderRadius: '8px',
                    backgroundColor: commandItem.textChannel ? '#f0fdfa' : SURFACE_SOFT,
                  }}
                >
                  <Box sx={{ pr: 1 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: FONT_FAMILY }}>
                      Send via GSM / SMS
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>
                      Dispatches the command payload directly through cellular SMS network to the device SIM card.
                    </Typography>
                  </Box>
                  <Checkbox
                    size="small"
                    checked={Boolean(commandItem.textChannel)}
                    disabled={!textEnabled}
                    onChange={(e) => setCommandItem({ ...commandItem, textChannel: e.target.checked })}
                    sx={{ color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                  />
                </Box>

                {!commandItem.textChannel && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      border: `1px solid ${BORDER}`,
                      borderRadius: '8px',
                      backgroundColor: SURFACE_SOFT,
                    }}
                  >
                    <Box sx={{ pr: 1 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: FONT_FAMILY }}>
                        Immediate Non-Queued Dispatch
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>
                        Executes without holding in message buffers if device is currently offline.
                      </Typography>
                    </Box>
                    <Checkbox
                      size="small"
                      checked={Boolean(commandItem.attributes?.noQueue)}
                      onChange={(e) =>
                        setCommandItem({
                          ...commandItem,
                          attributes: { ...commandItem.attributes, noQueue: e.target.checked },
                        })
                      }
                      sx={{ color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ padding: { xs: '10px 14px', sm: '12px 18px' }, backgroundColor: SURFACE, borderTop: `1px solid ${BORDER_LIGHT}`, gap: 1 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: '6px',
                color: PRIMARY,
                borderColor: PRIMARY,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '11.5px !important', sm: '12px !important' },
                px: { xs: 1.8, sm: 2.2 },
                py: 0.4,
                fontFamily: FONT_FAMILY,
                '&:hover': { borderColor: PRIMARY_DARK, backgroundColor: '#f0fdfa' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || selectedDeviceIds.length === 0}
              size="small"
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: '6px',
                backgroundColor: PRIMARY,
                color: SURFACE,
                '&:hover': { backgroundColor: PRIMARY_DARK },
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '11.5px !important', sm: '12px !important' },
                px: { xs: 2.2, sm: 2.8 },
                py: 0.4,
                boxShadow: 'none',
                fontFamily: FONT_FAMILY,
              }}
            >
              {submitting ? 'Dispatching...' : `Send Command (${selectedDeviceIds.length})`}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}