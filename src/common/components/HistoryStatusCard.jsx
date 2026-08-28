import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  Tooltip,
  TablePagination,
  Menu,
  ListItemIcon,
  InputBase,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const TEXT = '#0f172a';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const BORDER = '#cbd5e1';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const DEFAULT_GRAPH_HEIGHT = 80;
const MIN_GRAPH_HEIGHT = 45;
const MAX_GRAPH_HEIGHT = 280;

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': { width: '4px', height: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
};

const useStyles = makeStyles()((theme, { devicesOpen, isPinned, isResizing }) => ({
  bottomPlaybackBar: {
    position: 'absolute',
    bottom: 8,
    left: isPinned ? (devicesOpen ? 348 : 8) : 8,
    right: 8,
    zIndex: 1400,
    backgroundColor: SURFACE,
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 6px 20px -3px rgba(15, 23, 42, 0.14)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
    pointerEvents: 'auto',
    fontFamily: FONT_FAMILY,
    boxSizing: 'border-box',
    transition: isResizing ? 'none' : 'left 0.2s ease, max-height 0.2s ease',
    '@media (max-width: 768px)': {
      left: 6,
      right: 6,
      bottom: 6,
    },
    '@media (max-width: 480px)': {
      left: 4,
      right: 4,
      bottom: 4,
      borderRadius: '6px',
    },
  },
  portalFab: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    border: `1.5px solid ${PRIMARY}`,
    boxShadow: '0 4px 16px rgba(0, 171, 142, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PRIMARY,
    cursor: 'pointer',
    zIndex: 999999,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      transform: 'scale(1.06)',
    },
    '@media (max-width: 480px)': {
      bottom: '12px',
      right: '12px',
      width: '34px',
      height: '34px',
    },
  },
  resizeHandlePill: {
    position: 'absolute',
    top: '-9px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '28px',
    height: '16px',
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(15, 23, 42, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'row-resize',
    zIndex: 1450,
    color: TEXT_SECONDARY,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      color: PRIMARY,
      borderColor: PRIMARY,
    },
  },
  topNavRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 10px',
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    minHeight: '30px',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    gap: '6px',
    '@media (max-width: 480px)': {
      padding: '2px 6px',
      minHeight: '26px',
    },
  },
  tabsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
  chartTabIconBox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PRIMARY,
    backgroundColor: SURFACE_SOFT,
    flexShrink: 0,
    '@media (max-width: 380px)': {
      display: 'none',
    },
  },
  metricTabs: {
    minHeight: '24px',
    '& .MuiTabs-indicator': {
      backgroundColor: PRIMARY,
      height: '2.5px',
      borderRadius: '2px 2px 0 0',
    },
    '& .MuiTab-root': {
      minHeight: '24px',
      textTransform: 'none',
      fontSize: '11.5px',
      fontWeight: 600,
      fontFamily: FONT_FAMILY,
      color: TEXT_SECONDARY,
      minWidth: 'auto',
      padding: '0 8px',
      '@media (max-width: 480px)': {
        fontSize: '10.5px !important',
        padding: '0 4px',
      },
    },
    '& .Mui-selected': {
      color: `${PRIMARY} !important`,
      fontWeight: 700,
    },
  },
  rightToolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  toggleBtnGroup: {
    display: 'flex',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '12px',
    padding: '1.5px',
    border: `1px solid ${BORDER}`,
    gap: '2px',
  },
  modeToggleBtn: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '10.5px',
    fontWeight: 600,
    fontFamily: FONT_FAMILY,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    color: TEXT_SECONDARY,
    transition: 'all 0.15s ease',
    '&.active': {
      backgroundColor: SURFACE,
      color: TEXT,
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
    },
    '@media (max-width: 480px)': {
      padding: '1px 5px',
      fontSize: '9.5px',
    },
  },
  iconActionBtn: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    border: `1px solid ${BORDER}`,
    color: TEXT_SECONDARY,
    padding: 0,
    flexShrink: 0,
    '&:hover': {
      backgroundColor: SURFACE_SOFT,
      color: PRIMARY,
      borderColor: PRIMARY,
    },
    '& svg': {
      fontSize: '13px',
    },
  },
  playbackControlRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 10px',
    backgroundColor: SURFACE,
    borderBottom: `1px solid ${BORDER}`,
    flexWrap: 'wrap',
    gap: '6px',
    '@media (max-width: 480px)': {
      padding: '2px 6px',
      gap: '4px',
    },
  },
  playbackControlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  playPauseBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    color: TEXT,
    padding: 0,
    '&:hover': {
      backgroundColor: SURFACE_SOFT,
      color: PRIMARY,
    },
    '& svg': {
      fontSize: '16px',
    },
  },
  speedSelect: {
    fontSize: '11px',
    height: '22px',
    borderRadius: '4px',
    backgroundColor: SURFACE_SOFT,
    fontWeight: 600,
    fontFamily: FONT_FAMILY,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: BORDER,
    },
    '& .MuiSelect-select': {
      py: 0.1,
      px: 0.8,
    },
  },
  telemetryReadout: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: FONT_FAMILY,
    minWidth: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  chartContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: SURFACE,
    padding: '4px 8px',
    boxSizing: 'border-box',
    cursor: 'crosshair',
    userSelect: 'none',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    overflow: 'hidden',
  },
  tableWrapper: {
    width: '100%',
    overflowY: 'auto',
    overflowX: 'auto',
    backgroundColor: SURFACE,
    ...scrollableSx,
  },
  tableHeadCell: {
    fontSize: '11px !important',
    fontWeight: '600 !important',
    color: '#1e293b !important',
    backgroundColor: '#f8fafc !important',
    borderBottom: `1.5px solid ${BORDER} !important`,
    borderRight: `1px solid ${BORDER} !important`,
    padding: '5px 8px !important',
    whiteSpace: 'nowrap',
    fontFamily: `${FONT_FAMILY} !important`,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  tableBodyCell: {
    fontSize: '11px',
    color: TEXT,
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    padding: '4px 8px',
    whiteSpace: 'nowrap',
    fontFamily: FONT_FAMILY,
  },
  filterPill: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '12px',
    border: `1px solid ${BORDER}`,
    padding: '0 6px',
    height: '22px',
    width: '140px',
    '& input': {
      fontSize: '10.5px',
      padding: '0 4px',
    },
  },
}));

const PLAYBACK_SPEEDS = [1, 2, 4, 8];

const HistoryStatusCard = ({
  positions = [],
  currentIndex = 0,
  devicesOpen = true,
  onIndexChange,
}) => {
  const [isPinned, setIsPinned] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('graph');
  const [metricTab, setMetricTab] = useState('speed');
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [logFilterQuery, setLogFilterQuery] = useState('');

  const [graphHeight, setGraphHeight] = useState(DEFAULT_GRAPH_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const startDragYRef = useRef(0);
  const startHeightRef = useRef(DEFAULT_GRAPH_HEIGHT);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [actionMenu, setActionMenu] = useState({
    anchorEl: null,
    row: null,
  });

  const timerRef = useRef(null);
  const svgRef = useRef(null);
  const { classes } = useStyles({ devicesOpen, isPinned, isResizing });

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startDragYRef.current = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    startHeightRef.current = graphHeight;
  };

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const deltaY = startDragYRef.current - clientY;
    const nextHeight = Math.min(
      MAX_GRAPH_HEIGHT,
      Math.max(MIN_GRAPH_HEIGHT, startHeightRef.current + deltaY)
    );
    setGraphHeight(nextHeight);
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove);
      window.addEventListener('touchend', handleResizeEnd);
    } else {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const validPositions = useMemo(() => {
    if (!Array.isArray(positions)) return [];
    return positions.filter(
      (p) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)
    );
  }, [positions]);

  useEffect(() => {
    if (playing && validPositions.length > 0) {
      const delay = Math.max(40, 350 / playbackSpeed);
      timerRef.current = setInterval(() => {
        onIndexChange((prev) => {
          if (prev >= validPositions.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, validPositions, playbackSpeed, onIndexChange]);

  const currentPos = validPositions[currentIndex] || null;
  const currentSpeedKmh = currentPos?.speed ? Math.round(currentPos.speed * 1.852) : 0;
  const currentAltitudeM = currentPos?.altitude ? Math.round(currentPos.altitude) : 0;
  const currentTimeStr = currentPos
    ? dayjs(currentPos.fixTime || currentPos.deviceTime).format('HH:mm:ss')
    : '-';

  const { visibleData, windowStartIndex } = useMemo(() => {
    const total = validPositions.length;
    if (total === 0) return { visibleData: [], windowStartIndex: 0 };
    if (zoomLevel <= 1) return { visibleData: validPositions, windowStartIndex: 0 };

    const windowSize = Math.max(10, Math.round(total / zoomLevel));
    const half = Math.floor(windowSize / 2);

    let start = Math.max(0, currentIndex - half);
    let end = start + windowSize;
    if (end > total) {
      end = total;
      start = Math.max(0, end - windowSize);
    }

    return {
      visibleData: validPositions.slice(start, end),
      windowStartIndex: start,
    };
  }, [validPositions, zoomLevel, currentIndex]);

  const speedValues = useMemo(() => {
    return visibleData.map((p) => Math.round((p.speed || 0) * 1.852));
  }, [visibleData]);

  const altitudeValues = useMemo(() => {
    return visibleData.map((p) => Math.round(p.altitude || 0));
  }, [visibleData]);

  const maxSpeed = useMemo(() => Math.max(...speedValues, 60) * 1.15, [speedValues]);
  const maxAltitude = useMemo(() => Math.max(...altitudeValues, 60) * 1.15, [altitudeValues]);

  const width = 1000;
  const svgInternalHeight = Math.max(35, graphHeight - 10);

  const speedPoints = useMemo(() => {
    if (!speedValues.length) return [];
    return speedValues.map((v, i) => {
      const x = speedValues.length > 1 ? (i / (speedValues.length - 1)) * width : 0;
      const y = svgInternalHeight - (v / maxSpeed) * svgInternalHeight;
      return [x, y];
    });
  }, [speedValues, maxSpeed, svgInternalHeight]);

  const altitudePoints = useMemo(() => {
    if (!altitudeValues.length) return [];
    return altitudeValues.map((v, i) => {
      const x = altitudeValues.length > 1 ? (i / (altitudeValues.length - 1)) * width : 0;
      const y = svgInternalHeight - (v / maxAltitude) * svgInternalHeight;
      return [x, y];
    });
  }, [altitudeValues, maxAltitude, svgInternalHeight]);

  const speedLinePath = speedPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const altitudeLinePath = altitudePoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  const relativeCurrentIndex = currentIndex - windowStartIndex;
  const currentPoint =
    relativeCurrentIndex >= 0 && relativeCurrentIndex < visibleData.length
      ? metricTab === 'speed'
        ? speedPoints[relativeCurrentIndex]
        : altitudePoints[relativeCurrentIndex]
      : null;

  const handleSeek = (e) => {
    const svg = svgRef.current;
    if (!svg || visibleData.length < 2) return;
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const offset = Math.round(ratio * (visibleData.length - 1));
    const targetIdx = windowStartIndex + offset;
    onIndexChange(Math.min(validPositions.length - 1, Math.max(0, targetIdx)));
  };

  const dynamicAttributeKeys = useMemo(() => {
    const keySet = new Set();
    validPositions.forEach((p) => {
      if (p.attributes && typeof p.attributes === 'object') {
        Object.keys(p.attributes).forEach((k) => {
          if (!['speed', 'distance', 'totalDistance', 'ignition', 'battery', 'charge', 'blocked', 'hours', 'sat', 'satellites', 'rssi'].includes(k)) {
            keySet.add(k);
          }
        });
      }
    });
    return Array.from(keySet).slice(0, 8);
  }, [validPositions]);

  const filteredLogRows = useMemo(() => {
    const query = logFilterQuery.trim().toLowerCase();
    if (!query) return validPositions;
    return validPositions.filter((p) => {
      const timeStr = dayjs(p.fixTime || p.deviceTime).format('YYYY-MM-DD HH:mm:ss');
      const addr = String(p.address || '').toLowerCase();
      const eventType = String(p.type || p.attributes?.event || '').toLowerCase();
      return timeStr.includes(query) || addr.includes(query) || eventType.includes(query);
    });
  }, [validPositions, logFilterQuery]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLogRows.slice(start, start + rowsPerPage);
  }, [filteredLogRows, page, rowsPerPage]);

  const handleRowActionClick = (event, row) => {
    event.stopPropagation();
    setActionMenu({
      anchorEl: event.currentTarget,
      row,
    });
  };

  const handleCloseActionMenu = () => {
    setActionMenu({ anchorEl: null, row: null });
  };

  const handleActionFocusMap = () => {
    if (actionMenu.row) {
      const targetIdx = validPositions.findIndex((p) => p.id === actionMenu.row.id || p.fixTime === actionMenu.row.fixTime);
      if (targetIdx !== -1) onIndexChange(targetIdx);
    }
    handleCloseActionMenu();
  };

  const handleActionGoogleMaps = () => {
    if (actionMenu.row && actionMenu.row.latitude && actionMenu.row.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${actionMenu.row.latitude},${actionMenu.row.longitude}`, '_blank');
    }
    handleCloseActionMenu();
  };

  const handleActionCopyCoords = () => {
    if (actionMenu.row && actionMenu.row.latitude && actionMenu.row.longitude) {
      navigator.clipboard.writeText(`${actionMenu.row.latitude}, ${actionMenu.row.longitude}`);
    }
    handleCloseActionMenu();
  };

  if (!validPositions.length) return null;

  return (
    <>
      {isCollapsed && typeof document !== 'undefined' && createPortal(
        <Tooltip title="Expand History Chart" placement="top" arrow>
          <button
            type="button"
            className={classes.portalFab}
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand History Chart"
          >
            <ShowChartIcon sx={{ fontSize: '1.2rem' }} />
          </button>
        </Tooltip>,
        document.body
      )}

      {!isCollapsed ? (
        <Paper className={classes.bottomPlaybackBar} elevation={0}>
          <Tooltip title="Drag to resize" placement="top" arrow>
            <div
              className={classes.resizeHandlePill}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 15 12 20 17 15" />
                <polyline points="7 9 12 4 17 9" />
              </svg>
            </div>
          </Tooltip>

          <div className={classes.topNavRow}>
            <div className={classes.tabsContainer}>
              <div className={classes.chartTabIconBox}>
                <ShowChartIcon sx={{ fontSize: '13px' }} />
              </div>

              <Tabs
                value={metricTab}
                onChange={(_, val) => setMetricTab(val)}
                className={classes.metricTabs}
              >
                <Tab value="speed" label="Speed" />
                <Tab value="altitude" label="Altitude" />
              </Tabs>
            </div>

            <div className={classes.rightToolGroup}>
              {viewMode === 'datalog' && (
                <div className={classes.filterPill}>
                  <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 13 }} />
                  <InputBase
                    placeholder="Search logs..."
                    value={logFilterQuery}
                    onChange={(e) => {
                      setLogFilterQuery(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              )}

              <div className={classes.toggleBtnGroup}>
                <button
                  type="button"
                  className={`${classes.modeToggleBtn} ${viewMode === 'graph' ? 'active' : ''}`}
                  onClick={() => setViewMode('graph')}
                >
                  Graph
                </button>
                <button
                  type="button"
                  className={`${classes.modeToggleBtn} ${viewMode === 'datalog' ? 'active' : ''}`}
                  onClick={() => setViewMode('datalog')}
                >
                  Log ({validPositions.length})
                </button>
              </div>

              <Tooltip title={isPinned ? 'Unpin' : 'Pin'} arrow>
                <IconButton
                  size="small"
                  className={classes.iconActionBtn}
                  onClick={() => setIsPinned(!isPinned)}
                >
                  {isPinned ? (
                    <PushPinIcon sx={{ fontSize: '12px', color: PRIMARY }} />
                  ) : (
                    <PushPinOutlinedIcon sx={{ fontSize: '12px' }} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Collapse" arrow>
                <IconButton
                  size="small"
                  className={classes.iconActionBtn}
                  onClick={() => setIsCollapsed(true)}
                >
                  <KeyboardArrowDownIcon sx={{ fontSize: '15px' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div className={classes.playbackControlRow}>
            <div className={classes.playbackControlsLeft}>
              <IconButton
                size="small"
                className={classes.playPauseBtn}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? (
                  <StopIcon sx={{ fontSize: '15px', color: '#ef4444' }} />
                ) : (
                  <PlayArrowIcon sx={{ fontSize: '15px', color: PRIMARY }} />
                )}
              </IconButton>

              <FormControl size="small">
                <Select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className={classes.speedSelect}
                >
                  {PLAYBACK_SPEEDS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: '11px', fontFamily: FONT_FAMILY, fontWeight: 600 }}>
                      {`x${s}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className={classes.telemetryReadout}>
              <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: TEXT, fontFamily: FONT_FAMILY, whiteSpace: 'nowrap' }}>
                <span style={{ color: PRIMARY, marginRight: '5px' }}>{currentSpeedKmh} kph</span>
                <span style={{ color: '#f59e0b', marginRight: '5px' }}>{currentAltitudeM} m</span>
                <span style={{ color: TEXT_SECONDARY }}>{currentTimeStr}</span>
              </Typography>

              <IconButton
                size="small"
                className={classes.iconActionBtn}
                onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 6))}
                title="Zoom In Graph"
              >
                <ZoomInIcon sx={{ fontSize: '13px' }} />
              </IconButton>
              <IconButton
                size="small"
                className={classes.iconActionBtn}
                onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
                title="Zoom Out Graph"
              >
                <ZoomOutIcon sx={{ fontSize: '13px' }} />
              </IconButton>
              <IconButton
                size="small"
                className={classes.iconActionBtn}
                onClick={() => {
                  setZoomLevel(1);
                  onIndexChange(0);
                }}
                title="Reset Zoom"
              >
                <RestartAltIcon sx={{ fontSize: '13px' }} />
              </IconButton>
            </div>
          </div>

          {viewMode === 'graph' ? (
            <div
              className={classes.chartContainer}
              style={{ height: `${graphHeight}px` }}
              onClick={handleSeek}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${svgInternalHeight}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
              >
                {[0, 0.5, 1].map((g, i) => {
                  const y = svgInternalHeight * g;
                  const speedVal = Math.round(maxSpeed * (1 - g));
                  const altVal = Math.round(maxAltitude * (1 - g));
                  return (
                    <g key={i}>
                      <line x1={25} x2={width} y1={y} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                      <text x={0} y={y + 3} fill="#f59e0b" fontSize="8.5px" fontFamily={FONT_FAMILY} fontWeight="700">
                        {altVal}m
                      </text>
                      <text x={22} y={y + 3} fill="#94a3b8" fontSize="8.5px" fontFamily={FONT_FAMILY} fontWeight="600">
                        —{speedVal}kph
                      </text>
                    </g>
                  );
                })}

                {metricTab === 'speed' && speedLinePath && (
                  <path d={speedLinePath} fill="none" stroke="#f59e0b" strokeWidth={2} />
                )}

                {metricTab === 'altitude' && altitudeLinePath && (
                  <path d={altitudeLinePath} fill="none" stroke={PRIMARY} strokeWidth={2} />
                )}

                {currentPoint && (
                  <g>
                    <line
                      x1={currentPoint[0]}
                      x2={currentPoint[0]}
                      y1={0}
                      y2={svgInternalHeight}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={currentPoint[0]}
                      cy={currentPoint[1]}
                      r={3.5}
                      fill="#ffffff"
                      stroke={PRIMARY}
                      strokeWidth={2.5}
                    />
                  </g>
                )}
              </svg>
            </div>
          ) : (
            <TableContainer
              className={classes.tableWrapper}
              style={{ height: `${Math.max(120, graphHeight + 35)}px` }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" className={classes.tableHeadCell}>
                      <Checkbox size="small" sx={{ p: 0.1, '&.Mui-checked': { color: PRIMARY } }} />
                    </TableCell>
                    <TableCell className={classes.tableHeadCell}>#</TableCell>
                    <TableCell className={classes.tableHeadCell}>Fix Time</TableCell>
                    <TableCell className={classes.tableHeadCell}>Server Time</TableCell>
                    <TableCell className={classes.tableHeadCell}>Latitude</TableCell>
                    <TableCell className={classes.tableHeadCell}>Longitude</TableCell>
                    <TableCell className={classes.tableHeadCell}>Altitude</TableCell>
                    <TableCell className={classes.tableHeadCell}>Speed (kph)</TableCell>
                    <TableCell className={classes.tableHeadCell}>Course</TableCell>
                    <TableCell className={classes.tableHeadCell}>Ignition</TableCell>
                    <TableCell className={classes.tableHeadCell}>Motion</TableCell>
                    <TableCell className={classes.tableHeadCell}>Valid</TableCell>
                    <TableCell className={classes.tableHeadCell}>Address</TableCell>
                    <TableCell className={classes.tableHeadCell}>Trip Dist (km)</TableCell>
                    <TableCell className={classes.tableHeadCell}>Odometer (km)</TableCell>
                    <TableCell className={classes.tableHeadCell}>Engine Hours</TableCell>
                    <TableCell className={classes.tableHeadCell}>Satellites</TableCell>
                    <TableCell className={classes.tableHeadCell}>GSM (RSSI)</TableCell>
                    <TableCell className={classes.tableHeadCell}>Battery (%)</TableCell>
                    <TableCell className={classes.tableHeadCell}>Power (V)</TableCell>
                    <TableCell className={classes.tableHeadCell}>Charge</TableCell>
                    <TableCell className={classes.tableHeadCell}>Blocked</TableCell>

                    {dynamicAttributeKeys.map((key) => (
                      <TableCell key={key} className={classes.tableHeadCell}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </TableCell>
                    ))}

                    <TableCell className={classes.tableHeadCell}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row, i) => {
                    const globalIdx = page * rowsPerPage + i;
                    const isSelected = globalIdx === currentIndex;
                    const spd = row.speed ? Math.round(row.speed * 1.852) : 0;
                    const attrs = row.attributes || {};

                    return (
                      <TableRow
                        key={row.id || globalIdx}
                        hover
                        onClick={() => onIndexChange(globalIdx)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(0, 171, 142, 0.10) !important' : 'inherit',
                        }}
                      >
                        <TableCell padding="checkbox" className={classes.tableBodyCell}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            sx={{ p: 0.1, '&.Mui-checked': { color: PRIMARY } }}
                          />
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>{globalIdx + 1}</TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {dayjs(row.fixTime || row.deviceTime).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {dayjs(row.serverTime || row.fixTime).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>{Number(row.latitude).toFixed(6)}°</TableCell>
                        <TableCell className={classes.tableBodyCell}>{Number(row.longitude).toFixed(6)}°</TableCell>
                        <TableCell className={classes.tableBodyCell}>{Math.round(row.altitude || 0)} m</TableCell>
                        <TableCell className={classes.tableBodyCell} style={{ fontWeight: 700, color: spd > 0 ? PRIMARY : TEXT_SECONDARY }}>
                          {spd}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>{Math.round(row.course || 0)}°</TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          <span style={{ color: attrs.ignition ? '#10b981' : '#64748b', fontWeight: 700 }}>
                            {attrs.ignition !== undefined ? (attrs.ignition ? 'ON' : 'OFF') : '-'}
                          </span>
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {String(attrs.motion ?? (spd > 0))}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {String(row.valid !== false)}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.address || attrs.address || '-'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {attrs.distance ? (attrs.distance / 1000).toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {attrs.totalDistance ? (attrs.totalDistance / 1000).toFixed(2) : '-'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {attrs.hours ? (attrs.hours / 3600000).toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {attrs.sat ?? attrs.satellites ?? '-'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {attrs.rssi ?? '-'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {attrs.batteryLevel ?? attrs.battery ?? '-'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {attrs.power ?? '-'}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {String(attrs.charge ?? '-')}
                        </TableCell>
                        <TableCell className={classes.tableBodyCell}>
                          {String(attrs.blocked ?? false)}
                        </TableCell>

                        {dynamicAttributeKeys.map((k) => (
                          <TableCell key={k} className={classes.tableBodyCell}>
                            {attrs[k] !== undefined ? String(attrs[k]) : '-'}
                          </TableCell>
                        ))}

                        <TableCell className={classes.tableBodyCell}>
                          <IconButton
                            size="small"
                            sx={{ p: 0.1 }}
                            onClick={(e) => handleRowActionClick(e, row)}
                          >
                            <MoreVertIcon sx={{ fontSize: '13px' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {viewMode === 'datalog' && (
            <TablePagination
              component="div"
              count={filteredLogRows.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100, 250]}
              sx={{
                borderTop: `1px solid ${BORDER}`,
                minHeight: '26px',
                '& .MuiTablePagination-toolbar': {
                  minHeight: '26px',
                  fontSize: '10.5px',
                  fontFamily: FONT_FAMILY,
                  fontWeight: 600,
                  py: 0,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '10.5px',
                  fontFamily: FONT_FAMILY,
                  fontWeight: 600,
                },
              }}
            />
          )}
        </Paper>
      ) : null}

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '8px',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)',
            },
          },
        }}
      >
        <MenuItem onClick={handleActionFocusMap} sx={{ fontSize: '12px', gap: 1, py: 0.6, fontWeight: 600, fontFamily: FONT_FAMILY }}>
          <ListItemIcon sx={{ minWidth: '20px !important' }}>
            <LocationOnOutlinedIcon sx={{ fontSize: '16px', color: PRIMARY }} />
          </ListItemIcon>
          <span>Focus on Map</span>
        </MenuItem>
        <MenuItem onClick={handleActionGoogleMaps} sx={{ fontSize: '12px', gap: 1, py: 0.6, fontWeight: 600, fontFamily: FONT_FAMILY }}>
          <ListItemIcon sx={{ minWidth: '20px !important' }}>
            <VisibilityOutlinedIcon sx={{ fontSize: '16px', color: '#0284c7' }} />
          </ListItemIcon>
          <span>Open Google Maps</span>
        </MenuItem>
        <MenuItem onClick={handleActionCopyCoords} sx={{ fontSize: '12px', gap: 1, py: 0.6, fontWeight: 600, fontFamily: FONT_FAMILY }}>
          <ListItemIcon sx={{ minWidth: '20px !important' }}>
            <FileCopyOutlinedIcon sx={{ fontSize: '16px', color: '#64748b' }} />
          </ListItemIcon>
          <span>Copy Coordinates</span>
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(HistoryStatusCard);