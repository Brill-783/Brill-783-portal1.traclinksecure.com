import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  IconButton,
  Paper,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  Collapse,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  TablePagination,
  Menu,
  ListItemIcon,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SpeedIcon from '@mui/icons-material/Speed';
import HeightIcon from '@mui/icons-material/Height';
import HistoryIcon from '@mui/icons-material/History';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapOverlay from '../map/overlay/MapOverlay';
import { formatTime } from '../common/util/formatter';
import ReportFilter from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatchCallback } from '../reactHelper';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';

const PRIMARY = '#00ab8e';
const TEXT = '#0f172a';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const BORDER = '#e2e8f0';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Roboto Mono', monospace";
const FONT_SIZE_12 = '12px !important';

const DEFAULT_GRAPH_HEIGHT = 100;
const MIN_GRAPH_HEIGHT = 60;
const MAX_GRAPH_HEIGHT = 320;

const useStyles = makeStyles()((theme, { isPinned, isResizing }) => ({
  root: {
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: FONT_FAMILY,
  },

  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 1200,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: 320,
    maxHeight: 'calc(100vh - 24px)',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12)',
    border: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_12,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
      borderRadius: 0,
      maxHeight: '100vh',
    },
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    flexShrink: 0,
  },
  headerLeftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  headerTitle: {
    fontSize: '0.94rem',
    fontWeight: 600,
    color: TEXT,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: FONT_FAMILY,
  },
  headerSubtitle: {
    fontSize: '11px',
    color: TEXT_SECONDARY,
    fontWeight: 400,
    marginTop: '1px',
    fontFamily: FONT_FAMILY,
  },
  roundIconBtn: {
    width: '32px',
    height: '32px',
    border: `1px solid ${BORDER}`,
    borderRadius: '8px',
    color: TEXT_SECONDARY,
    backgroundColor: SURFACE,
    padding: 0,
    '&:hover': {
      backgroundColor: SURFACE_SOFT,
      color: PRIMARY,
      borderColor: PRIMARY,
    },
  },

  filterWrap: {
    padding: '12px 14px',
    backgroundColor: SURFACE,
    fontFamily: FONT_FAMILY,
  },

  summaryBar: {
    display: 'flex',
    padding: '10px 14px',
    gap: '12px',
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: SURFACE_SOFT,
    flexShrink: 0,
    fontFamily: FONT_FAMILY,
  },
  summaryItem: { flex: 1, minWidth: 0 },
  summaryLabel: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: FONT_FAMILY,
  },
  summaryValue: {
    fontSize: FONT_SIZE_12,
    fontWeight: 700,
    color: TEXT,
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: FONT_FAMILY,
  },

  timelineScroll: {
    flex: '1 1 0',
    minHeight: 0,
    overflowY: 'auto',
    padding: '8px 10px',
    fontFamily: FONT_FAMILY,
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
    '&::-webkit-scrollbar': { width: '4px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
  },
  dayHeader: {
    fontSize: '11px',
    fontWeight: 600,
    color: TEXT_SECONDARY,
    padding: '4px 6px 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: FONT_FAMILY,
  },

  segment: {
    display: 'flex',
    gap: '8px',
    padding: '8px 6px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    '&:hover': { backgroundColor: SURFACE_SOFT },
  },
  segmentActive: {
    display: 'flex',
    gap: '8px',
    padding: '8px 6px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'rgba(0, 171, 142, 0.08) !important',
  },
  segmentRail: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18px', flexShrink: 0 },
  segmentDotTrip: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRIMARY, flexShrink: 0, marginTop: '4px' },
  segmentDotStop: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', flexShrink: 0, marginTop: '4px' },
  segmentLine: { width: '1.5px', flex: 1, backgroundColor: BORDER, marginTop: '2px' },
  segmentBody: { flex: 1, minWidth: 0, paddingBottom: '6px' },
  segmentTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' },
  segmentTitle: { fontSize: FONT_SIZE_12, fontWeight: 600, color: TEXT, fontFamily: FONT_FAMILY },
  segmentMeta: { fontSize: '11px', fontWeight: 500, color: TEXT_SECONDARY, fontFamily: FONT_FAMILY },
  segmentSub: { fontSize: '11px', color: TEXT_MUTED, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT_FAMILY },
  segmentExpandBtn: { padding: '2px', color: TEXT_MUTED, '& svg': { fontSize: '1rem' } },
  segmentDetailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', marginTop: '6px', padding: '6px 8px', backgroundColor: SURFACE_SOFT, borderRadius: '6px' },
  segmentDetailLabel: { fontSize: '10.5px', fontWeight: 600, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FONT_FAMILY },
  segmentDetailValue: { fontSize: FONT_SIZE_12, fontWeight: 500, color: TEXT, marginTop: '1px', fontFamily: FONT_FAMILY },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 16px', textAlign: 'center', color: TEXT_MUTED, fontFamily: FONT_FAMILY },

  detailCard: {
    position: 'fixed',
    zIndex: 1300,
    top: 20,
    right: 20,
    width: 290,
    borderRadius: '12px',
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
    overflow: 'hidden',
    fontFamily: FONT_FAMILY,
    [theme.breakpoints.down('md')]: { left: 10, right: 10, width: 'auto' },
  },
  detailCardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 12px', borderBottom: `1px solid ${BORDER}` },
  detailCardTitle: { fontSize: FONT_SIZE_12, fontWeight: 600, color: TEXT, lineHeight: 1.35, fontFamily: FONT_FAMILY },
  detailCardRows: { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', gap: '8px' },
  detailRowLabel: { fontSize: '11px', fontWeight: 500, color: TEXT_SECONDARY, fontFamily: FONT_FAMILY },
  detailRowValue: { fontSize: FONT_SIZE_12, fontWeight: 600, color: TEXT, textAlign: 'right', fontFamily: FONT_FAMILY },

  chartBar: {
    position: 'fixed',
    zIndex: 1250,
    left: isPinned ? 348 : 16,
    right: 16,
    bottom: 12,
    borderRadius: '14px',
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 12px 30px -6px rgba(15, 23, 42, 0.16)',
    overflow: 'visible',
    fontFamily: FONT_FAMILY,
    transition: isResizing ? 'none' : 'left 0.2s ease',
    [theme.breakpoints.down('md')]: { left: 8, right: 8, bottom: 8 },
  },
  resizeHandlePill: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '24px',
    height: '18px',
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'row-resize',
    zIndex: 1450,
    color: TEXT_SECONDARY,
    transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      color: PRIMARY,
      borderColor: PRIMARY,
      transform: 'translateX(-50%) scale(1.1)',
    },
    '& svg': {
      fontSize: '14px',
    },
  },
  topNavRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 14px',
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    minHeight: '38px',
    borderTopLeftRadius: '14px',
    borderTopRightRadius: '14px',
  },
  tabsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  chartTabIconBox: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PRIMARY,
    backgroundColor: SURFACE_SOFT,
  },
  metricTabs: {
    minHeight: '32px',
    '& .MuiTabs-indicator': {
      backgroundColor: PRIMARY,
      height: '3px',
      borderRadius: '3px 3px 0 0',
    },
    '& .MuiTab-root': {
      minHeight: '32px',
      textTransform: 'none',
      fontSize: FONT_SIZE_12,
      fontWeight: 600,
      fontFamily: FONT_FAMILY,
      color: TEXT_SECONDARY,
      minWidth: 'auto',
      padding: '0 16px',
    },
    '& .Mui-selected': {
      color: `${PRIMARY} !important`,
    },
  },
  rightToolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toggleBtnGroup: {
    display: 'flex',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '20px',
    padding: '2px',
    border: `1px solid ${BORDER}`,
  },
  modeToggleBtn: {
    padding: '3px 14px',
    borderRadius: '18px',
    fontSize: '11px',
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
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
    },
  },
  iconActionBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: `1px solid ${BORDER}`,
    color: TEXT_SECONDARY,
    padding: 0,
    '&:hover': {
      backgroundColor: SURFACE_SOFT,
      color: PRIMARY,
      borderColor: PRIMARY,
    },
  },
  playbackControlRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 14px',
    backgroundColor: SURFACE,
    borderBottom: `1px solid ${BORDER}`,
  },
  playbackControlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  playPauseBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    color: TEXT,
    padding: 0,
    '&:hover': {
      backgroundColor: SURFACE_SOFT,
      color: PRIMARY,
    },
  },
  speedSelect: {
    fontSize: '11px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: SURFACE_SOFT,
    fontWeight: 600,
    fontFamily: FONT_FAMILY,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: BORDER,
    },
    '& .MuiSelect-select': {
      py: 0.3,
      px: 1.2,
    },
  },
  telemetryReadout: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontFamily: FONT_FAMILY,
  },
  chartContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: SURFACE,
    padding: '6px 14px 10px 14px',
    boxSizing: 'border-box',
    cursor: 'crosshair',
    userSelect: 'none',
    borderBottomLeftRadius: '14px',
    borderBottomRightRadius: '14px',
    overflow: 'hidden',
  },
  tableWrapper: {
    width: '100%',
    overflowY: 'auto',
    overflowX: 'auto',
    backgroundColor: SURFACE,
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
    borderBottomLeftRadius: '14px',
    borderBottomRightRadius: '14px',
  },
  tableHeadCell: {
    fontSize: '11px',
    fontWeight: 700,
    color: TEXT_SECONDARY,
    backgroundColor: '#f8fafc',
    borderBottom: `1px solid ${BORDER}`,
    padding: '6px 8px',
    whiteSpace: 'nowrap',
    fontFamily: FONT_FAMILY,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  tableBodyCell: {
    fontSize: FONT_SIZE_12,
    color: TEXT,
    borderBottom: '1px solid #f1f5f9',
    padding: '5px 8px',
    whiteSpace: 'nowrap',
    fontFamily: FONT_MONO,
  },
}));

const KNOTS_TO_KMH = 1.852;
const toKmh = (knots) => (knots ? Math.round(knots * KNOTS_TO_KMH) : 0);

const ensureIsoFormat = (dateStr) => {
  if (!dateStr) return dateStr;
  return dayjs(dateStr).isValid() ? dayjs(dateStr).toISOString() : dateStr;
};

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
    const diff = Math.abs(new Date(p.fixTime || p.deviceTime).getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  });
  return bestIndex;
};

const PLAYBACK_SPEEDS = [1, 2, 4, 8];

const ReplayPage = () => {
  const t = useTranslation();
  const [isPinned, setIsPinned] = useState(true);
  const [graphHeight, setGraphHeight] = useState(DEFAULT_GRAPH_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const startDragYRef = useRef(0);
  const startHeightRef = useRef(DEFAULT_GRAPH_HEIGHT);

  const { classes } = useStyles({ isPinned, isResizing });
  const navigate = useNavigate();
  const timerRef = useRef();

  const [searchParams] = useSearchParams();
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);

  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [expandedSegmentId, setExpandedSegmentId] = useState(null);
  const [activeSegmentId, setActiveSegmentId] = useState(null);

  const [selectedPoint, setSelectedPoint] = useState(null);

  const [viewMode, setViewMode] = useState('graph');
  const [chartMetric, setChartMetric] = useState('speed');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [actionMenu, setActionMenu] = useState({
    anchorEl: null,
    row: null,
  });

  const svgRef = useRef(null);

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

  const loaded = Boolean(from && to && !loading && positions.length);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) return device.name;
    }
    return null;
  });

  useEffect(() => {
    if (!from && !to) {
      setPositions([]);
      setTimeline([]);
    }
  }, [from, to]);

  useEffect(() => {
    if (playing && positions.length > 0) {
      const delay = Math.max(50, 400 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setIndex((i) => {
          if (i >= positions.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, delay);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, positions, playbackSpeed]);

  useEffect(() => {
    if (positions.length && index < positions.length) {
      setSelectedPoint((prev) => (prev ? positions[index] : prev));
    }
  }, [index, positions]);

  const onPointClick = useCallback((_, clickedIndex) => {
    setIndex(clickedIndex);
    setSelectedPoint(positions[clickedIndex]);
  }, [positions]);

  const onMarkerClick = useCallback((positionId) => {
    setSelectedPoint(positionId ? positions[index] : null);
  }, [positions, index]);

  const fetchTimeline = useCatchCallback(
    async (deviceId, tripsFrom, tripsTo) => {
      setTimelineLoading(true);
      try {
        const isoFrom = ensureIsoFormat(tripsFrom);
        const isoTo = ensureIsoFormat(tripsTo);
        const query = new URLSearchParams({ deviceId, from: isoFrom, to: isoTo });

        const [tripsResponse, stopsResponse] = await Promise.all([
          fetchOrThrow(`/api/reports/trips?${query.toString()}`, { headers: { Accept: 'application/json' } }),
          fetchOrThrow(`/api/reports/stops?${query.toString()}`, { headers: { Accept: 'application/json' } }),
        ]);
        const [trips, stops] = await Promise.all([tripsResponse.json(), stopsResponse.json()]);
        setTimeline(buildTimeline(trips, stops));
      } finally {
        setTimelineLoading(false);
      }
    },
    [],
  );

  const onShow = useCatchCallback(
    async ({ deviceIds, from: rangeFrom, to: rangeTo }) => {
      const deviceId = deviceIds.find(() => true);
      setLoading(true);
      setSelectedDeviceId(deviceId);
      setSelectedPoint(null);

      const isoFrom = ensureIsoFormat(rangeFrom);
      const isoTo = ensureIsoFormat(rangeTo);
      const query = new URLSearchParams({ deviceId, from: isoFrom, to: isoTo });

      try {
        const response = await fetchOrThrow(`/api/positions?${query.toString()}`);
        setIndex(0);
        const newPositions = await response.json();
        setPositions(newPositions);
        if (!newPositions.length) {
          throw Error(t('sharedNoData'));
        }
        setFilterOpen(false);
        fetchTimeline(deviceId, isoFrom, isoTo);
      } finally {
        setLoading(false);
      }
    },
    [t, fetchTimeline],
  );

  const handleDownload = () => {
    const query = new URLSearchParams({ 
      deviceId: selectedDeviceId, 
      from: ensureIsoFormat(from), 
      to: ensureIsoFormat(to) 
    });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  const handleDeleteHistory = async () => {
    if (!window.confirm('Delete all history for this device in the selected date range? This cannot be undone.')) return;
    try {
      const query = new URLSearchParams({ 
        deviceId: selectedDeviceId, 
        from: ensureIsoFormat(from), 
        to: ensureIsoFormat(to) 
      });
      await fetchOrThrow(`/api/positions?${query.toString()}`, { method: 'DELETE' });
      setPositions([]);
      setTimeline([]);
    } catch (error) {
      window.alert('Could not delete history. Your server may not support this endpoint.');
      console.error(error);
    }
  };

  const jumpToSegment = (item) => {
    setActiveSegmentId(item.id);
    const targetIndex = findClosestIndex(positions, item.start);
    setIndex(targetIndex);
    setSelectedPoint(positions[targetIndex]);
  };

  const summary = useMemo(() => {
    const trips = timeline.filter((i) => i.type === 'trip').map((i) => i.data);
    const totalDistance = trips.reduce((sum, tr) => sum + (tr.distance || 0), 0);
    const totalDuration = trips.reduce((sum, tr) => sum + (tr.duration || 0), 0);
    const maxSpeed = trips.reduce((max, tr) => Math.max(max, toKmh(tr.maxSpeed || 0)), 0);
    return { totalDistance, totalDuration, maxSpeed, tripCount: trips.length };
  }, [timeline]);

  const currentPosition = positions[index];
  const currentSpeedKmh = currentPosition?.speed ? toKmh(currentPosition.speed) : 0;
  const currentAltitudeM = currentPosition?.altitude ? Math.round(currentPosition.altitude) : 0;
  const currentTimeStr = currentPosition
    ? dayjs(currentPosition.fixTime || currentPosition.deviceTime).format('YYYY-MM-DD HH:mm:ss')
    : '-';

  const speedValues = useMemo(() => {
    return positions.map((p) => toKmh(p.speed));
  }, [positions]);

  const altitudeValues = useMemo(() => {
    return positions.map((p) => Math.round(p.altitude || 0));
  }, [positions]);

  const maxSpeed = useMemo(() => Math.max(...speedValues, 60) * 1.15, [speedValues]);
  const maxAltitude = useMemo(() => Math.max(...altitudeValues, 60) * 1.15, [altitudeValues]);

  const width = 1100;
  const svgInternalHeight = Math.max(50, graphHeight - 15);

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

  const currentPoint = chartMetric === 'speed' ? speedPoints[index] : altitudePoints[index];

  const handleSeek = (e) => {
    const svg = svgRef.current;
    if (!svg || positions.length < 2) return;
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const targetIdx = Math.round(ratio * (positions.length - 1));
    setIndex(targetIdx);
  };

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return positions.slice(start, start + rowsPerPage);
  }, [positions, page, rowsPerPage]);

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

  return (
    <div className={classes.root}>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapRoutePath positions={positions} />
        <MapRoutePoints positions={positions} onClick={onPointClick} showSpeedControl />
        {index < positions.length && (
          <MapPositions
            positions={[positions[index]]}
            onMarkerClick={onMarkerClick}
            titleField="fixTime"
          />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />

      <Paper className={classes.sidebar} elevation={0} square={false}>
        <div className={classes.sidebarHeader}>
          <div className={classes.headerLeftGroup}>
            <HistoryIcon sx={{ color: PRIMARY, fontSize: '20px', flexShrink: 0 }} />
            <div className={classes.headerTitleBlock}>
              <div className={classes.headerTitle}>History</div>
              {loaded && (
                <div className={classes.headerSubtitle}>
                  {formatDayLabel(from)} · {formatShortTime(from)} – {formatShortTime(to)}
                </div>
              )}
            </div>
          </div>
          
          <IconButton size="small" className={classes.roundIconBtn} onClick={() => navigate(-1)}>
            <BackIcon fontSize="small" />
          </IconButton>
        </div>

        <Collapse in={filterOpen || !loaded}>
          <div className={classes.filterWrap}>
            <ReportFilter onShow={onShow} deviceType="single" loading={loading} />
          </div>
        </Collapse>

        {loaded && !filterOpen && (
          <>
            <div className={classes.summaryBar}>
              <div className={classes.summaryItem}>
                <div className={classes.summaryLabel}>Distance</div>
                <div className={classes.summaryValue}>{formatDistance(summary.totalDistance)}</div>
              </div>
              <div className={classes.summaryItem}>
                <div className={classes.summaryLabel}>Drive time</div>
                <div className={classes.summaryValue}>{formatDuration(summary.totalDuration)}</div>
              </div>
              <div className={classes.summaryItem}>
                <div className={classes.summaryLabel}>Top speed</div>
                <div className={classes.summaryValue}>{summary.maxSpeed} km/h</div>
              </div>
              <div className={classes.summaryItem}>
                <div className={classes.summaryLabel}>Trips</div>
                <div className={classes.summaryValue}>{summary.tripCount}</div>
              </div>
            </div>

            <div className={classes.timelineScroll}>
              {timelineLoading ? (
                <div className={classes.emptyState}>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Loading trip history...</p>
                </div>
              ) : timeline.length === 0 ? (
                <div className={classes.emptyState}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 4px', color: '#334155' }}>No trips in this range</p>
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>Try a wider date range.</p>
                </div>
              ) : (
                <>
                  <div className={classes.dayHeader}>{formatDayLabel(timeline[0]?.start)}</div>
                  {timeline.map((item, i) => {
                    const isTrip = item.type === 'trip';
                    const expanded = expandedSegmentId === item.id;
                    const active = activeSegmentId === item.id;
                    const isLast = i === timeline.length - 1;
                    return (
                      <div key={item.id}>
                        <div
                          className={active ? classes.segmentActive : classes.segment}
                          onClick={() => jumpToSegment(item)}
                        >
                          <div className={classes.segmentRail}>
                            <div className={isTrip ? classes.segmentDotTrip : classes.segmentDotStop} />
                            {!isLast && <div className={classes.segmentLine} />}
                          </div>
                          <div className={classes.segmentBody}>
                            <div className={classes.segmentTitleRow}>
                              <span className={classes.segmentTitle}>
                                {isTrip ? 'Drive' : 'Parked'} · {formatShortTime(item.start)} – {formatShortTime(item.end)}
                              </span>
                              <IconButton
                                size="small"
                                className={classes.segmentExpandBtn}
                                onClick={(e) => { e.stopPropagation(); setExpandedSegmentId(expanded ? null : item.id); }}
                              >
                                <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                              </IconButton>
                            </div>
                            <div className={classes.segmentMeta}>
                              {isTrip
                                ? `${formatDistance(item.data.distance)} · ${formatDuration(item.data.duration)}`
                                : formatDuration(item.data.duration)}
                            </div>
                            <div className={classes.segmentSub}>
                              {isTrip ? (item.data.startAddress || 'Unknown location') : (item.data.address || 'Unknown location')}
                            </div>

                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <div className={classes.segmentDetailGrid}>
                                {isTrip ? (
                                  <>
                                    <div>
                                      <div className={classes.segmentDetailLabel}>Driver</div>
                                      <div className={classes.segmentDetailValue}>{item.data.driverName || 'No driver'}</div>
                                    </div>
                                    <div>
                                      <div className={classes.segmentDetailLabel}>Top speed</div>
                                      <div className={classes.segmentDetailValue}>{toKmh(item.data.maxSpeed)} km/h</div>
                                    </div>
                                    <div>
                                      <div className={classes.segmentDetailLabel}>Avg speed</div>
                                      <div className={classes.segmentDetailValue}>{toKmh(item.data.averageSpeed)} km/h</div>
                                    </div>
                                    <div>
                                      <div className={classes.segmentDetailLabel}>Ends at</div>
                                      <div className={classes.segmentDetailValue}>{item.data.endAddress || '—'}</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <div className={classes.segmentDetailLabel}>Arrived</div>
                                      <div className={classes.segmentDetailValue}>{formatShortTime(item.start)}</div>
                                    </div>
                                    <div>
                                      <div className={classes.segmentDetailLabel}>Left</div>
                                      <div className={classes.segmentDetailValue}>{formatShortTime(item.end)}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </Collapse>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}
      </Paper>

      {selectedPoint && (
        <Paper className={classes.detailCard} elevation={0}>
          <div className={classes.detailCardHeader}>
            <div className={classes.detailCardTitle}>
              {selectedPoint.address || `${selectedPoint.latitude?.toFixed(5)}, ${selectedPoint.longitude?.toFixed(5)}`}
            </div>
            <IconButton size="small" onClick={() => setSelectedPoint(null)} sx={{ p: 0.25, color: TEXT_MUTED }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div className={classes.detailCardRows}>
            <div className={classes.detailRow}>
              <span className={classes.detailRowLabel}>Latitude</span>
              <span className={classes.detailRowValue}>{selectedPoint.latitude?.toFixed(6)}</span>
            </div>
            <div className={classes.detailRow}>
              <span className={classes.detailRowLabel}>Longitude</span>
              <span className={classes.detailRowValue}>{selectedPoint.longitude?.toFixed(6)}</span>
            </div>
            <Divider sx={{ borderColor: '#f1f5f9' }} />
            <div className={classes.detailRow}>
              <span className={classes.detailRowLabel}>Time</span>
              <span className={classes.detailRowValue}>{formatTime(selectedPoint.fixTime, 'seconds')}</span>
            </div>
            <div className={classes.detailRow}>
              <span className={classes.detailRowLabel}>Speed</span>
              <span className={classes.detailRowValue}>{toKmh(selectedPoint.speed)} km/h</span>
            </div>
            <div className={classes.detailRow}>
              <span className={classes.detailRowLabel}>Altitude</span>
              <span className={classes.detailRowValue}>{Math.round(selectedPoint.altitude || 0)} m</span>
            </div>
            <div className={classes.detailRow}>
              <span className={classes.detailRowLabel}>Course</span>
              <span className={classes.detailRowValue}>{Math.round(selectedPoint.course || 0)}°</span>
            </div>
            {selectedPoint.attributes?.hours !== undefined && (
              <div className={classes.detailRow}>
                <span className={classes.detailRowLabel}>Engine hours</span>
                <span className={classes.detailRowValue}>{formatDuration(selectedPoint.attributes.hours)}</span>
              </div>
            )}
          </div>
        </Paper>
      )}

      {loaded && (
        <Paper className={classes.chartBar} elevation={0}>
          <Tooltip title="Drag up/down to adjust height" placement="top" arrow>
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
                <ShowChartIcon sx={{ fontSize: '18px' }} />
              </div>

              <Tabs
                value={chartMetric}
                onChange={(_, val) => setChartMetric(val)}
                className={classes.metricTabs}
              >
                <Tab value="speed" label="Speed" />
                <Tab value="altitude" label="Altitude" />
              </Tabs>
            </div>

            <div className={classes.rightToolGroup}>
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
                  Data log
                </button>
              </div>

              <Tooltip title={isPinned ? 'Unpin Panel' : 'Pin Panel'} arrow>
                <IconButton
                  size="small"
                  className={classes.iconActionBtn}
                  onClick={() => setIsPinned(!isPinned)}
                >
                  {isPinned ? (
                    <PushPinIcon sx={{ fontSize: '15px', color: PRIMARY }} />
                  ) : (
                    <PushPinOutlinedIcon sx={{ fontSize: '15px' }} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'} arrow>
                <IconButton
                  size="small"
                  className={classes.iconActionBtn}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <KeyboardArrowUpIcon sx={{ fontSize: '18px' }} />
                  ) : (
                    <KeyboardArrowDownIcon sx={{ fontSize: '18px' }} />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {!isCollapsed && (
            <>
              <div className={classes.playbackControlRow}>
                <div className={classes.playbackControlsLeft}>
                  <IconButton
                    size="small"
                    className={classes.playPauseBtn}
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? (
                      <StopIcon sx={{ fontSize: '20px', color: '#ef4444' }} />
                    ) : (
                      <PlayArrowIcon sx={{ fontSize: '20px', color: PRIMARY }} />
                    )}
                  </IconButton>

                  <FormControl size="small">
                    <Select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className={classes.speedSelect}
                    >
                      {PLAYBACK_SPEEDS.map((s) => (
                        <MenuItem key={s} value={s} sx={{ fontSize: '11px', fontFamily: FONT_FAMILY }}>
                          {`x${s}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div className={classes.telemetryReadout}>
                  <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 600, color: TEXT, fontFamily: FONT_FAMILY }}>
                    <span style={{ color: PRIMARY, marginRight: '8px' }}>{currentSpeedKmh} kph</span>
                    <span style={{ color: '#f59e0b', marginRight: '8px' }}>{currentAltitudeM} m</span>
                    <span style={{ color: TEXT_SECONDARY, fontFamily: FONT_MONO }}>{currentTimeStr}</span>
                  </Typography>

                  <IconButton
                    size="small"
                    className={classes.iconActionBtn}
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 4))}
                  >
                    <ZoomInIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    className={classes.iconActionBtn}
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
                  >
                    <ZoomOutIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    className={classes.iconActionBtn}
                    onClick={() => {
                      setZoomLevel(1);
                      setIndex(0);
                    }}
                  >
                    <RestartAltIcon sx={{ fontSize: '16px' }} />
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
                          <line x1={36} x2={width} y1={y} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                          <text x={0} y={y + 3} fill="#f59e0b" fontSize="9px" fontFamily={FONT_FAMILY} fontWeight="600">
                            {altVal} m
                          </text>
                          <text x={30} y={y + 3} fill="#94a3b8" fontSize="9px" fontFamily={FONT_FAMILY} fontWeight="500">
                            — {speedVal} kph
                          </text>
                        </g>
                      );
                    })}

                    {chartMetric === 'speed' && speedLinePath && (
                      <path d={speedLinePath} fill="none" stroke="#f59e0b" strokeWidth={2} />
                    )}

                    {chartMetric === 'altitude' && altitudeLinePath && (
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
                          r={4}
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
                  style={{ height: `${Math.max(140, graphHeight + 40)}px` }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" className={classes.tableHeadCell}>
                          <Checkbox size="small" sx={{ p: 0.2, '&.Mui-checked': { color: PRIMARY } }} />
                        </TableCell>
                        <TableCell className={classes.tableHeadCell}>Time</TableCell>
                        <TableCell className={classes.tableHeadCell}>Server time</TableCell>
                        <TableCell className={classes.tableHeadCell}>Latitude</TableCell>
                        <TableCell className={classes.tableHeadCell}>Longitude</TableCell>
                        <TableCell className={classes.tableHeadCell}>Altitude</TableCell>
                        <TableCell className={classes.tableHeadCell}>Speed</TableCell>
                        <TableCell className={classes.tableHeadCell}>Angle</TableCell>
                        <TableCell className={classes.tableHeadCell}>type</TableCell>
                        <TableCell className={classes.tableHeadCell}>status</TableCell>
                        <TableCell className={classes.tableHeadCell}>in2</TableCell>
                        <TableCell className={classes.tableHeadCell}>ignition</TableCell>
                        <TableCell className={classes.tableHeadCell}>charge</TableCell>
                        <TableCell className={classes.tableHeadCell}>blocked</TableCell>
                        <TableCell className={classes.tableHeadCell}>batterylevel</TableCell>
                        <TableCell className={classes.tableHeadCell}>rssi</TableCell>
                        <TableCell className={classes.tableHeadCell}>sequence</TableCell>
                        <TableCell className={classes.tableHeadCell}>distance</TableCell>
                        <TableCell className={classes.tableHeadCell}>totaldistance</TableCell>
                        <TableCell className={classes.tableHeadCell}>motion</TableCell>
                        <TableCell className={classes.tableHeadCell}>valid</TableCell>
                        <TableCell className={classes.tableHeadCell}>enginehours</TableCell>
                        <TableCell className={classes.tableHeadCell}>accuracy</TableCell>
                        <TableCell className={classes.tableHeadCell}>sat</TableCell>
                        <TableCell className={classes.tableHeadCell}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.map((row, i) => {
                        const globalIdx = page * rowsPerPage + i;
                        const isSelected = globalIdx === index;
                        const spd = row.speed ? toKmh(row.speed) : 0;
                        const attrs = row.attributes || {};

                        return (
                          <TableRow
                            key={row.id || globalIdx}
                            hover
                            onClick={() => setIndex(globalIdx)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(0, 171, 142, 0.10) !important' : 'inherit',
                            }}
                          >
                            <TableCell padding="checkbox" className={classes.tableBodyCell}>
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                sx={{ p: 0.2, '&.Mui-checked': { color: PRIMARY } }}
                              />
                            </TableCell>
                            <TableCell className={classes.tableBodyCell}>
                              {dayjs(row.fixTime || row.deviceTime).format('YYYY-MM-DD HH:mm:ss')}
                            </TableCell>
                            <TableCell className={classes.tableBodyCell}>
                              {dayjs(row.serverTime || row.fixTime).format('YYYY-MM-DD HH:mm:ss')}
                            </TableCell>
                            <TableCell className={classes.tableBodyCell}>{Number(row.latitude).toFixed(6)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{Number(row.longitude).toFixed(6)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{Math.round(row.altitude || 0)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{spd}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{Math.round(row.course || 0)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{row.type || attrs.event || '-'}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{attrs.status ?? '-'}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{String(attrs.in2 ?? false)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{String(attrs.ignition ?? false)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{String(attrs.charge ?? true)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{String(attrs.blocked ?? false)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{attrs.batteryLevel ?? attrs.battery ?? 100}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{attrs.rssi ?? 3}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{attrs.sequence ?? globalIdx + 1}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{((attrs.distance || 0) / 1000).toFixed(2)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{((attrs.totalDistance || 0) / 1000).toFixed(2)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{String(attrs.motion ?? (spd > 0))}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{String(row.valid !== false)}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{attrs.hours ? Math.round(attrs.hours / 3600000) : 0}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{row.accuracy ? Number(row.accuracy).toFixed(1) : 0}</TableCell>
                            <TableCell className={classes.tableBodyCell}>{attrs.sat ?? attrs.satellites ?? '-'}</TableCell>
                            <TableCell className={classes.tableBodyCell}>
                              <IconButton
                                size="small"
                                sx={{ p: 0.2 }}
                                onClick={(e) => handleRowActionClick(e, row)}
                              >
                                <MoreVertIcon sx={{ fontSize: '15px' }} />
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
                  count={positions.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[25, 50, 100]}
                  sx={{
                    borderTop: `1px solid ${BORDER}`,
                    minHeight: '30px',
                    '& .MuiTablePagination-toolbar': {
                      minHeight: '30px',
                      fontSize: '11px',
                      fontFamily: FONT_FAMILY,
                      py: 0,
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontSize: '11px',
                      fontFamily: FONT_FAMILY,
                    },
                  }}
                />
              )}
            </>
          )}
        </Paper>
      )}

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '8px',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (actionMenu.row) {
              const targetIdx = positions.findIndex((p) => p.id === actionMenu.row.id || p.fixTime === actionMenu.row.fixTime);
              if (targetIdx !== -1) {
                setIndex(targetIdx);
                setSelectedPoint(positions[targetIdx]);
              }
            }
            handleCloseActionMenu();
          }}
          sx={{ fontSize: FONT_SIZE_12, gap: 1 }}
        >
          <ListItemIcon sx={{ minWidth: '22px !important' }}>
            <LocationOnOutlinedIcon sx={{ fontSize: '16px', color: PRIMARY }} />
          </ListItemIcon>
          <span>Focus on Map</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenu.row && actionMenu.row.latitude && actionMenu.row.longitude) {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${actionMenu.row.latitude},${actionMenu.row.longitude}`, '_blank');
            }
            handleCloseActionMenu();
          }}
          sx={{ fontSize: FONT_SIZE_12, gap: 1 }}
        >
          <ListItemIcon sx={{ minWidth: '22px !important' }}>
            <VisibilityOutlinedIcon sx={{ fontSize: '16px', color: '#0284c7' }} />
          </ListItemIcon>
          <span>Open Google Maps</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenu.row && actionMenu.row.latitude && actionMenu.row.longitude) {
              navigator.clipboard.writeText(`${actionMenu.row.latitude}, ${actionMenu.row.longitude}`);
            }
            handleCloseActionMenu();
          }}
          sx={{ fontSize: FONT_SIZE_12, gap: 1 }}
        >
          <ListItemIcon sx={{ minWidth: '22px !important' }}>
            <FileCopyOutlinedIcon sx={{ fontSize: '16px', color: '#64748b' }} />
          </ListItemIcon>
          <span>Copy Coordinates</span>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default memo(ReplayPage);