import React, { useState, useCallback, useMemo } from 'react';
import {
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useLocation, useSearchParams, Outlet } from 'react-router-dom';

// Store & Hooks
import { devicesActions, eventsActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import fetchOrThrow from '../common/util/fetchOrThrow';
import MapView, { map } from '../map/core/MapView';
import GeofenceSidebar from '../map/GeofenceSidebar';

// Local Map Components
import useFilter from './useFilter';
import HistoryMap from './Historymap';
import ObjectsView from './components/ObjectsView';
import ActivityView from './components/ActivityView';
import HistorySidebar from './components/HistorySidebar';
import AddAlertModal from './components/AddAlertModal';
import StatusCard from '../common/components/StatusCard';
import MapToolbar from '../map/main/MapToolbar';

// Map Overlay Components
import MapPositions from '../map/MapPositions';
import MapCurrentLocation from '../map/MapCurrentLocation';

// Icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';

const useStyles = makeStyles()(() => ({
  workspaceRoot: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important",
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',

    '& .maplibregl-popup': {
      zIndex: '3000 !important',
      pointerEvents: 'auto !important',
    },
    '& .maplibregl-popup-content': {
      padding: '0 !important',
      borderRadius: '12px !important',
      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25), 0 8px 10px -6px rgba(15, 23, 42, 0.2) !important',
      background: '#ffffff !important',
      border: '1px solid #e2e8f0 !important',
      overflow: 'hidden !important',
    },
    '& .maplibregl-popup-close-button': {
      fontSize: '16px !important',
      color: '#64748b !important',
      padding: '4px 8px !important',
      right: '4px !important',
      top: '4px !important',
      borderRadius: '6px !important',
      outline: 'none !important',
      '&:hover': {
        backgroundColor: '#f1f5f9 !important',
        color: '#0f172a !important',
      },
    },
  },
  mainContentArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    display: 'flex',
  },
  mapContainerWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
  },

  /* FLOATING TOOLBAR CONTAINER DOCKED RIGHT */
  mapToolbarWrapper: {
    position: 'absolute !important',
    top: '12px !important',
    right: '12px !important',
    transform: 'none !important',
    zIndex: '2000 !important',
    pointerEvents: 'auto !important',
    display: 'flex !important',
    flexDirection: 'column !important',
    alignItems: 'center !important',
    width: 'auto !important',
    height: 'auto !important',
  },

  floatingSidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '320px',
    maxWidth: 'calc(100% - 60px)',
    height: '100%',
    zIndex: 900,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#ffffff',
    borderRight: '1px solid var(--tl-border-light, #e2e8f0)',
    boxShadow: '4px 0 20px rgba(15, 23, 42, 0.06)',
  },
  sidebarContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    height: '100%',
    backgroundColor: 'transparent',
  },
  toggleSidebarBtn: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 950,
    width: '32px',
    height: '32px',
    padding: 0,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--tl-border-light, #e2e8f0)',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
    color: '#0f172a',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: 'var(--tl-primary, #00ab8e)',
    },
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid var(--tl-border-light, #e2e8f0)',
    minHeight: '48px',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#0f172a',
    '& h3': { margin: 0, fontSize: '0.92rem', fontWeight: 700 },
  },
  closeSidebarBtn: {
    border: '1px solid var(--tl-border, #cbd5e1)',
    borderRadius: '6px',
    padding: '4px',
    color: 'var(--tl-primary, #00ab8e)',
    backgroundColor: '#ffffff',
  },
  historyPanelContent: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
  historyTop: { padding: '12px 12px 0' },
  historySummaryRowExtended: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', padding: '8px 10px 10px' },
  historySummaryCardExtended: { padding: '8px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' },
  historySummaryLabelExtended: { fontSize: '0.64rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' },
  historySummaryValueExtended: { fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' },
  addDeviceDialog: { '& .MuiPaper-root': { borderRadius: '16px', width: '560px', maxWidth: '90vw' } },

  /* STATUS CARD CONTAINER - FLUSH RIGHT */
  statusCardContainer: {
    position: 'absolute',
    bottom: '8px',
    left: '12px',
    right: '12px',
    zIndex: 850,
    pointerEvents: 'none',
    display: 'flex',
    transition: 'padding-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '& > *': {
      pointerEvents: 'auto',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
    },
  },
}));

const ALLOWED_MAP_IDS = ['googleRoad', 'googleHybrid', 'googleSatellite', 'googleTerrain', 'osm', 'cartoDark', 'openTopoMap'];
const EMPTY_DEVICE_FORM = { name: '', identifier: '', group: '', phone: '', model: '', contact: '', category: '', expiration: '', active: true, userId: '' };

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0 min';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h <= 0 ? `${m} min` : `${h} h ${m} min`;
};
const formatDistance = (meters) => (meters ? `${(meters / 1000).toFixed(1)} km` : '0 km');

const buildTimeline = (trips, stops) => {
  const items = [
    ...trips.map((t) => ({ id: `trip-${t.startTime}`, type: 'trip', start: t.startTime, end: t.endTime, data: t })),
    ...stops.map((s) => ({ id: `stop-${s.startTime}`, type: 'stop', start: s.startTime, end: s.endTime, data: s })),
  ];
  items.sort((a, b) => new Date(a.start) - new Date(b.start));
  return items;
};

const MainPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isMapRoute = location.pathname === '/' || location.pathname === '';
  const activeMenu = searchParams.get('tab') || 'Objects';

  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [deviceData, setDeviceData] = useState(EMPTY_DEVICE_FORM);
  const [saving, setSaving] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = useCallback((message, severity = 'success') => setSnackbar({ open: true, message, severity }), []);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions, shallowEqual);
  const groups = useSelector((state) => state.groups?.items || {}, shallowEqual);
  const geofencesById = useSelector((state) => state.geofences?.items || {}, shallowEqual);
  const geofences = useMemo(() => Object.values(geofencesById), [geofencesById]);
  const devicesById = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const eventsById = useSelector((state) => state.events?.items || {}, shallowEqual);

  const [filter] = usePersistedState('deviceFilter', { statuses: [], groups: [], geofences: [] });
  const [filterSort] = usePersistedState('filterSort', '');
  const [filterMap] = usePersistedState('filterMap', false);

  const { filteredDevices, filteredPositions } = useFilter('', filter, filterSort, filterMap, positions);
  
  const positionsById = useMemo(() => {
    const mapObj = {};
    if (Array.isArray(filteredPositions)) {
      filteredPositions.forEach((p) => { mapObj[p.deviceId] = p; });
    }
    return mapObj;
  }, [filteredPositions]);

  const selectedPosition = useMemo(() => {
    if (!selectedDeviceId) return null;
    return positionsById[selectedDeviceId] || (Array.isArray(positions) ? positions.find(p => p.deviceId === selectedDeviceId) : null);
  }, [selectedDeviceId, positionsById, positions]);

  const [selectedMapStyle, setSelectedMapStyle] = usePersistedState('selectedMapStyle', 'osm');
  const [mapStyleAnchor, setMapStyleAnchor] = useState(null);

  const [devicesOpen, setDevicesOpen] = useState(true);
  const [drawMode, setDrawMode] = useState(null);

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [alertsTab, setAlertsTab] = useState(0);

  const [historyPositions, setHistoryPositions] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyTimeline, setHistoryTimeline] = useState([]);

  const fetchHistoryTimeline = useCallback(async (deviceId, rangeFrom, rangeTo) => {
    try {
      const query = new URLSearchParams({ deviceId, from: rangeFrom, to: rangeTo });
      const [tripsResponse, stopsResponse] = await Promise.all([
        fetchOrThrow(`/api/reports/trips?${query.toString()}`),
        fetchOrThrow(`/api/reports/stops?${query.toString()}`),
      ]);
      const [trips, stops] = await Promise.all([tripsResponse.json(), stopsResponse.json()]);
      setHistoryTimeline(buildTimeline(trips, stops));
    } catch (error) {
      console.error('Failed to load history timeline:', error);
      setHistoryTimeline([]);
    }
  }, []);

  const handleHistoryShow = useCallback(async ({ deviceIds, from: rangeFrom, to: rangeTo }) => {
    const deviceId = deviceIds?.find(() => true) || selectedDeviceId;
    setHistoryPositions([]);
    try {
      const query = new URLSearchParams({ deviceId, from: rangeFrom, to: rangeTo });
      const response = await fetchOrThrow(`/api/positions?${query.toString()}`);
      const newPositions = await response.json();
      setHistoryPositions(newPositions);
      setHistoryIndex(0);
      if (newPositions.length) fetchHistoryTimeline(deviceId, rangeFrom, rangeTo);
    } catch (error) {
      showSnackbar('Could not load selected history range.', 'error');
    }
  }, [fetchHistoryTimeline, selectedDeviceId, showSnackbar]);

  const historySummary = useMemo(() => {
    const trips = historyTimeline.filter((i) => i.type === 'trip').map((i) => i.data);
    const totalDistance = trips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const totalDuration = trips.reduce((sum, t) => sum + (t.duration || 0), 0);
    return { totalDistance, totalDuration };
  }, [historyTimeline]);

  const handleCloseAddDevice = () => {
    setAddDeviceOpen(false);
    setDeviceData(EMPTY_DEVICE_FORM);
  };

  const handleSaveDevice = async () => {
    if (!deviceData.name.trim() || !deviceData.identifier.trim()) {
      showSnackbar('Unit name and IMEI are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deviceData.name,
          uniqueId: deviceData.identifier,
          phone: deviceData.phone,
          model: deviceData.model,
          contact: deviceData.contact,
          category: deviceData.category || undefined,
          disabled: !deviceData.active,
          groupId: deviceData.group ? Number(deviceData.group) : undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to add device');
      const device = await response.json();
      dispatch(devicesActions.add(device));
      showSnackbar(`"${device.name}" added successfully.`, 'success');
      handleCloseAddDevice();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFitAllBounds = useCallback(() => {
    if (!map || !filteredPositions || filteredPositions.length === 0) return;
    const lats = filteredPositions.map((p) => p.latitude).filter(Boolean);
    const lngs = filteredPositions.map((p) => p.longitude).filter(Boolean);
    if (lats.length === 0 || lngs.length === 0) return;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    if (typeof map.fitBounds === 'function') {
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, duration: 400 });
    }
  }, [filteredPositions]);

  // INSTANT SELECTION + FAST 250ms FLY-TO (ELIMINATES SELECTION DELAY)
  const handleSelectDeviceWithFlyTo = useCallback((id) => {
    dispatch(devicesActions.selectId(id));
    const pos = positionsById[id] || (Array.isArray(positions) ? positions.find(p => p.deviceId === id) : null);
    if (map && typeof map.flyTo === 'function' && pos?.latitude && pos?.longitude) {
      map.flyTo({
        center: [pos.longitude, pos.latitude],
        zoom: Math.max(map.getZoom ? map.getZoom() : 17, 17),
        duration: 250, // Fast 250ms transition
        animate: true,
        essential: true,
      });
    }
  }, [dispatch, positionsById, positions]);

  const getMenuTitle = (tab) => {
    switch (tab) {
      case 'History': return 'Playback History';
      case 'Alerts': return 'Alert Notifications';
      case 'Geofences': return 'Geofence Management';
      default: return tab;
    }
  };

  return (
    <div className={classes.workspaceRoot}>
      {/* Toast Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Main Content Area */}
      <div className={classes.mainContentArea}>
        {/* MAP LAYER ALWAYS RENDERS AT THE BACK (FULLSCREEN) */}
        <div className={classes.mapContainerWrapper}>
          {activeMenu === 'History' ? (
            <HistoryMap
              selectedStyleId={selectedMapStyle}
              onSelect={setSelectedMapStyle}
              allowedMapIds={ALLOWED_MAP_IDS}
              anchorEl={mapStyleAnchor}
              setAnchorEl={setMapStyleAnchor}
              historyPositions={historyPositions}
              historyIndex={historyIndex}
              onHistoryPointClick={(_, i) => { setHistoryIndex(i); }}
              showSnackbar={showSnackbar}
            />
          ) : (
            <MapView
              filteredPositions={filteredPositions}
              selectedPosition={selectedPosition}
              selectedStyleId={selectedMapStyle}
              onSelect={setSelectedMapStyle}
              allowedMapIds={ALLOWED_MAP_IDS}
              anchorEl={mapStyleAnchor}
              setAnchorEl={setMapStyleAnchor}
              showTraffic={showTraffic}
              userLocation={userLocation}
              showSnackbar={showSnackbar}
            >
              {/* VEHICLE MARKERS OVERLAY LAYER */}
              <MapPositions
                positions={filteredPositions}
                onMarkerClick={(positionId, deviceId) => {
                  handleSelectDeviceWithFlyTo(deviceId);
                }}
                showLabels={true}
                showMarkers={true}
              />

              {/* LIVE GPS USER LOCATION MARKER */}
              {userLocation && <MapCurrentLocation location={userLocation} />}
            </MapView>
          )}
        </div>

        {/* MAP TOOLBAR (Docked cleanly top-right) */}
        {isMapRoute && (
          <div className={classes.mapToolbarWrapper}>
            <MapToolbar
              map={map}
              onMapTypeChange={(e) => setMapStyleAnchor(e?.currentTarget || null)}
              onCenterLocation={(coords) => {
                if (coords) {
                  const lat = Array.isArray(coords) ? coords[0] : coords.latitude;
                  const lng = Array.isArray(coords) ? coords[1] : coords.longitude;

                  if (lat && lng) {
                    setUserLocation({ latitude: lat, longitude: lng });

                    if (map && typeof map.flyTo === 'function') {
                      map.flyTo({ center: [lng, lat], zoom: 18.5, duration: 250, animate: true });
                    }
                  }
                } else if (selectedPosition?.latitude && selectedPosition?.longitude && map && typeof map.flyTo === 'function') {
                  map.flyTo({ center: [selectedPosition.longitude, selectedPosition.latitude], zoom: 18.5, duration: 250, animate: true });
                }
              }}
              onToggleGeofences={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'Geofences');
                window.history.pushState({}, '', url.toString());
              }}
              onToggleTraffic={(active) => setShowTraffic(Boolean(active))}
              onFitBounds={handleFitAllBounds}
              onFollowDevice={() => {
                if (selectedPosition?.latitude && selectedPosition?.longitude && map && typeof map.flyTo === 'function') {
                  map.flyTo({ center: [selectedPosition.longitude, selectedPosition.latitude], zoom: 18.5, duration: 250, animate: true });
                }
              }}
              showSnackbar={showSnackbar}
            />
          </div>
        )}

        {/* NON-MAP PAGES RENDER VIA OUTLET ABOVE MAP */}
        {!isMapRoute && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100% !important',
              height: '100% !important',
              zIndex: 10,
              backgroundColor: '#f8fafc',
              overflow: 'hidden !important',
            }}
          >
            <Outlet />
          </Box>
        )}

        {/* Floating Panel Trigger (When collapsed) */}
        {isMapRoute && !devicesOpen && (
          <Tooltip title="Show panel" placement="right" arrow>
            <IconButton className={classes.toggleSidebarBtn} onClick={() => setDevicesOpen(true)}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Floating Tool Panel Body */}
        {isMapRoute && devicesOpen && (
          <div className={classes.floatingSidebar}>
            <Paper square elevation={0} className={classes.sidebarContent}>
              {/* Objects Tab: Managed by ObjectsView */}
              {activeMenu === 'Objects' && (
                <Box sx={{ flex: 1, overflow: 'hidden', height: '100%' }}>
                  <ObjectsView
                    devices={filteredDevices}
                    positions={positionsById}
                    selectedDeviceId={selectedDeviceId}
                    onSelectDevice={handleSelectDeviceWithFlyTo}
                    onOpenAddUnit={() => setAddDeviceOpen(true)}
                    onCollapsePanel={() => setDevicesOpen(false)}
                  />
                </Box>
              )}

              {/* Other Tabs Header Row */}
              {activeMenu !== 'Objects' && (
                <div className={classes.headerRow}>
                  <div className={classes.headerTitleGroup}>
                    <h3>{getMenuTitle(activeMenu)}</h3>
                  </div>
                  <IconButton className={classes.closeSidebarBtn} size="small" onClick={() => setDevicesOpen(false)}>
                    <ChevronLeftIcon />
                  </IconButton>
                </div>
              )}

              {activeMenu === 'History' && (
                <div className={classes.historyPanelContent}>
                  <div className={classes.historyTop}>
                    <HistorySidebar
                      selectedDeviceId={selectedDeviceId}
                      onSelect={(id) => dispatch(devicesActions.selectId(id))}
                      onShow={handleHistoryShow}
                    />
                    {historyPositions.length > 0 && (
                      <div className={classes.historySummaryRowExtended}>
                        <div className={classes.historySummaryCardExtended}>
                          <div className={classes.historySummaryLabelExtended}>Total Dist.</div>
                          <div className={classes.historySummaryValueExtended}>{formatDistance(historySummary.totalDistance)}</div>
                        </div>
                        <div className={classes.historySummaryCardExtended}>
                          <div className={classes.historySummaryLabelExtended}>Travel Time</div>
                          <div className={classes.historySummaryValueExtended}>{formatDuration(historySummary.totalDuration)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMenu === 'Alerts' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Tabs value={alertsTab} onChange={(e, v) => setAlertsTab(v)} variant="fullWidth">
                    <Tab label="Activity" />
                    <Tab label="Set Rules" />
                  </Tabs>
                  {alertsTab === 0 ? (
                    <ActivityView
                      events={eventsById}
                      devices={Object.values(devicesById)}
                      onDelete={(id) => dispatch(eventsActions.delete(id))}
                    />
                  ) : (
                    <Box sx={{ p: 1, flex: 1, overflowY: 'auto' }}>
                      <Button variant="contained" size="small" fullWidth startIcon={<AddIcon />} onClick={() => setRuleDialogOpen(true)}>
                        Add Rule
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {activeMenu === 'Geofences' && (
                <GeofenceSidebar onDrawModeChange={setDrawMode} drawMode={drawMode} />
              )}
            </Paper>
          </div>
        )}

        {/* FLOATING STATUS CARD */}
        {isMapRoute && selectedDeviceId && (
          <div
            className={classes.statusCardContainer}
            style={{
              paddingLeft: devicesOpen ? '328px' : '0px',
            }}
          >
            <StatusCard
              deviceId={selectedDeviceId}
              position={selectedPosition}
              devicesOpen={devicesOpen}
              onClose={() => dispatch(devicesActions.selectId(null))}
            />
          </div>
        )}
      </div>

      {/* Add Unit Dialog */}
      <Dialog open={addDeviceOpen} onClose={handleCloseAddDevice} className={classes.addDeviceDialog}>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Add New Unit</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth size="small" label="Unit Name / Plate Number" required sx={{ mt: 1, mb: 2 }}
            value={deviceData.name} onChange={(e) => setDeviceData({ ...deviceData, name: e.target.value })}
          />
          <TextField
            fullWidth size="small" label="IMEI Number" required sx={{ mb: 2 }}
            value={deviceData.identifier} onChange={(e) => setDeviceData({ ...deviceData, identifier: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDevice} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDevice} disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Alert Modal */}
      <AddAlertModal
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        units={Object.values(devicesById)}
        groups={Object.values(groups)}
        geofences={geofences}
      />
    </div>
  );
};

export default MainPage;