import React, { useState, useCallback, memo } from 'react';
import {
  Paper,
  IconButton,
  Tooltip,
  Box,
  Collapse,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import MapIcon from '@mui/icons-material/Map';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrafficIcon from '@mui/icons-material/Traffic';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';

import { map } from '../core/MapView';

const useStyles = makeStyles()((theme) => ({
  toolbarContainer: {
    display: 'flex !important',
    flexDirection: 'column !important',
    alignItems: 'center !important',
    gap: '6px !important',
    pointerEvents: 'auto !important',
    width: '40px !important',
    maxHeight: 'calc(100dvh - 90px)',
    boxSizing: 'border-box !important',
    margin: '0 !important',
    padding: '0 !important',
    position: 'relative',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    [theme.breakpoints.down('sm')]: {
      width: '36px !important',
      gap: '5px !important',
      maxHeight: 'calc(100dvh - 110px)',
    },
  },

  pillCard: {
    width: '100% !important',
    backgroundColor: '#ffffff !important',
    borderRadius: '10px !important',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.14) !important',
    display: 'flex !important',
    flexDirection: 'column !important',
    alignItems: 'center !important',
    overflow: 'hidden !important',
    border: '1.2px solid #cbd5e1 !important',
    flexShrink: 0,
    boxSizing: 'border-box !important',
  },

  toolButton: {
    width: '100% !important',
    height: '38px !important',
    padding: '0 !important',
    borderRadius: '0 !important',
    color: '#475569 !important',
    backgroundColor: '#ffffff !important',
    transition: 'all 0.15s ease-in-out !important',
    boxSizing: 'border-box !important',
    '&:hover': {
      backgroundColor: '#f1f5f9 !important',
      color: '#00ab8e !important',
    },
    '&.is-active': {
      backgroundColor: '#00ab8e !important',
      color: '#ffffff !important',
      '&:hover': {
        backgroundColor: '#00967d !important',
        color: '#ffffff !important',
      },
    },
    [theme.breakpoints.down('sm')]: {
      height: '34px !important',
    },
  },

  dividerLine: {
    width: '100% !important',
    height: '1px !important',
    backgroundColor: '#e2e8f0 !important',
    flexShrink: 0,
  },
}));

const MapToolbar = ({
  onMapTypeChange,
  onCenterLocation,
  onToggleGeofences,
  onToggleTraffic,
  onMeasureDistance,
  onFitBounds,
  onToggleMarkers,
  onToggleFullMap,
  isFullMap = false,
  showMarkers = true,
  showGeofences = true,
  showTraffic = false,
  showSnackbar = () => {},
}) => {
  const { classes } = useStyles();
  const [mobileExpanded, setMobileExpanded] = useState(true);
  const [isMeasureActive, setIsMeasureActive] = useState(false);

  const handleLocateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (map && typeof map.flyTo === 'function') {
            map.flyTo([latitude, longitude], 16, { duration: 0.8 });
          }
          if (typeof onCenterLocation === 'function') {
            onCenterLocation([latitude, longitude]);
          }
          showSnackbar('Centered on your GPS location', 'success');
        },
        () => {
          showSnackbar('Location access denied or unavailable.', 'warning');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else if (typeof onCenterLocation === 'function') {
      onCenterLocation();
    }
  };

  const handleToggleMeasure = () => {
    const next = !isMeasureActive;
    setIsMeasureActive(next);
    if (typeof onMeasureDistance === 'function') {
      onMeasureDistance(next);
    }
    showSnackbar(next ? 'Ruler active. Click on map to measure.' : 'Ruler closed.', 'info');
  };

  return (
    <div className={classes.toolbarContainer}>
      {/* 1. Full Map Mode */}
      <Paper className={classes.pillCard} elevation={0}>
        <Tooltip title={isFullMap ? 'Exit Full Map' : 'Full Map'} placement="left" arrow>
          <IconButton
            className={`${classes.toolButton} ${isFullMap ? 'is-active' : ''}`}
            onClick={onToggleFullMap}
          >
            {isFullMap ? <FullscreenExitIcon sx={{ fontSize: 20 }} /> : <FullscreenIcon sx={{ fontSize: 20 }} />}
          </IconButton>
        </Tooltip>
      </Paper>

      {/* 2. Map Styles Switcher */}
      <Paper className={classes.pillCard} elevation={0}>
        <Tooltip title="Map Styles" placement="left" arrow>
          <IconButton className={classes.toolButton} onClick={onMapTypeChange}>
            <MapIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* 3. Ruler & My Location */}
      <Paper className={classes.pillCard} elevation={0}>
        <Tooltip title="Ruler" placement="left" arrow>
          <IconButton
            className={`${classes.toolButton} ${isMeasureActive ? 'is-active' : ''}`}
            onClick={handleToggleMeasure}
          >
            <SquareFootIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Tooltip>
        <div className={classes.dividerLine} />

        <Tooltip title="My Location" placement="left" arrow>
          <IconButton className={classes.toolButton} onClick={handleLocateUser}>
            <MyLocationIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Mobile Menu Toggle */}
      <Paper className={classes.pillCard} elevation={0} sx={{ display: { xs: 'flex', sm: 'none' } }}>
        <IconButton className={classes.toolButton} onClick={() => setMobileExpanded(!mobileExpanded)}>
          {mobileExpanded ? <CloseIcon sx={{ fontSize: 17 }} /> : <MoreVertIcon sx={{ fontSize: 17 }} />}
        </IconButton>
      </Paper>

      {/* 4. Core System Action Toolset */}
      <Collapse in={mobileExpanded} timeout="auto" sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Paper className={classes.pillCard} elevation={0}>
            {/* Geofences */}
            <Tooltip title={showGeofences ? 'Hide Geofences' : 'Geofences'} placement="left" arrow>
              <IconButton
                className={`${classes.toolButton} ${showGeofences ? 'is-active' : ''}`}
                onClick={() => onToggleGeofences && onToggleGeofences(!showGeofences)}
              >
                <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <div className={classes.dividerLine} />

            {/* All Objects */}
            <Tooltip title="All Objects" placement="left" arrow>
              <IconButton className={classes.toolButton} onClick={onFitBounds}>
                <CenterFocusWeakIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
            <div className={classes.dividerLine} />

            {/* Markers & Labels Toggle */}
            <Tooltip title={showMarkers ? 'Hide Markers' : 'Markers'} placement="left" arrow>
              <IconButton
                className={`${classes.toolButton} ${showMarkers ? 'is-active' : ''}`}
                onClick={() => onToggleMarkers && onToggleMarkers(!showMarkers)}
              >
                <LocationOnIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
            <div className={classes.dividerLine} />

            {/* Realtime Traffic Layer */}
            <Tooltip title={showTraffic ? 'Hide Traffic' : 'Traffic'} placement="left" arrow>
              <IconButton
                className={`${classes.toolButton} ${showTraffic ? 'is-active' : ''}`}
                onClick={() => onToggleTraffic && onToggleTraffic(!showTraffic)}
              >
                <TrafficIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* 5. Zoom Controls */}
          <Paper className={classes.pillCard} elevation={0}>
            <Tooltip title="Zoom In" placement="left" arrow>
              <IconButton className={classes.toolButton} onClick={() => map?.zoomIn()}>
                <AddIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <div className={classes.dividerLine} />

            <Tooltip title="Zoom Out" placement="left" arrow>
              <IconButton className={classes.toolButton} onClick={() => map?.zoomOut()}>
                <RemoveIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Paper>
        </Box>
      </Collapse>
    </div>
  );
};

export default memo(MapToolbar);