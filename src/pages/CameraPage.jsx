import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Typography,
  IconButton,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Alert,
  Tooltip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  InputBase,
  Popper,
  ClickAwayListener,
  List,
  ListItem,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Hls, { Events } from 'hls.js/light';
import dayjs from 'dayjs';
import { devicesActions } from '../store';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const PRIMARY_LIGHT = '#f0fdfa';
const TEXT = '#0f172a';
const TEXT_SECONDARY = '#475569';
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

const useStyles = makeStyles()(() => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: SURFACE_SOFT,
    fontFamily: FONT_FAMILY,
    boxSizing: 'border-box',
    overflow: 'hidden',
    '& *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
  header: {
    padding: '14px 20px 10px',
    backgroundColor: SURFACE_SOFT,
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flexShrink: 0,
  },
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitle: {
    fontSize: '15px !important',
    fontWeight: '700 !important',
    color: TEXT,
    letterSpacing: '-0.02em',
  },
  headerSubtitle: {
    fontSize: '11.5px !important',
    color: TEXT_SECONDARY,
    fontWeight: '400 !important',
  },
  tabsContainer: {
    backgroundColor: SURFACE,
    borderBottom: `1px solid ${BORDER}`,
    padding: '0 20px',
  },
  tabs: {
    minHeight: '38px',
    '& .MuiTabs-indicator': {
      backgroundColor: PRIMARY,
      height: '2.5px',
      borderRadius: '2px 2px 0 0',
    },
    '& .MuiTab-root': {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '12px',
      minHeight: '38px',
      color: TEXT_SECONDARY,
      padding: '0 14px',
    },
    '& .Mui-selected': {
      color: `${PRIMARY} !important`,
      fontWeight: 700,
    },
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
    minHeight: 0,
    ...scrollableSx,
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '12.5px !important',
    fontWeight: '700 !important',
    color: TEXT,
    marginBottom: '10px',
    letterSpacing: '-0.01em',
  },
  configCard: {
    backgroundColor: SURFACE,
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    padding: '16px',
    boxSizing: 'border-box',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px',
    marginBottom: '14px',
    alignItems: 'center',
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
  dropdownPaper: {
    width: '300px',
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
  dropdownSearchContainer: {
    padding: '6px 8px',
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    flexShrink: 0,
  },
  dropdownSearchBox: {
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
  dropdownListContainer: {
    flex: '1 1 0',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    ...scrollableSx,
  },
  dropdownListItem: {
    padding: '8px 12px',
    borderBottom: '1px solid #f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover': { backgroundColor: SURFACE_SOFT },
  },
  dropdownDeviceName: {
    fontSize: '12px',
    fontWeight: 600,
    color: TEXT,
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '14px',
    marginTop: '12px',
  },
  audioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '14px',
    marginTop: '12px',
  },
  videoCard: {
    backgroundColor: SURFACE,
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: PRIMARY,
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    },
  },
  videoContainer: {
    backgroundColor: '#0f172a',
    position: 'relative',
    height: '155px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  videoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#64748b',
    gap: '4px',
  },
  videoInfo: {
    padding: '10px 12px',
    backgroundColor: SURFACE,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderTop: `1px solid ${BORDER_LIGHT}`,
  },
  videoInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoInfoLabel: {
    fontSize: '11px',
    color: TEXT_SECONDARY,
    fontWeight: 500,
  },
  videoInfoValue: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: TEXT,
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: SURFACE_SOFT,
    borderTop: `1px solid ${BORDER_LIGHT}`,
  },
  actionButton: {
    padding: '4px',
    borderRadius: '4px',
    border: `1px solid ${BORDER_LIGHT}`,
    backgroundColor: SURFACE,
    color: TEXT_SECONDARY,
    '&:hover': {
      color: PRIMARY,
      borderColor: PRIMARY,
      backgroundColor: PRIMARY_LIGHT,
    },
  },
  deleteActionButton: {
    padding: '4px',
    borderRadius: '4px',
    border: `1px solid ${BORDER_LIGHT}`,
    backgroundColor: SURFACE,
    color: TEXT_SECONDARY,
    '&:hover': {
      color: '#ef4444',
      borderColor: '#fca5a5',
      backgroundColor: '#fef2f2',
    },
  },
  statusChip: {
    fontSize: '10px !important',
    height: '20px !important',
    fontWeight: '700 !important',
    borderRadius: '4px !important',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 20px',
    textAlign: 'center',
    backgroundColor: SURFACE,
    borderRadius: '8px',
    border: `1px dashed ${BORDER}`,
  },
  emptyTitle: {
    fontSize: '13px !important',
    fontWeight: '700 !important',
    color: TEXT,
    marginTop: '10px',
    marginBottom: '4px',
  },
  emptyText: {
    fontSize: '11.5px !important',
    color: TEXT_MUTED,
  },
  /* Report-style Table Classes */
  tableContainer: {
    backgroundColor: SURFACE,
    borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    overflow: 'hidden',
    ...scrollableSx,
  },
  table: {
    minWidth: 700,
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderCell: {
    background: '#e6f7f5 !important',
    padding: '8px 10px !important',
    fontSize: '10.5px !important',
    textTransform: 'uppercase !important',
    color: '#0f172a !important',
    borderBottom: `2px solid ${PRIMARY} !important`,
    borderTop: `1px solid ${BORDER} !important`,
    borderRight: `1px solid ${BORDER_LIGHT} !important`,
    fontWeight: '700 !important',
    whiteSpace: 'nowrap',
    letterSpacing: '0.03em',
  },
  tableRowEven: {
    backgroundColor: '#f9fbfb',
    '&:hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  tableRowOdd: {
    backgroundColor: SURFACE,
    '&:hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  tableCell: {
    fontSize: '11px !important',
    color: `${TEXT} !important`,
    borderBottom: `1px solid ${BORDER_LIGHT} !important`,
    borderRight: `1px solid ${BORDER_LIGHT} !important`,
    padding: '7px 10px !important',
    whiteSpace: 'nowrap',
  },
  searchBoxContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: '6px',
    border: `1px solid ${BORDER}`,
    padding: '0 8px',
    height: '32px',
    width: '260px',
    boxSizing: 'border-box',
    marginBottom: '12px',
    '&:focus-within': {
      borderColor: PRIMARY,
    },
  },
  primaryButton: {
    height: '34px',
    fontSize: '12px !important',
    fontWeight: '600 !important',
    textTransform: 'none',
    borderRadius: '6px',
    backgroundColor: PRIMARY,
    color: '#ffffff',
    boxShadow: 'none',
    '&:hover': { backgroundColor: PRIMARY_DARK },
    '&.Mui-disabled': {
      backgroundColor: '#f1f5f9',
      color: TEXT_MUTED,
    },
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
    padding: '8px 0',
  },
  fullscreenDialog: {
    '& .MuiPaper-root': {
      backgroundColor: '#0f172a',
      margin: 0,
    },
  },
  fullscreenVideo: {
    width: '100vw',
    height: 'calc(100vh - 48px)',
    objectFit: 'contain',
  },
  audioPlayer: {
    width: '100%',
    height: '32px',
    outline: 'none',
  },
}));

const CameraPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const reduxDevicesObj = useSelector((state) => state.devices?.items) || {};
  const positions = useSelector((state) => state.session?.positions) || {};

  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Tab state - 0: Configuration, 1: Live Video, 2: Voice Recordings
  const [activeTab, setActiveTab] = useState(0);

  // Camera dropdown & config state
  const [cameraDeviceId, setCameraDeviceId] = useState('');
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
  const [cameraSearchQuery, setCameraSearchQuery] = useState('');
  const cameraInputRef = useRef(null);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraType, setCameraType] = useState('hls');
  const [cameraChannel, setCameraChannel] = useState(1);

  // Voice dropdown & config state
  const [voiceDeviceId, setVoiceDeviceId] = useState('');
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [voiceSearchQueryDropdown, setVoiceSearchQueryDropdown] = useState('');
  const voiceInputRef = useRef(null);

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceChannel, setVoiceChannel] = useState(1);
  const [voiceMode, setVoiceMode] = useState('manual');
  const [voiceDuration, setVoiceDuration] = useState(300);

  // Video streaming state
  const [activeStreams, setActiveStreams] = useState([]);
  const hlsRefs = useRef({});
  const videoRefs = useRef({});

  // Voice recordings state
  const [voiceRecordings, setVoiceRecordings] = useState([]);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceCurrentPage, setVoiceCurrentPage] = useState(1);
  const [voiceItemsPerPage] = useState(6);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');

  // Fullscreen state
  const [fullscreenStream, setFullscreenStream] = useState(null);

  const deviceList = useMemo(() => {
    const list = Array.isArray(reduxDevicesObj) ? reduxDevicesObj : Object.values(reduxDevicesObj);
    return list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [reduxDevicesObj]);

  const filteredCameraDevices = useMemo(() => {
    const term = cameraSearchQuery.trim().toLowerCase();
    if (!term) return deviceList;
    return deviceList.filter((device) => (device.name || '').toLowerCase().includes(term));
  }, [deviceList, cameraSearchQuery]);

  const filteredVoiceDevices = useMemo(() => {
    const term = voiceSearchQueryDropdown.trim().toLowerCase();
    if (!term) return deviceList;
    return deviceList.filter((device) => (device.name || '').toLowerCase().includes(term));
  }, [deviceList, voiceSearchQueryDropdown]);

  const selectedCameraDevice = useMemo(() => {
    return deviceList.find((d) => Number(d.id) === Number(cameraDeviceId)) || null;
  }, [deviceList, cameraDeviceId]);

  const selectedVoiceDevice = useMemo(() => {
    return deviceList.find((d) => Number(d.id) === Number(voiceDeviceId)) || null;
  }, [deviceList, voiceDeviceId]);

  // Sync selected device configuration attributes into form controls
  useEffect(() => {
    if (selectedCameraDevice) {
      const attrs = selectedCameraDevice.attributes || {};
      setCameraEnabled(Boolean(attrs.cameraEnabled || attrs.camera));
      setCameraType(attrs.cameraType || 'hls');
      setCameraChannel(attrs.cameraChannel || 1);
    }
  }, [selectedCameraDevice]);

  useEffect(() => {
    if (selectedVoiceDevice) {
      const attrs = selectedVoiceDevice.attributes || {};
      setVoiceEnabled(Boolean(attrs.voiceEnabled || attrs.voice));
      setVoiceChannel(attrs.voiceChannel || 1);
      setVoiceMode(attrs.voiceMode || 'manual');
      setVoiceDuration(attrs.voiceDuration || 300);
    }
  }, [selectedVoiceDevice]);

  // Load cameras
  useEffect(() => {
    const loadCameras = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/devices', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to load devices');
        const allDevices = await response.json();

        const cameraDevices = allDevices.filter((device) => {
          const attrs = device.attributes || {};
          return (
            attrs.camera ||
            attrs.video ||
            attrs.cameraUrl ||
            attrs.media ||
            attrs.cameraEnabled ||
            device.model?.toLowerCase().includes('cam') ||
            device.model?.toLowerCase().includes('jc')
          );
        });

        setCameras(cameraDevices.length ? cameraDevices : allDevices);
      } catch (err) {
        setCameras(deviceList);
      } finally {
        setLoading(false);
      }
    };
    loadCameras();
  }, [deviceList]);

  // Load voice recordings
  useEffect(() => {
    const loadRecordings = async () => {
      setVoiceLoading(true);
      try {
        const response = await fetch('/api/events', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });
        if (response.ok) {
          const events = await response.json();
          const voiceEvents = events.filter(
            (event) =>
              event.type === 'audio' ||
              event.type === 'voice' ||
              (event.attributes && (event.attributes.audio || event.attributes.voice))
          );
          setVoiceRecordings(voiceEvents);
        }
      } catch (err) {
        console.error('Failed to load voice recordings:', err);
      } finally {
        setVoiceLoading(false);
      }
    };
    loadRecordings();
  }, []);

  const initHls = useCallback(
    (deviceId, videoElement) => {
      if (!videoElement) return;

      if (hlsRefs.current[deviceId]) {
        hlsRefs.current[deviceId].destroy();
      }

      const hls = new Hls();
      hlsRefs.current[deviceId] = hls;
      hls.loadSource(`/api/stream/${deviceId}/${cameraChannel}/live.m3u8`);
      hls.attachMedia(videoElement);
      hls.on(Events.MANIFEST_PARSED, () => {
        videoElement.play().catch((e) => console.error('Play failed:', e));
      });
      hls.on(Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
        }
      });
    },
    [cameraChannel]
  );

  const getVideoRef = useCallback(
    (deviceId) => (element) => {
      videoRefs.current[deviceId] = element;
      if (element) {
        initHls(deviceId, element);
      }
    },
    [initHls]
  );

  const getDevicePosition = (deviceId) => positions[deviceId] || null;

  const getDeviceStatus = (deviceId) => {
    const position = getDevicePosition(deviceId);
    if (!position) return 'offline';
    const lastUpdate = new Date(position.deviceTime || position.fixTime);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / 60000;
    return diffMinutes < 10 ? 'online' : 'offline';
  };

  const startStream = async (deviceId, channel) => {
    if (activeStreams.some((s) => s.deviceId === deviceId)) return;

    try {
      await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId, type: 'videoStart', attributes: { index: channel } }),
      });
    } catch (err) {
      console.error('Failed to send stream command:', err);
    }
    setActiveStreams((prev) => [...prev, { deviceId, channel }]);
  };

  const stopStream = async (deviceId, channel) => {
    try {
      await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId, type: 'videoStop', attributes: { index: channel } }),
      });
    } catch (err) {
      console.error('Failed to send stop command:', err);
    }

    if (hlsRefs.current[deviceId]) {
      hlsRefs.current[deviceId].destroy();
      delete hlsRefs.current[deviceId];
    }

    setActiveStreams((prev) => prev.filter((s) => s.deviceId !== deviceId));
  };

  useEffect(() => {
    return () => {
      Object.values(hlsRefs.current).forEach((hls) => hls.destroy());
    };
  }, []);

  const handlePlayStop = (deviceId) => {
    const isActive = activeStreams.some((s) => s.deviceId === deviceId);
    if (isActive) {
      const stream = activeStreams.find((s) => s.deviceId === deviceId);
      stopStream(deviceId, stream.channel);
    } else {
      startStream(deviceId, cameraChannel);
    }
  };

  const handleRemoveCamera = (deviceId) => {
    stopStream(deviceId, cameraChannel);
  };

  // Safe Real System Camera Save Handler
  const handleSaveCameraConfig = async () => {
    if (!cameraDeviceId) {
      setError('Please select a unit for camera configuration.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const currentDevice = deviceList.find((d) => Number(d.id) === Number(cameraDeviceId));
      if (!currentDevice) {
        throw new Error('Target unit not found in state.');
      }

      const updatedDevice = {
        ...currentDevice,
        attributes: {
          ...(currentDevice.attributes || {}),
          cameraEnabled,
          cameraType,
          cameraChannel,
          camera: true,
        },
      };

      const response = await fetch(`/api/devices/${cameraDeviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedDevice),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Save failed with status ${response.status}`);
      }

      const savedItem = await response.json();
      dispatch(devicesActions.update([savedItem]));
      setSuccess(`Camera settings for ${savedItem.name || 'Unit'} saved successfully.`);
    } catch (err) {
      setError(err.message || 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  // Safe Real System Voice Save Handler
  const handleSaveVoiceConfig = async () => {
    if (!voiceDeviceId) {
      setError('Please select a unit for voice configuration.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const currentDevice = deviceList.find((d) => Number(d.id) === Number(voiceDeviceId));
      if (!currentDevice) {
        throw new Error('Target unit not found in state.');
      }

      const updatedDevice = {
        ...currentDevice,
        attributes: {
          ...(currentDevice.attributes || {}),
          voiceEnabled,
          voiceChannel,
          voiceMode,
          voiceDuration,
          voice: true,
        },
      };

      const response = await fetch(`/api/devices/${voiceDeviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedDevice),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Save failed with status ${response.status}`);
      }

      const savedItem = await response.json();
      dispatch(devicesActions.update([savedItem]));
      setSuccess(`Voice settings for ${savedItem.name || 'Unit'} saved successfully.`);
    } catch (err) {
      setError(err.message || 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const filteredVoiceList = useMemo(() => {
    if (!voiceSearchQuery.trim()) return voiceRecordings;
    const q = voiceSearchQuery.trim().toLowerCase();
    return voiceRecordings.filter((rec) => {
      const device = deviceList.find((d) => Number(d.id) === Number(rec.deviceId));
      const name = (device?.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [voiceRecordings, voiceSearchQuery, deviceList]);

  const voiceTotalPages = Math.ceil(filteredVoiceList.length / voiceItemsPerPage);
  const voicePaginatedRecordings = useMemo(() => {
    const start = (voiceCurrentPage - 1) * voiceItemsPerPage;
    return filteredVoiceList.slice(start, start + voiceItemsPerPage);
  }, [filteredVoiceList, voiceCurrentPage, voiceItemsPerPage]);

  const connectedCameras = activeStreams.map((s) => {
    const device = deviceList.find((d) => Number(d.id) === Number(s.deviceId));
    const status = getDeviceStatus(s.deviceId);
    return {
      deviceId: s.deviceId,
      deviceName: device?.name || `Unit #${s.deviceId}`,
      status,
      channel: s.channel,
    };
  });

  const voiceRecordingItems = voicePaginatedRecordings.map((recording) => {
    const device = deviceList.find((d) => Number(d.id) === Number(recording.deviceId));
    return {
      id: recording.id,
      deviceId: recording.deviceId,
      deviceName: device?.name || `Unit #${recording.deviceId}`,
      date: recording.eventTime,
      duration: recording.attributes?.duration || 0,
      channel: recording.attributes?.channel || 1,
    };
  });

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.headerTitleWrap}>
          <VideocamIcon sx={{ color: PRIMARY, fontSize: 18 }} />
          <Typography className={classes.headerTitle}>Live Camera & Video</Typography>
        </div>
        <Typography className={classes.headerSubtitle}>
          Configure and stream real-time camera and voice telemetry
        </Typography>
      </div>

      <div className={classes.tabsContainer}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          className={classes.tabs}
        >
          <Tab label="Configuration" />
          <Tab label="Live Video" />
          <Tab label="Voice Recordings" />
        </Tabs>
      </div>

      {error && (
        <Alert severity="error" sx={{ m: 2, borderRadius: '6px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ m: 2, borderRadius: '6px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <div className={classes.content}>
        {activeTab === 0 && (
          <>
            {/* Camera Configuration Card */}
            <div className={classes.section}>
              <div className={classes.sectionTitle}>Camera Stream Setup</div>
              <div className={classes.configCard}>
                <div className={classes.formGrid}>
                  {/* Target Unit Selector */}
                  <div className={classes.formInputGroup}>
                    <span className={classes.sectionLabel}>Target Unit</span>
                    <div
                      ref={cameraInputRef}
                      className={classes.pickerInputPill}
                      onClick={() => setCameraDropdownOpen((o) => !o)}
                    >
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: selectedCameraDevice ? TEXT : TEXT_MUTED }}>
                        {selectedCameraDevice ? selectedCameraDevice.name : 'Select Unit...'}
                      </Typography>
                      <ExpandMoreIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
                    </div>
                  </div>

                  {cameraDeviceId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <Chip
                        label="Ready to Configure"
                        size="small"
                        className={classes.statusChip}
                        sx={{ backgroundColor: '#dcfce7', color: '#166534' }}
                      />
                    </Box>
                  )}

                  <FormControlLabel
                    sx={{ mt: 2 }}
                    control={
                      <Switch
                        size="small"
                        checked={cameraEnabled}
                        onChange={(e) => setCameraEnabled(e.target.checked)}
                        disabled={!cameraDeviceId}
                        sx={{
                          '& .Mui-checked': { color: `${PRIMARY} !important` },
                          '& .Mui-checked + .MuiSwitch-track': { backgroundColor: `${PRIMARY} !important` },
                        }}
                      />
                    }
                    label={<span style={{ fontSize: '12px', fontWeight: 600, color: TEXT }}>Enable Streaming</span>}
                  />

                  <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                    <InputLabel sx={{ fontSize: '12px' }}>Stream Protocol</InputLabel>
                    <Select
                      label="Stream Protocol"
                      value={cameraType}
                      onChange={(e) => setCameraType(e.target.value)}
                      disabled={!cameraEnabled}
                      sx={{ fontSize: '12px' }}
                    >
                      <MenuItem value="hls" sx={{ fontSize: '12px' }}>HLS (HTTP Live Streaming)</MenuItem>
                      <MenuItem value="rtsp" sx={{ fontSize: '12px' }}>RTSP</MenuItem>
                      <MenuItem value="mjpeg" sx={{ fontSize: '12px' }}>MJPEG</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Camera Channel"
                    type="number"
                    sx={{ mt: 2 }}
                    inputProps={{ min: 1, max: 4, style: { fontSize: '12px' } }}
                    InputLabelProps={{ style: { fontSize: '12px' } }}
                    value={cameraChannel}
                    onChange={(e) => setCameraChannel(Number(e.target.value) || 1)}
                    disabled={!cameraEnabled}
                    fullWidth
                  />
                </div>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                  onClick={handleSaveCameraConfig}
                  disabled={!cameraDeviceId || saving}
                  className={classes.primaryButton}
                  disableElevation
                >
                  {saving ? 'Saving...' : 'Save Camera Settings'}
                </Button>
              </div>
            </div>

            {/* Voice Configuration Card */}
            <div className={classes.section}>
              <div className={classes.sectionTitle}>Audio & Voice Setup</div>
              <div className={classes.configCard}>
                <div className={classes.formGrid}>
                  {/* Target Unit Selector */}
                  <div className={classes.formInputGroup}>
                    <span className={classes.sectionLabel}>Target Unit</span>
                    <div
                      ref={voiceInputRef}
                      className={classes.pickerInputPill}
                      onClick={() => setVoiceDropdownOpen((o) => !o)}
                    >
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: selectedVoiceDevice ? TEXT : TEXT_MUTED }}>
                        {selectedVoiceDevice ? selectedVoiceDevice.name : 'Select Unit...'}
                      </Typography>
                      <ExpandMoreIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
                    </div>
                  </div>

                  {voiceDeviceId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <Chip
                        label="Ready to Configure"
                        size="small"
                        className={classes.statusChip}
                        sx={{ backgroundColor: '#dcfce7', color: '#166534' }}
                      />
                    </Box>
                  )}

                  <FormControlLabel
                    sx={{ mt: 2 }}
                    control={
                      <Switch
                        size="small"
                        checked={voiceEnabled}
                        onChange={(e) => setVoiceEnabled(e.target.checked)}
                        disabled={!voiceDeviceId}
                        sx={{
                          '& .Mui-checked': { color: `${PRIMARY} !important` },
                          '& .Mui-checked + .MuiSwitch-track': { backgroundColor: `${PRIMARY} !important` },
                        }}
                      />
                    }
                    label={<span style={{ fontSize: '12px', fontWeight: 600, color: TEXT }}>Enable Voice Recording</span>}
                  />

                  <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                    <InputLabel sx={{ fontSize: '12px' }}>Audio Channel</InputLabel>
                    <Select
                      label="Audio Channel"
                      value={voiceChannel}
                      onChange={(e) => setVoiceChannel(Number(e.target.value))}
                      disabled={!voiceEnabled}
                      sx={{ fontSize: '12px' }}
                    >
                      <MenuItem value={1} sx={{ fontSize: '12px' }}>Channel 1 (Main)</MenuItem>
                      <MenuItem value={2} sx={{ fontSize: '12px' }}>Channel 2 (Cabin)</MenuItem>
                      <MenuItem value={3} sx={{ fontSize: '12px' }}>Cabin Audio</MenuItem>
                      <MenuItem value={4} sx={{ fontSize: '12px' }}>Driver Audio</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                    <InputLabel sx={{ fontSize: '12px' }}>Recording Mode</InputLabel>
                    <Select
                      label="Recording Mode"
                      value={voiceMode}
                      onChange={(e) => setVoiceMode(e.target.value)}
                      disabled={!voiceEnabled}
                      sx={{ fontSize: '12px' }}
                    >
                      <MenuItem value="manual" sx={{ fontSize: '12px' }}>Manual Trigger</MenuItem>
                      <MenuItem value="event" sx={{ fontSize: '12px' }}>Event-Based</MenuItem>
                      <MenuItem value="continuous" sx={{ fontSize: '12px' }}>Continuous Loop</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Duration (seconds)"
                    type="number"
                    sx={{ mt: 2 }}
                    inputProps={{ min: 30, max: 3600, style: { fontSize: '12px' } }}
                    InputLabelProps={{ style: { fontSize: '12px' } }}
                    value={voiceDuration}
                    onChange={(e) => setVoiceDuration(Number(e.target.value) || 300)}
                    disabled={!voiceEnabled}
                    fullWidth
                  />
                </div>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                  onClick={handleSaveVoiceConfig}
                  disabled={!voiceDeviceId || saving}
                  className={classes.primaryButton}
                  disableElevation
                >
                  {saving ? 'Saving...' : 'Save Audio Settings'}
                </Button>
              </div>
            </div>
          </>
        )}

        {activeTab === 1 && (
          <>
            <div className={classes.section}>
              <div className={classes.sectionTitle}>Active Live Feeds</div>

              {connectedCameras.length === 0 ? (
                <div className={classes.emptyState}>
                  <VideocamIcon sx={{ fontSize: 36, color: BORDER }} />
                  <div className={classes.emptyTitle}>No Live Feeds Active</div>
                  <div className={classes.emptyText}>
                    Select a camera device from the list below to begin live video playback.
                  </div>
                </div>
              ) : (
                <div className={classes.videoGrid}>
                  {connectedCameras.map((camera) => (
                    <div key={camera.deviceId} className={classes.videoCard}>
                      <div className={classes.videoContainer}>
                        <video
                          ref={getVideoRef(camera.deviceId)}
                          className={classes.videoPlayer}
                          autoPlay
                          muted
                          controls
                        />
                        {camera.status === 'offline' && (
                          <div className={classes.videoPlaceholder}>
                            <VideocamIcon sx={{ fontSize: 24 }} />
                            <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>Feed Offline</Typography>
                          </div>
                        )}
                      </div>
                      <div className={classes.videoInfo}>
                        <div className={classes.videoInfoRow}>
                          <span className={classes.videoInfoLabel}>Unit</span>
                          <span className={classes.videoInfoValue}>{camera.deviceName}</span>
                        </div>
                        <div className={classes.videoInfoRow}>
                          <span className={classes.videoInfoLabel}>Status</span>
                          <div className={classes.statusIndicator}>
                            <span
                              className={classes.statusDot}
                              style={{ backgroundColor: camera.status === 'online' ? PRIMARY : '#ef4444' }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: camera.status === 'online' ? PRIMARY : '#ef4444' }}>
                              {camera.status === 'online' ? 'Live Stream' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={classes.cardActions}>
                        <Tooltip title="Fullscreen">
                          <IconButton
                            size="small"
                            className={classes.actionButton}
                            onClick={() => setFullscreenStream(camera)}
                          >
                            <FullscreenIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Stop Stream">
                          <IconButton
                            size="small"
                            className={classes.deleteActionButton}
                            onClick={() => handleRemoveCamera(camera.deviceId)}
                          >
                            <CloseIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report-Style Registered Camera Hardware Table */}
            <div className={classes.section}>
              <div className={classes.sectionTitle}>Registered Camera Hardware</div>
              <div className={classes.tableContainer}>
                <Table className={classes.table} size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeaderCell}>#</TableCell>
                      <TableCell className={classes.tableHeaderCell}>Unit</TableCell>
                      <TableCell className={classes.tableHeaderCell}>Model</TableCell>
                      <TableCell className={classes.tableHeaderCell}>Camera Status</TableCell>
                      <TableCell className={classes.tableHeaderCell}>Connection</TableCell>
                      <TableCell className={classes.tableHeaderCell}>Last Update (24h)</TableCell>
                      <TableCell className={classes.tableHeaderCell}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className={classes.tableCell} sx={{ textAlign: 'center', py: 2 }}>
                          Loading camera fleet...
                        </TableCell>
                      </TableRow>
                    ) : deviceList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className={classes.tableCell} sx={{ textAlign: 'center', py: 2, color: TEXT_MUTED }}>
                          No units available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deviceList.map((device, idx) => {
                        const position = getDevicePosition(device.id);
                        const status = getDeviceStatus(device.id);
                        const isStreaming = activeStreams.some((s) => s.deviceId === device.id);
                        const isEven = idx % 2 === 1;

                        return (
                          <TableRow key={device.id} className={isEven ? classes.tableRowEven : classes.tableRowOdd}>
                            <TableCell className={classes.tableCell} style={{ color: TEXT_MUTED }}>
                              {idx + 1}
                            </TableCell>
                            <TableCell className={classes.tableCell} style={{ fontWeight: 700, color: PRIMARY }}>
                              {device.name}
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                              {device.model || '—'}
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                              <Chip
                                label={device.attributes?.cameraEnabled ? 'Configured' : 'Available'}
                                size="small"
                                className={classes.statusChip}
                                sx={{
                                  backgroundColor: device.attributes?.cameraEnabled ? PRIMARY_LIGHT : '#f1f5f9',
                                  color: device.attributes?.cameraEnabled ? PRIMARY_DARK : TEXT_SECONDARY,
                                }}
                              />
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                              <Chip
                                label={status === 'online' ? 'Online' : 'Offline'}
                                size="small"
                                className={classes.statusChip}
                                sx={{
                                  backgroundColor: status === 'online' ? PRIMARY_LIGHT : '#fee2e2',
                                  color: status === 'online' ? PRIMARY_DARK : '#991b1b',
                                }}
                              />
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                              {position ? dayjs(position.deviceTime || position.fixTime).format('DD-MM-YYYY HH:mm:ss') : '—'}
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                              <Tooltip title={isStreaming ? 'Stop Feed' : 'Start Feed'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handlePlayStop(device.id)}
                                  className={classes.actionButton}
                                >
                                  {isStreaming ? (
                                    <StopIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                                  ) : (
                                    <VideocamIcon sx={{ fontSize: 16, color: PRIMARY }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {activeTab === 2 && (
          <div className={classes.section}>
            <div className={classes.sectionTitle}>Audio Library</div>

            <div className={classes.searchBoxContainer}>
              <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 16, mr: 0.6 }} />
              <InputBase
                placeholder="Search unit recordings..."
                value={voiceSearchQuery}
                onChange={(e) => {
                  setVoiceSearchQuery(e.target.value);
                  setVoiceCurrentPage(1);
                }}
                sx={{ fontSize: '11.5px', color: TEXT, width: '100%' }}
              />
            </div>

            {voiceRecordingItems.length === 0 ? (
              <div className={classes.emptyState}>
                <AudiotrackIcon sx={{ fontSize: 36, color: BORDER }} />
                <div className={classes.emptyTitle}>No Voice Clips Found</div>
                <div className={classes.emptyText}>
                  Recorded audio transmissions will automatically sync here.
                </div>
              </div>
            ) : (
              <>
                <div className={classes.audioGrid}>
                  {voiceRecordingItems.map((recording) => (
                    <div key={recording.id} className={classes.videoCard}>
                      <div className={classes.videoContainer} style={{ height: '52px', backgroundColor: '#f1f5f9' }}>
                        <AudiotrackIcon sx={{ fontSize: 24, color: PRIMARY }} />
                      </div>
                      <div className={classes.videoInfo}>
                        <div className={classes.videoInfoRow}>
                          <span className={classes.videoInfoLabel}>Unit</span>
                          <span className={classes.videoInfoValue}>{recording.deviceName}</span>
                        </div>
                        <div className={classes.videoInfoRow}>
                          <span className={classes.videoInfoLabel}>Time (24h)</span>
                          <span className={classes.videoInfoValue}>
                            {recording.date ? dayjs(recording.date).format('DD-MM-YYYY HH:mm') : '—'}
                          </span>
                        </div>
                        <div className={classes.videoInfoRow}>
                          <span className={classes.videoInfoLabel}>Duration</span>
                          <span className={classes.videoInfoValue}>
                            {recording.duration
                              ? `${Math.floor(recording.duration / 60)}m ${String(recording.duration % 60).padStart(2, '0')}s`
                              : '0s'}
                          </span>
                        </div>
                        <div className={classes.videoInfoRow}>
                          <span className={classes.videoInfoLabel}>Channel</span>
                          <span className={classes.videoInfoValue}>#{recording.channel}</span>
                        </div>
                      </div>
                      <div className={classes.cardActions}>
                        <audio
                          controls
                          src={`/api/events/${recording.id}/media`}
                          className={classes.audioPlayer}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {voiceTotalPages > 1 && (
                  <div className={classes.paginationContainer}>
                    <Pagination
                      count={voiceTotalPages}
                      page={voiceCurrentPage}
                      onChange={(_, page) => setVoiceCurrentPage(page)}
                      size="small"
                      sx={{
                        '& .Mui-selected': {
                          backgroundColor: `${PRIMARY} !important`,
                          color: '#ffffff',
                          fontWeight: 700,
                        },
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Camera Target Unit Dropdown Popper */}
      <Popper open={cameraDropdownOpen} anchorEl={cameraInputRef.current} placement="bottom-start" style={{ zIndex: 3000 }}>
        <ClickAwayListener onClickAway={() => setCameraDropdownOpen(false)}>
          <div className={classes.dropdownPaper}>
            <div className={classes.dropdownHeader}>
              <span className={classes.dropdownTitle}>Select Unit ({deviceList.length})</span>
              <IconButton size="small" onClick={() => setCameraDropdownOpen(false)} sx={{ p: '2px' }}>
                <CloseIcon sx={{ fontSize: '15px' }} />
              </IconButton>
            </div>
            <div className={classes.dropdownSearchContainer}>
              <div className={classes.dropdownSearchBox}>
                <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 15, mr: 0.6 }} />
                <InputBase
                  placeholder="Search units..."
                  fullWidth
                  value={cameraSearchQuery}
                  onChange={(e) => setCameraSearchQuery(e.target.value)}
                  sx={{ fontSize: '12px', color: TEXT }}
                />
              </div>
            </div>
            <div className={classes.dropdownListContainer}>
              <List dense sx={{ py: 0 }}>
                {filteredCameraDevices.map((device) => (
                  <ListItem
                    key={device.id}
                    className={classes.dropdownListItem}
                    onClick={() => {
                      setCameraDeviceId(device.id);
                      setCameraDropdownOpen(false);
                    }}
                  >
                    <Typography className={classes.dropdownDeviceName}>
                      {device.name}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </div>
          </div>
        </ClickAwayListener>
      </Popper>

      {/* Voice Target Unit Dropdown Popper */}
      <Popper open={voiceDropdownOpen} anchorEl={voiceInputRef.current} placement="bottom-start" style={{ zIndex: 3000 }}>
        <ClickAwayListener onClickAway={() => setVoiceDropdownOpen(false)}>
          <div className={classes.dropdownPaper}>
            <div className={classes.dropdownHeader}>
              <span className={classes.dropdownTitle}>Select Unit ({deviceList.length})</span>
              <IconButton size="small" onClick={() => setVoiceDropdownOpen(false)} sx={{ p: '2px' }}>
                <CloseIcon sx={{ fontSize: '15px' }} />
              </IconButton>
            </div>
            <div className={classes.dropdownSearchContainer}>
              <div className={classes.dropdownSearchBox}>
                <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 15, mr: 0.6 }} />
                <InputBase
                  placeholder="Search units..."
                  fullWidth
                  value={voiceSearchQueryDropdown}
                  onChange={(e) => setVoiceSearchQueryDropdown(e.target.value)}
                  sx={{ fontSize: '12px', color: TEXT }}
                />
              </div>
            </div>
            <div className={classes.dropdownListContainer}>
              <List dense sx={{ py: 0 }}>
                {filteredVoiceDevices.map((device) => (
                  <ListItem
                    key={device.id}
                    className={classes.dropdownListItem}
                    onClick={() => {
                      setVoiceDeviceId(device.id);
                      setVoiceDropdownOpen(false);
                    }}
                  >
                    <Typography className={classes.dropdownDeviceName}>
                      {device.name}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </div>
          </div>
        </ClickAwayListener>
      </Popper>

      {/* Fullscreen Video Modal */}
      <Dialog
        open={Boolean(fullscreenStream)}
        onClose={() => setFullscreenStream(null)}
        fullScreen
        className={classes.fullscreenDialog}
      >
        <DialogTitle sx={{ backgroundColor: '#0f172a', color: '#ffffff', py: 1, px: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>
              {fullscreenStream?.deviceName} (Channel #{fullscreenStream?.channel})
            </Typography>
            <IconButton size="small" onClick={() => setFullscreenStream(null)} sx={{ color: '#ffffff' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {fullscreenStream && (
            <video
              ref={getVideoRef(fullscreenStream.deviceId)}
              className={classes.fullscreenVideo}
              autoPlay
              muted
              controls
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CameraPage;