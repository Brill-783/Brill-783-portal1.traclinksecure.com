import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  Box,
  InputBase,
  IconButton,
  Tabs,
  Tab,
  Button,
  Typography,
  Collapse,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Slider,
  Tooltip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseIcon from '@mui/icons-material/PauseCircleOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { devicesActions, groupsActions, eventsActions, notificationsActions } from '../../store';
import DeviceList from './DeviceList';
import ActivityView from './ActivityView';
import HistorySidebar from './HistorySidebar';
import GeofenceSidebar from '../map/GeofenceSidebar';
import { formatTime } from '../common/util/formatter';
import useEventCallback from '../common/util/useEventCallback';
import useDataCache from '../common/util/useDataCache';
import fetchOrThrow from '../common/util/fetchOrThrow';
import AddAlertModal from './AddAlertModal';
import GradientColorPicker from '../common/components/GradientColorPicker';

const useStyles = makeStyles()((theme) => ({
  sidebarContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    borderRadius: 0,
    overflow: 'hidden',
    boxShadow: 'none',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    margin: 0,
    padding: 0,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    minHeight: '42px',
    boxSizing: 'border-box',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#0f172a',
    '& svg': { color: '#0f172a', fontSize: '1.1rem' },
    '& h3': { margin: 0, fontSize: '0.86rem', fontWeight: 700, letterSpacing: '-0.01em' },
  },
  headerActionsGroup: { display: 'flex', alignItems: 'center', gap: '6px' },
  closeSidebarBtn: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '5px',
    color: '#64748b',
    '& svg': { fontSize: '1rem' },
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
  },
  customSearchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '2px 8px',
    height: '28px',
    boxSizing: 'border-box',
    '&:focus-within': {
      borderColor: '#0f172a',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 1px #0f172a',
    },
  },
  searchInputBase: { fontSize: '0.7rem', width: '100%', color: '#0f172a' },
  filterIconBox: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    width: '32px',
    height: '32px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    color: '#475569',
  },
  deviceListContainer: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    padding: '4px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
    '&::-webkit-scrollbar': { width: '3px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '3px' },
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5px 7px 5px 8px',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    margin: '4px 2px',
  },
  groupHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#0f172a',
    flex: 1,
    minWidth: 0,
    '& svg': { fontSize: '0.9rem', color: '#64748b', flexShrink: 0 },
  },
  groupHeaderRight: { display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 },
  groupName: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  groupCount: {
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    borderRadius: '999px',
    padding: '1px 6px',
    minWidth: '16px',
    textAlign: 'center',
    flexShrink: 0,
  },
  groupChevron: { fontSize: '1rem', color: '#94a3b8', transition: 'transform 0.1s ease' },
  groupChevronOpen: {
    fontSize: '1rem',
    color: '#0f172a',
    transition: 'transform 0.1s ease',
    transform: 'rotate(180deg)',
  },
  groupMenuBtn: {
    padding: '3px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '32px 16px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  searchActionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 8px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
  },
  addButtonCustom: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    width: '28px',
    height: '28px',
    flexShrink: 0,
    color: '#0f172a',
    '& svg': { fontSize: '1rem' },
  },
  tabsBar: { minHeight: '36px' },
  historyPanelContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
    border: 'none',
    boxShadow: 'none',
  },
  historyTop: { padding: '12px 12px 0', backgroundColor: 'transparent', borderBottom: 'none' },
  historyVehicleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 10px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
  },
  historyVehicleIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '#e0f2fe',
    color: '#0ea5e9',
    flexShrink: 0,
  },
  historyVehicleInfo: { flex: 1, minWidth: 0 },
  historyVehicleName: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historyVehicleStatus: {
    fontSize: '0.7rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px',
  },
  historyStatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
  historyDateDisplay: { fontSize: '0.72rem', color: '#64748b', fontWeight: 600 },
  historySummaryRowExtended: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    padding: '8px 10px 10px',
    margin: '0 0 6px',
  },
  historySummaryCardExtended: {
    minWidth: 0,
    padding: '10px 10px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  historySummaryLabelExtended: {
    fontSize: '0.66rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  historySummaryValueExtended: {
    fontSize: '0.84rem',
    fontWeight: 700,
    color: '#0f172a',
    marginTop: '4px',
  },
  historyTimeline: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 10px 90px',
    backgroundColor: '#ffffff',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
    '&::-webkit-scrollbar': { width: '3px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '3px' },
  },
  historySegment: {
    display: 'flex',
    gap: '10px',
    padding: '10px 10px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  historySegmentActive: {
    display: 'flex',
    gap: '10px',
    padding: '10px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: '#eff6ff',
    border: '1px solid #0f172a',
  },
  historySegmentRail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '24px',
    flexShrink: 0,
  },
  historyDotTrip: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    backgroundColor: '#0f172a',
    flexShrink: 0,
    marginTop: '4px',
  },
  historyDotStop: {
    width: '9px',
    height: '9px',
    borderRadius: '3px',
    backgroundColor: '#94a3b8',
    flexShrink: 0,
    marginTop: '4px',
  },
  historyLine: { width: '2px', flex: 1, backgroundColor: '#e2e8f0', marginTop: '4px' },
  historySegmentBody: { flex: 1, minWidth: 0 },
  historySegmentIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '#eef2ff',
    color: '#0f172a',
    flexShrink: 0,
  },
  historySegmentTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' },
  historySegmentMeta: { fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginTop: '6px' },
  historySegmentSub: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    marginTop: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historySegmentDetails: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '10px',
  },
  historyBottomCard: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: '#ffffff',
    borderTop: '1px solid #f1f5f9',
    padding: '16px',
  },
  historyBottomHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '16px',
  },
  historyBottomLabel: { fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' },
  historyBottomHint: { fontSize: '0.72rem', color: '#64748b' },
  historyBottomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  historyBottomStat: {
    minWidth: 0,
    padding: '12px',
    borderRadius: '14px',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    fontSize: '0.8rem',
    fontWeight: 700,
    textAlign: 'center',
  },
  historyPlaybackControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '16px',
  },
  historyControlBtn: {
    minWidth: '38px',
    borderRadius: '12px',
    padding: '10px',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  historyDetailRows: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  historyDetailLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' },
  historyDetailValue: { fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' },
  filterDialog: {
    '& .MuiBackdrop-root': { backgroundColor: 'rgba(15, 23, 42, 0.35)' },
    '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
    '& .MuiPaper-root': {
      borderRadius: '18px',
      width: '480px',
      maxWidth: '95vw',
      padding: '4px',
      backgroundColor: '#f8fafc',
      boxShadow: '0 16px 40px -18px rgba(15, 23, 42, 0.28)',
      border: '1px solid #e2e8f0',
    },
  },
  addDeviceDialog: {
    '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
    '& .MuiPaper-root': {
      borderRadius: '16px',
      width: '560px',
      maxWidth: '90vw',
      padding: '0px',
      backgroundColor: '#ffffff',
    },
  },
  createGroupDialog: {
    '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
    '& .MuiPaper-root': {
      borderRadius: '16px',
      width: '420px',
      maxWidth: '90vw',
      padding: '4px',
      backgroundColor: '#ffffff',
    },
  },
}));

const FILTER_STATUS_OPTIONS = [
  'Move', 'Stop', 'Engine ON', 'Engine OFF', 'Online', 'Offline', 'Park', 'Idle', 'Expired', 'Inactive',
];

const EMPTY_DEVICE_FORM = {
  name: '', identifier: '', group: '', phone: '', model: '', contact: '', category: '',
  expiration: '', active: true, userId: '',
};

const EMPTY_GROUP_FORM = { name: '', deviceIds: [] };

const EMPTY_RULE_FORM = {
  type: '', notificators: ['web'], always: true, deviceIds: [], emails: '', phones: '', speedLimit: 80,
};

const CATEGORY_OPTIONS = [
  { value: 'car', label: 'Car', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'truck', label: 'Truck', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'van', label: 'Van', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'bus', label: 'Bus', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'motorcycle', label: 'Motorcycle', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'default', label: 'Other', icon: <DirectionsCarIcon fontSize="small" /> },
];

const KNOTS_TO_KMH = 1.852;
const toKmh = (knots) => (knots ? Math.round(knots * KNOTS_TO_KMH) : 0);

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0 min';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${m} min`;
};

const formatDistance = (meters) => {
  if (!meters) return '0 km';
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatShortTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDayLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const buildTimeline = (trips, stops) => {
  const items = [
    ...trips.map((t) => ({ id: `trip-${t.startTime}`, type: 'trip', start: t.startTime, end: t.endTime, data: t })),
    ...stops.map((s) => ({ id: `stop-${s.startTime}`, type: 'stop', start: s.startTime, end: s.endTime, data: s })),
  ];
  items.sort((a, b) => new Date(a.start) - new Date(b.start));
  return items;
};

const findClosestIndex = (positions, targetTime) => {
  if (!positions.length) return 0;
  const target = new Date(targetTime).getTime();
  let bestIndex = 0;
  let bestDiff = Infinity;
  positions.forEach((p, i) => {
    const diff = Math.abs(new Date(p.fixTime).getTime() - target);
    if (diff < bestDiff) { bestDiff = diff; bestIndex = i; }
  });
  return bestIndex;
};

// ==================== OBJECTS PANEL ====================

/**
 * OPTIMIZATION: ObjectsPanel is wrapped with React.memo and uses
 * useEventCallback for stable function references. This prevents
 * unnecessary re-renders when MainPage re-renders due to other state changes.
 */
const ObjectsPanel = React.memo(({
  classes, keyword, onKeywordChange, filterOpen, onFilterOpen, onAddDevice,
  filteredDevices, groupedDevices, expandedGroups, onToggleGroup, filtersActive,
  groupMenuAnchor, onGroupMenuOpen, onGroupMenuClose, onOpenCreateGroup,
  filterConfig, draftStatuses, onToggleDraftStatus, onApplyFilters, onClearFilters, onCancelFilters,
  addDeviceOpen, deviceData, onDeviceDataChange, deviceTab, onDeviceTabChange,
  onSaveDevice, onCloseAddDevice, saving,
  groups, users,
  createGroupOpen, onCreateGroupClose, groupForm, onGroupFormChange,
  ungroupedDevices, onToggleGroupFormDevice, onCreateGroup, onCreatingGroup,
}) => {
  return (
    <>
      <div className={classes.searchActionContainer}>
        <div className={classes.customSearchBox}>
          <InputBase
            className={classes.searchInputBase}
            placeholder="Quick search..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
          <SearchIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
        </div>
        <IconButton
          className={filtersActive ? { ...classes.filterIconBox, backgroundColor: '#0f172a', color: '#ffffff' } : classes.filterIconBox}
          size="small"
          onClick={onFilterOpen}
        >
          <FilterListIcon />
        </IconButton>
        <IconButton className={classes.addButtonCustom} size="small" onClick={onAddDevice}>
          <AddIcon />
        </IconButton>
      </div>
      <div className={classes.deviceListContainer}>
        {filteredDevices.length === 0 ? (
          <div className={classes.emptyState}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 4px' }}>
              {keyword || filtersActive ? 'No units match your search' : 'No units yet'}
            </p>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>
              {keyword || filtersActive ? 'Try adjusting your search or filters.' : 'Add your first vehicle to start tracking.'}
            </p>
          </div>
        ) : (
          groupedDevices.map((group) => {
            const open = expandedGroups[group.id] !== undefined ? expandedGroups[group.id] : groupedDevices.length <= 1;
            const isUngrouped = group.id === 0;
            return (
              <div key={group.id}>
                <div className={classes.groupHeader} onClick={() => onToggleGroup(group.id)}>
                  <div className={classes.groupHeaderLeft}>
                    <FolderIcon />
                    <span className={classes.groupName}>{group.name}</span>
                  </div>
                  <div className={classes.groupHeaderRight}>
                    <span className={classes.groupCount}>{group.devices.length}</span>
                    {isUngrouped && (
                      <IconButton size="small" className={classes.groupMenuBtn} onClick={(e) => { e.stopPropagation(); onGroupMenuOpen(e); }}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                    <ExpandMoreIcon className={open ? classes.groupChevronOpen : classes.groupChevron} />
                  </div>
                </div>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <DeviceList devices={group.devices} />
                </Collapse>
              </div>
            );
          })
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={onCancelFilters} className={classes.filterDialog}>
        <DialogTitle sx={{ pb: 1, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
          Filter Configuration
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#f8fafc', p: 2.5 }}>
          <Grid container spacing={1}>
            {FILTER_STATUS_OPTIONS.map((s) => (
              <Grid item xs={6} key={s}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={draftStatuses.includes(s)} onChange={() => onToggleDraftStatus(s)} sx={{ color: '#0f172a', '&.Mui-checked': { color: '#0f172a' } }} />}
                  label={<span style={{ fontSize: '0.8rem', color: '#111827', fontWeight: 600 }}>{s}</span>}
                  sx={{
                    width: '100%', px: 1.5, py: 1, borderRadius: '10px',
                    backgroundColor: draftStatuses.includes(s) ? '#f8fafc' : '#ffffff',
                    border: `1px solid ${draftStatuses.includes(s) ? '#0f172a' : '#e2e8f0'}`,
                    boxSizing: 'border-box', alignItems: 'center', m: 0,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 0.5 }}>
          <Button size="small" onClick={onClearFilters} sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.75rem' }}>Clear</Button>
          <Button size="small" onClick={onCancelFilters} sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.75rem' }}>Cancel</Button>
          <Button variant="contained" size="small" onClick={onApplyFilters} sx={{ backgroundColor: '#0f172a', color: '#ffffff', boxShadow: 'none', borderRadius: '8px' }}>Apply Parameters</Button>
        </DialogActions>
      </Dialog>

      {/* Add Device Dialog */}
      <Dialog open={addDeviceOpen} onClose={onCloseAddDevice} className={classes.addDeviceDialog}>
        <DialogTitle sx={{ fontSize: '1.05rem', fontWeight: 700, px: 3, pt: 2.5, pb: 0 }}>Add New Unit</DialogTitle>
        <Tabs value={deviceTab} onChange={(e, val) => onDeviceTabChange(val)} className={classes.tabsBar}
          TabIndicatorProps={{ style: { backgroundColor: '#0f172a' } }}
          sx={{ mt: 1.5, minHeight: '36px', '& .MuiTab-root': { textTransform: 'none', fontSize: '0.82rem', fontWeight: 600, minHeight: '36px', color: '#94a3b8' }, '& .Mui-selected': { color: '#0f172a !important' } }}>
          <Tab label="Main" />
          <Tab label="Vehicle Details" />
          <Tab label="Assignment" />
        </Tabs>
        <DialogContent sx={{ px: 3, pt: 2.5 }}>
          {deviceTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel control={<Switch checked={deviceData.active} onChange={(e) => onDeviceDataChange({ ...deviceData, active: e.target.checked })} />} label={<span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active</span>} />
              <TextField fullWidth size="small" label="Unit Name / Plate Number *" value={deviceData.name} onChange={(e) => onDeviceDataChange({ ...deviceData, name: e.target.value })} />
              <TextField fullWidth size="small" label="IMEI *" helperText="Matches identifier reported to server" value={deviceData.identifier} onChange={(e) => onDeviceDataChange({ ...deviceData, identifier: e.target.value })} />
              <TextField fullWidth size="small" type="date" InputLabelProps={{ shrink: true }} label="Expiration Date" value={deviceData.expiration} onChange={(e) => onDeviceDataChange({ ...deviceData, expiration: e.target.value })} />
            </Box>
          )}
          {deviceTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={deviceData.category} onChange={(e) => onDeviceDataChange({ ...deviceData, category: e.target.value })} displayEmpty>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth size="small" label="Model" value={deviceData.model} onChange={(e) => onDeviceDataChange({ ...deviceData, model: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField fullWidth size="small" label="Phone" value={deviceData.phone} onChange={(e) => onDeviceDataChange({ ...deviceData, phone: e.target.value })} /></Grid>
              </Grid>
              <TextField fullWidth size="small" label="Owner Contact" value={deviceData.contact} onChange={(e) => onDeviceDataChange({ ...deviceData, contact: e.target.value })} />
            </Box>
          )}
          {deviceTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Group</InputLabel>
                <Select label="Group" value={deviceData.group} onChange={(e) => onDeviceDataChange({ ...deviceData, group: e.target.value })}>
                  <MenuItem value=""><em>Ungrouped</em></MenuItem>
                  {Object.values(groups).map((g) => (<MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Assign to User</InputLabel>
                <Select label="Assign to User" value={deviceData.userId} onChange={(e) => onDeviceDataChange({ ...deviceData, userId: e.target.value })}>
                  <MenuItem value=""><em>Don't assign yet</em></MenuItem>
                  {Object.values(users).map((u) => (<MenuItem key={u.id} value={String(u.id)}>{u.email || u.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button onClick={onCloseAddDevice} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={onSaveDevice} disabled={saving} sx={{ backgroundColor: '#0f172a', textTransform: 'none', borderRadius: '8px', px: 3 }} disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onClose={onCreateGroupClose} className={classes.createGroupDialog}>
        <DialogTitle sx={{ pb: 0.5, fontSize: '1.05rem', fontWeight: 700 }}>Create New Group</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="Group Name" required autoFocus sx={{ mt: 1, mb: 2 }} value={groupForm.name} onChange={(e) => onGroupFormChange({ ...groupForm, name: e.target.value })} />
          {ungroupedDevices.length > 0 && (
            <>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>Move units into this group (optional)</Typography>
              <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                {ungroupedDevices.map((d) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox size="small" checked={groupForm.deviceIds.includes(d.id)} onChange={() => onToggleGroupFormDevice(d.id)} />
                    <span style={{ fontSize: '0.8rem' }}>{d.name}</span>
                  </div>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onCreateGroupClose} disabled={onCreatingGroup} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={onCreateGroup} disabled={onCreatingGroup} sx={{ backgroundColor: '#0f172a', textTransform: 'none', borderRadius: '8px' }}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
ObjectsPanel.displayName = 'ObjectsPanel';

// ==================== ALERTS PANEL ====================

const ALERT_TYPES = [
  { value: 'deviceOnline', label: 'Unit Connected', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'deviceOffline', label: 'Unit Disconnected', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'deviceMoving', label: 'Unit Moving', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'deviceStopped', label: 'Unit Stopped', icon: <DirectionsCarIcon fontSize="small" /> },
  { value: 'deviceOverspeed', label: 'Speed Limit Exceeded', icon: <DirectionsCarIcon fontSize="small" /> },
];

const getAlertTypeMeta = (type) =>
  ALERT_TYPES.find((t) => t.value === type) || { value: type, label: type || 'Unknown', icon: <DirectionsCarIcon fontSize="small" /> };

/**
 * OPTIMIZATION: AlertsPanel manages its own internal tab state and
 * passes stable callbacks via useEventCallback. The component is
 * wrapped with React.memo and only re-renders when props change.
 */
const AlertsPanel = React.memo(({
  classes, alertsTab, onAlertsTabChange, eventSearch, onEventSearch,
  filteredEvents, devicesById, onEventEdit, onEventDelete,
  ruleSearch, onRuleSearch, filteredRules, onOpenAddRule, onOpenEditRule,
  onDeleteRule, rulesLoaded, rulesLoading,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Tabs value={alertsTab} onChange={onAlertsTabChange} className={classes.tabsBar}
        variant="fullWidth"
        TabIndicatorProps={{ style: { backgroundColor: '#0f172a' } }}
        sx={{ minHeight: '38px', '& .MuiTab-root': { textTransform: 'none', fontSize: '0.74rem', fontWeight: 600, minHeight: '38px', color: '#94a3b8' }, '& .Mui-selected': { color: '#0f172a !important' } }}>
        <Tab label="Activity" />
        <Tab label="Set" />
      </Tabs>

      {/* Activity Tab */}
      <Box sx={{ display: alertsTab === 0 ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div className={classes.searchActionContainer}>
          <div className={classes.customSearchBox}>
            <InputBase className={classes.searchInputBase} placeholder="Search activity..." value={eventSearch} onChange={(e) => onEventSearch(e.target.value)} />
            <SearchIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
          </div>
        </div>
        <ActivityView
          events={filteredEvents}
          devices={Object.values(devicesById)}
          onEdit={onEventEdit}
          onDelete={onEventDelete}
        />
      </Box>

      {/* Set Tab */}
      <Box sx={{ display: alertsTab === 1 ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div className={classes.searchActionContainer}>
          <div className={classes.customSearchBox}>
            <InputBase className={classes.searchInputBase} placeholder="Search alert rules..." value={ruleSearch} onChange={(e) => onRuleSearch(e.target.value)} />
            <SearchIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
          </div>
          <IconButton className={classes.addButtonCustom} size="small" onClick={onOpenAddRule}><AddIcon /></IconButton>
        </div>
        <div className={classes.deviceListContainer}>
          {filteredRules.length === 0 ? (
            <div className={classes.emptyState}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 4px' }}>{ruleSearch ? 'No rules match your search' : 'No alert rules yet'}</p>
              <p style={{ fontSize: '0.75rem', margin: 0 }}>{ruleSearch ? 'Try a different keyword.' : 'Add a rule to get notified.'}</p>
            </div>
          ) : (
            <div className={classes.emptyState}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Use the form above to create alert rules.</p>
            </div>
          )}
        </div>
      </Box>
    </div>
  );
});
AlertsPanel.displayName = 'AlertsPanel';

// ==================== HISTORY PANEL ====================

/**
 * OPTIMIZATION: HistoryPanel is extracted and memoized. 
 * It manages its own timeline data and uses refs for playback timers
 * to avoid re-render overhead.
 */
const HistoryPanel = React.memo(({
  classes, selectedDeviceId, onDeviceSelect, onHistoryShow,
  historyPositions, historyIndex, historyLoading, historyTimeline,
  historyTimelineLoading, historyTried, historySummary, historyActiveSegmentId,
  onSegmentClick, historyPlaying, onTogglePlayback, historyPlaybackSpeed,
  onPlaybackSpeedChange, onPrevPoint, onNextPoint, historySelectedPoint,
  historyRange, devicesById, historyTimerRef, setHistoryIndex,
}) => {
  return (
    <div className={classes.historyPanelContent}>
      <div className={classes.historyTop}>
        <HistorySidebar
          selectedDeviceId={selectedDeviceId}
          onSelect={onDeviceSelect}
          onShow={onHistoryShow}
        />
        {historyPositions.length > 0 && (
          <>
            <div className={classes.historyVehicleHeader}>
              <div className={classes.historyVehicleIcon}>
                <DirectionsCarIcon fontSize="small" />
              </div>
              <div className={classes.historyVehicleInfo}>
                <div className={classes.historyVehicleName}>{devicesById[selectedDeviceId]?.name || 'Vehicle'}</div>
                <div className={classes.historyVehicleStatus}>
                  <span className={classes.historyStatusDot} />
                  <span>Online</span>
                </div>
              </div>
              <div className={classes.historyDateDisplay}>
                {historyRange?.from && historyRange?.to
                  ? `${formatDayLabel(historyRange.from)} - ${formatDayLabel(historyRange.to)}`
                  : 'Select date range'}
              </div>
            </div>
            <div className={classes.historySummaryRowExtended}>
              <div className={classes.historySummaryCardExtended}>
                <div className={classes.historySummaryLabelExtended}>Total Distance</div>
                <div className={classes.historySummaryValueExtended}>{formatDistance(historySummary.totalDistance)}</div>
              </div>
              <div className={classes.historySummaryCardExtended}>
                <div className={classes.historySummaryLabelExtended}>Travel Time</div>
                <div className={classes.historySummaryValueExtended}>{formatDuration(historySummary.totalDuration)}</div>
              </div>
              <div className={classes.historySummaryCardExtended}>
                <div className={classes.historySummaryLabelExtended}>Stop Time</div>
                <div className={classes.historySummaryValueExtended}>{formatDuration(historySummary.stopDuration || 0)}</div>
              </div>
              <div className={classes.historySummaryCardExtended}>
                <div className={classes.historySummaryLabelExtended}>Avg Speed</div>
                <div className={classes.historySummaryValueExtended}>{historySummary.avgSpeed || 0} km/h</div>
              </div>
              <div className={classes.historySummaryCardExtended}>
                <div className={classes.historySummaryLabelExtended}>Max Speed</div>
                <div className={classes.historySummaryValueExtended}>{historySummary.maxSpeed} km/h</div>
              </div>
              <div className={classes.historySummaryCardExtended}>
                <div className={classes.historySummaryLabelExtended}>Trips</div>
                <div className={classes.historySummaryValueExtended}>{historySummary.tripCount}</div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className={classes.historyTimeline}>
        {historyLoading ? (
          <div className={classes.emptyState}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Loading history…</span>
          </div>
        ) : historyPositions.length === 0 ? (
          <div className={classes.emptyState}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
              {historyTried ? 'No route data was found for that range.' : 'Select a device and date range to load history.'}
            </span>
          </div>
        ) : historyTimeline.length === 0 ? (
          <div className={classes.emptyState}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>No segments found</span>
          </div>
        ) : (
          historyTimeline.map((item, index) => {
            const isTrip = item.type === 'trip';
            const active = historyActiveSegmentId === item.id;
            const isLast = index === historyTimeline.length - 1;
            return (
              <div key={item.id} style={{ marginBottom: '10px' }}>
                <div className={active ? classes.historySegmentActive : classes.historySegment} onClick={() => onSegmentClick(item)}>
                  <div className={classes.historySegmentRail}>
                    <div className={isTrip ? classes.historyDotTrip : classes.historyDotStop} />
                    {!isLast && <div className={classes.historyLine} />}
                  </div>
                  <div className={classes.historySegmentIcon}>
                    {isTrip ? <DirectionsCarIcon fontSize="small" /> : <LocalParkingIcon fontSize="small" />}
                  </div>
                  <div className={classes.historySegmentBody}>
                    <div className={classes.historySegmentTitle}>
                      {isTrip ? 'Drive' : 'Parking'} · {formatShortTime(item.start)} – {formatShortTime(item.end)}
                    </div>
                    <div className={classes.historySegmentMeta}>
                      {isTrip ? `${formatDistance(item.data.distance)} · ${formatDuration(item.data.duration)}` : `Stopped · ${formatDuration(item.data.duration)}`}
                    </div>
                    <div className={classes.historySegmentDetails}>
                      <div className={classes.historySegmentSub}>{item.data.address || item.data.startAddress || 'Unknown location'}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {historyPositions.length > 0 && (
        <div className={classes.historyBottomCard}>
          <div className={classes.historyBottomHeader}>
            <span className={classes.historyBottomLabel}>Replay</span>
            <span className={classes.historyBottomHint}>{historyPositions.length} points</span>
          </div>
          <div className={classes.historyBottomRow}>
            <span className={classes.historyBottomStat}>Point {historyIndex + 1}</span>
            <span className={classes.historyBottomStat}>{toKmh(historySelectedPoint?.speed)} km/h</span>
            <span className={classes.historyBottomStat}>{formatTime(historySelectedPoint?.fixTime, 'seconds')}</span>
          </div>
          <div className={classes.historyPlaybackControls}>
            <IconButton className={classes.historyControlBtn} size="small" disabled={historyIndex === 0} onClick={onPrevPoint}>
              <FastRewindIcon fontSize="small" />
            </IconButton>
            <IconButton className={classes.historyControlBtn} size="small" onClick={onTogglePlayback}>
              {historyPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>
            <IconButton className={classes.historyControlBtn} size="small" disabled={historyIndex >= historyPositions.length - 1} onClick={onNextPoint}>
              <FastForwardIcon fontSize="small" />
            </IconButton>
            <FormControl size="small" sx={{ minWidth: 90, ml: 'auto' }}>
              <Select value={historyPlaybackSpeed} onChange={onPlaybackSpeedChange} sx={{ fontSize: '0.74rem', borderRadius: '10px', height: '36px' }}>
                {[1, 2, 4, 8].map((speed) => (
                  <MenuItem key={speed} value={speed} sx={{ fontSize: '0.75rem' }}>{`x${speed}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={classes.historyDetailRows}>
            <div><div className={classes.historyDetailLabel}>Lat</div><div className={classes.historyDetailValue}>{historySelectedPoint?.latitude?.toFixed(6) || '—'}</div></div>
            <div><div className={classes.historyDetailLabel}>Lon</div><div className={classes.historyDetailValue}>{historySelectedPoint?.longitude?.toFixed(6) || '—'}</div></div>
            <div><div className={classes.historyDetailLabel}>Alt</div><div className={classes.historyDetailValue}>{Math.round(historySelectedPoint?.altitude || 0)} m</div></div>
            <div><div className={classes.historyDetailLabel}>Dir</div><div className={classes.historyDetailValue}>{Math.round(historySelectedPoint?.course || 0)}°</div></div>
          </div>
        </div>
      )}
    </div>
  );
});
HistoryPanel.displayName = 'HistoryPanel';

// ==================== GEOFENCES PANEL ====================

/**
 * OPTIMIZATION: GeofencesPanel wraps GeofenceSidebar (which is already
 * a separate component) and keeps it mounted.
 */
const GeofencesPanel = React.memo(({ classes, onDrawModeChange, drawMode, drawingStatus }) => {
  return (
    <div className={classes.deviceListContainer}>
      <GeofenceSidebar
        onDrawModeChange={onDrawModeChange}
        drawMode={drawMode}
        drawingStatus={drawingStatus}
      />
    </div>
  );
});
GeofencesPanel.displayName = 'GeofencesPanel';

// ==================== MAIN SIDEBAR WRAPPER ====================

/**
 * OPTIMIZATION: FloatingSidebar is the main wrapper that stays mounted at all times.
 * It uses CSS opacity/pointer-events to show/hide, NOT conditional rendering.
 * 
 * ROOT CAUSE: The original sidebar was conditionally rendered (&& short-circuit),
 * which caused it to unmount and lose all state on every navigation click.
 * When the user clicked back, it would remount, triggering fresh API calls
 * and re-initializing all component state.
 */
const FloatingSidebar = React.memo(({
  classes, activeMenu, n, onDevicesClose, contentPanelOffset,
  keyword, onKeywordChange, filterOpen, onFilterOpen, onFilterClose,
  filteredDevices, groupedDevices, expandedGroups, onToggleGroup,
  filtersActive, draftStatuses, setDraftStatuses, onApplyFilters, filter,
  addDeviceOpen, onAddDeviceOpen, deviceData, setDeviceData, deviceTab, setDeviceTab,
  onSaveDevice, onCloseAddDevice, saving, groups, users,
  createGroupOpen, onCreateGroupClose, groupForm, setGroupForm,
  ungroupedDevices, onToggleGroupFormDevice, onCreateGroup, onCreatingGroup,
  groupMenuAnchor, onGroupMenuOpen, onGroupMenuClose, onOpenCreateGroup,
  // Alerts
  alertsTab, setAlertsTab, eventSearch, setEventSearch,
  filteredEvents, devicesById, onEventEdit, onEventDelete,
  ruleSearch, setRuleSearch, filteredRules, onOpenAddRule, onOpenEditRule, onDeleteRule,
  rulesLoaded, rulesLoading,
  // History
  selectedDeviceId, onDeviceSelect, onHistoryShow,
  historyPositions, historyIndex, setHistoryIndex, historyLoading,
  historyTimeline, historyTimelineLoading, historyTried, historySummary,
  historyActiveSegmentId, onSegmentClick, historyPlaying, setHistoryPlaying,
  historyPlaybackSpeed, setHistoryPlaybackSpeed, onPrevPoint, onNextPoint,
  historySelectedPoint, historyRange, devicesById: devicesByIdMap,
  // Geofences
  onDrawModeChange, drawMode, drawingStatus,
  // Visibility
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={classes.floatingSidebar}
      style={{
        left: `${contentPanelOffset}px`,
        width: '280px',
        transform: 'translateX(0)',
        opacity: 1,
        pointerEvents: 'auto',
      }}
    >
      <div square={false} elevation={0} className={classes.sidebarContent}>
        {/* Header */}
        <div className={classes.headerRow}>
          <div className={classes.headerTitleGroup}>
            <h3>{activeMenu}</h3>
          </div>
          <div className={classes.headerActionsGroup}>
            <IconButton className={classes.closeSidebarBtn} size="small" onClick={onDevicesClose}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
        </div>

        {/* Content panels */}
        {activeMenu === 'Objects' && (
          <ObjectsPanel
            classes={classes}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filterOpen={filterOpen}
            onFilterOpen={onFilterOpen}
            onAddDevice={onAddDeviceOpen}
            filteredDevices={filteredDevices}
            groupedDevices={groupedDevices}
            expandedGroups={expandedGroups}
            onToggleGroup={onToggleGroup}
            filtersActive={filtersActive}
            groupMenuAnchor={groupMenuAnchor}
            onGroupMenuOpen={onGroupMenuOpen}
            onGroupMenuClose={onGroupMenuClose}
            onOpenCreateGroup={onOpenCreateGroup}
            filterConfig={filter}
            draftStatuses={draftStatuses}
            onToggleDraftStatus={(s) => setDraftStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
            onApplyFilters={onApplyFilters}
            onClearFilters={() => { setDraftStatuses([]); onFilterClose(); }}
            onCancelFilters={onFilterClose}
            addDeviceOpen={addDeviceOpen}
            deviceData={deviceData}
            onDeviceDataChange={setDeviceData}
            deviceTab={deviceTab}
            onDeviceTabChange={setDeviceTab}
            onSaveDevice={onSaveDevice}
            onCloseAddDevice={onCloseAddDevice}
            saving={saving}
            groups={groups}
            users={users}
            createGroupOpen={createGroupOpen}
            onCreateGroupClose={onCreateGroupClose}
            groupForm={groupForm}
            onGroupFormChange={setGroupForm}
            ungroupedDevices={ungroupedDevices}
            onToggleGroupFormDevice={onToggleGroupFormDevice}
            onCreateGroup={onCreateGroup}
            onCreatingGroup={onCreatingGroup}
          />
        )}

        {activeMenu === 'Alerts' && (
          <AlertsPanel
            classes={classes}
            alertsTab={alertsTab}
            onAlertsTabChange={(e, val) => setAlertsTab(val)}
            eventSearch={eventSearch}
            onEventSearch={setEventSearch}
            filteredEvents={filteredEvents}
            devicesById={devicesById}
            onEventEdit={() => {}}
            onEventDelete={onEventDelete}
            ruleSearch={ruleSearch}
            onRuleSearch={setRuleSearch}
            filteredRules={filteredRules}
            onOpenAddRule={onOpenAddRule}
            onOpenEditRule={onOpenEditRule}
            onDeleteRule={onDeleteRule}
            rulesLoaded={rulesLoaded}
            rulesLoading={rulesLoading}
          />
        )}

        {activeMenu === 'History' && (
          <HistoryPanel
            classes={classes}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={onDeviceSelect}
            onHistoryShow={onHistoryShow}
            historyPositions={historyPositions}
            historyIndex={historyIndex}
            setHistoryIndex={setHistoryIndex}
            historyLoading={historyLoading}
            historyTimeline={historyTimeline}
            historyTimelineLoading={historyTimelineLoading}
            historyTried={historyTried}
            historySummary={historySummary}
            historyActiveSegmentId={historyActiveSegmentId}
            onSegmentClick={onSegmentClick}
            historyPlaying={historyPlaying}
            onTogglePlayback={() => setHistoryPlaying((p) => !p)}
            historyPlaybackSpeed={historyPlaybackSpeed}
            onPlaybackSpeedChange={(e) => setHistoryPlaybackSpeed(e.target.value)}
            onPrevPoint={onPrevPoint}
            onNextPoint={onNextPoint}
            historySelectedPoint={historySelectedPoint}
            historyRange={historyRange}
            devicesById={devicesByIdMap}
          />
        )}

        {activeMenu === 'Geofences' && (
          <GeofencesPanel
            classes={classes}
            onDrawModeChange={onDrawModeChange}
            drawMode={drawMode}
            drawingStatus={drawingStatus}
          />
        )}
      </div>
    </div>
  );
});
FloatingSidebar.displayName = 'FloatingSidebar';

export { FloatingSidebar, ObjectsPanel, AlertsPanel, HistoryPanel, GeofencesPanel };
export default FloatingSidebar;

