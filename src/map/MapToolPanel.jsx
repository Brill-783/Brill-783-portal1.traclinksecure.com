import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import FullscreenIcon from '@mui/icons-material/Fullscreen';
import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import NavigationIcon from '@mui/icons-material/Navigation';
import StreetviewIcon from '@mui/icons-material/Streetview';
import TrafficIcon from '@mui/icons-material/Traffic';

import { map } from './core/MapView';

const useStyles = makeStyles()(() => ({
  toolbar: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 900,
    display: 'flex',
    gap: '6px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '6px',
    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e5e7eb',
  },
  toolButton: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    '&:hover': {
      backgroundColor: '#00ab8e',
      color: '#ffffff',
      borderColor: '#00ab8e',
    },
    '& svg': { fontSize: '1.1rem' },
  },
  toolButtonActive: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#00ab8e',
    color: '#ffffff',
    border: '1px solid #00ab8e',
    '&:hover': {
      backgroundColor: '#008f77',
    },
    '& svg': { fontSize: '1.1rem' },
  },
}));

const MapToolPanel = ({
  filteredPositions = [],
  selectedPosition,
  setMapStyleAnchor,
  showSnackbar = () => {},
  showTraffic,
  onToggleTraffic,
}) => {
  const { classes } = useStyles();

  const handleMapStyleClick = (event) => {
    if (setMapStyleAnchor) {
      setMapStyleAnchor(event.currentTarget);
    }
  };

  const handleFitObjects = () => {
    if (!map || !filteredPositions || filteredPositions.length === 0) return;
    const bounds = filteredPositions
      .filter((p) => p.latitude && p.longitude)
      .map((p) => [p.latitude, p.longitude]);
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [50, 50] });
      showSnackbar('Fitted map to visible objects.', 'success');
    }
  };

  return (
    <div className={classes.toolbar}>
      <Tooltip title="Fullscreen" placement="bottom" arrow>
        <IconButton
          className={classes.toolButton}
          size="small"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
          }}
        >
          <FullscreenIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Maps Styles" placement="bottom" arrow>
        <IconButton
          className={classes.toolButton}
          size="small"
          onClick={handleMapStyleClick}
        >
          <MapIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Fit All Objects" placement="bottom" arrow>
        <IconButton className={classes.toolButton} size="small" onClick={handleFitObjects}>
          <MyLocationIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Compass / Reset View" placement="bottom" arrow>
        <IconButton
          className={classes.toolButton}
          size="small"
          onClick={() => {
            if (map && selectedPosition?.latitude && selectedPosition?.longitude) {
              map.flyTo([selectedPosition.latitude, selectedPosition.longitude], 17);
            }
          }}
        >
          <NavigationIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Street View" placement="bottom" arrow>
        <IconButton
          className={classes.toolButton}
          size="small"
          onClick={() => {
            if (selectedPosition?.latitude && selectedPosition?.longitude) {
              window.open(
                `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedPosition.latitude},${selectedPosition.longitude}`,
                '_blank'
              );
            } else {
              showSnackbar('Select a device to view street view.', 'info');
            }
          }}
        >
          <StreetviewIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Traffic Layer" placement="bottom" arrow>
        <IconButton
          className={showTraffic ? classes.toolButtonActive : classes.toolButton}
          size="small"
          onClick={() => onToggleTraffic && onToggleTraffic(!showTraffic)}
        >
          <TrafficIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default React.memo(MapToolPanel);