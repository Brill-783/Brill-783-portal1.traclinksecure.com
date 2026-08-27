import React, { useState, useMemo, useRef, useCallback, memo, useEffect } from 'react';
import {
  Popper,
  List,
  ListItem,
  Button,
  Dialog,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  ClickAwayListener,
  CircularProgress,
  Box,
  InputBase,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useSelector, shallowEqual } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HistoryIcon from '@mui/icons-material/History';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const PRIMARY_LIGHT = '#f0fdfa';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#e2e8f0';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': { width: '4px', height: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));

const useStyles = makeStyles()(() => ({
  sidebarContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: SURFACE,
    fontFamily: FONT_FAMILY,
    boxSizing: 'border-box',
    borderRight: `1px solid ${BORDER}`,
    overflow: 'hidden',
    '& *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
  headerSection: {
    padding: '14px 12px 10px',
    backgroundColor: SURFACE,
    borderBottom: `1px solid ${BORDER_LIGHT}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '100%',
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitle: {
    fontWeight: '700 !important',
    fontSize: '15px !important',
    color: TEXT,
    letterSpacing: '-0.02em',
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    border: `1px solid ${BORDER_LIGHT}`,
    borderRadius: '6px',
    color: TEXT_SECONDARY,
    padding: 0,
    '&:hover': {
      backgroundColor: SURFACE_SOFT,
      color: PRIMARY,
      borderColor: PRIMARY,
    },
  },
  filterSection: {
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderBottom: `1px solid ${BORDER_LIGHT}`,
    backgroundColor: SURFACE,
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '100%',
  },
  formInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  },
  sectionLabel: {
    fontSize: '10.5px !important',
    fontWeight: 600,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  pickerInputPill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: '6px',
    border: `1px solid ${BORDER}`,
    padding: '6px 10px',
    minHeight: '34px',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: '#94a3b8',
    },
    '&:focus-within': {
      borderColor: PRIMARY,
    },
  },
  showButton: {
    height: '34px',
    fontSize: '12.5px !important',
    fontWeight: '600 !important',
    textTransform: 'none',
    borderRadius: '6px',
    backgroundColor: PRIMARY,
    color: '#ffffff',
    boxShadow: 'none',
    fontFamily: FONT_FAMILY,
    '&:hover': { backgroundColor: PRIMARY_DARK },
    '&.Mui-disabled': {
      backgroundColor: '#f1f5f9',
      color: '#94a3b8',
    },
  },
  deleteBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '6px',
    border: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    color: TEXT_SECONDARY,
    padding: 0,
    '&:hover': {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      borderColor: '#fecaca',
    },
  },
  mainScrollArea: {
    flex: '1 1 0',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '10px 12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxSizing: 'border-box',
    width: '100%',
    ...scrollableSx,
  },
  summaryContainer: {
    padding: '10px 12px',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flexShrink: 0,
  },
  summaryTitle: {
    fontWeight: 700,
    color: TEXT,
    fontSize: '11.5px !important',
    letterSpacing: '-0.01em',
    marginBottom: '2px',
  },
  summaryGridMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    backgroundColor: SURFACE,
    padding: '6px 8px',
    borderRadius: '6px',
    border: `1px solid ${BORDER_LIGHT}`,
    marginTop: '4px',
    boxSizing: 'border-box',
    width: '100%',
  },
  metricCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  metricCellLabel: {
    fontSize: '9.5px !important',
    color: TEXT_MUTED,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    lineHeight: 1.1,
  },
  metricCellValue: {
    fontSize: '11px !important',
    fontWeight: 700,
    color: PRIMARY_DARK,
    marginTop: '2px',
    lineHeight: 1.2,
  },
  locationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '3px 4px',
    borderRadius: '4px',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: '#e2e8f0',
    },
  },
  locationLabel: {
    fontSize: '10.5px !important',
    color: TEXT_SECONDARY,
    fontWeight: 600,
    minWidth: '55px',
  },
  locationVal: {
    fontSize: '11px !important',
    fontWeight: 600,
    color: TEXT,
    maxWidth: '210px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'right',
  },
  timelineDateBar: {
    padding: '4px 2px',
    fontSize: '11px',
    fontWeight: 700,
    color: TEXT_SECONDARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${BORDER_LIGHT}`,
    marginBottom: '2px',
    width: '100%',
  },
  timelineBlock: {
    border: `1px solid ${BORDER}`,
    padding: '8px 10px',
    cursor: 'pointer',
    backgroundColor: SURFACE,
    borderRadius: '6px',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: PRIMARY,
      backgroundColor: '#fbfffe',
    },
  },
  timelineBlockActive: {
    border: `1.5px solid ${PRIMARY}`,
    padding: '8px 10px',
    cursor: 'pointer',
    backgroundColor: `${PRIMARY_LIGHT} !important`,
    borderRadius: '6px',
    boxSizing: 'border-box',
    width: '100%',
  },
  timelineRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11.5px',
    width: '100%',
  },
  dotStart: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: PRIMARY,
    marginRight: '6px',
    flexShrink: 0,
  },
  dotStop: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    marginRight: '6px',
    flexShrink: 0,
  },
  dotEvent: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    marginRight: '6px',
    flexShrink: 0,
  },
  timeLabel: {
    fontWeight: 700,
    color: TEXT,
    fontSize: '11.5px',
  },
  durationText: {
    fontSize: '10.5px',
    color: TEXT_SECONDARY,
    marginLeft: 'auto',
    fontWeight: 600,
  },
  addressSub: {
    fontSize: '10.5px',
    color: TEXT_MUTED,
    marginTop: '3px',
    paddingLeft: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: 400,
  },
  dropdownPaper: {
    width: '310px',
    height: '260px',
    maxHeight: '260px',
    backgroundColor: SURFACE,
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: FONT_FAMILY,
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    backgroundColor: SURFACE_SOFT,
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
  },
  dropdownTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: TEXT,
  },
  searchContainer: {
    padding: '6px 8px',
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    flexShrink: 0,
  },
  searchBoxContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '16px',
    border: `1px solid ${BORDER}`,
    padding: '0 8px',
    height: '28px',
    width: '100%',
    boxSizing: 'border-box',
    '&:focus-within': {
      borderColor: PRIMARY,
      backgroundColor: SURFACE,
    },
  },
  listContainer: {
    flex: '1 1 0',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    ...scrollableSx,
  },
  listItem: {
    padding: '8px 12px',
    borderBottom: '1px solid #f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover': { backgroundColor: SURFACE_SOFT },
  },
  deviceName: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: TEXT,
  },
  emptyState: {
    padding: '24px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: '11.5px',
    fontWeight: 500,
  },
  dateModalDialog: {
    '& .MuiPaper-root': {
      borderRadius: '10px',
      maxWidth: '620px',
      width: '100%',
      backgroundColor: SURFACE,
      boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
      fontFamily: FONT_FAMILY,
    },
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13.5px',
    fontWeight: 700,
    color: TEXT,
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '270px',
  },
  modalSidebar: {
    width: '130px',
    backgroundColor: SURFACE_SOFT,
    borderRight: `1px solid ${BORDER}`,
    padding: '8px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    flexShrink: 0,
  },
  presetBtn: {
    padding: '5px 8px',
    borderRadius: '5px',
    fontSize: '11.5px',
    fontWeight: 500,
    color: TEXT_SECONDARY,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': { backgroundColor: '#e2e8f0', color: TEXT },
  },
  presetBtnActive: {
    padding: '5px 8px',
    borderRadius: '5px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: PRIMARY,
    backgroundColor: SURFACE,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
  },
  modalMainContent: {
    flex: 1,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  calendarGridRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    width: '100%',
  },
  calendarBox: {
    border: `1px solid ${BORDER}`,
    borderRadius: '6px',
    padding: '6px',
    backgroundColor: SURFACE,
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    fontWeight: 700,
    color: TEXT,
    marginBottom: '4px',
  },
  weekDaysRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
    fontSize: '10.5px',
    fontWeight: 600,
    color: TEXT_MUTED,
    marginBottom: '2px',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
  },
  dayCellWrapper: {
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    margin: '1px 0',
  },
  dayCellInRange: {
    backgroundColor: 'rgba(0, 171, 142, 0.12)',
  },
  dayCellRangeStart: {
    backgroundColor: 'rgba(0, 171, 142, 0.12)',
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
  },
  dayCellRangeEnd: {
    backgroundColor: 'rgba(0, 171, 142, 0.12)',
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  },
  dayCell: {
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    borderRadius: '50%',
    cursor: 'pointer',
    color: TEXT,
    fontWeight: 500,
    position: 'relative',
    zIndex: 2,
    '&:hover': { backgroundColor: '#e2e8f0' },
  },
  dayCellToday: {
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: `1.5px solid ${PRIMARY}`,
    fontWeight: 700,
    color: PRIMARY,
    position: 'relative',
    zIndex: 2,
  },
  dayCellSelected: {
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    borderRadius: '50%',
    cursor: 'pointer',
    backgroundColor: `${PRIMARY} !important`,
    color: '#ffffff !important',
    fontWeight: 700,
    position: 'relative',
    zIndex: 2,
  },
  dayCellMuted: {
    color: '#cbd5e1',
  },
  dayCellDisabled: {
    color: '#e2e8f0',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  timeInputsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
    paddingTop: '6px',
    borderTop: `1px solid ${BORDER}`,
  },
  timeInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  timeInputBox: {
    backgroundColor: SURFACE_SOFT,
    borderRadius: '5px',
    padding: '3px 5px',
    border: `1px solid ${BORDER}`,
    fontSize: '11px',
    fontWeight: 500,
    textAlign: 'center',
    width: '100%',
    color: TEXT,
    outline: 'none',
    fontFamily: FONT_FAMILY,
    '&:focus': { borderColor: PRIMARY },
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '8px 12px',
    borderTop: '1px solid #f1f5f9',
  },
}));

// Strict 24-Hour Time (HH:mm)
const format24Time = (value) => {
  if (!value) return '';
  const d = dayjs(value);
  return d.isValid() ? d.format('HH:mm') : '';
};

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0 min';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
};

const formatDistance = (meters) => (meters ? `${(meters / 1000).toFixed(2)} km` : '0 km');

const formatEventTitle = (event) => {
  if (!event) return 'Event';
  if (event.attributes?.ruleName) return event.attributes.ruleName;
  if (event.type === 'deviceOverspeed') return 'Overspeed Alert';
  if (event.type === 'ignitionOn') return 'Ignition ON';
  if (event.type === 'ignitionOff') return 'Ignition OFF';
  if (event.type === 'geofenceEnter') return 'Geofence Entry';
  if (event.type === 'geofenceExit') return 'Geofence Exit';
  if (event.type === 'alarm') return 'Alarm Alert';
  if (event.type === 'deviceStopped') return 'Driving Ended';
  if (event.type === 'deviceMoving') return 'Driver Start';
  return event.type || 'Event Log';
};

const isAlertEvent = (event) => {
  if (!event) return false;
  if (event.attributes?.alarm || event.attributes?.ruleName) return true;
  const t = event.type || '';
  if (t === 'deviceOnline' || t === 'deviceOffline' || t === 'deviceMoving' || t === 'deviceStopped') {
    return false;
  }
  return true;
};

const buildTimeline = (trips, stops, events = []) => {
  const filteredEvents = events.filter(isAlertEvent);

  const items = [
    ...trips.map((t) => ({ id: `trip-${t.startTime}`, type: 'trip', start: t.startTime, end: t.endTime, data: t })),
    ...stops.map((s) => ({ id: `stop-${s.startTime}`, type: 'stop', start: s.startTime, end: s.endTime, data: s })),
    ...filteredEvents.map((e, idx) => ({
      id: `event-${e.id || idx}`,
      type: 'event',
      start: e.eventTime || e.serverTime,
      end: e.eventTime || e.serverTime,
      data: e,
    })),
  ];
  items.sort((a, b) => new Date(a.start) - new Date(b.start));
  return items;
};

const PRESETS = [
  { label: 'Last hour', key: 'lastHour' },
  { label: 'Today', key: 'today' },
  { label: 'Yesterday', key: 'yesterday' },
  { label: 'Last week', key: 'lastWeek' },
  { label: 'This month', key: 'thisMonth' },
  { label: 'Custom range', key: 'custom' },
];

const HistorySidebar = ({
  selectedDeviceId,
  onSelect,
  onClose,
  onPositionsLoaded,
  onReportsLoaded,
  onSegmentClick,
  showSnackbar,
}) => {
  const { classes } = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('today');
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);

  const [fromDate, setFromDate] = useState(() => dayjs().startOf('day').toISOString());
  const [toDate, setToDate] = useState(() => dayjs().endOf('day').toISOString());

  const [tempFromDate, setTempFromDate] = useState(() => dayjs().format('DD-MM-YYYY'));
  const [tempFromTime, setTempFromTime] = useState('00:00');
  const [tempToDate, setTempToDate] = useState(() => dayjs().format('DD-MM-YYYY'));
  const [tempToTime, setTempToTime] = useState('23:59');

  const [currentViewMonth, setCurrentViewMonth] = useState(() => dayjs());

  const [timeline, setTimeline] = useState([]);
  const [rawPositions, setRawPositions] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const reduxDevicesObj = useSelector((state) => state.devices?.items || {}, shallowEqual);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const deviceList = useMemo(() => {
    const list = Array.isArray(reduxDevicesObj) ? reduxDevicesObj : Object.values(reduxDevicesObj);
    return list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [reduxDevicesObj]);

  const filteredDevices = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return deviceList;
    return deviceList.filter((device) =>
      (device.name || '').toLowerCase().includes(term)
    );
  }, [deviceList, searchQuery]);

  const selectedDevice = useMemo(() => {
    return deviceList.find((d) => Number(d.id) === Number(selectedDeviceId)) || null;
  }, [deviceList, selectedDeviceId]);

  const summaryMetrics = useMemo(() => {
    const trips = timeline.filter((i) => i.type === 'trip').map((i) => i.data);
    const stops = timeline.filter((i) => i.type === 'stop').map((i) => i.data);
    const totalMileage = trips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const totalWorkTime = trips.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalStopTime = stops.reduce((sum, s) => sum + (s.duration || 0), 0);

    const firstPos = rawPositions[0];
    const lastPos = rawPositions[rawPositions.length - 1];

    return {
      firstPos,
      lastPos,
      startLocation: trips[0]?.startAddress || firstPos?.address || 'Start location',
      finishLocation: trips[trips.length - 1]?.endAddress || lastPos?.address || 'Finish location',
      mileage: formatDistance(totalMileage),
      workTime: formatDuration(totalWorkTime),
      stopTime: formatDuration(totalStopTime),
    };
  }, [timeline, rawPositions]);

  const fetchHistoryWithParams = useCallback(
    async (startISO, endISO) => {
      if (!selectedDeviceId) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setTimelineLoading(true);
      setHasDataLoaded(false);
      setTimeline([]);

      const query = new URLSearchParams({
        deviceId: selectedDeviceId,
        from: startISO,
        to: endISO,
      }).toString();

      try {
        const [posRes, tripsRes, stopsRes, eventsRes] = await Promise.all([
          fetch(`/api/positions?${query}`, { signal, headers: { Accept: 'application/json' }, credentials: 'include' }),
          fetch(`/api/reports/trips?${query}`, { signal, headers: { Accept: 'application/json' }, credentials: 'include' }).catch(() => null),
          fetch(`/api/reports/stops?${query}`, { signal, headers: { Accept: 'application/json' }, credentials: 'include' }).catch(() => null),
          fetch(`/api/reports/events?${query}`, { signal, headers: { Accept: 'application/json' }, credentials: 'include' }).catch(() => null),
        ]);

        if (signal.aborted) return;

        if (!posRes || !posRes.ok) {
          throw new Error('Positions request failed');
        }

        const [newPositions, trips, stops, events] = await Promise.all([
          posRes.json(),
          tripsRes && tripsRes.ok ? tripsRes.json() : [],
          stopsRes && stopsRes.ok ? stopsRes.json() : [],
          eventsRes && eventsRes.ok ? eventsRes.json() : [],
        ]);

        if (signal.aborted) return;

        if (!Array.isArray(newPositions) || newPositions.length === 0) {
          if (showSnackbar) showSnackbar('No telemetry points found for this timeframe.', 'warning');
          if (onPositionsLoaded) onPositionsLoaded([]);
          setRawPositions([]);
          setTimeline([]);
          setHasDataLoaded(false);
          setTimelineLoading(false);
          return;
        }

        setHasDataLoaded(true);
        setRawPositions(newPositions);
        if (onPositionsLoaded) onPositionsLoaded(newPositions);
        if (onReportsLoaded) {
          onReportsLoaded({
            stops: Array.isArray(stops) ? stops : [],
            events: Array.isArray(events) ? events.filter(isAlertEvent) : [],
          });
        }
        setTimeline(buildTimeline(Array.isArray(trips) ? trips : [], Array.isArray(stops) ? stops : [], Array.isArray(events) ? events : []));
        setTimelineLoading(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          if (showSnackbar) showSnackbar('Failed to load telemetry history.', 'error');
          if (onPositionsLoaded) onPositionsLoaded([]);
          setTimeline([]);
          setHasDataLoaded(false);
        }
        setTimelineLoading(false);
      }
    },
    [selectedDeviceId, onPositionsLoaded, onReportsLoaded, showSnackbar]
  );

  const handleShowHistory = () => {
    fetchHistoryWithParams(fromDate, toDate);
  };

  const handleSummaryClick = (type) => {
    if (!rawPositions.length) return;
    if (type === 'start') {
      const p = summaryMetrics.firstPos || rawPositions[0];
      if (p && onSegmentClick) {
        onSegmentClick({
          type: 'point',
          data: {
            ...p,
            title: 'Driver Start (A)',
            address: summaryMetrics.startLocation,
          },
        });
      }
    } else if (type === 'finish') {
      const p = summaryMetrics.lastPos || rawPositions[rawPositions.length - 1];
      if (p && onSegmentClick) {
        onSegmentClick({
          type: 'point',
          data: {
            ...p,
            title: 'Driving Ended (B)',
            address: summaryMetrics.finishLocation,
          },
        });
      }
    } else if (type === 'general') {
      const p = rawPositions[0];
      if (p && onSegmentClick) {
        onSegmentClick({
          type: 'point',
          data: {
            ...p,
            title: 'Telemetry Overview',
            address: summaryMetrics.startLocation,
          },
        });
      }
    }
  };

  const handleExportCSV = () => {
    setExportMenuAnchor(null);
    if (!rawPositions.length) return;

    const unitName = selectedDevice ? selectedDevice.name : `Unit_${selectedDeviceId}`;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'History Playback Log\r\n';
    csvContent += `Unit,${unitName}\r\n`;
    csvContent += `Period,${dayjs(fromDate).format('DD-MM-YYYY HH:mm')} to ${dayjs(toDate).format('DD-MM-YYYY HH:mm')}\r\n`;
    csvContent += `From Location (A),${summaryMetrics.startLocation}\r\n`;
    csvContent += `To Location (B),${summaryMetrics.finishLocation}\r\n`;
    csvContent += `Total Distance Covered,${summaryMetrics.mileage}\r\n`;
    csvContent += `Driving Duration,${summaryMetrics.workTime}\r\n`;
    csvContent += `Parked Duration,${summaryMetrics.stopTime}\r\n\r\n`;
    csvContent += 'Timestamp (24h),Status / Event,Location From (A),Location To (B),Duration,Distance Covered (km),Speed (km/h)\r\n';

    timeline.forEach((item) => {
      const isTrip = item.type === 'trip';
      const isStop = item.type === 'stop';
      const typeLabel = isTrip ? 'Driver Start' : isStop ? 'Driving Ended' : formatEventTitle(item.data);
      const fromLoc = `"${(isTrip ? item.data.startAddress || '-' : item.data.address || '-').replace(/"/g, '""')}"`;
      const toLoc = `"${(isTrip ? item.data.endAddress || item.data.startAddress || '-' : item.data.address || '-').replace(/"/g, '""')}"`;
      const timeStr = dayjs(item.start).format('DD-MM-YYYY HH:mm');
      const dur = formatDuration(item.data.duration);
      const dist = isTrip ? (item.data.distance / 1000).toFixed(2) : '-';
      const spd = isTrip ? Math.round((item.data.maxSpeed || 0) * 1.852) : 0;

      csvContent += `${timeStr},${typeLabel},${fromLoc},${toLoc},${dur},${dist},${spd}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${unitName.replace(/[^a-zA-Z0-9]/g, '_')}_History_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    setExportMenuAnchor(null);
    if (!rawPositions.length) return;

    const unitName = selectedDevice ? selectedDevice.name : `Unit #${selectedDeviceId}`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = timeline
      .map((item, idx) => {
        const isTrip = item.type === 'trip';
        const isStop = item.type === 'stop';
        const typeLabel = isTrip ? 'Driver Start' : isStop ? 'Driving Ended' : formatEventTitle(item.data);
        const duration = isTrip || isStop ? formatDuration(item.data.duration) : '-';
        const dist = isTrip ? formatDistance(item.data.distance) : '-';
        const fromLoc = isTrip ? item.data.startAddress || '-' : item.data.address || '-';
        const toLoc = isTrip ? item.data.endAddress || item.data.startAddress || '-' : item.data.address || '-';
        const fromTime = dayjs(item.start).format('DD-MM-YYYY HH:mm');
        const toTime = dayjs(item.end).format('DD-MM-YYYY HH:mm');

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 7px 6px;">${idx + 1}</td>
            <td style="padding: 7px 6px; font-weight: 700; color: ${isTrip ? '#00ab8e' : isStop ? '#0284c7' : '#ef4444'};">${escapeHtml(typeLabel)}</td>
            <td style="padding: 7px 6px; color: #475569;">${escapeHtml(fromTime)}</td>
            <td style="padding: 7px 6px; color: #475569;">${escapeHtml(toTime)}</td>
            <td style="padding: 7px 6px; font-weight: 700;">${escapeHtml(duration)}</td>
            <td style="padding: 7px 6px; font-weight: 700; color: #00ab8e;">${escapeHtml(dist)}</td>
            <td style="padding: 7px 6px; color: #1e293b; max-width: 180px;"><strong>(A)</strong> ${escapeHtml(fromLoc)}</td>
            <td style="padding: 7px 6px; color: #1e293b; max-width: 180px;"><strong>(B)</strong> ${escapeHtml(toLoc)}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <title>${escapeHtml(unitName)} - Route History Log</title>
          <style>
            @page { size: landscape; margin: 12mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; color: #0f172a; font-size: 11px; line-height: 1.4; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00ab8e; padding-bottom: 12px; margin-bottom: 16px; }
            .logo-img { max-height: 48px; width: auto; object-fit: contain; }
            .summary-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
            .summary-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 2px; letter-spacing: 0.03em; }
            .summary-val { font-size: 13px; font-weight: 700; color: #0f172a; }
            .route-overview-box { background: #f0fdfa; border: 1px solid #a7f3d0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 11.5px; color: #0f172a; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { background: #e6f7f5; padding: 8px 6px; font-size: 10.5px; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #00ab8e; border-top: 1px solid #cbd5e1; font-weight: 700; }
            tbody tr:nth-of-type(even) { background-color: #f9fbfb; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <img src="/logo.png" class="logo-img" alt="Logo" onerror="this.src='/logo.svg';"/>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b; line-height: 1.5;">
              <div><strong>Target Unit:</strong> ${escapeHtml(unitName)}</div>
              <div><strong>Generated:</strong> ${dayjs().format('DD-MM-YYYY HH:mm:ss')}</div>
              <div><strong>User:</strong> ${escapeHtml(currentUser?.email || 'Administrator')}</div>
            </div>
          </div>

          <div class="route-overview-box">
            <div><strong>Origin (A):</strong> ${escapeHtml(summaryMetrics.startLocation)}</div>
            <div><strong>Destination (B):</strong> ${escapeHtml(summaryMetrics.finishLocation)}</div>
          </div>

          <div class="summary-card">
            <div>
              <div class="summary-title">Total Distance Covered</div>
              <div class="summary-val" style="color: #00ab8e;">${escapeHtml(summaryMetrics.mileage)}</div>
            </div>
            <div>
              <div class="summary-title">Driving Duration</div>
              <div class="summary-val">${escapeHtml(summaryMetrics.workTime)}</div>
            </div>
            <div>
              <div class="summary-title">Parked Duration</div>
              <div class="summary-val">${escapeHtml(summaryMetrics.stopTime)}</div>
            </div>
            <div>
              <div class="summary-title">Period Window</div>
              <div class="summary-val" style="font-size: 11px; font-weight: 600;">${dayjs(fromDate).format('DD/MM/YYYY')} - ${dayjs(toDate).format('DD/MM/YYYY')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Status / Event</th>
                <th>Departed (24h)</th>
                <th>Arrived (24h)</th>
                <th>Duration</th>
                <th>Distance</th>
                <th>From Location (A)</th>
                <th>To Location (B)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const applyPreset = (key) => {
    setActivePreset(key);
    const now = dayjs();
    let start;
    let end;

    switch (key) {
      case 'lastHour':
        start = now.subtract(1, 'hour');
        end = now;
        break;
      case 'today':
        start = now.startOf('day');
        end = now.endOf('day');
        break;
      case 'yesterday':
        start = now.subtract(1, 'day').startOf('day');
        end = now.subtract(1, 'day').endOf('day');
        break;
      case 'lastWeek':
        start = now.subtract(1, 'week').startOf('week');
        end = now.subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        start = now.startOf('month');
        end = now.endOf('month');
        break;
      case 'custom':
        return;
      default:
        start = now.startOf('day');
        end = now.endOf('day');
    }

    setTempFromDate(start.format('DD-MM-YYYY'));
    setTempFromTime(start.format('HH:mm'));
    setTempToDate(end.format('DD-MM-YYYY'));
    setTempToTime(end.format('HH:mm'));
  };

  const handleApplyCustomDate = () => {
    const fParsed = dayjs(`${tempFromDate} ${tempFromTime}`, 'DD-MM-YYYY HH:mm');
    const tParsed = dayjs(`${tempToDate} ${tempToTime}`, 'DD-MM-YYYY HH:mm');

    const fISO = fParsed.isValid() ? fParsed.toISOString() : fromDate;
    const tISO = tParsed.isValid() ? tParsed.toISOString() : toDate;

    setFromDate(fISO);
    setToDate(tISO);
    setDateModalOpen(false);

    fetchHistoryWithParams(fISO, tISO);
  };

  const renderCalendarMonth = (monthDayjs, showPrev, showNext) => {
    const startOfMonth = monthDayjs.startOf('month');
    const daysInMonth = monthDayjs.daysInMonth();
    const startDayOfWeek = startOfMonth.day();
    const todayStr = dayjs().format('DD-MM-YYYY');

    const startSel = tempFromDate ? dayjs(tempFromDate, 'DD-MM-YYYY') : null;
    const endSel = tempToDate ? dayjs(tempToDate, 'DD-MM-YYYY') : null;

    const prevMonthDays = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(startOfMonth.subtract(i + 1, 'day').date());
    }

    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className={classes.calendarBox}>
        <div className={classes.calendarHeader}>
          {showPrev ? (
            <IconButton size="small" onClick={() => setCurrentViewMonth((m) => m.subtract(1, 'month'))}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          ) : (
            <div />
          )}
          <span>{monthDayjs.format('MMM YYYY')}</span>
          {showNext ? (
            <IconButton size="small" onClick={() => setCurrentViewMonth((m) => m.add(1, 'month'))}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          ) : (
            <div />
          )}
        </div>

        <div className={classes.weekDaysRow}>
          <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
        </div>

        <div className={classes.daysGrid}>
          {prevMonthDays.map((d, idx) => (
            <div key={`prev-${idx}`} className={classes.dayCellWrapper}>
              <div className={`${classes.dayCell} ${classes.dayCellMuted}`}>{d}</div>
            </div>
          ))}

          {currentMonthDays.map((d) => {
            const dayObj = monthDayjs.date(d);
            const dateStr = dayObj.format('DD-MM-YYYY');
            const isToday = dateStr === todayStr;
            const isFuture = dayObj.isAfter(dayjs(), 'day');

            const isStart = startSel && dayObj.isSame(startSel, 'day');
            const isEnd = endSel && dayObj.isSame(endSel, 'day');
            const isInRange = startSel && endSel && dayObj.isAfter(startSel, 'day') && dayObj.isBefore(endSel, 'day');

            let wrapperClass = classes.dayCellWrapper;
            if (isStart && isEnd) {
              wrapperClass = classes.dayCellWrapper;
            } else if (isStart) {
              wrapperClass = `${classes.dayCellWrapper} ${classes.dayCellRangeStart}`;
            } else if (isEnd) {
              wrapperClass = `${classes.dayCellWrapper} ${classes.dayCellRangeEnd}`;
            } else if (isInRange) {
              wrapperClass = `${classes.dayCellWrapper} ${classes.dayCellInRange}`;
            }

            let cellClass = classes.dayCell;
            if (isFuture) cellClass = `${classes.dayCell} ${classes.dayCellDisabled}`;
            else if (isStart || isEnd) cellClass = classes.dayCellSelected;
            else if (isToday) cellClass = classes.dayCellToday;

            return (
              <div key={`day-${d}`} className={wrapperClass}>
                <div
                  className={cellClass}
                  onClick={() => {
                    if (isFuture) return;
                    setActivePreset('custom');

                    if (!tempFromDate || (tempFromDate && tempToDate && tempFromDate !== tempToDate)) {
                      setTempFromDate(dateStr);
                      setTempToDate(dateStr);
                    } else {
                      const currentStart = dayjs(tempFromDate, 'DD-MM-YYYY');
                      if (dayObj.isBefore(currentStart)) {
                        setTempFromDate(dateStr);
                      } else {
                        setTempToDate(dateStr);
                      }
                    }
                  }}
                >
                  {d}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={classes.sidebarContainer}>
      <div className={classes.headerSection}>
        <div className={classes.headerTopRow}>
          <div className={classes.headerTitleWrap}>
            <HistoryIcon sx={{ color: PRIMARY, fontSize: 20 }} />
            <Typography className={classes.headerTitle}>History</Typography>
          </div>

          {onClose && (
            <IconButton size="small" onClick={onClose} className={classes.closeBtn}>
              <ChevronLeftIcon sx={{ fontSize: '20px' }} />
            </IconButton>
          )}
        </div>
      </div>

      <div className={classes.filterSection}>
        <div className={classes.formInputGroup}>
          <span className={classes.sectionLabel}>Target Unit</span>
          <div
            ref={inputRef}
            className={classes.pickerInputPill}
            onClick={() => setDeviceDropdownOpen((o) => !o)}
          >
            <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: selectedDevice ? TEXT : TEXT_MUTED }}>
              {selectedDevice ? selectedDevice.name : 'Select Unit...'}
            </Typography>
            <ExpandMoreIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
          </div>
        </div>

        <div className={classes.formInputGroup}>
          <span className={classes.sectionLabel}>Date Range (24h)</span>
          <div
            className={classes.pickerInputPill}
            onClick={() => setDateModalOpen(true)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
              <CalendarMonthIcon sx={{ fontSize: '15px', color: PRIMARY }} />
              <Typography noWrap sx={{ fontSize: '11.5px', fontWeight: 500, color: TEXT }}>
                {`${dayjs(fromDate).format('DD-MM-YYYY HH:mm')} — ${dayjs(toDate).format('DD-MM-YYYY HH:mm')}`}
              </Typography>
            </Box>
            <ExpandMoreIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', width: '100%' }}>
          <Button
            variant="contained"
            className={classes.showButton}
            onClick={handleShowHistory}
            disabled={!selectedDeviceId || timelineLoading}
            disableElevation
            style={{ flex: 1 }}
          >
            Show History
          </Button>

          {hasDataLoaded && (
            <>
              <Tooltip title="Export Report">
                <IconButton
                  size="small"
                  onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                  sx={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '6px',
                    border: `1px solid ${BORDER}`,
                    backgroundColor: SURFACE,
                    color: PRIMARY,
                  }}
                >
                  <DownloadIcon sx={{ fontSize: '17px' }} />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={() => setExportMenuAnchor(null)}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: '8px',
                      border: `1px solid ${BORDER}`,
                      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
                      mt: '4px',
                    },
                  },
                }}
              >
                <MenuItem onClick={handleExportPDF} sx={{ fontSize: '12px', gap: 1, fontWeight: 600 }}>
                  <ListItemIcon sx={{ minWidth: '20px !important' }}>
                    <PictureAsPdfOutlinedIcon sx={{ fontSize: '15px', color: '#ef4444' }} />
                  </ListItemIcon>
                  <span>Download PDF Document</span>
                </MenuItem>
                <MenuItem onClick={handleExportCSV} sx={{ fontSize: '12px', gap: 1, fontWeight: 600 }}>
                  <ListItemIcon sx={{ minWidth: '20px !important' }}>
                    <TableViewOutlinedIcon sx={{ fontSize: '15px', color: PRIMARY }} />
                  </ListItemIcon>
                  <span>Download CSV Table</span>
                </MenuItem>
              </Menu>

              <Tooltip title="Clear History View">
                <IconButton
                  size="small"
                  className={classes.deleteBtn}
                  onClick={() => {
                    setTimeline([]);
                    setRawPositions([]);
                    setHasDataLoaded(false);
                    if (onPositionsLoaded) onPositionsLoaded([]);
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: '17px' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      <div className={classes.mainScrollArea}>
        {hasDataLoaded && (
          <div className={classes.summaryContainer}>
            <div className={classes.summaryTitle}>Playback Summary</div>

            <div className={classes.locationRow} onClick={() => handleSummaryClick('start')}>
              <span className={classes.locationLabel}>From (A):</span>
              <span className={classes.locationVal} title={summaryMetrics.startLocation}>
                {summaryMetrics.startLocation}
              </span>
            </div>

            <div className={classes.locationRow} onClick={() => handleSummaryClick('finish')}>
              <span className={classes.locationLabel}>To (B):</span>
              <span className={classes.locationVal} title={summaryMetrics.finishLocation}>
                {summaryMetrics.finishLocation}
              </span>
            </div>

            <div className={classes.summaryGridMetrics}>
              <div className={classes.metricCell} onClick={() => handleSummaryClick('general')}>
                <span className={classes.metricCellLabel}>Driving</span>
                <span className={classes.metricCellValue}>{summaryMetrics.workTime}</span>
              </div>
              <div className={classes.metricCell} onClick={() => handleSummaryClick('general')}>
                <span className={classes.metricCellLabel}>Parked</span>
                <span className={classes.metricCellValue}>{summaryMetrics.stopTime}</span>
              </div>
              <div className={classes.metricCell} onClick={() => handleSummaryClick('general')}>
                <span className={classes.metricCellLabel}>Distance</span>
                <span className={classes.metricCellValue}>{summaryMetrics.mileage}</span>
              </div>
            </div>
          </div>
        )}

        {hasDataLoaded && (
          <div className={classes.timelineDateBar}>
            <span>{dayjs(fromDate).format('DD/MM/YYYY')}</span>
            <InfoOutlinedIcon sx={{ fontSize: '13px', color: TEXT_MUTED }} />
          </div>
        )}

        {timelineLoading && !hasDataLoaded ? (
          <div className={classes.emptyState}>
            <CircularProgress size={20} sx={{ color: PRIMARY, mb: 1 }} />
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: TEXT_SECONDARY }}>
              Loading history...
            </Typography>
          </div>
        ) : timeline.length === 0 && hasDataLoaded ? (
          <div className={classes.emptyState}>
            <Typography sx={{ fontSize: '11.5px', fontWeight: 500, color: TEXT_MUTED }}>
              No recorded events for this timeframe.
            </Typography>
          </div>
        ) : timeline.length === 0 ? (
          <div className={classes.emptyState}>Select unit & date range to view history</div>
        ) : (
          timeline.map((item) => {
            const isTrip = item.type === 'trip';
            const isStop = item.type === 'stop';
            const active = activeSegmentId === item.id;
            const address = isTrip
              ? `(A) ${item.data.startAddress || 'Start'} → (B) ${item.data.endAddress || item.data.startAddress || 'Finish'}`
              : isStop
              ? item.data.address
              : item.data.attributes?.address || '';

            return (
              <div
                key={item.id}
                className={active ? classes.timelineBlockActive : classes.timelineBlock}
                onClick={() => {
                  setActiveSegmentId(item.id);
                  if (onSegmentClick) onSegmentClick(item);
                }}
              >
                <div className={classes.timelineRow}>
                  <div
                    className={
                      isTrip
                        ? classes.dotStart
                        : isStop
                        ? classes.dotStop
                        : classes.dotEvent
                    }
                  />
                  <span
                    className={classes.timeLabel}
                    style={{
                      color: isTrip ? PRIMARY : isStop ? '#0284c7' : '#ef4444',
                    }}
                  >
                    {format24Time(item.start)}{' '}
                    {isTrip
                      ? 'Driver Start'
                      : isStop
                      ? 'Driving Ended'
                      : formatEventTitle(item.data)}
                  </span>
                  <span className={classes.durationText}>
                    {isTrip
                      ? `${formatDuration(item.data.duration)} | ${formatDistance(item.data.distance)}`
                      : isStop
                      ? formatDuration(item.data.duration)
                      : item.data.attributes?.speed
                      ? `${Math.round(item.data.attributes.speed * 1.852)} kph`
                      : ''}
                  </span>
                </div>
                {isTrip && (
                  <div className={classes.timelineRow} style={{ paddingLeft: '13px' }}>
                    <span style={{ fontSize: '10.5px', color: TEXT_SECONDARY, fontWeight: 500 }}>
                      Ended: {format24Time(item.end)}
                    </span>
                  </div>
                )}
                {address && <div className={classes.addressSub}>{address}</div>}
              </div>
            );
          })
        )}
      </div>

      <Popper open={deviceDropdownOpen} anchorEl={inputRef.current} placement="bottom-start" style={{ zIndex: 3000 }}>
        <ClickAwayListener onClickAway={() => setDeviceDropdownOpen(false)}>
          <div className={classes.dropdownPaper}>
            <div className={classes.dropdownHeader}>
              <span className={classes.dropdownTitle}>Select Unit ({deviceList.length})</span>
              <IconButton size="small" onClick={() => setDeviceDropdownOpen(false)} sx={{ p: '2px' }}>
                <CloseIcon sx={{ fontSize: '15px' }} />
              </IconButton>
            </div>
            <div className={classes.searchContainer}>
              <div className={classes.searchBoxContainer}>
                <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 15, mr: 0.6 }} />
                <InputBase
                  placeholder="Search units..."
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ fontSize: '12px', color: TEXT }}
                />
              </div>
            </div>
            <div className={classes.listContainer}>
              <List dense sx={{ py: 0 }}>
                {filteredDevices.map((device) => (
                  <ListItem
                    key={device.id}
                    className={classes.listItem}
                    onClick={() => {
                      onSelect(device.id);
                      setDeviceDropdownOpen(false);
                    }}
                  >
                    <Typography className={classes.deviceName}>
                      {device.name}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </div>
          </div>
        </ClickAwayListener>
      </Popper>

      <Dialog
        open={dateModalOpen}
        onClose={(_, reason) => {
          if (reason === 'backdropClick') return;
          setDateModalOpen(false);
        }}
        className={classes.dateModalDialog}
      >
        <div className={classes.modalHeader}>
          <div className={classes.modalTitleGroup}>
            <CalendarTodayOutlinedIcon sx={{ color: PRIMARY, fontSize: '16px' }} />
            <span>Select Date Window (24h)</span>
          </div>
          <IconButton size="small" onClick={() => setDateModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <div className={classes.modalBody}>
          <div className={classes.modalSidebar}>
            {PRESETS.map((p) => (
              <div
                key={p.key}
                className={activePreset === p.key ? classes.presetBtnActive : classes.presetBtn}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </div>
            ))}
          </div>

          <div className={classes.modalMainContent}>
            <div className={classes.calendarGridRow}>
              {renderCalendarMonth(currentViewMonth, true, false)}
              {renderCalendarMonth(currentViewMonth.add(1, 'month'), false, true)}
            </div>

            <div className={classes.timeInputsRow}>
              <div className={classes.timeInputGroup}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT }}>From (24h)</span>
                <input
                  type="text"
                  className={classes.timeInputBox}
                  value={tempFromDate}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setTempFromDate(e.target.value);
                  }}
                />
                <input
                  type="text"
                  className={classes.timeInputBox}
                  value={tempFromTime}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setTempFromTime(e.target.value);
                  }}
                />
              </div>

              <span style={{ color: BORDER, fontWeight: 700 }}>—</span>

              <div className={classes.timeInputGroup}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT }}>To (24h)</span>
                <input
                  type="text"
                  className={classes.timeInputBox}
                  value={tempToDate}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setTempToDate(e.target.value);
                  }}
                />
                <input
                  type="text"
                  className={classes.timeInputBox}
                  value={tempToTime}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setTempToTime(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={classes.modalFooter}>
          <Button
            variant="outlined"
            onClick={() => setDateModalOpen(false)}
            sx={{
              borderRadius: '6px',
              borderColor: BORDER,
              color: TEXT_SECONDARY,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '12px',
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyCustomDate}
            disableElevation
            sx={{
              borderRadius: '6px',
              backgroundColor: PRIMARY,
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '12px',
              px: 2.5,
              '&:hover': { backgroundColor: PRIMARY_DARK },
            }}
          >
            Apply Range
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default memo(HistorySidebar);