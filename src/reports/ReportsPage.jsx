import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  MenuItem,
  Checkbox,
  InputBase,
  TextField,
  FormControl,
} from '@mui/material';

import Swal from 'sweetalert2';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ConstructionIcon from '@mui/icons-material/Construction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouteIcon from '@mui/icons-material/Route';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlaceIcon from '@mui/icons-material/Place';
import TimelineIcon from '@mui/icons-material/Timeline';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

import dayjs from 'dayjs';

import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { formatDistance, formatSpeed, formatNumericHours } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import exportExcel from '../common/util/exportExcel';
import { devicesActions } from '../store';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const unitPrimaryTypographySx = {
  fontFamily: FONT_FAMILY,
  fontSize: '13px',
  fontWeight: 600,
  color: '#1e293b',
  lineHeight: 1.3,
};

const fontStyle = {
  fontFamily: FONT_FAMILY,
};

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const PRIMARY_LIGHT = '#f0fdfa';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#f1f5f9';
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

const showAlert = (options) => {
  return Swal.fire({
    target: document.body,
    customClass: {
      container: 'swal-top-layer',
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = '999999';
      }
    },
    ...options,
  });
};

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: SURFACE_SOFT,
    fontFamily: FONT_FAMILY,
    fontSize: '12px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    padding: '12px',
    minWidth: 0,
    minHeight: 0,
    '& *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
  header: {
    paddingBottom: '8px',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  headerTitle: {
    fontWeight: '700 !important',
    fontSize: '17px !important',
    color: TEXT,
    letterSpacing: '-0.02em',
    fontFamily: FONT_FAMILY,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  tabsContainer: {
    backgroundColor: 'transparent',
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: '4px',
    flexShrink: 0,
  },
  tabs: {
    minHeight: '38px',
    '& .MuiTabs-indicator': {
      backgroundColor: PRIMARY,
      height: '2.5px',
    },
    '& .MuiTab-root': {
      textTransform: 'none',
      fontSize: '13px',
      fontWeight: 600,
      color: TEXT_SECONDARY,
      minHeight: '38px',
      padding: '4px 14px',
    },
    '& .Mui-selected': {
      color: `${PRIMARY} !important`,
      fontWeight: '700 !important',
    },
  },
  content: {
    flex: '1 1 0',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px 0',
    boxSizing: 'border-box',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    ...scrollableSx,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: '12px',
    border: `1px solid ${BORDER}`,
    padding: '16px 18px',
    boxShadow: 'none',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  },
  cardTitle: {
    fontSize: '13.5px !important',
    fontWeight: '700 !important',
    color: TEXT,
    marginBottom: '14px',
    letterSpacing: '-0.01em',
  },
  formInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
    minWidth: 0,
  },
  inputLabel: {
    fontWeight: '500 !important',
    fontSize: '12px !important',
    color: TEXT,
    fontFamily: FONT_FAMILY,
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      backgroundColor: SURFACE,
      '& fieldset': {
        borderColor: BORDER,
      },
      '&:hover fieldset': {
        borderColor: '#94a3b8',
      },
      '&.Mui-focused fieldset': {
        borderColor: `${PRIMARY} !important`,
        borderWidth: '1.5px',
      },
    },
    '& input': {
      fontSize: '13px !important',
      fontWeight: '400 !important',
      color: TEXT,
      fontFamily: FONT_FAMILY,
      padding: '8.5px 12px',
    },
  },
  selectField: {
    borderRadius: '6px',
    backgroundColor: SURFACE,
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
    fontWeight: 400,
    color: TEXT,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: BORDER,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#94a3b8',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: `${PRIMARY} !important`,
      borderWidth: '1.5px',
    },
    '& .MuiSelect-select': {
      padding: '8.5px 12px',
    },
  },
  dateBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '38px',
    border: `1px solid ${BORDER}`,
    borderRadius: '6px',
    padding: '6px 12px',
    backgroundColor: SURFACE,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: '#94a3b8',
    },
    '&:focus-within': {
      borderColor: PRIMARY,
    },
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginBottom: '14px',
    width: '100%',
    boxSizing: 'border-box',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  },
  unitSelectionUnifiedContainer: {
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    backgroundColor: SURFACE_SOFT,
    padding: '14px',
    marginBottom: '14px',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  },
  searchBoxContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: '20px',
    border: `1px solid ${BORDER}`,
    padding: '0 10px',
    height: '32px',
    width: '200px',
    maxWidth: '100%',
    transition: 'all 0.15s ease',
    '&:focus-within': {
      borderColor: PRIMARY,
      boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
    },
  },
  unitListScroll: {
    maxHeight: '220px',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
    marginTop: '12px',
    paddingRight: '4px',
    boxSizing: 'border-box',
    ...scrollableSx,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
      maxHeight: '180px',
    },
  },
  unitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minWidth: 0,
    height: '38px',
    boxSizing: 'border-box',
    '&:hover': {
      borderColor: PRIMARY,
    },
  },
  unitItemSelected: {
    border: `1.5px solid ${PRIMARY} !important`,
    backgroundColor: '#f0fdfa !important',
  },
  categoryIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: PRIMARY,
  },
  unitReportSection: {
    backgroundColor: SURFACE,
    borderRadius: '12px',
    border: `1px solid ${BORDER}`,
    overflow: 'hidden',
    marginBottom: '12px',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  },
  unitReportHeader: {
    padding: '10px 14px',
    backgroundColor: SURFACE_SOFT,
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
    boxSizing: 'border-box',
    width: '100%',
  },
  unitMetaBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '10px',
    padding: '8px 14px',
    backgroundColor: SURFACE,
    borderBottom: `1px solid ${BORDER}`,
    fontSize: '12px',
    fontWeight: 600,
    color: TEXT_SECONDARY,
    fontFamily: FONT_FAMILY,
  },
  tableResponsiveWrapper: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    boxSizing: 'border-box',
    ...scrollableSx,
  },
  tableHeader: {
    backgroundColor: '#e6f7f5',
  },
  tableHeaderCell: {
    fontSize: '11px !important',
    fontWeight: '700 !important',
    color: '#0f172a',
    backgroundColor: '#e6f7f5',
    borderBottom: '2px solid #00ab8e',
    borderRight: '1px solid #cbd5e1',
    padding: '8px 10px',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: FONT_FAMILY,
  },
  tableCell: {
    fontSize: '12.5px',
    color: TEXT,
    fontWeight: 500,
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    padding: '8px 10px',
    verticalAlign: 'top',
    fontFamily: FONT_FAMILY,
  },
}));

const getDeviceCategoryIcon = (category) => {
  const cat = String(category || 'default').toLowerCase();
  switch (cat) {
    case 'motorcycle':
    case 'scooter':
    case 'bicycle':
      return <TwoWheelerIcon sx={{ fontSize: 16 }} />;
    case 'truck':
    case 'pickup':
      return <LocalShippingIcon sx={{ fontSize: 16 }} />;
    case 'bus':
      return <DirectionsBusIcon sx={{ fontSize: 16 }} />;
    case 'van':
      return <AirportShuttleIcon sx={{ fontSize: 16 }} />;
    case 'tractor':
      return <AgricultureIcon sx={{ fontSize: 16 }} />;
    case 'construction':
      return <ConstructionIcon sx={{ fontSize: 16 }} />;
    case 'person':
      return <PersonIcon sx={{ fontSize: 16 }} />;
    case 'car':
    case 'auto':
    case 'default':
    default:
      return <DirectionsCarFilledIcon sx={{ fontSize: 16 }} />;
  }
};

const REPORT_CATEGORIES = {
  trips: {
    key: 'trips',
    label: 'Trip Log',
    endpoint: '/api/reports/trips',
    color: '#00ab8e',
    icon: RouteIcon,
    columns: [
      { key: 'startTime', label: 'Start Time', width: 130, render: (r) => (r.startTime ? dayjs(r.startTime).format('DD-MM-YYYY HH:mm') : '-') },
      { key: 'endTime', label: 'End Time', width: 130, render: (r) => (r.endTime ? dayjs(r.endTime).format('DD-MM-YYYY HH:mm') : '-') },
      { key: 'startAddress', label: 'Start Address', render: (r) => r.startAddress || r.address || '-' },
      { key: 'endAddress', label: 'End Address', render: (r) => r.endAddress || r.address || '-' },
      { key: 'distance', label: 'Distance', width: 90, accent: true, render: (r, ctx) => formatDistance(r.distance || 0, ctx.distanceUnit, ctx.t) },
      { key: 'maxSpeed', label: 'Max Speed', width: 90, render: (r, ctx) => formatSpeed(r.maxSpeed || 0, ctx.speedUnit, ctx.t) },
      { key: 'driverName', label: 'Driver', width: 110, render: (r) => r.driverName || '-' },
    ],
    computeStats: (rows, ctx) => {
      const totalDistance = rows.reduce((sum, r) => sum + Number(r.distance || 0), 0);
      const totalDuration = rows.reduce((sum, r) => sum + Number(r.duration || 0), 0);
      const maxSpeed = rows.reduce((max, r) => Math.max(max, Number(r.maxSpeed || 0)), 0);
      return [
        { label: 'Trips', value: String(rows.length) },
        { label: 'Total Distance', value: formatDistance(totalDistance, ctx.distanceUnit, ctx.t) },
        { label: 'Drive Time', value: formatNumericHours(totalDuration, ctx.t) },
        { label: 'Max Speed', value: formatSpeed(maxSpeed, ctx.speedUnit, ctx.t) },
      ];
    },
    emptyMessage: 'No trips recorded for this unit in the selected timeframe.',
  },
  stops: {
    key: 'stops',
    label: 'Stops Log',
    endpoint: '/api/reports/stops',
    color: '#f59e0b',
    icon: PauseCircleFilledIcon,
    columns: [
      { key: 'startTime', label: 'Arrived', width: 140, render: (r) => (r.startTime ? dayjs(r.startTime).format('DD-MM-YYYY HH:mm') : '-') },
      { key: 'endTime', label: 'Departed', width: 140, render: (r) => (r.endTime ? dayjs(r.endTime).format('DD-MM-YYYY HH:mm') : '-') },
      { key: 'duration', label: 'Duration', width: 100, accent: true, render: (r, ctx) => formatNumericHours(r.duration || 0, ctx.t) },
      { key: 'address', label: 'Location', render: (r) => r.address || '-' },
      { key: 'engineHours', label: 'Engine Hours', width: 100, render: (r, ctx) => (r.engineHours ? formatNumericHours(r.engineHours, ctx.t) : '-') },
    ],
    computeStats: (rows, ctx) => {
      const totalDuration = rows.reduce((sum, r) => sum + Number(r.duration || 0), 0);
      return [
        { label: 'Stops', value: String(rows.length) },
        { label: 'Total Stopped Time', value: formatNumericHours(totalDuration, ctx.t) },
      ];
    },
    emptyMessage: 'No stops recorded for this unit in the selected timeframe.',
  },
  summary: {
    key: 'summary',
    label: 'Summary',
    endpoint: '/api/reports/summary',
    color: '#3b82f6',
    icon: FormatListBulletedIcon,
    columns: [
      { key: 'startOdometer', label: 'Start Odometer', width: 110, render: (r, ctx) => (r.startOdometer != null ? formatDistance(r.startOdometer, ctx.distanceUnit, ctx.t) : '-') },
      { key: 'endOdometer', label: 'End Odometer', width: 110, render: (r, ctx) => (r.endOdometer != null ? formatDistance(r.endOdometer, ctx.distanceUnit, ctx.t) : '-') },
      { key: 'distance', label: 'Distance', width: 90, accent: true, render: (r, ctx) => formatDistance(r.distance || 0, ctx.distanceUnit, ctx.t) },
      { key: 'averageSpeed', label: 'Avg Speed', width: 90, render: (r, ctx) => formatSpeed(r.averageSpeed || 0, ctx.speedUnit, ctx.t) },
      { key: 'maxSpeed', label: 'Max Speed', width: 90, render: (r, ctx) => formatSpeed(r.maxSpeed || 0, ctx.speedUnit, ctx.t) },
      { key: 'engineHours', label: 'Engine Hours', width: 100, render: (r, ctx) => (r.engineHours ? formatNumericHours(r.engineHours, ctx.t) : '-') },
      { key: 'spentFuel', label: 'Fuel Used', width: 90, render: (r) => (r.spentFuel ? `${Number(r.spentFuel).toFixed(1)} L` : '-') },
    ],
    computeStats: (rows, ctx) => {
      const totalDistance = rows.reduce((sum, r) => sum + Number(r.distance || 0), 0);
      const totalFuel = rows.reduce((sum, r) => sum + Number(r.spentFuel || 0), 0);
      return [
        { label: 'Days Summarized', value: String(rows.length) },
        { label: 'Total Distance', value: formatDistance(totalDistance, ctx.distanceUnit, ctx.t) },
        { label: 'Total Fuel Used', value: totalFuel ? `${totalFuel.toFixed(1)} L` : '-' },
      ];
    },
    emptyMessage: 'No summary data available for this unit in the selected timeframe.',
  },
  events: {
    key: 'events',
    label: 'Events & Alarms',
    endpoint: '/api/reports/events',
    color: '#ef4444',
    icon: NotificationsActiveIcon,
    columns: [
      { key: 'eventTime', label: 'Time', width: 150, render: (r) => (r.eventTime ? dayjs(r.eventTime).format('DD-MM-YYYY HH:mm:ss') : '-') },
      { key: 'type', label: 'Event Type', width: 160, render: (r) => formatEventTypeLabel(r.type) },
      { key: 'details', label: 'Details', render: (r) => r.attributes?.alarm || r.attributes?.message || '-' },
    ],
    computeStats: (rows) => [{ label: 'Events Triggered', value: String(rows.length) }],
    emptyMessage: 'No events or alarms triggered for this unit in the selected timeframe.',
  },
  geofences: {
    key: 'geofences',
    label: 'Geofence Visits',
    endpoint: '/api/reports/geofences',
    color: '#8b5cf6',
    icon: PlaceIcon,
    columns: [
      { key: 'geofenceId', label: 'Geofence', width: 160, render: (r, ctx) => ctx.geofences?.[r.geofenceId]?.name || `Zone #${r.geofenceId}` },
      { key: 'startTime', label: 'Entry Time', width: 150, render: (r) => (r.startTime ? dayjs(r.startTime).format('DD-MM-YYYY HH:mm:ss') : '-') },
      { key: 'endTime', label: 'Exit Time', width: 150, render: (r) => (r.endTime ? dayjs(r.endTime).format('DD-MM-YYYY HH:mm:ss') : '-') },
      { key: 'duration', label: 'Time Inside', width: 100, accent: true, render: (r, ctx) => formatNumericHours(Date.parse(r.endTime) - Date.parse(r.startTime), ctx.t) },
    ],
    computeStats: (rows) => [{ label: 'Zone Visits', value: String(rows.length) }],
    emptyMessage: 'No geofence entries or exits recorded for this unit in the selected timeframe.',
  },
  positions: {
    key: 'positions',
    label: 'Route Coordinates',
    endpoint: '/api/positions',
    color: '#0891b2',
    icon: TimelineIcon,
    columns: [
      { key: 'fixTime', label: 'Time', width: 150, render: (r) => (r.fixTime ? dayjs(r.fixTime).format('DD-MM-YYYY HH:mm:ss') : '-') },
      { key: 'latitude', label: 'Latitude', width: 100, render: (r) => (r.latitude != null ? Number(r.latitude).toFixed(5) : '-') },
      { key: 'longitude', label: 'Longitude', width: 100, accent: true, render: (r) => (r.longitude != null ? Number(r.longitude).toFixed(5) : '-') },
      { key: 'speed', label: 'Speed', width: 90, render: (r, ctx) => formatSpeed(r.speed || 0, ctx.speedUnit, ctx.t) },
      { key: 'address', label: 'Address', render: (r) => r.address || '-' },
    ],
    computeStats: (rows) => [{ label: 'Points Logged', value: String(rows.length) }],
    emptyMessage: 'No position points recorded for this unit in the selected timeframe.',
  },
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const formatEventTypeLabel = (type) => {
  const withSpaces = String(type || 'Unknown').replace(/([a-z])([A-Z])/g, '$1 $2');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

const REPORT_TYPE_CATALOG = [
  { label: 'General Information', category: 'summary' },
  { label: 'Odometer Daily', category: 'summary' },
  { label: 'Engine Work Hours', category: 'summary' },
  { label: 'Travel Sheet', category: 'trips' },
  { label: 'Drive Time', category: 'trips' },
  { label: 'Fuel Level & Fillings', category: 'trips' },
  { label: 'Temperature Log', category: 'trips' },
  { label: 'Drives and Stops', category: 'stops' },
  { label: 'Stops Report', category: 'stops' },
  { label: 'Overspeed Violations', category: 'events' },
  { label: 'Speed Report', category: 'events' },
  { label: 'Events & Alarms', category: 'events' },
  { label: 'Ignition ON / OFF', category: 'events' },
  { label: 'Geofence In / Out', category: 'geofences' },
  { label: 'Route Coordinates', category: 'positions' },
];
const REPORT_TYPE_MAP = new Map(REPORT_TYPE_CATALOG.map((it) => [it.label, it.category]));
const CORE_REPORT_TYPES = REPORT_TYPE_CATALOG.map((it) => it.label);

const REPORT_FORMAT_OPTIONS = [
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'xls', label: 'XLS' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'pdf', label: 'PDF' },
  { value: 'pdf_landscape', label: 'PDF (Landscape)' },
];

const resolveCategory = (reportLabel) => REPORT_CATEGORIES[REPORT_TYPE_MAP.get(reportLabel) || 'trips'];
const resolveApiEndpoint = (reportLabel) => resolveCategory(reportLabel).endpoint;

const ReportsPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const hiddenFromDateRef = useRef(null);
  const hiddenToDateRef = useRef(null);

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const server = useSelector((state) => state.session?.server || {});
  const impersonatedUserId = localStorage.getItem('impersonated_user_id');
  const effectiveUserId = impersonatedUserId ? Number(impersonatedUserId) : currentUser?.id;
  const isSuperAdmin = Boolean(currentUser && (currentUser.administrator || currentUser.admin || currentUser.id === 1) && !impersonatedUserId);

  const reduxDevicesObj = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const geofencesById = useSelector((state) => state.geofences?.items || {}, shallowEqual);
  const [fetchedDevices, setFetchedDevices] = useState([]);

  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';

  const deviceList = useMemo(() => {
    let list = Array.isArray(reduxDevicesObj) ? reduxDevicesObj : Object.values(reduxDevicesObj || {});
    if (list.length === 0 && fetchedDevices.length > 0) {
      list = fetchedDevices;
    }

    if (!isSuperAdmin && effectiveUserId) {
      list = list.filter((dev) => {
        if (!dev) return false;
        if (dev.userId === effectiveUserId) return true;
        if (Array.isArray(dev.userIds) && dev.userIds.includes(effectiveUserId)) return true;
        return true;
      });
    }

    return list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [reduxDevicesObj, fetchedDevices, isSuperAdmin, effectiveUserId]);

  const loadAuthDevices = useCallback(async () => {
    // Only fetch if Redux is empty or needs refresh
    if (Object.keys(reduxDevicesObj).length > 0) return;
    
    if (!effectiveUserId) return;
    try {
      const endpoint = isSuperAdmin
        ? '/api/devices'
        : impersonatedUserId
        ? `/api/devices?userId=${impersonatedUserId}`
        : '/api/devices';

      const res = await fetch(endpoint, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Object.values(data || {});
        setFetchedDevices(list);
        if (devicesActions?.refresh) {
          dispatch(devicesActions.refresh(list));
        }
      }
    } catch (e) {}
  }, [effectiveUserId, isSuperAdmin, impersonatedUserId, dispatch, reduxDevicesObj]);

  useEffect(() => {
    loadAuthDevices();
  }, [loadAuthDevices]);

  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const speedUnit = useAttributePreference('speedUnit', 'kmh');

  const [activeTab, setActiveTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState(CORE_REPORT_TYPES[0]);
  const [showPreview, setShowPreview] = useState(false);

  const [unitSearch, setUnitSearch] = useState('');
  const [formTouched, setFormTouched] = useState(false);
  const [scheduleTouched, setScheduleTouched] = useState(false);

  const [dateFromOnly, setDateFromOnly] = useState('');
  const [dateToOnly, setDateToOnly] = useState('');

  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    type: CORE_REPORT_TYPES[0],
    format: 'html',
    deviceIds: [],
    frequency: 'daily',
    time: '08:00',
    dayOfWeek: '1',
    dayOfMonth: '1',
    emails: [],
  });

  const [newEmail, setNewEmail] = useState('');

  const filteredDeviceList = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return deviceList;
    return deviceList.filter((d) => (d.name || '').toLowerCase().includes(q) || (d.uniqueId || '').includes(q));
  }, [deviceList, unitSearch]);

  const handleClearReport = () => {
    setReportData(null);
    setShowPreview(false);
    setFormTouched(false);
    setDateFromOnly('');
    setDateToOnly('');
    setScheduleForm((prev) => ({
      ...prev,
      title: '',
      deviceIds: [],
    }));
    showAlert({
      icon: 'info',
      title: 'Report Cleared',
      text: 'Parameters reset. You can configure a new report.',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleReportTypeChange = (newType) => {
    setScheduleForm((prev) => ({ ...prev, type: newType }));
    setReportData(null);
    setShowPreview(false);
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setShowPreview(false);
  };

  const handleToggleUnit = (id) => {
    setScheduleForm((prev) => {
      const exists = prev.deviceIds.includes(id);
      return {
        ...prev,
        deviceIds: exists ? prev.deviceIds.filter((dId) => dId !== id) : [...prev.deviceIds, id],
      };
    });
  };

  const handleSelectAllUnits = () => {
    setScheduleForm((prev) => ({ ...prev, deviceIds: deviceList.map((d) => d.id) }));
  };

  const handleDeselectAllUnits = () => {
    setScheduleForm((prev) => ({ ...prev, deviceIds: [] }));
  };

  const openDatePicker = (inputRef) => {
    if (!inputRef.current) return;
    if (typeof inputRef.current.showPicker === 'function') {
      try {
        inputRef.current.showPicker();
        return;
      } catch (e) {}
    }
    inputRef.current.click();
  };

  const reportCtx = useMemo(
    () => ({ t, distanceUnit, speedUnit, geofences: geofencesById }),
    [t, distanceUnit, speedUnit, geofencesById],
  );

  const activeCategory = useMemo(() => resolveCategory(reportType), [reportType]);

  const perUnitReports = useMemo(() => {
    if (!reportData || !Array.isArray(reportData)) return [];

    const grouped = new Map();
    const activeTargetIds = scheduleForm.deviceIds;

    activeTargetIds.forEach((id) => {
      const dev = deviceList.find((d) => d.id === id);
      if (dev) {
        grouped.set(id, { device: dev, rows: [] });
      }
    });

    reportData.forEach((row) => {
      const devId = row.deviceId;
      if (grouped.has(devId)) {
        grouped.get(devId).rows.push(row);
      }
    });

    return Array.from(grouped.values())
      .filter((g) => g.rows.length > 0 || scheduleForm.deviceIds.includes(g.device.id))
      .map((g) => ({ ...g, stats: activeCategory.computeStats(g.rows, reportCtx) }));
  }, [reportData, scheduleForm.deviceIds, deviceList, activeCategory, reportCtx]);

  const onPrintReport = (orientation = 'portrait') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fromStr = dateFromOnly ? dayjs(dateFromOnly).format('DD-MM-YYYY') : '-';
    const toStr = dateToOnly ? dayjs(dateToOnly).format('DD-MM-YYYY') : '-';
    const category = activeCategory;

    const sectionsHtml = perUnitReports
      .map((unitReport) => {
        const statsHtml = unitReport.stats
          .map((s) => `<div><strong>${escapeHtml(s.label)}:</strong> ${escapeHtml(s.value)}</div>`)
          .join('');
        const headHtml = category.columns
          .map((col) => `<th${col.width ? ` style="width: ${col.width}px;"` : ''}>${escapeHtml(col.label)}</th>`)
          .join('');
        const bodyHtml = unitReport.rows.length === 0
          ? `<tr><td colspan="${category.columns.length}" style="text-align: center; color: #94a3b8; padding: 12px;">${escapeHtml(category.emptyMessage)}</td></tr>`
          : unitReport.rows
            .map((r) => `<tr>${category.columns
              .map((col) => `<td${col.accent ? ` style="font-weight: bold; color: ${category.color};"` : ''}>${escapeHtml(String(col.render(r, reportCtx) ?? '-'))}</td>`)
              .join('')}</tr>`)
            .join('');

        return `
        <div class="panel-box" style="border-left: 4px solid ${category.color};">
          <div class="panel-head">
            <div class="head-left"><span class="cat-badge" style="background:${category.color}1a; color:${category.color};">${escapeHtml(category.label)}</span> ${fromStr} 00:00:00 - ${toStr} 23:59:59</div>
            <div class="head-right">${escapeHtml(unitReport.device.name)}</div>
          </div>
          <div class="meta-row">${statsHtml}</div>
          <table>
            <thead><tr>${headHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <title>${escapeHtml(scheduleForm.title || reportType)}</title>
          <style>
            @page { size: ${orientation}; margin: 12mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.4; color: #333; background: #fff; margin: 15px; }
            header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00ab8e; padding-bottom: 10px; margin-bottom: 14px; }
            .logo-img { max-height: 48px; width: auto; object-fit: contain; }
            .meta-info { font-size: 11px; color: #64748b; text-align: right; line-height: 1.5; }
            .panel-box { border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 16px; page-break-inside: avoid; background: #fff; }
            .panel-head { background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 7px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; font-weight: 700; color: #333; gap: 8px; }
            .cat-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; margin-right: 6px; }
            .head-left { color: #333; font-size: 11.5px; display: flex; align-items: center; }
            .head-right { color: #333; font-size: 11.5px; font-weight: 700; }
            .meta-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; padding: 8px 10px; background: #fafafa; border-bottom: 1px solid #eee; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; color: #333; font-weight: 700; }
            td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
            tbody tr:nth-of-type(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <header>
            <div>
              <img src="/logo.png" class="logo-img" alt="Logo" onerror="this.src='/logo.svg';"/>
            </div>
            <div class="meta-info">
              Generated: ${dayjs().format('DD-MM-YYYY HH:mm:ss')}<br/>
              User: ${currentUser?.email || 'Administrator'}
            </div>
          </header>
          ${sectionsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const onExportJson = () => {
    if (!reportData || reportData.length === 0) {
      showAlert({
        icon: 'warning',
        title: 'Export Failed',
        text: 'No report data available to export.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${(scheduleForm.title || reportType).replace(/[^a-zA-Z0-9]/g, '_')}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const onExportExcel = useCatch(async (extension = 'xlsx') => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      showAlert({
        icon: 'warning',
        title: 'Export Failed',
        text: 'No report data available to export.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    const sheets = new Map();
    perUnitReports.forEach((unitReport) => {
      const rows = unitReport.rows.map((item, idx) => ({
        '#': idx + 1,
        ...activeCategory.columns.reduce((acc, col) => {
          acc[col.label] = col.render(item, reportCtx) ?? '-';
          return acc;
        }, {}),
      }));
      sheets.set(unitReport.device.name.slice(0, 30), rows);
    });

    await exportExcel(`${(scheduleForm.title || reportType).replace(/[^a-zA-Z0-9]/g, '_')}`, `${(scheduleForm.title || reportType).replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`, sheets);
  });

  const handleDownloadByFormat = () => {
    switch (scheduleForm.format) {
      case 'json':
        onExportJson();
        break;
      case 'xls':
        onExportExcel('xls');
        break;
      case 'xlsx':
        onExportExcel('xlsx');
        break;
      case 'pdf':
        onPrintReport('portrait');
        break;
      case 'pdf_landscape':
        onPrintReport('landscape');
        break;
      case 'html':
      default:
        onPrintReport('portrait');
        break;
    }
  };

  const handleGenerateReport = useCatch(async () => {
    setFormTouched(true);

    if (!scheduleForm.title.trim()) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter the report title.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (!scheduleForm.type) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select a report type.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (scheduleForm.deviceIds.length === 0) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select at least one unit before generating the report.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setGenerating(true);

    const apiEndpoint = resolveApiEndpoint(scheduleForm.type);
    const fromIso = dateFromOnly ? dayjs(dateFromOnly).startOf('day').toISOString() : dayjs().startOf('day').toISOString();
    const toIso = dateToOnly ? dayjs(dateToOnly).endOf('day').toISOString() : dayjs().endOf('day').toISOString();

    const params = new URLSearchParams();
    scheduleForm.deviceIds.forEach((id) => params.append('deviceId', id));
    params.append('from', fromIso);
    params.append('to', toIso);

    const EVENT_TYPE_FILTERS = {
      'Overspeed Violations': ['deviceOverspeed'],
      'Speed Report': ['deviceOverspeed'],
      'Ignition ON / OFF': ['ignitionOn', 'ignitionOff'],
    };
    (EVENT_TYPE_FILTERS[scheduleForm.type] || []).forEach((evType) => params.append('type', evType));

    try {
      const response = await fetchOrThrow(`${apiEndpoint}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      setReportData(Array.isArray(data) ? data : []);
      setReportType(scheduleForm.type);
      setShowPreview(true);
      showAlert({
        icon: 'success',
        title: 'Report Generated',
        text: 'Report preview generated successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Generation Failed',
        text: err.message || 'Could not fetch report data from the system.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setGenerating(false);
    }
  });

  const handleScheduleReport = useCatch(async () => {
    setScheduleTouched(true);

    if (!scheduleForm.title.trim()) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter the scheduled report title.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }
    if (scheduleForm.deviceIds.length === 0) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select at least one unit for the scheduled report.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }
    if (!scheduleForm.time) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please set the dispatch delivery time.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }
    if (scheduleForm.emails.length === 0) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please add at least one recipient email address.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setGenerating(true);

    const calendarBody = {
      name: `${scheduleForm.title} (${scheduleForm.time})`,
      ...(scheduleForm.frequency === 'daily' && { dailyFrom: scheduleForm.time }),
      ...(scheduleForm.frequency === 'weekly' && {
        weeklyDay: Number(scheduleForm.dayOfWeek),
        weeklyFrom: scheduleForm.time,
      }),
      ...(scheduleForm.frequency === 'monthly' && {
        monthlyDay: Number(scheduleForm.dayOfMonth),
        monthlyFrom: scheduleForm.time,
      }),
    };

    try {
      const calendarResponse = await fetchOrThrow('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify(calendarBody),
      });

      if (calendarResponse.ok) {
        const calendar = await calendarResponse.json();

        const reportBody = {
          description: scheduleForm.title,
          type: scheduleForm.type,
          calendarId: calendar.id,
          attributes: {
            format: scheduleForm.format,
            emails: scheduleForm.emails.join(','),
            dispatchTime: scheduleForm.time,
            frequency: scheduleForm.frequency,
            ownerUserId: Number(effectiveUserId),
          },
        };

        const reportResponse = await fetchOrThrow('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'include',
          body: JSON.stringify(reportBody),
        });

        if (reportResponse.ok) {
          const report = await reportResponse.json();
          if (scheduleForm.deviceIds.length > 0) {
            await fetch('/api/permissions/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(scheduleForm.deviceIds.map((id) => ({ deviceId: id, reportId: report.id }))),
            }).catch(() => null);
          }

          showAlert({
            icon: 'success',
            title: 'Report Scheduled',
            text: `Report scheduled for delivery at ${scheduleForm.time}.`,
            timer: 2000,
            showConfirmButton: false,
          });

          setScheduleForm({
            title: '',
            type: CORE_REPORT_TYPES[0],
            format: 'html',
            deviceIds: [],
            frequency: 'daily',
            time: '08:00',
            dayOfWeek: '1',
            dayOfMonth: '1',
            emails: [],
          });
          setScheduleTouched(false);
        }
      }
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Schedule Failed',
        text: err.message || 'Could not schedule report delivery in the system.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setGenerating(false);
    }
  });

  const addEmail = () => {
    if (newEmail.trim() && !scheduleForm.emails.includes(newEmail.trim())) {
      setScheduleForm((prev) => ({ ...prev, emails: [...prev.emails, newEmail.trim()] }));
      setNewEmail('');
    }
  };

  const removeEmail = (email) => {
    setScheduleForm((prev) => ({ ...prev, emails: prev.emails.filter((e) => e !== email) }));
  };

  return (
    <Box className={classes.root}>
      {/* Header */}
      <Box className={classes.header}>
        <Box className={classes.headerTitleWrap}>
          <BarChartIcon sx={{ color: PRIMARY, fontSize: 24 }} />
          <Typography className={classes.headerTitle}>Reports</Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box className={classes.tabsContainer}>
        <Tabs value={activeTab} onChange={handleTabChange} className={classes.tabs}>
          <Tab label="Reports" />
          <Tab label="Scheduled Reports" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box className={classes.content}>
          <Box className={classes.card}>
            <Typography className={classes.cardTitle}>Generate Report</Typography>

            <Box className={classes.formGrid}>
              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>
                  <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Report Title
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="e.g. Monthly Distance Log..."
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={classes.textField}
                />
              </Box>

              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>
                  <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Report Type
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={scheduleForm.type}
                    IconComponent={KeyboardArrowDownIcon}
                    onChange={(e) => handleReportTypeChange(e.target.value)}
                    className={classes.selectField}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 260,
                          borderRadius: '8px',
                          border: `1px solid ${BORDER}`,
                          fontFamily: FONT_FAMILY,
                          ...scrollableSx,
                        },
                      },
                    }}
                  >
                    {CORE_REPORT_TYPES.map((typeLabel) => {
                      const cat = resolveCategory(typeLabel);
                      const CatIcon = cat.icon;
                      return (
                        <MenuItem key={typeLabel} value={typeLabel} sx={{ fontSize: '13px', fontWeight: 500, gap: 1, fontFamily: FONT_FAMILY }}>
                          <CatIcon sx={{ fontSize: 16, color: cat.color, flexShrink: 0 }} />
                          {typeLabel}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>Format</Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={scheduleForm.format}
                    IconComponent={KeyboardArrowDownIcon}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, format: e.target.value }))}
                    className={classes.selectField}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: '8px',
                          border: `1px solid ${BORDER}`,
                          fontFamily: FONT_FAMILY,
                        },
                      },
                    }}
                  >
                    {REPORT_FORMAT_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box className={classes.formGrid}>
              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>Date From (00:00:00)</Typography>
                <Box className={classes.dateBox} onClick={() => openDatePicker(hiddenFromDateRef)}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 400, color: dateFromOnly ? TEXT : TEXT_MUTED, flex: 1, fontFamily: FONT_FAMILY }}>
                    {dateFromOnly ? dayjs(dateFromOnly).format('DD-MM-YYYY') : 'Select date from...'}
                  </Typography>
                  <CalendarMonthIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                  <input
                    ref={hiddenFromDateRef}
                    type="date"
                    value={dateFromOnly}
                    onChange={(e) => setDateFromOnly(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                  />
                </Box>
              </Box>

              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>Date To (23:59:59)</Typography>
                <Box className={classes.dateBox} onClick={() => openDatePicker(hiddenToDateRef)}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 400, color: dateToOnly ? TEXT : TEXT_MUTED, flex: 1, fontFamily: FONT_FAMILY }}>
                    {dateToOnly ? dayjs(dateToOnly).format('DD-MM-YYYY') : 'Select date to...'}
                  </Typography>
                  <CalendarMonthIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                  <input
                    ref={hiddenToDateRef}
                    type="date"
                    value={dateToOnly}
                    onChange={(e) => setDateToOnly(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Units Selection */}
            <Box
              className={classes.unitSelectionUnifiedContainer}
              style={{
                borderColor: formTouched && scheduleForm.deviceIds.length === 0 ? '#ef4444' : BORDER,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
                <Typography sx={{ fontSize: '12px !important', fontWeight: '500 !important', color: formTouched && scheduleForm.deviceIds.length === 0 ? '#ef4444' : TEXT, fontFamily: FONT_FAMILY }}>
                  Select Units ({scheduleForm.deviceIds.length}/{deviceList.length} Selected)
                </Typography>

                <Box className={classes.searchBoxContainer}>
                  <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 16, mr: 0.8, flexShrink: 0 }} />
                  <InputBase
                    placeholder="Search units..."
                    fullWidth
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    sx={{ fontSize: '13px', fontWeight: 400, color: TEXT, fontFamily: FONT_FAMILY }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Button size="small" onClick={handleSelectAllUnits} sx={{ textTransform: 'none', color: PRIMARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}>
                    Select All
                  </Button>
                  <Button size="small" onClick={handleDeselectAllUnits} sx={{ textTransform: 'none', color: TEXT_SECONDARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}>
                    Deselect All
                  </Button>
                </Box>
              </Box>

              <Box className={classes.unitListScroll}>
                {filteredDeviceList.map((dev) => {
                  const isChecked = scheduleForm.deviceIds.includes(dev.id);

                  return (
                    <Box
                      key={dev.id}
                      className={`${classes.unitItem} ${isChecked ? classes.unitItemSelected : ''}`}
                      onClick={() => handleToggleUnit(dev.id)}
                    >
                      <Checkbox
                        size="small"
                        checked={isChecked}
                        sx={{ p: 0.2, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                      />
                      <Box className={classes.categoryIconWrap}>
                        {getDeviceCategoryIcon(dev.category)}
                      </Box>
                      <Typography noWrap sx={{ ...unitPrimaryTypographySx, fontSize: '13px', color: isChecked ? '#0f172a' : TEXT, flex: 1, minWidth: 0 }}>
                        {dev.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={generating}
                disableElevation
                sx={{
                  borderRadius: '8px',
                  backgroundColor: PRIMARY,
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  textTransform: 'none',
                  px: 3,
                  py: 0.8,
                  fontFamily: FONT_FAMILY,
                  boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
                  '&:hover': { backgroundColor: PRIMARY_DARK },
                }}
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleClearReport}
                startIcon={<DeleteSweepIcon fontSize="small" />}
                sx={{
                  borderRadius: '8px',
                  borderColor: BORDER,
                  color: TEXT_SECONDARY,
                  fontWeight: 600,
                  fontSize: '13px',
                  textTransform: 'none',
                  px: 2,
                  fontFamily: FONT_FAMILY,
                  '&:hover': { borderColor: '#ef4444', color: '#ef4444', backgroundColor: '#fef2f2' },
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>

          {/* Report Breakdown Preview */}
          {showPreview && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, p: '0 4px', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${activeCategory.color}1a`,
                      color: activeCategory.color,
                      flexShrink: 0,
                    }}
                  >
                    <activeCategory.icon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: TEXT, fontFamily: FONT_FAMILY }}>
                    {activeCategory.label} — Breakdown ({perUnitReports.length} Units)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PrintIcon fontSize="small" />}
                    onClick={() => onPrintReport('portrait')}
                    sx={{
                      borderRadius: '6px',
                      borderColor: BORDER,
                      color: TEXT,
                      fontWeight: 600,
                      fontSize: '12px',
                      textTransform: 'none',
                      fontFamily: FONT_FAMILY,
                      '&:hover': { borderColor: PRIMARY, color: PRIMARY, backgroundColor: '#f0fdfa' },
                    }}
                  >
                    Print
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<FileDownloadIcon fontSize="small" />}
                    onClick={handleDownloadByFormat}
                    disableElevation
                    sx={{
                      borderRadius: '6px',
                      backgroundColor: PRIMARY,
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '12px',
                      textTransform: 'none',
                      fontFamily: FONT_FAMILY,
                      '&:hover': { backgroundColor: PRIMARY_DARK },
                    }}
                  >
                    Export ({scheduleForm.format.toUpperCase()})
                  </Button>
                </Box>
              </Box>

              {perUnitReports.map((unitReport) => (
                <Box
                  key={unitReport.device.id}
                  className={classes.unitReportSection}
                  style={{ borderLeft: `3px solid ${activeCategory.color}` }}
                >
                  <Box className={classes.unitReportHeader}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          px: 0.9,
                          py: 0.15,
                          borderRadius: '10px',
                          backgroundColor: `${activeCategory.color}1a`,
                          color: activeCategory.color,
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          flexShrink: 0,
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {activeCategory.label}
                      </Box>
                      <Box sx={{ color: TEXT_SECONDARY, fontSize: '12px', fontWeight: 600, fontFamily: FONT_FAMILY }}>
                        {dateFromOnly ? dayjs(dateFromOnly).format('DD-MM-YYYY') : '-'} 00:00:00 - {dateToOnly ? dayjs(dateToOnly).format('DD-MM-YYYY') : '-'} 23:59:59
                      </Box>
                    </Box>
                    <Box sx={{ color: TEXT, fontSize: '13px', fontWeight: 700, fontFamily: FONT_FAMILY }}>
                      {unitReport.device.name}
                    </Box>
                  </Box>

                  <Box className={classes.unitMetaBar}>
                    {unitReport.stats.map((stat) => (
                      <div key={stat.label}><strong>{stat.label}:</strong> {stat.value}</div>
                    ))}
                  </Box>

                  <Box className={classes.tableResponsiveWrapper}>
                    <Table size="small">
                      <TableHead className={classes.tableHeader}>
                        <TableRow>
                          {activeCategory.columns.map((col) => (
                            <TableCell key={col.key} className={classes.tableHeaderCell} sx={col.width ? { width: col.width } : undefined}>
                              {col.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {unitReport.rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={activeCategory.columns.length} className={classes.tableCell} sx={{ textAlign: 'center', py: 2, color: TEXT_MUTED }}>
                              {activeCategory.emptyMessage}
                            </TableCell>
                          </TableRow>
                        ) : (
                          unitReport.rows.map((row, idx) => (
                            <TableRow key={idx} hover>
                              {activeCategory.columns.map((col) => (
                                <TableCell
                                  key={col.key}
                                  className={classes.tableCell}
                                  sx={col.accent
                                    ? { color: activeCategory.color, fontWeight: 700 }
                                    : { whiteSpace: 'normal', maxWidth: 260 }}
                                >
                                  {col.render(row, reportCtx) ?? '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box className={classes.content}>
          <Box className={classes.card}>
            <Typography className={classes.cardTitle}>Schedule Report Delivery</Typography>

            <Box className={classes.formGrid}>
              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>
                  <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Schedule Title
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter schedule title..."
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={classes.textField}
                />
              </Box>

              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>
                  <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Report Type
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={scheduleForm.type}
                    IconComponent={KeyboardArrowDownIcon}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, type: e.target.value }))}
                    className={classes.selectField}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 260,
                          borderRadius: '8px',
                          border: `1px solid ${BORDER}`,
                          fontFamily: FONT_FAMILY,
                          ...scrollableSx,
                        },
                      },
                    }}
                  >
                    {CORE_REPORT_TYPES.map((typeLabel) => {
                      const cat = resolveCategory(typeLabel);
                      const CatIcon = cat.icon;
                      return (
                        <MenuItem key={typeLabel} value={typeLabel} sx={{ fontSize: '13px', fontWeight: 500, gap: 1, fontFamily: FONT_FAMILY }}>
                          <CatIcon sx={{ fontSize: 16, color: cat.color, flexShrink: 0 }} />
                          {typeLabel}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>Format</Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={scheduleForm.format}
                    IconComponent={KeyboardArrowDownIcon}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, format: e.target.value }))}
                    className={classes.selectField}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: '8px',
                          border: `1px solid ${BORDER}`,
                          fontFamily: FONT_FAMILY,
                        },
                      },
                    }}
                  >
                    {REPORT_FORMAT_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box className={classes.formGrid}>
              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>
                  <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Send Frequency
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={scheduleForm.frequency}
                    IconComponent={KeyboardArrowDownIcon}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, frequency: e.target.value }))}
                    className={classes.selectField}
                  >
                    <MenuItem value="daily" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Daily</MenuItem>
                    <MenuItem value="weekly" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Weekly</MenuItem>
                    <MenuItem value="monthly" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box className={classes.formInputGroup}>
                <Typography className={classes.inputLabel}>
                  <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Send Time
                </Typography>
                <Box className={classes.dateBox}>
                  <InputBase
                    type="time"
                    fullWidth
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                    sx={{ fontSize: '13px', fontWeight: 400, color: TEXT, fontFamily: FONT_FAMILY }}
                  />
                  <AccessTimeIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                </Box>
              </Box>

              {scheduleForm.frequency === 'weekly' && (
                <Box className={classes.formInputGroup}>
                  <Typography className={classes.inputLabel}>Day of Week</Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={scheduleForm.dayOfWeek}
                      IconComponent={KeyboardArrowDownIcon}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
                      className={classes.selectField}
                    >
                      <MenuItem value="1" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Monday</MenuItem>
                      <MenuItem value="2" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Tuesday</MenuItem>
                      <MenuItem value="3" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Wednesday</MenuItem>
                      <MenuItem value="4" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Thursday</MenuItem>
                      <MenuItem value="5" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Friday</MenuItem>
                      <MenuItem value="6" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Saturday</MenuItem>
                      <MenuItem value="7" sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>Sunday</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {scheduleForm.frequency === 'monthly' && (
                <Box className={classes.formInputGroup}>
                  <Typography className={classes.inputLabel}>Day of Month</Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={scheduleForm.dayOfMonth}
                      IconComponent={KeyboardArrowDownIcon}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, dayOfMonth: e.target.value }))}
                      className={classes.selectField}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <MenuItem key={day} value={String(day)} sx={{ fontSize: '13px', fontWeight: 500, fontFamily: FONT_FAMILY }}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>

            {/* Target Units */}
            <Box
              className={classes.unitSelectionUnifiedContainer}
              style={{
                borderColor: scheduleTouched && scheduleForm.deviceIds.length === 0 ? '#ef4444' : BORDER,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontSize: '12px !important', fontWeight: '500 !important', color: scheduleTouched && scheduleForm.deviceIds.length === 0 ? '#ef4444' : TEXT, fontFamily: FONT_FAMILY }}>
                  Target Units ({scheduleForm.deviceIds.length}/{deviceList.length} Selected)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button size="small" onClick={handleSelectAllUnits} sx={{ textTransform: 'none', color: PRIMARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}>
                    Select All
                  </Button>
                  <Button size="small" onClick={handleDeselectAllUnits} sx={{ textTransform: 'none', color: TEXT_SECONDARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}>
                    Deselect All
                  </Button>
                </Box>
              </Box>

              <Box className={classes.unitListScroll}>
                {deviceList.map((dev) => {
                  const isChecked = scheduleForm.deviceIds.includes(dev.id);

                  return (
                    <Box
                      key={dev.id}
                      className={`${classes.unitItem} ${isChecked ? classes.unitItemSelected : ''}`}
                      onClick={() => handleToggleUnit(dev.id)}
                    >
                      <Checkbox
                        size="small"
                        checked={isChecked}
                        sx={{ p: 0.2, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                      />
                      <Box className={classes.categoryIconWrap}>
                        {getDeviceCategoryIcon(dev.category)}
                      </Box>
                      <Typography noWrap sx={{ ...unitPrimaryTypographySx, fontSize: '13px', color: isChecked ? '#0f172a' : TEXT, flex: 1, minWidth: 0 }}>
                        {dev.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Email Recipients */}
            <Box sx={{ border: `1.5px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT, padding: '16px', marginTop: '16px' }}>
              <Typography sx={{ fontSize: '12px !important', fontWeight: 600, color: TEXT, mb: 1.2, fontFamily: FONT_FAMILY }}>
                <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Email Recipients
              </Typography>

              {scheduleForm.emails.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                  {scheduleForm.emails.map((email) => (
                    <Chip
                      key={email}
                      label={email}
                      onDelete={() => removeEmail(email)}
                      sx={{
                        fontSize: '12px',
                        fontWeight: 500,
                        height: 28,
                        backgroundColor: '#ffffff',
                        border: `1px solid ${BORDER}`,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                        '& .MuiChip-deleteIcon': {
                          color: TEXT_SECONDARY,
                          fontSize: 16,
                          '&:hover': { color: '#ef4444' },
                        },
                      }}
                    />
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: `1.5px solid ${BORDER}`,
                  padding: '2px 4px 2px 12px',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                  '&:focus-within': {
                    borderColor: PRIMARY,
                    boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
                  },
                }}
              >
                <EmailOutlinedIcon sx={{ color: TEXT_MUTED, fontSize: 18, mr: 1, flexShrink: 0 }} />
                <InputBase
                  placeholder="Enter email address (e.g. alerts@company.com)..."
                  fullWidth
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  sx={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: TEXT,
                    fontFamily: FONT_FAMILY,
                  }}
                />
                <Button
                  variant="contained"
                  onClick={addEmail}
                  disabled={!newEmail.trim()}
                  disableElevation
                  startIcon={<AddIcon sx={{ fontSize: '17px !important' }} />}
                  sx={{
                    height: '32px',
                    px: 2,
                    borderRadius: '6px',
                    backgroundColor: PRIMARY,
                    color: '#ffffff',
                    textTransform: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    fontFamily: FONT_FAMILY,
                    flexShrink: 0,
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: PRIMARY_DARK },
                    '&.Mui-disabled': {
                      backgroundColor: '#f1f5f9',
                      color: '#94a3b8',
                    },
                  }}
                >
                  Add Email
                </Button>
              </Box>
            </Box>

            <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<ScheduleIcon fontSize="small" />}
                onClick={handleScheduleReport}
                disabled={generating}
                disableElevation
                sx={{
                  borderRadius: '8px',
                  backgroundColor: PRIMARY,
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  textTransform: 'none',
                  px: 3,
                  py: 0.8,
                  fontFamily: FONT_FAMILY,
                  boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
                  '&:hover': { backgroundColor: PRIMARY_DARK },
                }}
              >
                {generating ? 'Scheduling...' : 'Schedule Report Delivery'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* System Status Footer */}
      <Box
        sx={{
          mt: 'auto',
          pt: '8px',
          pb: '2px',
          px: '6px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #e2e8f0',
          width: '100%',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isSuperAdmin && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <DnsOutlinedIcon sx={{ fontSize: '16px', color: PRIMARY }} />
                <span style={{ color: '#64748b', fontSize: '12px', ...fontStyle }}>Server:</span>
                <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px', ...fontStyle }}>{serverHostIp}</strong>
              </Box>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <InfoOutlinedIcon sx={{ fontSize: '16px', color: PRIMARY }} />
                <span style={{ color: '#64748b', fontSize: '12px', ...fontStyle }}>System Version:</span>
                <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px', ...fontStyle }}>v{serverVersion}</strong>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default memo(ReportsPage);