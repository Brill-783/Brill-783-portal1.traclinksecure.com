import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Switch,
  Checkbox,
  Tabs,
  Tab,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  Snackbar,
} from '@mui/material';

import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NearMeIcon from '@mui/icons-material/NearMe';
import LayersIcon from '@mui/icons-material/Layers';
import TuneIcon from '@mui/icons-material/Tune';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import SpeedIcon from '@mui/icons-material/Speed';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';
const BORDER = '#e2e8f0';
const BORDER_LIGHT = '#f1f5f9';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_SIZE_12 = '12px !important';

export const playAlertSound = (soundType = 'chime') => {
  if (!soundType || soundType === 'none') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playNote = (freq, startTime, duration, type = 'sine', volume = 0.9) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    switch (soundType) {
      case 'chime':
        playNote(1046.5, 0.0, 0.35, 'sine', 0.85);
        playNote(1567.98, 0.12, 0.5, 'sine', 0.95);
        break;
      case 'bell':
        playNote(1567.98, 0.0, 0.7, 'triangle', 0.9);
        playNote(2093.0, 0.02, 0.8, 'sine', 0.95);
        break;
      case 'radar':
        playNote(1760.0, 0.0, 0.08, 'sine', 0.9);
        playNote(2349.32, 0.1, 0.15, 'sine', 0.95);
        break;
      case 'siren':
        playNote(880.0, 0.0, 0.12, 'sawtooth', 0.75);
        playNote(1318.51, 0.12, 0.12, 'sawtooth', 0.85);
        break;
      default:
        playNote(1046.5, 0.0, 0.3, 'sine', 0.85);
        break;
    }
  } catch (err) {}
};

const ALL_ALERT_TYPES = [
  { id: 'deviceOverspeed', label: 'Over Speed' },
  { id: 'deviceMoving', label: 'Vehicle Moving' },
  { id: 'deviceStopped', label: 'Vehicle Stopped' },
  { id: 'ignitionOn', label: 'Ignition ON' },
  { id: 'ignitionOff', label: 'Ignition OFF' },
  { id: 'geofenceEnter', label: 'Geofence Entry' },
  { id: 'geofenceExit', label: 'Geofence Exit' },
  { id: 'alarm', label: 'SOS / Panic Alarm' },
  { id: 'powerCut', label: 'Power Cut / Tamper' },
  { id: 'lowBattery', label: 'Low Battery' },
  { id: 'tow', label: 'Towing / Movement Alert' },
  { id: 'idleDuration', label: 'Excessive Idling' },
  { id: 'hardAcceleration', label: 'Harsh Acceleration' },
  { id: 'hardBraking', label: 'Harsh Braking' },
  { id: 'hardCornering', label: 'Harsh Cornering' },
  { id: 'maintenance', label: 'Service / Maintenance Due' },
  { id: 'deviceOnline', label: 'Unit Connected (Online)' },
  { id: 'deviceOffline', label: 'Unit Disconnected (Offline)' },
  { id: 'deviceExpiring', label: 'Device Expiring' },
];

const SOUND_PRESETS = [
  { id: 'chime', label: 'Enterprise Chime', desc: 'Pleasant dual-tone airport chime' },
  { id: 'bell', label: 'Crystal Glass Bell', desc: 'Clear high-pitch harmonic ring' },
  { id: 'radar', label: 'Sonar Radar Chirp', desc: 'Double sonar sweep' },
  { id: 'siren', label: 'Emergency Siren', desc: 'Urgent warning sweep' },
  { id: 'none', label: 'Silent (Mute)', desc: 'Visual popup notification only' },
];

const ALERT_COLORS = [
  { label: 'Red', hex: '#ef4444' },
  { label: 'Orange', hex: '#f97316' },
  { label: 'Amber', hex: '#f59e0b' },
  { label: 'Teal', hex: '#00ab8e' },
  { label: 'Blue', hex: '#3b82f6' },
  { label: 'Purple', hex: '#8b5cf6' },
];

export const AddAlertModal = ({
  open,
  onClose,
  units = [],
  geofences = [],
  onSave,
  initialData = null,
}) => {
  const currentUser = useSelector((state) => state.session?.user);
  const impersonatedUserId = localStorage.getItem('impersonated_user_id');
  const effectiveUserId = impersonatedUserId ? Number(impersonatedUserId) : currentUser?.id;

  const [activeTab, setActiveTab] = useState(0);
  const [alertName, setAlertName] = useState('');
  const [selectedType, setSelectedType] = useState('deviceOverspeed');
  const [speedLimit, setSpeedLimit] = useState('');
  const [channels, setChannels] = useState({ inApp: true, email: false, sms: false });
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedSound, setSelectedSound] = useState('chime');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [unitSearch, setUnitSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [emails, setEmails] = useState('');
  const [phones, setPhones] = useState('');
  const [geofenceMode, setGeofenceMode] = useState('in');
  const [selectedGeofences, setSelectedGeofences] = useState([]);
  const [geofenceSearch, setGeofenceSearch] = useState('');

  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (!isInitializedRef.current) {
        setTouched(false);
        if (initialData) {
          setAlertName(initialData.name || '');
          setSelectedType(initialData.type || 'deviceOverspeed');
          setSpeedLimit(
            initialData.speedLimit !== undefined && initialData.speedLimit !== null
              ? String(initialData.speedLimit)
              : ''
          );
          setSelectedUnits(
            initialData.attributes?.selectedUnits ||
              initialData.selectedUnits ||
              (units || []).map((u) => u.id)
          );
          setSelectedGeofences(initialData.selectedGeofences || []);
          setGeofenceMode(initialData.geofenceMode || 'in');
          setChannels(initialData.channels || { inApp: true, email: false, sms: false });
          setSelectedSound(initialData.sound || 'chime');
          setSelectedColor(initialData.color || '#ef4444');
          setEmails(initialData.emails || '');
          setPhones(initialData.phones || '');
        } else {
          setAlertName('');
          setSelectedType('deviceOverspeed');
          setSpeedLimit('');
          setSelectedUnits([]);
          setSelectedGeofences([]);
          setGeofenceMode('in');
          setChannels({ inApp: true, email: false, sms: false });
          setSelectedSound('chime');
          setSelectedColor('#ef4444');
          setEmails('');
          setPhones('');
        }
        setActiveTab(0);
        isInitializedRef.current = true;
      }
    } else {
      isInitializedRef.current = false;
    }
  }, [open, initialData, units]);

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const filteredUnits = useMemo(() => {
    const searchLower = unitSearch.trim().toLowerCase();
    if (!searchLower) return units || [];
    return (units || []).filter((u) => (u.name || '').toLowerCase().includes(searchLower));
  }, [units, unitSearch]);

  const filteredTypes = useMemo(() => {
    const searchLower = typeSearch.trim().toLowerCase();
    if (!searchLower) return ALL_ALERT_TYPES;
    return ALL_ALERT_TYPES.filter((t) => t.label.toLowerCase().includes(searchLower));
  }, [typeSearch]);

  const filteredGeofences = useMemo(() => {
    const searchLower = geofenceSearch.trim().toLowerCase();
    if (!searchLower) return geofences || [];
    return (geofences || []).filter((g) => (g.name || '').toLowerCase().includes(searchLower));
  }, [geofences, geofenceSearch]);

  const handleModalClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown' || saving) {
      return;
    }
    if (onClose) onClose();
  };

  const handleSaveAlert = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setTouched(true);

    if (!alertName.trim()) {
      setActiveTab(0);
      showToast('Please enter an alert name', 'error');
      return;
    }

    if (selectedUnits.length === 0) {
      setActiveTab(0);
      showToast('Please select at least one unit', 'error');
      return;
    }

    if (selectedType === 'deviceOverspeed') {
      const parsed = Number(speedLimit);
      if (!speedLimit || isNaN(parsed) || parsed <= 0) {
        setActiveTab(1);
        showToast('Please enter a valid speed threshold', 'error');
        return;
      }
    }

    if (selectedType === 'geofenceEnter' || selectedType === 'geofenceExit') {
      if (selectedGeofences.length === 0) {
        setActiveTab(2);
        showToast('Please select at least one geofence', 'error');
        return;
      }
    }

    if (!channels.inApp && !channels.email && !channels.sms) {
      setActiveTab(3);
      showToast('Please select at least one notification channel', 'error');
      return;
    }

    if (channels.email && !emails.trim()) {
      setActiveTab(3);
      showToast('Please enter at least one recipient email address', 'error');
      return;
    }

    if (channels.sms && !phones.trim()) {
      setActiveTab(3);
      showToast('Please enter at least one recipient phone number', 'error');
      return;
    }

    setSaving(true);

    try {
      const parsedSpeed =
        speedLimit !== '' && !isNaN(Number(speedLimit)) ? Number(speedLimit) : undefined;
      const isEditing = Boolean(initialData?.id);

      const notificatorsArray = [];
      if (channels.inApp) notificatorsArray.push('web');
      if (channels.email) notificatorsArray.push('mail');
      if (channels.sms) notificatorsArray.push('sms');

      const isAllUnitsSelected =
        (units || []).length > 0 && selectedUnits.length === (units || []).length;

      const endpoint = isEditing ? `/api/notifications/${initialData.id}` : '/api/notifications';
      const method = isEditing ? 'PUT' : 'POST';

      const notifRes = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: isEditing ? initialData.id : undefined,
          type: selectedType,
          always: isAllUnitsSelected,
          notificators: notificatorsArray.join(','),
          description: isEditing ? initialData?.description : undefined,
          calendarId: isEditing ? initialData?.calendarId : undefined,
          commandId: isEditing ? initialData?.commandId : undefined,
          attributes: {
            ...(isEditing ? initialData?.attributes : {}),
            ruleName: alertName.trim(),
            speedLimit: selectedType === 'deviceOverspeed' && parsedSpeed ? parsedSpeed / 1.852 : undefined,
            sound: selectedSound,
            color: selectedColor,
            emails,
            phones,
            geofenceMode,
            selectedGeofences,
            selectedUnits,
            ownerUserId: Number(effectiveUserId),
          },
        }),
      });

      if (!notifRes.ok) {
        throw new Error('Failed to save alert rule to server');
      }

      const createdNotif = await notifRes.json();
      const notifId = createdNotif?.id || (isEditing ? initialData.id : undefined);

      if (parsedSpeed && selectedType === 'deviceOverspeed') {
        const speedKnots = parsedSpeed / 1.852;
        await Promise.all(
          selectedUnits.map(async (devId) => {
            const currentDev = units.find((u) => u.id === Number(devId));
            if (currentDev) {
              await fetch(`/api/devices/${devId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  ...currentDev,
                  attributes: {
                    ...(currentDev.attributes || {}),
                    speedLimit: speedKnots,
                  },
                }),
              }).catch(() => null);
            }
          })
        );
      }

      const ruleRecord = {
        id: notifId || Date.now(),
        name: alertName.trim(),
        type: selectedType,
        speedLimit: selectedType === 'deviceOverspeed' ? parsedSpeed : undefined,
        selectedUnits,
        selectedGeofences,
        geofenceMode,
        channels,
        sound: selectedSound,
        color: selectedColor,
        emails,
        phones,
        ownerUserId: Number(effectiveUserId),
        updatedAt: new Date().toISOString(),
        createdAt: initialData?.createdAt || new Date().toISOString(),
      };

      if (onSave) onSave(ruleRecord);
      showToast(
        initialData
          ? `Alert "${ruleRecord.name}" updated successfully!`
          : `Alert "${ruleRecord.name}" saved successfully!`,
        'success'
      );

      setTimeout(() => {
        setSaving(false);
        if (onClose) onClose();
      }, 350);
    } catch (err) {
      showToast(err.message || 'Error saving alert', 'error');
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleModalClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: FONT_FAMILY,
              width: '100%',
              maxWidth: '680px',
              margin: { xs: '8px', sm: '24px' },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            margin: 0,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SURFACE,
            borderBottom: `1px solid ${BORDER_LIGHT}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <NotificationsActiveIcon
              sx={{
                color: PRIMARY,
                fontSize: '20px',
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                color: TEXT,
                fontFamily: FONT_FAMILY,
                letterSpacing: '-0.2px',
              }}
            >
              {initialData ? 'Edit Alert' : 'Set Alert'}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            disabled={saving}
            size="small"
            sx={{
              color: TEXT_SECONDARY,
              padding: '4px',
              '&:hover': { backgroundColor: SURFACE_SOFT, color: TEXT },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form noValidate onSubmit={handleSaveAlert} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              borderBottom: `1px solid ${BORDER}`,
              backgroundColor: SURFACE,
              minHeight: '44px',
              px: 1,
              '& .MuiTabs-flexContainer': {
                justifyContent: 'space-between',
                width: '100%',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                color: TEXT_SECONDARY,
                minHeight: '44px',
                minWidth: 'auto',
                padding: '0 8px',
                fontFamily: FONT_FAMILY,
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                gap: '6px',
                '& svg': {
                  margin: 0,
                  fontSize: '16px',
                },
              },
              '& .Mui-selected': {
                color: `${PRIMARY} !important`,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: PRIMARY,
                height: '2.5px',
              },
            }}
          >
            <Tab icon={<NearMeIcon sx={{ transform: 'rotate(45deg)' }} />} iconPosition="start" label={`Units (${selectedUnits.length})`} />
            <Tab icon={<TuneIcon />} iconPosition="start" label="Type" />
            <Tab icon={<LayersIcon />} iconPosition="start" label={`Geofencing (${selectedGeofences.length})`} />
            <Tab icon={<EmailIcon />} iconPosition="start" label="Notifications" />
            <Tab icon={<VolumeUpIcon />} iconPosition="start" label="Sound" />
            <Tab icon={<ColorLensIcon />} iconPosition="start" label="Colors" />
          </Tabs>

          <DialogContent
            sx={{
              padding: '20px 22px',
              minHeight: '340px',
              maxHeight: '480px',
              overflowY: 'auto',
              backgroundColor: SURFACE,
            }}
          >
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                    <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>Alert Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    error={touched && !alertName.trim()}
                    helperText={touched && !alertName.trim() ? 'Alert Name is required' : ''}
                    placeholder="Enter alert title..."
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: SURFACE },
                      '& input': { fontSize: FONT_SIZE_12, fontWeight: 700, color: TEXT, fontFamily: FONT_FAMILY, padding: '8.5px 12px' },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                    <TextField
                      size="small"
                      placeholder="Search units..."
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      sx={{
                        width: '240px',
                        '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: SURFACE },
                        '& input': { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_12, fontWeight: 700, padding: '6px 10px' },
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        size="small"
                        onClick={() => setSelectedUnits((units || []).map((u) => u.id))}
                        sx={{ textTransform: 'none', color: PRIMARY, fontWeight: 700, fontSize: FONT_SIZE_12, fontFamily: FONT_FAMILY, p: 0, minWidth: 0 }}
                      >
                        Select All
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setSelectedUnits([])}
                        sx={{ textTransform: 'none', color: TEXT_SECONDARY, fontWeight: 700, fontSize: FONT_SIZE_12, fontFamily: FONT_FAMILY, p: 0, minWidth: 0 }}
                      >
                        Deselect All
                      </Button>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      maxHeight: '230px',
                      overflowY: 'auto',
                      p: 1.5,
                      backgroundColor: SURFACE_SOFT,
                      borderRadius: '8px',
                      border: touched && selectedUnits.length === 0 ? '1px solid #ef4444' : `1px solid ${BORDER}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                        gap: 1.2,
                      }}
                    >
                      {filteredUnits.map((u) => {
                        const isSelected = selectedUnits.includes(u.id);
                        return (
                          <Box
                            key={u.id}
                            onClick={() =>
                              setSelectedUnits(
                                isSelected
                                  ? selectedUnits.filter((id) => id !== u.id)
                                  : [...selectedUnits, u.id]
                              )
                            }
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              border: isSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                              borderRadius: '6px',
                              backgroundColor: isSelected ? '#f0fdfa' : SURFACE,
                              height: '42px',
                              px: 1.5,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:hover': { borderColor: PRIMARY },
                            }}
                          >
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              sx={{ padding: 0, marginRight: '10px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                            />
                            <Typography noWrap sx={{ fontSize: FONT_SIZE_12, color: isSelected ? '#0f172a' : TEXT, fontWeight: 700, fontFamily: FONT_FAMILY }}>
                              {u.name}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  placeholder="Search alert type..."
                  size="small"
                  fullWidth
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                    '& input': { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_12, fontWeight: 700, padding: '7px 12px' },
                  }}
                />
                <Box sx={{ maxHeight: '220px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                    {filteredTypes.map((type) => {
                      const isSelected = selectedType === type.id;
                      return (
                        <Box
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: isSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                            borderRadius: '6px',
                            backgroundColor: isSelected ? '#f0fdfa' : SURFACE,
                            height: '42px',
                            px: 1.5,
                            cursor: 'pointer',
                            '&:hover': { borderColor: PRIMARY },
                          }}
                        >
                          <Radio size="small" checked={isSelected} sx={{ padding: 0, marginRight: '10px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                          <Typography noWrap sx={{ fontSize: FONT_SIZE_12, color: isSelected ? '#0f172a' : TEXT, fontWeight: 700, fontFamily: FONT_FAMILY }}>
                            {type.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {selectedType === 'deviceOverspeed' && (
                  <Box sx={{ p: 1.5, backgroundColor: SURFACE_SOFT, border: touched && (!speedLimit || Number(speedLimit) <= 0) ? '1px solid #ef4444' : `1px solid ${PRIMARY}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                      <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, color: TEXT, fontFamily: FONT_FAMILY }}>Speed Threshold</Typography>
                    </Box>
                    <TextField
                      type="number"
                      size="small"
                      required
                      placeholder="e.g. 80"
                      value={speedLimit}
                      error={touched && (!speedLimit || Number(speedLimit) <= 0)}
                      onChange={(e) => setSpeedLimit(e.target.value)}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">km/h</InputAdornment>,
                          sx: { borderRadius: '6px', width: '120px', fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY },
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RadioGroup row value={geofenceMode} onChange={(e) => setGeofenceMode(e.target.value)} sx={{ gap: 4, px: 0.5 }}>
                  <FormControlLabel value="in" control={<Radio size="small" sx={{ '&.Mui-checked': { color: PRIMARY } }} />} label={<Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>Zone Entry (In)</Typography>} />
                  <FormControlLabel value="out" control={<Radio size="small" sx={{ '&.Mui-checked': { color: PRIMARY } }} />} label={<Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>Zone Exit (Out)</Typography>} />
                </RadioGroup>
                <TextField
                  placeholder="Search geofences..."
                  size="small"
                  fullWidth
                  value={geofenceSearch}
                  onChange={(e) => setGeofenceSearch(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                    '& input': { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_12, fontWeight: 700, padding: '7px 12px' },
                  }}
                />
                <Box sx={{ maxHeight: '200px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                    {filteredGeofences.map((gf) => {
                      const isChecked = selectedGeofences.includes(gf.id);
                      return (
                        <Box key={gf.id} onClick={() => setSelectedGeofences(isChecked ? selectedGeofences.filter((id) => id !== gf.id) : [...selectedGeofences, gf.id])} sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: '6px', backgroundColor: SURFACE, height: '42px', px: 1.5, cursor: 'pointer', '&:hover': { borderColor: PRIMARY } }}>
                          <Checkbox size="small" disableRipple checked={isChecked} sx={{ padding: 0, marginRight: '10px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                          <Typography noWrap sx={{ fontSize: FONT_SIZE_12, color: TEXT, fontWeight: 700, fontFamily: FONT_FAMILY }}>{gf.name}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}

            {activeTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <PhoneIphoneIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                    <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>In-App Notification</Typography>
                  </Box>
                  <Switch checked={channels.inApp} size="small" onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PRIMARY } }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <EmailIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                    <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>Email Dispatch</Typography>
                  </Box>
                  <Switch checked={channels.email} size="small" onChange={(e) => setChannels({ ...channels, email: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PRIMARY } }} />
                </Box>
                {channels.email && (
                  <TextField
                    fullWidth
                    size="small"
                    required
                    error={touched && channels.email && !emails.trim()}
                    helperText={touched && channels.email && !emails.trim() ? 'Recipient email is required' : ''}
                    placeholder="emails (comma-separated)..."
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    sx={{ '& input': { fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY } }}
                  />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <SmsIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
                    <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>SMS Alert</Typography>
                  </Box>
                  <Switch checked={channels.sms} size="small" onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PRIMARY } }} />
                </Box>
                {channels.sms && (
                  <TextField
                    fullWidth
                    size="small"
                    required
                    error={touched && channels.sms && !phones.trim()}
                    helperText={touched && channels.sms && !phones.trim() ? 'Recipient phone number is required' : ''}
                    placeholder="phone numbers (comma-separated)..."
                    value={phones}
                    onChange={(e) => setPhones(e.target.value)}
                    sx={{ '& input': { fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY } }}
                  />
                )}
              </Box>
            )}

            {activeTab === 4 && (
              <Box sx={{ maxHeight: '260px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                {SOUND_PRESETS.map((snd) => {
                  const isSelected = selectedSound === snd.id;
                  return (
                    <Box key={snd.id} onClick={() => setSelectedSound(snd.id)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '6px', border: isSelected ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`, backgroundColor: isSelected ? '#e6f7f4' : SURFACE, cursor: 'pointer', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {snd.id === 'none' ? <VolumeOffIcon sx={{ color: TEXT_MUTED, fontSize: 20 }} /> : <VolumeUpIcon sx={{ color: PRIMARY, fontSize: 20 }} />}
                        <Box>
                          <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, fontFamily: FONT_FAMILY }}>{snd.label}</Typography>
                          <Typography sx={{ fontSize: '11px', color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>{snd.desc}</Typography>
                        </Box>
                      </Box>
                      {snd.id !== 'none' && (
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); playAlertSound(snd.id); }} sx={{ color: PRIMARY, border: `1px solid ${PRIMARY}`, padding: '4px' }}>
                          <PlayArrowIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            {activeTab === 5 && (
              <Box sx={{ p: 2, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: FONT_SIZE_12, fontWeight: 700, mb: 1.5, fontFamily: FONT_FAMILY }}>Select Notification Color</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {ALERT_COLORS.map((c) => (
                    <Box
                      key={c.hex}
                      onClick={() => setSelectedColor(c.hex)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        cursor: 'pointer',
                        border: selectedColor === c.hex ? '3px solid #0f172a' : '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ padding: '14px 20px', backgroundColor: SURFACE, borderTop: `1px solid ${BORDER_LIGHT}`, gap: 1.5 }}>
            <Button
              onClick={onClose}
              disabled={saving}
              variant="outlined"
              sx={{
                borderRadius: '8px',
                color: PRIMARY,
                borderColor: PRIMARY,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                px: 2.5,
                py: 0.6,
                fontFamily: FONT_FAMILY,
                '&:hover': { borderColor: PRIMARY_DARK, backgroundColor: '#f0fdfa' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                borderRadius: '8px',
                backgroundColor: PRIMARY,
                color: SURFACE,
                '&:hover': { backgroundColor: PRIMARY_DARK },
                textTransform: 'none',
                fontWeight: 700,
                fontSize: FONT_SIZE_12,
                px: 3,
                py: 0.6,
                boxShadow: 'none',
                fontFamily: FONT_FAMILY,
              }}
            >
              {saving ? 'Saving...' : initialData ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          zIndex: 999999,
          top: '14px !important',
          right: '14px !important',
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'transparent !important',
            boxShadow: 'none !important',
            padding: 0,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            backgroundColor: toast.severity === 'error' ? '#ef4444' : '#00ab8e',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '6px 14px',
            boxShadow:
              toast.severity === 'error'
                ? '0 8px 20px -2px rgba(239, 68, 68, 0.4)'
                : '0 8px 20px -2px rgba(0, 171, 142, 0.4)',
            fontFamily: FONT_FAMILY,
            minWidth: '220px',
            maxWidth: '340px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.severity === 'error' ? (
              <ErrorOutlineOutlinedIcon sx={{ color: '#ffffff', fontSize: '1.15rem' }} />
            ) : (
              <CheckIcon sx={{ color: '#ffffff', fontSize: '1.15rem' }} />
            )}
            <Typography sx={{ color: '#ffffff', fontSize: FONT_SIZE_12, fontWeight: 700 }}>
              {toast.message}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ color: '#ffffff', p: 0.2 }}>
            <CloseIcon sx={{ fontSize: '0.95rem' }} />
          </IconButton>
        </Box>
      </Snackbar>
    </>
  );
};

export default memo(AddAlertModal);