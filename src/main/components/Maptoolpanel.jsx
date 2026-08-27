import { useState, useEffect, useCallback } from 'react';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import maplibregl from 'maplibre-gl';
import LayersIcon from '@mui/icons-material/Layers';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ExploreIcon from '@mui/icons-material/Explore';
import MapIcon from '@mui/icons-material/Map';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CompassCalibrationIcon from '@mui/icons-material/CompassCalibration';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import usePersistedState from '../common/util/usePersistedState';
import { map } from '../map/core/MapView';

const useStyles = makeStyles()((theme) => ({
  mapToolPanel: ({ theme }) => ({
    position: 'fixed',
    top: '18px',
    right: '18px',
    left: 'auto',
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '6px',
    borderRadius: '16px',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
    pointerEvents: 'auto',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    [theme.breakpoints.down('sm')]: {
      top: '12px',
      right: '12px',
      padding: '4px',
      borderRadius: '12px',
    },
  }),
  toolbarToggle: ({ theme }) => ({
    minWidth: 0,
    width: '36px',
    height: '36px',
    padding: 0,
    borderRadius: '11px',
    color: theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
      color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#0f172a',
    },
  }),
  toolbarCollapsed: {
    gap: 0,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  divider: ({ theme }) => ({
    height: '1px',
    margin: '6px 4px',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
  }),
  mapToolBtn: ({ theme }) => ({
    minWidth: 0,
    width: '36px',
    height: '36px',
    padding: 0,
    borderRadius: '11px',
    color: theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569',
    transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
    '& svg': {
      fontSize: '19px',
    },
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.04)',
      color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#0f172a',
    },
    '&:active': {
      transform: 'scale(0.92)',
    },
  }),
  mapToolBtnActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.28)',
    color: '#38bdf8',
    '&:hover': {
      backgroundColor: 'rgba(14, 165, 233, 0.36)',
      color: '#7dd3fc',
    },
  },
}));

// Floating map controls (fullscreen/fit/center/pin/style-cycle/style-picker/overlays).
// Most of these all call into the maplibre `map` singleton or `maplibregl.Marker`
// directly, so -- like MainMap and HistoryMap -- this is its own lazily-loaded chunk.
// That keeps maplibre-gl out of MainPage's own bundle entirely; it's only ever
// pulled in by the three map-related chunks that actually need it.
const MapToolPanel = ({
  filteredPositions,
  selectedPosition,
  availableMapStyles,
  selectedMapStyle,
  setSelectedMapStyle,
  setMapStyleAnchor,
  showSnackbar,
}) => {
  const { classes, cx } = useStyles();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [isMapOverlaysHidden, setIsMapOverlaysHidden] = usePersistedState('mapOverlaysHidden', false);
  const [toolbarOpen, setToolbarOpen] = usePersistedState('mapToolbarOpen', true);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const request = document.documentElement.requestFullscreen?.bind(document.documentElement);
      if (!request) {
        showSnackbar('Fullscreen is not supported in this browser.', 'info');
        return;
      }
      request().catch(() => showSnackbar('Unable to enter fullscreen.', 'error'));
    } else {
      document.exitFullscreen?.();
    }
  }, [showSnackbar]);

  const centerOnSelectedPosition = useCallback(() => {
    if (!map || !map.loaded()) {
      showSnackbar('Map is still loading, try again in a moment.', 'info');
      return;
    }
    if (selectedPosition?.latitude && selectedPosition?.longitude) {
      map.flyTo({ center: [selectedPosition.longitude, selectedPosition.latitude], zoom: Math.max(map.getZoom(), 14) });
      showSnackbar('Centered on selected unit.', 'success');
      return;
    }
    if (!filteredPositions.length) {
      showSnackbar('No device positions available to center.', 'info');
      return;
    }
    const lats = filteredPositions.map((position) => position.latitude).filter(Boolean);
    const lons = filteredPositions.map((position) => position.longitude).filter(Boolean);
    if (!lats.length || !lons.length) {
      showSnackbar('No valid positions available on the map.', 'info');
      return;
    }
    const bounds = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 });
    showSnackbar('Fit map to visible device locations.', 'success');
  }, [filteredPositions, selectedPosition, showSnackbar]);

  const cycleMapStyle = useCallback(() => {
    if (!availableMapStyles.length) return;
    const currentIndex = availableMapStyles.findIndex((style) => style.id === selectedMapStyle);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % availableMapStyles.length;
    setSelectedMapStyle(availableMapStyles[nextIndex].id);
    showSnackbar(`Map style switched to ${availableMapStyles[nextIndex].title}.`, 'success');
  }, [availableMapStyles, selectedMapStyle, setSelectedMapStyle, showSnackbar]);

  const applyOverlayVisibility = useCallback(
    (hidden) => {
      if (!map || !map.loaded()) return;
      const layerTitles = map.getStyle()?.layers?.map((layer) => layer.metadata?.['traccar:title']).filter(Boolean);
      if (!layerTitles?.length) return;
      layerTitles.forEach((title) => {
        map.getStyle()?.layers?.forEach((layer) => {
          if (layer.metadata?.['traccar:title'] === title) {
            const visibility = hidden ? 'none' : 'visible';
            if ((map.getLayoutProperty(layer.id, 'visibility') || 'visible') !== visibility) {
              map.setLayoutProperty(layer.id, 'visibility', visibility);
            }
          }
        });
      });
    },
    [],
  );

  useEffect(() => {
    applyOverlayVisibility(isMapOverlaysHidden);
    const handleStyleData = () => applyOverlayVisibility(isMapOverlaysHidden);
    if (map) {
      map.on('styledata', handleStyleData);
    }
    return () => {
      if (map) {
        map.off('styledata', handleStyleData);
      }
    };
  }, [applyOverlayVisibility, isMapOverlaysHidden]);

  const toggleMapOverlays = useCallback(() => {
    if (!map || !map.loaded()) {
      showSnackbar('Map is still loading, try again shortly.', 'info');
      return;
    }
    const hidden = !isMapOverlaysHidden;
    setIsMapOverlaysHidden(hidden);
    applyOverlayVisibility(hidden);
    showSnackbar(hidden ? 'Map overlays hidden.' : 'Map overlays shown.', 'success');
  }, [applyOverlayVisibility, isMapOverlaysHidden, showSnackbar]);

  const dropPinAtSelected = useCallback(() => {
    if (!map || !map.loaded()) {
      showSnackbar('Map is still loading, try again shortly.', 'info');
      return;
    }
    if (!selectedPosition?.latitude || !selectedPosition?.longitude) {
      showSnackbar('Select a unit to drop a pin at its location.', 'info');
      return;
    }
    const marker = new maplibregl.Marker({ color: '#0f172a' })
      .setLngLat([selectedPosition.longitude, selectedPosition.latitude])
      .addTo(map);
    setTimeout(() => marker.remove(), 7000);
    showSnackbar('Temporary pin dropped on selected unit.', 'success');
  }, [selectedPosition, showSnackbar]);

  const zoomIn = useCallback(() => {
    if (!map || !map.loaded()) {
      showSnackbar('Map is still loading, try again in a moment.', 'info');
      return;
    }
    map.zoomTo(Math.min(map.getZoom() + 1, 22), { duration: 200 });
  }, [showSnackbar]);

  const zoomOut = useCallback(() => {
    if (!map || !map.loaded()) {
      showSnackbar('Map is still loading, try again in a moment.', 'info');
      return;
    }
    map.zoomTo(Math.max(map.getZoom() - 1, 0), { duration: 200 });
  }, [showSnackbar]);

  const resetBearing = useCallback(() => {
    if (!map || !map.loaded()) {
      showSnackbar('Map is still loading, try again in a moment.', 'info');
      return;
    }
    map.resetNorth({ duration: 300 });
    showSnackbar('Map orientation reset to north.', 'success');
  }, [showSnackbar]);

  const fitAllPositions = useCallback(() => {
    if (!map || !map.loaded()) {
      showSnackbar('Map is still loading, try again in a moment.', 'info');
      return;
    }
    if (!filteredPositions.length) {
      showSnackbar('No device positions available for map fit.', 'info');
      return;
    }
    const lats = filteredPositions.map((position) => position.latitude).filter(Boolean);
    const lons = filteredPositions.map((position) => position.longitude).filter(Boolean);
    if (!lats.length || !lons.length) {
      showSnackbar('No valid positions available on the map.', 'info');
      return;
    }
    const bounds = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 90, maxZoom: 14, duration: 800 });
    showSnackbar('Map fitted to all visible positions.', 'success');
  }, [filteredPositions, showSnackbar]);

  const toggleToolbarOpen = useCallback(() => {
    setToolbarOpen((open) => !open);
  }, [setToolbarOpen]);

  const renderToolbar = !isMobile || toolbarOpen;

  return (
    <div className={classes.mapToolPanel}>
      {isMobile && (
        <Tooltip title={toolbarOpen ? 'Collapse map tools' : 'Open map tools'} placement="left" arrow>
          <IconButton className={classes.toolbarToggle} size="small" onClick={toggleToolbarOpen}>
            {toolbarOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      )}

      {renderToolbar && (
        <>
          {/* Display group: fullscreen, overlays, style cycle, style picker */}
          <div className={classes.group}>
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} placement="left" arrow>
              <IconButton
                className={cx(classes.mapToolBtn, isFullscreen && classes.mapToolBtnActive)}
                size="small"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title={isMapOverlaysHidden ? 'Show overlays' : 'Hide overlays'} placement="left" arrow>
              <IconButton
                className={cx(classes.mapToolBtn, isMapOverlaysHidden && classes.mapToolBtnActive)}
                size="small"
                onClick={toggleMapOverlays}
              >
                <LayersIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cycle map style" placement="left" arrow>
              <IconButton className={classes.mapToolBtn} size="small" onClick={cycleMapStyle}>
                <ExploreIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Map style" placement="left" arrow>
              <IconButton
                className={classes.mapToolBtn}
                size="small"
                onClick={(e) => setMapStyleAnchor(e.currentTarget)}
              >
                <MapIcon />
              </IconButton>
            </Tooltip>
          </div>

          <div className={classes.divider} />

          {/* Navigate group: fit all, center selected, drop pin */}
          <div className={classes.group}>
            <Tooltip title="Zoom in" placement="left" arrow>
              <IconButton className={classes.mapToolBtn} size="small" onClick={zoomIn}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom out" placement="left" arrow>
              <IconButton className={classes.mapToolBtn} size="small" onClick={zoomOut}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset north" placement="left" arrow>
              <IconButton className={classes.mapToolBtn} size="small" onClick={resetBearing}>
                <CompassCalibrationIcon />
              </IconButton>
            </Tooltip>
          </div>
          <div className={classes.divider} />
          <div className={classes.group}>
            <Tooltip title="Fit all devices" placement="left" arrow>
              <IconButton className={classes.mapToolBtn} size="small" onClick={fitAllPositions}>
                <GpsFixedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Center selected unit" placement="left" arrow>
              <IconButton className={classes.mapToolBtn} size="small" onClick={centerOnSelectedPosition}>
                <MyLocationIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Drop pin at selection" placement="left" arrow>
              <IconButton className={classes.mapToolBtn} size="small" onClick={dropPinAtSelected}>
                <PinDropIcon />
              </IconButton>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
};

export default MapToolPanel;