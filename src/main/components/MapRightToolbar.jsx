import React from 'react';
import { Paper, IconButton, Tooltip } from '@mui/material';

// MUI Icons matching the image stack top-to-bottom
import CropFreeIcon from '@mui/icons-material/CropFree';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimelineIcon from '@mui/icons-material/Timeline';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NorthIcon from '@mui/icons-material/North';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

export default function MapRightToolbar({
  onToggleFullscreen,
  onToggleLayers,
  onToggleGrid,
  onCenterUser,
  onToggleGeofences,
  onToggleMarkers,
  onToggleRoutes,
  onTogglePlaces,
  onOpenReports,
  onToggleFilterActive,
  onMoreOptions,
  onOrientNorth,
  onZoomIn,
  onZoomOut,
}) {
  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: 12,
        left: '52px', // CRITICAL: Position as a compact floating toolbar on top-left
        zIndex: 850,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.6,
        p: 0.6,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
        width: 'auto !important', // STOPS THE WHITE CONTAINER STRETCH
        height: 'auto !important', // STOPS THE WHITE CONTAINER STRETCH
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Fullscreen */}
      <Tooltip title="Fullscreen" placement="right">
        <IconButton size="small" onClick={onToggleFullscreen} sx={btnWhite}>
          <CropFreeIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 2. Layers */}
      <Tooltip title="Map Style" placement="right">
        <IconButton size="small" onClick={onToggleLayers} sx={btnWhite}>
          <LayersOutlinedIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 3. Grid / Layout */}
      <Tooltip title="Grid" placement="right">
        <IconButton size="small" onClick={onToggleGrid} sx={btnWhite}>
          <GridViewIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 4. Center / Location */}
      <Tooltip title="Center Location" placement="right">
        <IconButton size="small" onClick={onCenterUser} sx={btnWhite}>
          <MyLocationIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 5. Geofences (TEAL) */}
      <Tooltip title="Geofences" placement="right">
        <IconButton size="small" onClick={onToggleGeofences} sx={btnTeal}>
          <ChangeHistoryIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 6. Markers (TEAL) */}
      <Tooltip title="Markers" placement="right">
        <IconButton size="small" onClick={onToggleMarkers} sx={btnTeal}>
          <LocationOnIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 7. Routes / Polyline */}
      <Tooltip title="Routes" placement="right">
        <IconButton size="small" onClick={onToggleRoutes} sx={btnWhite}>
          <TimelineIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 8. POI / Places */}
      <Tooltip title="Places" placement="right">
        <IconButton size="small" onClick={onTogglePlaces} sx={btnWhite}>
          <PlaceOutlinedIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 9. Reports / Status (TEAL) */}
      <Tooltip title="Reports" placement="right">
        <IconButton size="small" onClick={onOpenReports} sx={btnTeal}>
          <AssignmentIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 10. Filter Active Check (YELLOW) */}
      <Tooltip title="Active Filter" placement="right">
        <IconButton size="small" onClick={onToggleFilterActive} sx={btnYellow}>
          <CheckIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 11. More (...) */}
      <Tooltip title="More" placement="right">
        <IconButton size="small" onClick={onMoreOptions} sx={btnWhite}>
          <MoreHorizIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 12. Compass North */}
      <Tooltip title="Orient North" placement="right">
        <IconButton size="small" onClick={onOrientNorth} sx={btnWhite}>
          <NorthIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 13. Zoom In (+) */}
      <Tooltip title="Zoom In" placement="right">
        <IconButton size="small" onClick={onZoomIn} sx={btnCircle}>
          <AddIcon sx={iconSize} />
        </IconButton>
      </Tooltip>

      {/* 14. Zoom Out (-) */}
      <Tooltip title="Zoom Out" placement="right">
        <IconButton size="small" onClick={onZoomOut} sx={btnCircle}>
          <RemoveIcon sx={iconSize} />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

// STYLES
const iconSize = { fontSize: '18px' };

const btnWhite = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  color: '#475569',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  '&:hover': { backgroundColor: '#f8fafc', color: '#00a896' },
};

const btnTeal = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  color: '#ffffff',
  backgroundColor: '#00a896',
  '&:hover': { backgroundColor: '#008f80' },
};

const btnYellow = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  color: '#ffffff',
  backgroundColor: '#f59e0b',
  '&:hover': { backgroundColor: '#d97706' },
};

const btnCircle = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  color: '#475569',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  '&:hover': { backgroundColor: '#f1f5f9', color: '#00a896' },
};