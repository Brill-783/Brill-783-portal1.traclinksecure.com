import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo,
} from 'react';
import {
  Snackbar,
  Alert,
  Tooltip,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useLocation, useSearchParams, Outlet } from 'react-router-dom';

import '../styles.css';
import { devicesActions, geofencesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';

import MapView, { map, resetMapCanvas } from '../map/core/MapView';
import GeofenceSidebar from '../geofence/GeofenceSidebar';
import GeofenceDraw from '../geofence/GeofenceDraw';
import useFilter from '../main/useFilter';
import HistoryMap from '../main/Historymap';

import ObjectsView from '../main/components/ObjectsView';
import HistorySidebar from '../main/components/HistorySidebar';
import EventsDrawer from '../main/components/EventsDrawer';

import MapToolbar from '../map/main/MapToolbar';
import StatusCard from '../common/components/StatusCard';
import HistoryStatusCard from '../common/components/HistoryStatusCard';

import MapPositions from '../map/MapPositions';
import MapCurrentLocation from '../map/MapCurrentLocation';
import MapGeofence from '../map/MapGeofence';
import fetchOrThrow from '../common/util/fetchOrThrow';

import NearMeIcon from '@mui/icons-material/NearMe';

const DEFAULT_MAP_CENTER = [-15.3875, 28.2814];
const DEFAULT_MAP_ZOOM = 5;
const DEVICE_FOCUS_ZOOM = 17;

const useStyles = makeStyles()((theme, { devicesOpen }) => ({
  workspaceRoot: {
    fontFamily:
      "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important",
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    boxSizing: 'border-box',
    overscrollBehavior: 'none',
    WebkitOverflowScrolling: 'touch',
    touchAction: 'manipulation',
    '& *, & *::before, & *::after': {
      boxSizing: 'border-box',
    },
  },

  mainContentArea: {
    flex: '1 1 auto',
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    display: 'flex',
    minWidth: 0,
    isolation: 'isolate',
    overscrollBehavior: 'none',
  },

  mapContainerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
    contain: 'layout paint style',
    overflow: 'hidden',
    '& .leaflet-container': {
      width: '100% !important',
      height: '100% !important',
      minWidth: '0 !important',
      minHeight: '0 !important',
    },
  },

  mapToolbarOverlay: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 900,
    pointerEvents: 'auto',
    maxWidth: 'calc(100vw - 20px)',
    overflow: 'visible',
    [theme.breakpoints.down('sm')]: {
      top: '8px',
      right: '8px',
      maxWidth: 'calc(100vw - 16px)',
    },
    '@media (max-width: 380px)': {
      top: '6px',
      right: '6px',
      maxWidth: 'calc(100vw - 12px)',
    },
  },

  floatingSidebar: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    bottom: '10px',
    width: '320px',
    maxWidth: 'calc(100vw - 20px)',
    height: 'calc(100% - 20px)',
    minHeight: 'calc(100% - 20px)',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow:
      '0 10px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    minWidth: 0,
    minHeight: 0,
    transition: 'transform 0.2s ease, opacity 0.2s ease, width 0.2s ease',
    contain: 'layout paint',
    [theme.breakpoints.down('md')]: {
      width: '300px',
      maxWidth: 'calc(100vw - 20px)',
    },
    [theme.breakpoints.down('sm')]: {
      top: '8px',
      left: '6px',
      right: '6px',
      bottom: 'auto',
      width: 'auto',
      maxWidth: 'none',
      height: 'clamp(180px, calc(100dvh - 239px), 560px)',
      maxHeight: 'calc(100dvh - 16px)',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 8px 22px rgba(15, 23, 42, 0.12)',
    },
    '@media (max-width: 380px)': {
      top: '6px',
      left: '5px',
      right: '5px',
      borderRadius: '9px',
    },
  },

  sidebarContent: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    contain: 'layout paint',
    '& > *': {
      minWidth: 0,
      maxWidth: '100%',
    },
  },

  toggleSidebarBtn: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 1250,
    width: '34px',
    height: '34px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    borderRadius: '8px',
    color: '#00ab8e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition:
      'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
    touchAction: 'manipulation',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      borderColor: '#00ab8e',
      transform: 'scale(1.03)',
    },
    '&:active': {
      transform: 'scale(0.97)',
    },
    [theme.breakpoints.down('sm')]: {
      top: '8px',
      left: '8px',
      width: '34px',
      height: '34px',
    },
    '@media (max-width: 380px)': {
      top: '6px',
      left: '6px',
      width: '32px',
      height: '32px',
    },
  },

  statusCardWrapper: {
    position: 'absolute',
    bottom: '16px',
    left: devicesOpen ? '340px' : '16px',
    right: '16px',
    maxWidth: 'calc(100vw - 32px)',
    zIndex: 1400,
    pointerEvents: 'auto',
    transition: 'left 0.2s ease',
    [theme.breakpoints.down('sm')]: {
      left: '6px',
      right: '6px',
      bottom: '12px',
      maxWidth: 'calc(100vw - 12px)',
      width: 'auto',
    },
    '@media (max-width: 380px)': {
      left: '5px',
      right: '5px',
      bottom: '10px',
      maxWidth: 'calc(100vw - 10px)',
    },
  },

  navigationLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 3500,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    pointerEvents: 'auto',
    overflow: 'hidden',
  },

  fullScreenPageWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    minHeight: 0,
    flex: '1 1 auto',
    zIndex: 10,
    backgroundColor: '#f8fafc',
    overflow: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overscrollBehaviorX: 'none',
    WebkitOverflowScrolling: 'touch',
    '& > *': {
      minWidth: 0,
      maxWidth: '100%',
    },
  },
}));

const SidebarPanel = memo(
  ({
    activeMenu,
    filteredDevices,
    positionsById,
    selectedDeviceId,
    onSelectDevice,
    onCloseSidebar,
    showSnackbar,
    onPositionsLoaded,
    onReportsLoaded,
    onSegmentClick,
    onDrawModeChange,
    drawMode,
    drawingStatus,
    classes,
  }) => (
    <div className={classes.floatingSidebar}>
      <Paper square elevation={0} className={classes.sidebarContent}>
        {activeMenu === 'Objects' && (
          <Box
            key="panel-objects"
            sx={{
              flex: '1 1 0',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <ObjectsView
              devices={filteredDevices}
              positions={positionsById}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={onSelectDevice}
              onCollapsePanel={onCloseSidebar}
              showSnackbar={showSnackbar}
            />
          </Box>
        )}

        {activeMenu === 'History' && (
          <HistorySidebar
            key="panel-history"
            selectedDeviceId={selectedDeviceId}
            onSelect={onSelectDevice}
            onClose={onCloseSidebar}
            onPositionsLoaded={onPositionsLoaded}
            onReportsLoaded={onReportsLoaded}
            onSegmentClick={onSegmentClick}
            showSnackbar={showSnackbar}
          />
        )}

        {activeMenu === 'Alerts' && (
          <EventsDrawer
            key="panel-alerts"
            open={true}
            onClose={onCloseSidebar}
            onSelectDevice={onSelectDevice}
          />
        )}

        {activeMenu === 'Geofences' && (
          <GeofenceSidebar
            key="panel-geofences"
            onDrawModeChange={onDrawModeChange}
            drawMode={drawMode}
            drawingStatus={drawingStatus}
            showSnackbar={showSnackbar}
          />
        )}
      </Paper>
    </div>
  )
);

SidebarPanel.displayName = 'SidebarPanel';

const MainPage = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), {
    noSsr: true,
  });

  const [devicesOpen, setDevicesOpen] = useState(true);
  const { classes } = useStyles({ devicesOpen });

  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isMapRoute = location.pathname === '/' || location.pathname === '';
  const activeMenu = searchParams.get('tab') || 'Objects';

  const [pageLoading] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showRoadLayer, setShowRoadLayer] = useState(false);
  const [showPoi, setShowPoi] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions, shallowEqual);
  const geofencesById = useSelector((state) => state.geofences?.items || {}, shallowEqual);

  const geofences = useMemo(() => Object.values(geofencesById), [geofencesById]);

  const [filter] = usePersistedState('deviceFilter', {
    statuses: [],
    groups: [],
    geofences: [],
  });

  const [filterSort] = usePersistedState('filterSort', '');
  const [filterMap] = usePersistedState('filterMap', false);

  const { filteredDevices, filteredPositions } = useFilter(
    '',
    filter,
    filterSort,
    filterMap,
    positions
  );

  const positionsById = useMemo(() => {
    const mapObj = {};
    if (Array.isArray(filteredPositions)) {
      filteredPositions.forEach((position) => {
        if (position && position.deviceId != null) {
          mapObj[position.deviceId] = position;
        }
      });
    }
    return mapObj;
  }, [filteredPositions]);

  const [selectedMapStyle, setSelectedMapStyle] = usePersistedState(
    'selectedMapStyle',
    'googleHybrid'
  );
  const [mapStyleAnchor, setMapStyleAnchor] = useState(null);
  const [drawMode, setDrawMode] = useState(null);
  const [drawingStatus, setDrawingStatus] = useState(null);
  const [pendingGeofenceMeta, setPendingGeofenceMeta] = useState(null);

  const [historyPositions, setHistoryPositions] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyStops, setHistoryStops] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);

  const invalidateMapSize = useCallback(() => {
    if (!map) return;
    requestAnimationFrame(() => {
      try {
        map.invalidateSize({
          pan: false,
          debounceMoveend: true,
        });
      } catch (e) {}
    });
  }, []);

  const getAccuratePosition = useCallback(
    (deviceId) => {
      const filteredPosition = positionsById[deviceId];
      if (
        filteredPosition &&
        Number.isFinite(Number(filteredPosition.latitude)) &&
        Number.isFinite(Number(filteredPosition.longitude))
      ) {
        return {
          lat: Number(filteredPosition.latitude),
          lng: Number(filteredPosition.longitude),
        };
      }

      const fallbackPosition = Array.isArray(positions)
        ? positions.find((pos) => pos.deviceId === deviceId)
        : null;

      if (
        fallbackPosition &&
        Number.isFinite(Number(fallbackPosition.latitude)) &&
        Number.isFinite(Number(fallbackPosition.longitude))
      ) {
        return {
          lat: Number(fallbackPosition.latitude),
          lng: Number(fallbackPosition.longitude),
        };
      }

      return null;
    },
    [positionsById, positions]
  );

  const focusVehicle = useCallback((targetPosition) => {
    if (!map || !targetPosition) return;

    const lat = Number(targetPosition.lat);
    const lng = Number(targetPosition.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    try {
      map.stop();
      map.invalidateSize({
        pan: false,
        debounceMoveend: true,
      });
      map.flyTo([lat, lng], DEVICE_FOCUS_ZOOM, {
        animate: true,
        duration: 0.75,
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (
      isMapRoute &&
      activeMenu === 'Objects' &&
      Array.isArray(filteredDevices) &&
      filteredDevices.length > 0
    ) {
      const isCurrentlySelected = filteredDevices.some(
        (d) => String(d.id) === String(selectedDeviceId)
      );

      if (!selectedDeviceId || !isCurrentlySelected) {
        const firstDevice = filteredDevices[0];
        if (firstDevice && firstDevice.id != null) {
          dispatch(devicesActions.selectId(firstDevice.id));
          const targetPosition = getAccuratePosition(firstDevice.id);
          if (targetPosition) {
            requestAnimationFrame(() => focusVehicle(targetPosition));
          }
        }
      }
    }
  }, [
    isMapRoute,
    activeMenu,
    selectedDeviceId,
    filteredDevices,
    dispatch,
    getAccuratePosition,
    focusVehicle,
  ]);

  useEffect(() => {
    if (!isFollowing || !selectedDeviceId) return;
    const targetPos = getAccuratePosition(selectedDeviceId);
    if (targetPos && map) {
      map.panTo([targetPos.lat, targetPos.lng], { animate: true, duration: 0.5 });
    }
  }, [positionsById, isFollowing, selectedDeviceId, getAccuratePosition]);

  useEffect(() => {
    setDevicesOpen(true);
    setUserLocation(null);
    resetMapCanvas();

    if (map) {
      try {
        map.stop();
        map.invalidateSize({
          pan: false,
          debounceMoveend: true,
        });
        map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, {
          animate: false,
        });
      } catch (e) {}
    }

    if (activeMenu !== 'History') {
      setHistoryPositions([]);
      setHistoryIndex(0);
      setHistoryStops([]);
      setHistoryEvents([]);
    }

    if (activeMenu !== 'Geofences') {
      setDrawMode(null);
      setPendingGeofenceMeta(null);
      setDrawingStatus(null);
    }
  }, [activeMenu, location.pathname]);

  useEffect(() => {
    if (!map) return;
    const handleMapBackgroundClick = (e) => {
      if (e.originalEvent?.defaultPrevented) return;
      dispatch(devicesActions.selectId(null));
    };

    map.on('click', handleMapBackgroundClick);
    return () => {
      map.off('click', handleMapBackgroundClick);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isMapRoute) return;
    let resizeFrame = null;
    const handleResize = () => {
      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
      }
      resizeFrame = requestAnimationFrame(() => {
        invalidateMapSize();
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    const timers = [50, 150, 300].map((delay) => setTimeout(handleResize, delay));

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
      }
      timers.forEach((id) => clearTimeout(id));
    };
  }, [isMapRoute, devicesOpen, activeMenu, invalidateMapSize]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const handleMarkerClick = useCallback(
    (_positionId, deviceId) => {
      dispatch(devicesActions.selectId(deviceId));
    },
    [dispatch]
  );

  const handleSelectDevice = useCallback(
    (id) => {
      if (id == null) return;
      dispatch(devicesActions.selectId(id));

      const targetPosition = getAccuratePosition(id);
      if (!targetPosition) return;

      requestAnimationFrame(() => {
        focusVehicle(targetPosition);
      });
    },
    [dispatch, getAccuratePosition, focusVehicle]
  );

  const handleCloseSidebar = useCallback(() => {
    setDevicesOpen(false);
    setTimeout(invalidateMapSize, 220);
  }, [invalidateMapSize]);

  const handleOpenSidebar = useCallback(() => {
    setDevicesOpen(true);
    setTimeout(invalidateMapSize, 220);
  }, [invalidateMapSize]);

  const handleGeofenceComplete = useCallback(
    async ({ area }) => {
      setDrawMode(null);
      setDrawingStatus(null);

      try {
        let savedGeofence;
        if (pendingGeofenceMeta?.id) {
          const res = await fetchOrThrow(
            `/api/geofences/${pendingGeofenceMeta.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: pendingGeofenceMeta.id,
                name: pendingGeofenceMeta.name,
                area: area || pendingGeofenceMeta.area,
                attributes: {
                  color: pendingGeofenceMeta.color || '#00ab8e',
                },
              }),
            }
          );
          savedGeofence = await res.json();
          dispatch(geofencesActions.update([savedGeofence]));
        } else {
          const res = await fetchOrThrow('/api/geofences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: pendingGeofenceMeta?.name || `Geofence ${geofences.length + 1}`,
              area,
              attributes: {
                color: pendingGeofenceMeta?.color || '#00ab8e',
              },
            }),
          });
          savedGeofence = await res.json();
          dispatch(geofencesActions.add(savedGeofence));
        }

        if (pendingGeofenceMeta?.deviceIds) {
          await Promise.all(
            pendingGeofenceMeta.deviceIds.map((deviceId) =>
              fetchOrThrow('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  deviceId,
                  geofenceId: savedGeofence.id,
                }),
              })
            )
          );
        }

        setShowGeofences(true);
        showSnackbar('Geofence saved successfully!', 'success');
      } catch (err) {
        showSnackbar(err.message || 'Failed to save geofence', 'error');
      } finally {
        setPendingGeofenceMeta(null);
      }
    },
    [pendingGeofenceMeta, geofences.length, dispatch, showSnackbar]
  );

  const handleGeofenceCancel = useCallback(() => {
    setDrawMode(null);
    setPendingGeofenceMeta(null);
    setDrawingStatus(null);
  }, []);

  const handleMapTypeChange = useCallback((e) => {
    if (e && e.currentTarget) {
      setMapStyleAnchor(e.currentTarget);
    }
  }, []);

  const handleCenterLocation = useCallback((coords) => {
    if (!coords) return;

    const lat = Array.isArray(coords) ? coords[0] : coords.latitude;
    const lng = Array.isArray(coords) ? coords[1] : coords.longitude;

    const numericLat = Number(lat);
    const numericLng = Number(lng);

    if (!Number.isFinite(numericLat) || !Number.isFinite(numericLng)) return;

    setUserLocation({
      latitude: numericLat,
      longitude: numericLng,
    });

    if (map) {
      try {
        map.stop();
        map.invalidateSize({
          pan: false,
          debounceMoveend: true,
        });
        map.panTo([numericLat, numericLng], {
          animate: true,
          duration: 0.5,
        });
      } catch (e) {}
    }

    setTimeout(() => {
      setUserLocation(null);
    }, 6000);
  }, []);

  const handleToggleGeofences = useCallback((active) => {
    setShowGeofences((prev) => (typeof active === 'boolean' ? active : !prev));
  }, []);

  const handleToggleTraffic = useCallback((active) => {
    setShowTraffic(Boolean(active));
  }, []);

  const handleFitBounds = useCallback(() => {
    if (
      !map ||
      !Array.isArray(filteredPositions) ||
      filteredPositions.length === 0
    ) {
      return;
    }

    const bounds = filteredPositions
      .filter(
        (pos) =>
          pos &&
          Number.isFinite(Number(pos.latitude)) &&
          Number.isFinite(Number(pos.longitude))
      )
      .map((pos) => [Number(pos.latitude), Number(pos.longitude)]);

    if (bounds.length === 1) {
      focusVehicle({
        lat: bounds[0][0],
        lng: bounds[0][1],
      });
      return;
    }

    if (bounds.length > 1) {
      try {
        map.fitBounds(bounds, {
          maxZoom: 15,
          animate: true,
          duration: 0.6,
          padding: isMobile ? [60, 60] : [80, 80],
        });
      } catch (e) {}
    }
  }, [filteredPositions, focusVehicle, isMobile]);

  const handleHistoryPositionsLoaded = useCallback((p) => {
    setHistoryPositions(Array.isArray(p) ? p : []);
    setHistoryIndex(0);
  }, []);

  const handleHistoryReportsLoaded = useCallback(({ stops, events }) => {
    setHistoryStops(Array.isArray(stops) ? stops : []);
    setHistoryEvents(Array.isArray(events) ? events : []);
  }, []);

  const handleSegmentClick = useCallback(
    (item) => {
      if (item && item.start && historyPositions.length) {
        const targetTime = new Date(item.start).getTime();
        let bestIdx = 0;
        let bestDiff = Infinity;

        historyPositions.forEach((pos, index) => {
          const diff = Math.abs(
            new Date(pos.fixTime || pos.deviceTime).getTime() - targetTime
          );
          if (diff < bestDiff) {
            bestDiff = diff;
            bestIdx = index;
          }
        });

        setHistoryIndex(bestIdx);
      }
    },
    [historyPositions]
  );

  const handleDrawModeChange = useCallback((mode, meta) => {
    setPendingGeofenceMeta(meta);
    setDrawMode(mode);
  }, []);

  const handleCloseSnackbar = useCallback(
    () => setSnackbar((prev) => ({ ...prev, open: false })),
    []
  );

  const shouldShowMapToolbar = isMapRoute && activeMenu !== 'History';

  return (
    <div className={classes.workspaceRoot}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isMobile ? 'center' : 'right',
        }}
        sx={{
          maxWidth: '100vw',
          '& .MuiSnackbarContent-root': {
            maxWidth: 'calc(100vw - 16px)',
          },
        }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            maxWidth: 'calc(100vw - 24px)',
            fontSize: {
              xs: '0.75rem',
              sm: '0.82rem',
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {pageLoading && (
        <div className={classes.navigationLoaderOverlay}>
          <CircularProgress size={36} sx={{ color: '#00ab8e' }} />
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#0f172a',
              fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Loading {activeMenu}...
          </span>
        </div>
      )}

      <div className={classes.mainContentArea}>
        {isMapRoute ? (
          <div className={classes.mapContainerWrapper}>
            {activeMenu === 'History' ? (
              <HistoryMap
                key="history-map-route"
                selectedStyleId={selectedMapStyle}
                onSelect={setSelectedMapStyle}
                anchorEl={mapStyleAnchor}
                setAnchorEl={setMapStyleAnchor}
                historyPositions={historyPositions}
                historyIndex={historyIndex}
                historyStops={historyStops}
                historyEvents={historyEvents}
                onHistoryPointClick={(_, index) => setHistoryIndex(index)}
              />
            ) : (
              <MapView
                key={`live-map-${activeMenu}`}
                selectedStyleId={selectedMapStyle}
                onSelect={setSelectedMapStyle}
                anchorEl={mapStyleAnchor}
                setAnchorEl={setMapStyleAnchor}
                showTraffic={showTraffic}
              >
                <MapPositions
                  positions={filteredPositions}
                  onMarkerClick={handleMarkerClick}
                  showLabels={showLabels}
                  showMarkers={true}
                  showTrails={showTrails}
                />

                {userLocation && (
                  <MapCurrentLocation location={userLocation} />
                )}

                <MapGeofence visible={showGeofences} />

                {activeMenu === 'Geofences' && drawMode && (
                  <GeofenceDraw
                    mode={drawMode}
                    defaultColor={pendingGeofenceMeta?.color || '#00ab8e'}
                    pendingMeta={pendingGeofenceMeta}
                    onComplete={handleGeofenceComplete}
                    onCancel={handleGeofenceCancel}
                    onStatusChange={setDrawingStatus}
                  />
                )}
              </MapView>
            )}
          </div>
        ) : (
          <Box className={classes.fullScreenPageWrapper}>
            <Outlet />
          </Box>
        )}

        {shouldShowMapToolbar && (
          <div className={classes.mapToolbarOverlay}>
            <MapToolbar
              map={map}
              showGeofences={showGeofences}
              showTraffic={showTraffic}
              showTrails={showTrails}
              showLabels={showLabels}
              onMapTypeChange={handleMapTypeChange}
              onCenterLocation={handleCenterLocation}
              onToggleGeofences={handleToggleGeofences}
              onToggleTraffic={handleToggleTraffic}
              onFitBounds={handleFitBounds}
              onFollowDevice={(active) => {
                if (active && !selectedDeviceId) {
                  showSnackbar('Please select a unit first to follow it.', 'warning');
                  return;
                }
                setIsFollowing(Boolean(active));
              }}
              onMeasureDistance={(_active) => {}}
              onToggleTrails={(active) => setShowTrails(Boolean(active))}
              onToggleLabels={(active) => setShowLabels(Boolean(active))}
              onToggleRoadLayer={(active) => setShowRoadLayer(Boolean(active))}
              onTogglePoi={(active) => setShowPoi(Boolean(active))}
              onTogglePoiFilter={(_active) => {}}
              onGetDirections={(_active) => {
                if (selectedDeviceId && positionsById[selectedDeviceId]) {
                  const pos = positionsById[selectedDeviceId];
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${pos.latitude},${pos.longitude}`, '_blank');
                } else {
                  showSnackbar('Select a unit to get directions.', 'info');
                }
              }}
              showSnackbar={showSnackbar}
            />
          </div>
        )}

        {isMapRoute && !devicesOpen && (
          <Tooltip title="Units" placement="right" arrow>
            <div className={classes.toggleSidebarBtn} onClick={handleOpenSidebar}>
              <NearMeIcon
                sx={{
                  fontSize: isMobile ? '17px' : '18px',
                  color: '#00ab8e',
                  transform: 'rotate(45deg)',
                }}
              />
            </div>
          </Tooltip>
        )}

        {isMapRoute && devicesOpen && (
          <SidebarPanel
            activeMenu={activeMenu}
            filteredDevices={filteredDevices}
            positionsById={positionsById}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={handleSelectDevice}
            onCloseSidebar={handleCloseSidebar}
            showSnackbar={showSnackbar}
            onPositionsLoaded={handleHistoryPositionsLoaded}
            onReportsLoaded={handleHistoryReportsLoaded}
            onSegmentClick={handleSegmentClick}
            onDrawModeChange={handleDrawModeChange}
            drawMode={drawMode}
            drawingStatus={drawingStatus}
            classes={classes}
          />
        )}

        {/* 1. Live Real-Time Telemetry Card: ONLY in Live Objects View */}
        {isMapRoute && selectedDeviceId && activeMenu === 'Objects' && (
          <div className={classes.statusCardWrapper}>
            <StatusCard
              deviceId={selectedDeviceId}
              devicesOpen={devicesOpen}
              onClose={() => dispatch(devicesActions.selectId(null))}
            />
          </div>
        )}

        {/* 2. History Playback Scrubber & Graph / Data Log Table: ONLY in History View */}
        {isMapRoute && activeMenu === 'History' && historyPositions.length > 0 && (
          <HistoryStatusCard
            positions={historyPositions}
            currentIndex={historyIndex}
            devicesOpen={devicesOpen}
            onIndexChange={setHistoryIndex}
          />
        )}
      </div>
    </div>
  );
};

export default memo(MainPage);