import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { devicesActions, sessionActions, groupsActions } from './store';
import { eventsActions } from './store/events';
import { useCatchCallback } from './reactHelper';
import { snackBarDurationLongMs } from './common/util/duration';
import { playAlertSound } from './main/components/AddAlertModal';
import {
  handleNativeNotificationListeners,
  nativePostMessage,
} from './common/components/NativeInterface';

const LOGOUT_CODE = 4000;
const INITIAL_RETRY_DELAY = 3000;
const MAX_RETRY_DELAY = 30000;
const MAX_STACKED_TOASTS = 5;
const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const getEventIcon = (type) => {
  switch (type) {
    case 'deviceOverspeed':
      return <SpeedIcon sx={{ fontSize: 18, color: '#ffffff' }} />;
    case 'geofenceEnter':
    case 'geofenceExit':
      return <LocationOnIcon sx={{ fontSize: 18, color: '#ffffff' }} />;
    case 'alarm':
      return <WarningAmberIcon sx={{ fontSize: 18, color: '#ffffff' }} />;
    default:
      return <NotificationsActiveIcon sx={{ fontSize: 18, color: '#ffffff' }} />;
  }
};

const formatEventTitle = (event, deviceName) => {
  switch (event.type) {
    case 'deviceOverspeed':
      return `Speed Alert: ${deviceName}`;
    case 'geofenceEnter':
      return `Zone Entry: ${deviceName}`;
    case 'geofenceExit':
      return `Zone Exit: ${deviceName}`;
    case 'ignitionOn':
    case 'ignitionOnOff':
      return `Ignition Activated: ${deviceName}`;
    case 'ignitionOff':
      return `Ignition Turned OFF: ${deviceName}`;
    case 'deviceMoving':
    case 'startMovement':
      return `Movement Started: ${deviceName}`;
    case 'deviceStopped':
      return `Unit Stopped: ${deviceName}`;
    case 'deviceOnline':
      return `Unit Connected: ${deviceName}`;
    case 'deviceOffline':
      return `Unit Disconnected: ${deviceName}`;
    case 'alarm':
      return `Alarm Triggered: ${deviceName}`;
    default:
      return `Alert: ${deviceName}`;
  }
};

const SocketController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.session?.user);
  const userId = user?.id;
  const authenticated = Boolean(user);
  const includeLogs = useSelector((state) => state.session?.includeLogs);
  const devices = useSelector((state) => state.devices?.items || {});
  const geofences = useSelector((state) => state.geofences?.items || {});

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY);
  const isMountedRef = useRef(true);

  const [notifications, setNotifications] = useState([]);
  const toastContainerRef = useRef(null);

  const [serverRules, setServerRules] = useState([]);
  const serverRulesRef = useRef([]);
  serverRulesRef.current = serverRules;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setServerRules([]);
      return;
    }
    let active = true;

    fetch('/api/notifications', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        if (active && Array.isArray(data)) setServerRules(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [authenticated]);

  const handleEvents = useCallback(
    (events) => {
      if (!Array.isArray(events) || events.length === 0) return;

      if (eventsActions?.add) {
        dispatch(eventsActions.add(events));
      }

      const rules = serverRulesRef.current;

      const newAlerts = events.map((event) => {
        const device = Array.isArray(devices)
          ? devices.find((d) => d.id === event.deviceId)
          : devices[event.deviceId];
        const deviceName = device ? device.name : `Unit #${event.deviceId}`;
        const geofence = event.geofenceId
          ? (Array.isArray(geofences) ? geofences.find((g) => g.id === event.geofenceId) : geofences[event.geofenceId])
          : null;

        const matchedRule = rules.find(
          (r) =>
            r.type === event.type ||
            (r.type === 'ignitionOnOff' && (event.type === 'ignitionOn' || event.type === 'ignitionOff'))
        );
        const matchedAttrs = matchedRule?.attributes || {};

        const chosenSound = event.attributes?.sound || matchedAttrs.sound || 'chime';
        const chosenColor = event.attributes?.color || matchedAttrs.color || '#ef4444';

        try {
          if (typeof playAlertSound === 'function') {
            playAlertSound(chosenSound);
          }
        } catch (e) {}

        let detailText = event.attributes?.message;
        if (!detailText) {
          if (event.type === 'deviceOverspeed') {
            const currentSpeed = event.attributes?.speed
              ? Math.round(event.attributes.speed * 1.852)
              : null;
            const limit = matchedAttrs.speedLimit
              ? Math.round(matchedAttrs.speedLimit * 1.852)
              : (event.attributes?.speedLimit ? Math.round(event.attributes.speedLimit * 1.852) : null);
            detailText = currentSpeed && limit
              ? `Moving at ${currentSpeed} km/h (Limit: ${limit} km/h)`
              : currentSpeed
              ? `Moving at ${currentSpeed} km/h`
              : 'Configured speed threshold exceeded.';
          } else if (geofence) {
            detailText = `Geofence Zone: ${geofence.name}`;
          } else {
            detailText = `Triggered at ${new Date(event.eventTime || Date.now()).toLocaleTimeString()}`;
          }
        }

        return {
          id: event.id || `${Date.now()}-${Math.random()}`,
          eventId: event.id,
          deviceId: event.deviceId,
          title: formatEventTitle(event, deviceName),
          message: detailText,
          color: chosenColor,
          type: event.type,
          time: new Date(event.eventTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
      });

      setNotifications((prev) => {
        const combined = [...prev, ...newAlerts];
        return combined.slice(-MAX_STACKED_TOASTS);
      });
    },
    [dispatch, devices, geofences]
  );

  const handleEventsRef = useRef(handleEvents);
  handleEventsRef.current = handleEvents;

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connectSocket = useCallback(() => {
    clearReconnectTimeout();

    if (socketRef.current) {
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/api/socket`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!isMountedRef.current) return;
      retryDelayRef.current = INITIAL_RETRY_DELAY;
      dispatch(sessionActions.updateSocket(true));
      if (includeLogs) {
        try {
          socket.send(JSON.stringify({ logs: true }));
        } catch {}
      }
    };

    socket.onclose = (event) => {
      if (!isMountedRef.current) return;
      dispatch(sessionActions.updateSocket(false));
      socketRef.current = null;

      if (event.code === LOGOUT_CODE) return;

      clearReconnectTimeout();
      const delay = retryDelayRef.current;
      retryDelayRef.current = Math.min(delay * 1.5, MAX_RETRY_DELAY);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (isMountedRef.current) {
          connectSocket();
        }
      }, delay);
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {}
    };

    socket.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.devices) {
          dispatch(devicesActions.update(data.devices));
        }
        if (data.positions) {
          dispatch(sessionActions.updatePositions(data.positions));
        }
        if (data.events) {
          handleEventsRef.current(data.events);
        }
        if (data.logs) {
          dispatch(sessionActions.updateLogs(data.logs));
        }
        if (data.groups && groupsActions?.update) {
          dispatch(groupsActions.update(data.groups));
        }
      } catch {}
    };
  }, [clearReconnectTimeout, dispatch, includeLogs]);

  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ logs: Boolean(includeLogs) }));
      } catch {}
    }
  }, [includeLogs]);

  useEffect(() => {
    if (authenticated) {
      nativePostMessage('authenticated');
      // Force clean reconnection if user ID changed
      if (socketRef.current) {
        try { socketRef.current.close(); } catch {}
        socketRef.current = null;
      }
      connectSocket();
    } else {
      clearReconnectTimeout();
      if (socketRef.current) {
        try {
          socketRef.current.close(LOGOUT_CODE);
        } catch {}
        socketRef.current = null;
      }
      dispatch(sessionActions.updateSocket(false));
    }

    return () => {
      clearReconnectTimeout();
      if (socketRef.current) {
        try {
          socketRef.current.close(LOGOUT_CODE);
        } catch {}
        socketRef.current = null;
      }
    };
  }, [authenticated, userId, connectSocket, clearReconnectTimeout, dispatch]);

  const handleNativeNotification = useCatchCallback(
    async (message) => {
      const eventId = message.data?.eventId;
      if (eventId) {
        const response = await fetch(`/api/events/${eventId}`, { credentials: 'include' });
        if (response.ok) {
          const event = await response.json();
          handleEvents([event]);
        }
      }
    },
    [handleEvents]
  );

  useEffect(() => {
    handleNativeNotificationListeners.add(handleNativeNotification);
    return () => handleNativeNotificationListeners.delete(handleNativeNotification);
  }, [handleNativeNotification]);

  const handleToastClick = (alert) => {
    if (!alert) return;
    setNotifications((prev) => prev.filter((a) => a.id !== alert.id));
    if (alert.deviceId) {
      dispatch(devicesActions.selectId(alert.deviceId));
    }
    if (alert.eventId) {
      navigate(`/event/${alert.eventId}`);
    }
  };

  return (
    <Box
      ref={toastContainerRef}
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
        maxWidth: 380,
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {notifications.map((alert) => (
        <Snackbar
          key={alert.id}
          open
          container={() => toastContainerRef.current}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={snackBarDurationLongMs}
          onClose={() => setNotifications((prev) => prev.filter((a) => a.id !== alert.id))}
          sx={{
            position: 'relative',
            top: 'auto !important',
            right: 'auto !important',
            left: 'auto !important',
            bottom: 'auto !important',
            transform: 'none !important',
            pointerEvents: 'auto',
            '& .MuiSnackbarContent-root': {
              backgroundColor: 'transparent !important',
              boxShadow: 'none !important',
              padding: 0,
            },
          }}
        >
          <Box
            onClick={() => handleToastClick(alert)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1.5,
              backgroundColor: alert.color || '#ef4444',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.35)',
              fontFamily: FONT_FAMILY,
              width: '100%',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2, flex: 1, minWidth: 0 }}>
              <Box sx={{ mt: '2px', flexShrink: 0 }}>
                {getEventIcon(alert.type)}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <Typography sx={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.2, fontFamily: FONT_FAMILY }}>
                  {alert.title}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: '0.78rem', fontWeight: 500, mt: 0.3, lineHeight: 1.3, fontFamily: FONT_FAMILY }}>
                  {alert.message}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.70rem', fontWeight: 400, mt: 0.5, fontFamily: FONT_FAMILY }}>
                  {alert.time}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setNotifications((prev) => prev.filter((a) => a.id !== alert.id));
              }}
              sx={{ color: '#ffffff', p: 0.2, flexShrink: 0, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } }}
            >
              <CloseIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Box>
        </Snackbar>
      ))}
    </Box>
  );
};

export default SocketController;