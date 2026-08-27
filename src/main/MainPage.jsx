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
import useFilter from './useFilter';
import HistoryMap from './Historymap';

import ObjectsView from './components/ObjectsView';
import HistorySidebar from './components/HistorySidebar';
import EventsDrawer from './components/EventsDrawer';

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

const ROBOTO_FONT = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const useStyles = makeStyles()((theme, { dynamicPrimary, isMobile }) => ({
  workspaceRoot: {
    fontFamily: `${ROBOTO_FONT} !important`,
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
      fontFamily: `${ROBOTO_FONT} !important`,
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
    top: '8px',
    right: '8px',
    zIndex: 900,
    pointerEvents: 'auto',
    maxWidth: 'calc(100vw - 16px)',
    overflow: 'visible',
    [theme.breakpoints.down('sm')]: {
      top: '6px',
      right: '6px',
      maxWidth: 'calc(100vw - 12px)',
    },
  },

  // MOBILE RESPONSIVE AUTO-DOCKED VERTICAL STACK
  mobileStackContainer: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    right: '6px',
    bottom: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: '6px',
    pointerEvents: 'none',
    zIndex: 1500,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    '@media (min-width: 600px)': {
      display: 'none',
    },
  },

  desktopSidebar: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    bottom: '10px',
    width: '320px',
    height: 'calc(100% - 20px)',
    zIndex: 1500,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
    border: '1.5px solid #cbd5e1',
    overflow: 'hidden',
    '@media (max-width: 599.95px)': {
      display: 'none',
    },
  },

  mobileSidebarItem: {
    flex: '1 1 0',
    minHeight: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1.2px solid #cbd5e1',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
    overflow: 'hidden',
    pointerEvents: 'auto',
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
  },

  toggleSidebarBtn: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    zIndex: 1250,
    width: '34px',
    height: '34px',
    backgroundColor: '#ffffff',
    border: '1.2px solid #cbd5e1',
    boxShadow: '0 3px 10px rgba(15, 23, 42, 0.08)',
    borderRadius: '8px',
    color: dynamicPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    pointerEvents: 'auto',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      borderColor: dynamicPrimary,
      transform: 'scale(1.03)',
    },
  },

  desktopStatusCardWrapper: {
    position: 'absolute',
    bottom: '10px',
    left: '340px',
    right: '10px',
    zIndex: 2000,
    pointerEvents: 'auto',
    transition: 'left 0.18s ease',
    '@media (max-width: 599.95px)': {
      display: 'none',
    },
  },

  desktopStatusCardWrapperClosed: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    right: '10px',
    zIndex: 2000,
    pointerEvents: 'auto',
    transition: 'left 0.18s ease',
    '@media (max-width: 599.95px)': {
      display: 'none',
    },
  },

  mobileStatusCardItem: {
    flex: '0 0 auto',
    width: '100%',
    pointerEvents: 'auto',
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
    backdropFilter: 'blur(4px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    pointerEvents: 'auto',
  },

  fullScreenPageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    flex: '1 1 auto',
    zIndex: 10,
    backgroundColor: '#f8fafc',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
}));

const SidebarInnerContent = memo(
  ({
    activeMenu,
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
    <Paper square elevation={0} className={classes.sidebarContent}>
      {activeMenu === 'Objects' && (
        <Box
          key="panel-objects"
          sx={{
            flex: '1 1 0',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <ObjectsView
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
  )
);

SidebarInnerContent.displayName = 'SidebarInnerContent';

const MainPage = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), {
    noSsr: true,
  });

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const server = useSelector((state) => state.session?.server, shallowEqual) || {};
  const serverAttributes = server?.attributes || {};
  const dynamicPrimary = serverAttributes.colorPrimary || serverAttributes.color || '#00ab8e';

  const [devicesOpen, setDevicesOpen] = useState(true);
  const [isStatusCardExpanded, setIsStatusCardExpanded] = useState(true);
  const [isFullMapMode, setIsFullMapMode] = useState(false);
  const [showMapMarkers, setShowMapMarkers] = useState(true);

  const { classes } = useStyles({
    dynamicPrimary,
    isMobile,
  });

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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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

  const isHistoryActive = activeMenu === 'History' && historyPositions.length > 0;

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

  const handleToggleFullMap = useCallback(() => {
    setIsFullMapMode((prev) => !prev);
    setTimeout(invalidateMapSize, 180);
  }, [invalidateMapSize]);

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
        duration: 0.5,
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
      map.panTo([targetPos.lat, targetPos.lng], { animate: false });
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
  }, [isMapRoute, devicesOpen, activeMenu, isStatusCardExpanded, isFullMapMode, invalidateMapSize]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const handleMarkerClick = useCallback(
    (_positionId, deviceId) => {
      if (deviceId) {
        dispatch(devicesActions.selectId(deviceId));
      }
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
    setTimeout(invalidateMapSize, 180);
  }, [invalidateMapSize]);

  const handleOpenSidebar = useCallback(() => {
    setDevicesOpen(true);
    setTimeout(invalidateMapSize, 180);
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
              credentials: 'include',
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
            credentials: 'include',
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
                credentials: 'include',
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
        const isSmallScreen = window.innerWidth <= 480;
        map.fitBounds(bounds, {
          maxZoom: 15,
          animate: true,
          duration: 0.5,
          padding: isSmallScreen ? [20, 20] : [60, 60],
        });
      } catch (e) {}
    }
  }, [filteredPositions, focusVehicle]);

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

  const shouldShowMapToolbar = isMapRoute && !isHistoryActive;

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
            maxWidth: 'calc(100vw - 20px)',
            fontSize: {
              xs: '0.72rem',
              sm: '0.8rem',
            },
            fontWeight: 700,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {pageLoading && (
        <div className={classes.navigationLoaderOverlay}>
          <CircularProgress size={32} sx={{ color: dynamicPrimary }} />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#0f172a',
              fontFamily: ROBOTO_FONT,
            }}
          >
            Loading {activeMenu}...
          </span>
        </div>
      )}

      <div className={classes.mainContentArea}>
        {isMapRoute ? (
          <div className={classes.mapContainerWrapper}>
            {isHistoryActive ? (
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
                  showMarkers={showMapMarkers}
                  showLabels={showLabels}
                  allowPopup={true}
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
              isFullMap={isFullMapMode}
              showMarkers={showMapMarkers}
              showGeofences={showGeofences}
              showTraffic={showTraffic}
              onToggleFullMap={handleToggleFullMap}
              onToggleMarkers={setShowMapMarkers}
              onMapTypeChange={handleMapTypeChange}
              onCenterLocation={handleCenterLocation}
              onToggleGeofences={handleToggleGeofences}
              onToggleTraffic={handleToggleTraffic}
              onFitBounds={handleFitBounds}
              onMeasureDistance={(_active) => {}}
              showSnackbar={showSnackbar}
            />
          </div>
        )}

        {isMapRoute && !isFullMapMode && !devicesOpen && (
          <Tooltip title="Units" placement="right" arrow>
            <div className={classes.toggleSidebarBtn} onClick={handleOpenSidebar}>
              <NearMeIcon
                sx={{
                  fontSize: isMobile ? '16px' : '17px',
                  color: dynamicPrimary,
                  transform: 'rotate(45deg)',
                }}
              />
            </div>
          </Tooltip>
        )}

        {/* =========================================================
            DESKTOP VIEW (LARGE SCREENS)
           ========================================================= */}
        {isMapRoute && !isFullMapMode && devicesOpen && (
          <div className={classes.desktopSidebar}>
            <SidebarInnerContent
              activeMenu={activeMenu}
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
          </div>
        )}

        {isMapRoute && !isFullMapMode && selectedDeviceId && !isHistoryActive && (
          <div className={devicesOpen ? classes.desktopStatusCardWrapper : classes.desktopStatusCardWrapperClosed}>
            <StatusCard
              deviceId={selectedDeviceId}
              devicesOpen={devicesOpen}
              onExpandedChange={setIsStatusCardExpanded}
              onClose={() => {}}
            />
          </div>
        )}

        {isMapRoute && !isFullMapMode && isHistoryActive && (
          <div className={devicesOpen ? classes.desktopStatusCardWrapper : classes.desktopStatusCardWrapperClosed}>
            <HistoryStatusCard
              positions={historyPositions}
              currentIndex={historyIndex}
              devicesOpen={devicesOpen}
              onIndexChange={setHistoryIndex}
            />
          </div>
        )}

        {/* =========================================================
            MOBILE VIEW (FLEX-STACK: ALWAYS DOCKED AT BOTTOM)
           ========================================================= */}
        {isMapRoute && !isFullMapMode && (
          <div className={classes.mobileStackContainer}>
            {/* 1. TOP HALF: OBJECTS VIEW */}
            {devicesOpen && (
              <div className={classes.mobileSidebarItem}>
                <SidebarInnerContent
                  activeMenu={activeMenu}
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
              </div>
            )}

            {/* 2. BOTTOM HALF: STATUS CARD (STAYS AT THE BOTTOM) */}
            {selectedDeviceId && !isHistoryActive && (
              <div className={classes.mobileStatusCardItem}>
                <StatusCard
                  deviceId={selectedDeviceId}
                  devicesOpen={devicesOpen}
                  onExpandedChange={setIsStatusCardExpanded}
                  onClose={() => {}}
                />
              </div>
            )}

            {isHistoryActive && (
              <div className={classes.mobileStatusCardItem}>
                <HistoryStatusCard
                  positions={historyPositions}
                  currentIndex={historyIndex}
                  devicesOpen={devicesOpen}
                  onIndexChange={setHistoryIndex}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MainPage);