import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Chip,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Divider,
  Button,
  Skeleton,
} from '@mui/material';
import Swal from 'sweetalert2';

import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import ActivityView, { closeEventMapPopup } from './ActivityView';
import AddAlertModal from './AddAlertModal';
import { devicesActions, eventsActions, sessionActions, notificationsActions } from '../../store';

const PRIMARY = '#00ab8e';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const BORDER = '#e2e8f0';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_SIZE_12 = '12px !important';

const NOTIFICATIONS_STORAGE_KEY = 'tracklink_notifications_cache';
const EVENTS_STORAGE_KEY = 'tracklink_activity_cache';
const EVENTS_CACHE_LIMIT = 200;

const menuPaperSx = {
  borderRadius: '8px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
  minWidth: '130px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: `1px solid ${BORDER}`,
  marginTop: '4px',
  zIndex: 99999,
  fontFamily: FONT_FAMILY,
};

const DrawerSkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', p: '2px 4px 0 0' }}>
    {[1, 2, 3, 4, 5].map((k) => (
      <Paper
        key={k}
        elevation={0}
        sx={{
          p: '10px 12px',
          minHeight: 46,
          background: '#ffffff',
          border: `1px solid ${BORDER}`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: '#e2e8f0' }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: '#e2e8f0' }} />
            <Skeleton variant="text" width="35%" height={13} sx={{ bgcolor: '#f1f5f9' }} />
          </Box>
        </Box>
        <Skeleton variant="circular" width={18} height={18} sx={{ bgcolor: '#f1f5f9' }} />
      </Paper>
    ))}
  </Box>
);

const getRuleIcon = (type, customColor) => {
  const iconColor = customColor || PRIMARY;
  const lower = String(type || '').toLowerCase();
  if (lower.includes('expir') || lower.includes('expired')) {
    return <EventBusyIcon sx={{ fontSize: '16px', color: iconColor }} />;
  }
  if (lower.includes('overspeed') || lower.includes('speed')) {
    return <SpeedIcon sx={{ fontSize: '16px', color: iconColor }} />;
  }
  if (lower.includes('geofence')) {
    return <LocationOnIcon sx={{ fontSize: '16px', color: iconColor }} />;
  }
  if (lower.includes('ignition')) {
    return <PowerSettingsNewIcon sx={{ fontSize: '16px', color: iconColor }} />;
  }
  return <NotificationsActiveOutlinedIcon sx={{ fontSize: '16px', color: iconColor }} />;
};

const formatRuleTypeLabel = (type) => {
  if (!type) return 'Alert';
  if (type === 'deviceExpiring') return 'Expiring';
  if (type === 'deviceOverspeed') return 'Over Speed';
  if (type === 'geofenceEnter') return 'Geofence Entry';
  if (type === 'geofenceExit') return 'Geofence Exit';
  if (type === 'deviceStopped') return 'Stop duration';
  if (type === 'deviceOffline') return 'Unit Disconnected';
  if (type === 'deviceMoving') return 'Move duration';
  if (type === 'deviceOnline') return 'Unit Connected';
  if (type === 'ignitionOn') return 'Ignition ON';
  if (type === 'ignitionOff') return 'Ignition OFF';
  return type.replace(/^device/, '');
};

const readCachedRules = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const readCachedEvents = () => {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const EventsDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const impersonatedUserId = localStorage.getItem('impersonated_user_id');
  const effectiveUserId = impersonatedUserId ? Number(impersonatedUserId) : currentUser?.id;
  const isSuperAdmin = Boolean(currentUser?.administrator || currentUser?.admin || currentUser?.id === 1);

  const reduxDevicesObj = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const [fetchedDevices, setFetchedDevices] = useState([]);

  const devices = useMemo(() => {
    const fromRedux = Array.isArray(reduxDevicesObj) ? reduxDevicesObj : Object.values(reduxDevicesObj);
    if (fromRedux.length > 0) return fromRedux;
    return fetchedDevices;
  }, [reduxDevicesObj, fetchedDevices]);

  const allowedDeviceIds = useMemo(() => new Set(devices.map((d) => Number(d.id))), [devices]);
  const geofencesById = useSelector((state) => state.geofences?.items || {}, shallowEqual);
  const geofences = useMemo(() => Object.values(geofencesById), [geofencesById]);

  const rawEvents = useSelector((state) => state.events?.items || [], shallowEqual);
  const storeEvents = useMemo(() => (Array.isArray(rawEvents) ? rawEvents : Object.values(rawEvents)), [rawEvents]);

  const [activeTab, setActiveTab] = useState('activity');
  const [searchQuery, setSearchQuery] = useState('');

  const [configuredRules, setConfiguredRules] = useState(readCachedRules);
  const [backendServerEvents, setBackendServerEvents] = useState(readCachedEvents);

  const [isLoadingActivity, setIsLoadingActivity] = useState(
    () => storeEvents.length === 0 && backendServerEvents.length === 0
  );
  const [isLoadingRules, setIsLoadingRules] = useState(() => configuredRules.length === 0);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeRuleForMenu, setActiveRuleForMenu] = useState(null);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  const hasLoadedActivityOnceRef = useRef(false);

  const lastEventsClearedAt = useMemo(() => {
    const ts = currentUser?.attributes?.lastEventsClearedAt;
    return ts ? new Date(ts).getTime() : 0;
  }, [currentUser?.attributes?.lastEventsClearedAt]);

  const loadUserAccountDevices = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      const endpoint = isSuperAdmin
        ? '/api/devices'
        : impersonatedUserId
        ? `/api/devices?userId=${impersonatedUserId}`
        : '/api/devices';

      const res = await fetch(endpoint, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Object.values(data || {});
        setFetchedDevices(list);
        if (devicesActions?.refresh) {
          dispatch(devicesActions.refresh(list));
        }
      }
    } catch (e) {}
  }, [effectiveUserId, isSuperAdmin, impersonatedUserId, dispatch]);

  const configuredTypeSet = useMemo(() => {
    const set = new Set();
    configuredRules.forEach((r) => {
      if (r.type) set.add(r.type);
    });
    return set;
  }, [configuredRules]);

  const loadConfiguredRules = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      const endpoint = isSuperAdmin
        ? '/api/notifications'
        : `/api/notifications?userId=${effectiveUserId}`;

      const res = await fetch(endpoint, { credentials: 'include' });
      if (res.ok) {
        const notifs = await res.json();
        if (Array.isArray(notifs)) {
          const freshList = notifs
            .filter((n) => {
              const ruleOwner = n.attributes?.ownerUserId;
              if (ruleOwner && Number(ruleOwner) !== Number(effectiveUserId)) {
                return false;
              }
              return true;
            })
            .map((n) => ({
              id: n.id,
              name: n.attributes?.ruleName || (n.type === 'deviceOverspeed' ? 'Over Speed' : n.type) || 'Alert Rule',
              type: n.type,
              speedLimit: n.attributes?.speedLimit !== undefined ? Math.round(n.attributes.speedLimit * 1.852) : undefined,
              sound: n.attributes?.sound || 'chime',
              color: n.attributes?.color || PRIMARY,
              selectedUnits: n.attributes?.selectedUnits || [],
              selectedGeofences: n.attributes?.selectedGeofences || [],
              geofenceMode: n.attributes?.geofenceMode || 'in',
              channels: {
                inApp: (n.notificators || '').includes('web'),
                email: (n.notificators || '').includes('mail'),
                sms: (n.notificators || '').includes('sms'),
              },
              emails: n.attributes?.emails || '',
              phones: n.attributes?.phones || '',
              ownerUserId: Number(n.attributes?.ownerUserId || effectiveUserId),
            }));

          setConfiguredRules(freshList);
          try {
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(freshList));
          } catch (e) {}
          if (notificationsActions?.refresh) {
            dispatch(notificationsActions.refresh(freshList));
          }
        }
      }
    } catch (e) {
    } finally {
      setIsLoadingRules(false);
    }
  }, [effectiveUserId, isSuperAdmin, dispatch]);

  const loadBackendEvents = useCallback(async () => {
    try {
      const isFirstLoad = !hasLoadedActivityOnceRef.current;
      const windowMs = isFirstLoad ? 24 * 3600 * 1000 : 5 * 60 * 1000;

      const from = new Date(Date.now() - windowMs).toISOString();
      const to = new Date().toISOString();

      const params = new URLSearchParams();
      params.append('from', from);
      params.append('to', to);

      if (devices.length > 0) {
        devices.forEach((d) => params.append('deviceId', d.id));
      }

      const res = await fetch(`/api/reports/events?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const filtered = data.filter((item) => {
            const isDeviceAllowed = allowedDeviceIds.size === 0 || allowedDeviceIds.has(Number(item.deviceId));
            const isTypeConfigured = configuredTypeSet.size === 0 || configuredTypeSet.has(item.type);
            const itemTime = new Date(item.eventTime || item.serverTime || 0).getTime();
            const isAfterClear = !lastEventsClearedAt || itemTime > lastEventsClearedAt;

            return isDeviceAllowed && isTypeConfigured && isAfterClear;
          });

          setBackendServerEvents((prev) => {
            const merged = isFirstLoad ? filtered : [...filtered, ...prev];
            const seen = new Set();
            const deduped = merged.filter((item) => {
              const key = String(item.id);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            const trimmed = deduped.slice(0, EVENTS_CACHE_LIMIT);
            try {
              localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(trimmed));
            } catch (e) {}
            return deduped;
          });

          if (eventsActions?.add) {
            dispatch(eventsActions.add(filtered));
          }
        }
      }
      hasLoadedActivityOnceRef.current = true;
    } catch (e) {
    } finally {
      setIsLoadingActivity(false);
    }
  }, [devices, allowedDeviceIds, configuredTypeSet, lastEventsClearedAt, dispatch]);

  useEffect(() => {
    if (open) {
      loadUserAccountDevices();
      loadConfiguredRules();
      loadBackendEvents();
    }
  }, [open, loadUserAccountDevices, loadConfiguredRules, loadBackendEvents]);

  useEffect(() => {
    if (!open) return;

    const handleSync = () => {
      loadConfiguredRules();
      loadBackendEvents();
    };

    window.addEventListener('focus', handleSync);
    const syncInterval = setInterval(handleSync, 30000);

    return () => {
      window.removeEventListener('focus', handleSync);
      clearInterval(syncInterval);
    };
  }, [open, loadConfiguredRules, loadBackendEvents]);

  const allActivityEvents = useMemo(() => {
    const combined = [...storeEvents, ...backendServerEvents];
    const seen = new Set();
    return combined.filter((item) => {
      const idKey = String(item.id);
      if (seen.has(idKey)) return false;
      seen.add(idKey);

      const isDeviceAllowed = allowedDeviceIds.size === 0 || allowedDeviceIds.has(Number(item.deviceId));
      const isTypeConfigured = configuredTypeSet.size === 0 || configuredTypeSet.has(item.type);
      const itemTime = new Date(item.eventTime || item.serverTime || Date.now()).getTime();
      const isAfterClear = !lastEventsClearedAt || itemTime > lastEventsClearedAt;

      return isDeviceAllowed && isTypeConfigured && isAfterClear;
    });
  }, [storeEvents, backendServerEvents, allowedDeviceIds, configuredTypeSet, lastEventsClearedAt]);

  const filteredRules = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return configuredRules;
    return configuredRules.filter((r) =>
      (r.name || '').toLowerCase().includes(term) || (r.type || '').toLowerCase().includes(term)
    );
  }, [configuredRules, searchQuery]);

  const handleOpenSetAlertModal = () => {
    setEditingRule(null);
    setAlertModalOpen(true);
  };

  const handleTriggerEdit = (rule) => {
    setEditingRule(rule);
    setAlertModalOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteConfiguredRule = async (rule) => {
    setMenuAnchor(null);

    const result = await Swal.fire({
      title: 'Delete Alert?',
      text: `Do you want to delete the alert rule "${rule.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/notifications/${rule.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (res.ok) {
          setConfiguredRules((prev) => {
            const updated = prev.filter((r) => String(r.id) !== String(rule.id));
            try {
              localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
          if (notificationsActions?.remove) {
            dispatch(notificationsActions.remove(rule.id));
          }
          showToast(`Alert "${rule.name}" deleted successfully!`, 'success');
        } else {
          showToast('Failed to delete alert rule from server', 'error');
        }
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete alert rule.', 'error');
      }
    }
  };

  const handleSaveUpdatedRule = () => {
    setAlertModalOpen(false);
    setEditingRule(null);
    loadConfiguredRules();
  };

  const handleDeleteActivityEvent = (eventId) => {
    setBackendServerEvents((prev) => {
      const updated = prev.filter((e) => String(e.id) !== String(eventId));
      try {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated.slice(0, EVENTS_CACHE_LIMIT)));
      } catch (e) {}
      return updated;
    });
    if (eventsActions?.delete) {
      dispatch(eventsActions.delete(eventId));
    }
    closeEventMapPopup();
  };

  const handleClearAllActivity = async () => {
    if (allActivityEvents.length === 0) return;

    const result = await Swal.fire({
      title: 'Clear All Activity?',
      text: 'Are you sure you want to clear all activity events across your account?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      const nowIso = new Date().toISOString();

      try {
        if (currentUser?.id) {
          const updatedUser = {
            ...currentUser,
            attributes: {
              ...(currentUser.attributes || {}),
              lastEventsClearedAt: nowIso,
            },
          };

          const res = await fetch(`/api/users/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updatedUser),
          });

          if (res.ok) {
            const savedUser = await res.json();
            dispatch(sessionActions.updateUser(savedUser));
          }
        }
      } catch (e) {}

      setBackendServerEvents([]);
      try {
        localStorage.removeItem(EVENTS_STORAGE_KEY);
      } catch (e) {}
      if (eventsActions?.deleteAll) {
        dispatch(eventsActions.deleteAll());
      }
      closeEventMapPopup();
      showToast('Activity cleared successfully', 'success');
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        backgroundColor: SURFACE,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '14px 10px 10px 10px',
        overflow: 'hidden',
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_12,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minWidth: 0,
          marginBottom: '12px',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <NotificationsActiveOutlinedIcon sx={{ color: PRIMARY, fontSize: '18px', flexShrink: 0 }} />
          <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: '#1e293b', letterSpacing: '-0.1px', fontFamily: FONT_FAMILY, whiteSpace: 'nowrap' }}>
            Alerts & Events
          </Typography>
        </Box>

        {onClose && (
          <IconButton
            size="small"
            tabIndex={-1}
            onClick={onClose}
            sx={{
              width: '34px',
              height: '34px',
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              color: TEXT_SECONDARY,
              backgroundColor: SURFACE,
              flexShrink: 0,
              padding: 0,
              '&:hover': {
                backgroundColor: SURFACE_SOFT,
                color: PRIMARY,
                borderColor: '#cbd5e1',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: '22px' }} />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          width: '100%',
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: SURFACE_SOFT,
            borderRadius: '20px',
            paddingLeft: '12px',
            paddingRight: '8px',
            height: '38px',
            border: `1px solid ${BORDER}`,
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
            '&:focus-within': {
              borderColor: PRIMARY,
              backgroundColor: SURFACE,
              boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.12)',
            },
          }}
        >
          <SearchIcon sx={{ color: TEXT_MUTED, fontSize: '17px', marginRight: '8px', flexShrink: 0 }} />

          <InputBase
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: FONT_SIZE_12,
              fontWeight: 700,
              color: TEXT,
              fontFamily: FONT_FAMILY,
              '& input': {
                minWidth: 0,
                padding: 0,
                fontSize: FONT_SIZE_12,
                fontWeight: 700,
              },
            }}
          />
        </Box>

        <IconButton
          size="small"
          onClick={handleOpenSetAlertModal}
          sx={{
            width: '38px',
            height: '38px',
            backgroundColor: PRIMARY,
            color: SURFACE,
            borderRadius: '8px',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
            '&:hover': {
              backgroundColor: '#008f77',
            },
          }}
        >
          <AddIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: '6px', marginBottom: '10px', flexShrink: 0 }}>
        <Box
          component="button"
          onClick={() => setActiveTab('activity')}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            py: 0.7,
            px: 1,
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'activity' ? PRIMARY : BORDER}`,
            backgroundColor: activeTab === 'activity' ? '#e6f7f4' : SURFACE_SOFT,
            color: activeTab === 'activity' ? PRIMARY : TEXT_SECONDARY,
            fontSize: FONT_SIZE_12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONT_FAMILY,
            transition: 'all 0.15s ease',
            '&:hover': { backgroundColor: activeTab === 'activity' ? '#e6f7f4' : '#f1f5f9' },
          }}
        >
          <DynamicFeedIcon sx={{ fontSize: '15px' }} />
          <span>Activity ({allActivityEvents.length})</span>
        </Box>

        <Box
          component="button"
          onClick={() => {
            setActiveTab('view_alerts');
          }}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            py: 0.7,
            px: 1,
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'view_alerts' ? PRIMARY : BORDER}`,
            backgroundColor: activeTab === 'view_alerts' ? '#e6f7f4' : SURFACE_SOFT,
            color: activeTab === 'view_alerts' ? PRIMARY : TEXT_SECONDARY,
            fontSize: FONT_SIZE_12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONT_FAMILY,
            transition: 'all 0.15s ease',
            '&:hover': { backgroundColor: activeTab === 'view_alerts' ? '#e6f7f4' : '#f1f5f9' },
          }}
        >
          <ListAltIcon sx={{ fontSize: '15px' }} />
          <span>View Alerts ({configuredRules.length})</span>
        </Box>
      </Box>

      {/* Clear All Action */}
      {activeTab === 'activity' && allActivityEvents.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1, px: 0.5 }}>
          <Button
            size="small"
            onClick={handleClearAllActivity}
            startIcon={<DeleteSweepIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              color: '#dc2626',
              fontSize: '11.5px',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.2,
              px: 1,
              borderRadius: '6px',
              fontFamily: FONT_FAMILY,
              '&:hover': { backgroundColor: '#fef2f2' },
            }}
          >
            Clear All Activity
          </Button>
        </Box>
      )}

      <Divider sx={{ borderColor: BORDER, marginBottom: '8px', flexShrink: 0 }} />

      <Box
        sx={{
          flex: '1 1 0',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minWidth: 0,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '10px' },
          '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
        }}
      >
        {activeTab === 'activity' ? (
          isLoadingActivity ? (
            <DrawerSkeleton />
          ) : (
            <ActivityView
              events={allActivityEvents}
              devices={devices}
              geofences={geofences}
              searchQuery={searchQuery}
              onDeleteEvent={handleDeleteActivityEvent}
            />
          )
        ) : (
          isLoadingRules ? (
            <DrawerSkeleton />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '2px 4px', scrollBehavior: 'smooth' }}>
              {filteredRules.length === 0 ? (
                <Box sx={{ padding: '24px 10px', textAlign: 'center', color: TEXT_MUTED, fontSize: FONT_SIZE_12, fontFamily: FONT_FAMILY, fontWeight: 700 }}>
                  {searchQuery ? 'No matching alerts found.' : 'No alerts configured yet.'}
                </Box>
              ) : (
                filteredRules.map((rule) => {
                  const assignedUnitsCount = Array.isArray(rule.selectedUnits) ? rule.selectedUnits.length : 0;
                  const assignedGeofencesCount = Array.isArray(rule.selectedGeofences) ? rule.selectedGeofences.length : 0;

                  return (
                    <Paper
                      key={rule.id}
                      elevation={0}
                      sx={{
                        margin: 0,
                        padding: '7px 8px',
                        minHeight: 46,
                        background: '#ffffff',
                        border: '1.5px solid transparent',
                        borderBottom: `1px solid ${BORDER}`,
                        borderLeft: `3.5px solid ${rule.color || PRIMARY} !important`,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'default',
                        userSelect: 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': { backgroundColor: '#f8fafc' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, paddingRight: '6px' }}>
                        <Box
                          sx={{
                            width: '28px',
                            height: '28px',
                            minWidth: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: `${rule.color || PRIMARY}15`,
                            border: `1px solid ${rule.color || PRIMARY}30`,
                          }}
                        >
                          {getRuleIcon(rule.type, rule.color)}
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
                          <Typography
                            noWrap
                            sx={{
                              fontFamily: `${FONT_FAMILY} !important`,
                              fontSize: FONT_SIZE_12,
                              fontWeight: '700 !important',
                              color: '#1e293b !important',
                              lineHeight: '1.25 !important',
                              letterSpacing: '-0.05px',
                            }}
                          >
                            {rule.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                            <Chip
                              label={formatRuleTypeLabel(rule.type)}
                              size="small"
                              sx={{
                                height: '16px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: `${rule.color || PRIMARY}15`,
                                color: rule.color || PRIMARY,
                                fontFamily: FONT_FAMILY,
                              }}
                            />
                            <Chip
                              label={`${assignedUnitsCount} Unit${assignedUnitsCount === 1 ? '' : 's'}`}
                              size="small"
                              sx={{
                                height: '16px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#f1f5f9',
                                color: TEXT_SECONDARY,
                                fontFamily: FONT_FAMILY,
                              }}
                            />
                            {(rule.type === 'geofenceEnter' || rule.type === 'geofenceExit') && assignedGeofencesCount > 0 && (
                              <Chip
                                label={`${assignedGeofencesCount} Zone${assignedGeofencesCount === 1 ? '' : 's'}`}
                                size="small"
                                sx={{
                                  height: '16px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#f5f3ff',
                                  color: '#8b5cf6',
                                  fontFamily: FONT_FAMILY,
                                }}
                              />
                            )}
                            {rule.speedLimit && (
                              <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, color: rule.color || '#ef4444', fontFamily: FONT_FAMILY }}>
                                {rule.speedLimit} km/h
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAnchor(e.currentTarget);
                          setActiveRuleForMenu(rule);
                        }}
                        sx={{
                          padding: '2px',
                          borderRadius: '4px',
                          color: TEXT_MUTED,
                          marginLeft: '2px',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#f1f5f9',
                            color: '#0f172a',
                          },
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: '17px' }} />
                      </IconButton>
                    </Paper>
                  );
                })
              )}
            </Box>
          )
        )}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setActiveRuleForMenu(null);
        }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        <MenuItem
          onClick={() => {
            if (activeRuleForMenu) handleTriggerEdit(activeRuleForMenu);
          }}
          sx={{ py: 0.6, px: 1.2, '&:hover': { backgroundColor: '#f0fdfa' } }}
        >
          <ListItemIcon sx={{ minWidth: '22px !important' }}>
            <EditOutlinedIcon sx={{ fontSize: '16px', color: PRIMARY }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, color: TEXT, fontFamily: FONT_FAMILY }}>
                Edit
              </Typography>
            }
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (activeRuleForMenu) {
              handleDeleteConfiguredRule(activeRuleForMenu);
            }
          }}
          sx={{ py: 0.6, px: 1.2, '&:hover': { backgroundColor: '#fef2f2' } }}
        >
          <ListItemIcon sx={{ minWidth: '20px !important' }}>
            <DeleteOutlinedIcon sx={{ fontSize: '16px', color: '#dc2626' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, color: '#dc2626', fontFamily: FONT_FAMILY }}>
                Delete
              </Typography>
            }
          />
        </MenuItem>
      </Menu>

      {alertModalOpen && (
        <AddAlertModal
          open={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setEditingRule(null);
          }}
          units={devices}
          geofences={geofences}
          initialData={editingRule}
          onSave={handleSaveUpdatedRule}
        />
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          zIndex: 999999,
          top: '14px !important',
          right: '14px !important',
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'transparent !important',
            boxShadow: 'none !important',
            padding: 0,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            backgroundColor: toast.severity === 'error' ? '#ef4444' : '#00ab8e',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '6px 14px',
            boxShadow:
              toast.severity === 'error'
                ? '0 8px 20px -2px rgba(220, 38, 38, 0.4)'
                : '0 8px 20px -2px rgba(0, 171, 142, 0.4)',
            fontFamily: FONT_FAMILY,
            minWidth: '220px',
            maxWidth: '340px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.severity === 'error' ? (
              <ErrorOutlineOutlinedIcon sx={{ color: '#ffffff', fontSize: '1.15rem' }} />
            ) : (
              <CheckIcon sx={{ color: '#ffffff', fontSize: '1.15rem' }} />
            )}
            <Typography sx={{ color: '#ffffff', fontSize: FONT_SIZE_12, fontWeight: 700 }}>
              {toast.message}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ color: '#ffffff', p: 0.2 }}>
            <CloseIcon sx={{ fontSize: '0.95rem' }} />
          </IconButton>
        </Box>
      </Snackbar>
    </Box>
  );
};

export default memo(EventsDrawer);