import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { makeStyles } from 'tss-react/mui';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Autocomplete,
  TextField,
  createFilterOptions,
  Button,
  Box,
  Tooltip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CachedIcon from '@mui/icons-material/Cached';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';

import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import SelectField from '../common/components/SelectField';
import useMapStyles from '../map/core/useMapStyles';
import useMapOverlays from '../map/overlay/useMapOverlays';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { playAlertSound } from '../main/components/AddAlertModal';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const PRIMARY_LIGHT = '#f0fdfa';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#e2e8f0';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const deviceFields = [
  { id: 'name', name: 'sharedName' },
  { id: 'uniqueId', name: 'deviceIdentifier' },
  { id: 'phone', name: 'sharedPhone' },
  { id: 'model', name: 'deviceModel' },
  { id: 'contact', name: 'deviceContact' },
  { id: 'geofenceIds', name: 'sharedGeofence' },
  { id: 'driverUniqueId', name: 'sharedDriver' },
  { id: 'motion', name: 'positionMotion' },
];

const CARD_OPTIONS = [
  { id: 'identity', label: 'Identity & Address' },
  { id: 'location_detail', label: 'Location Details' },
  { id: 'sensors', label: 'Telemetry Sensors' },
  { id: 'gps', label: 'Network & GSM' },
  { id: 'driver', label: 'Driver Information' },
  { id: 'gprs', label: 'GPRS Commands' },
  { id: 'security', label: 'Security & Immobilizer' },
  { id: 'temperature', label: 'Temperature & Cargo' },
  { id: 'maintenance', label: 'Maintenance Schedules' },
  { id: 'summary', label: 'Today Summary' },
  { id: 'power', label: 'Power & Voltage' },
  { id: 'fuel', label: 'Fuel & Consumption' },
];

const SOUND_PRESETS = [
  { id: 'chime', label: 'Enterprise Chime' },
  { id: 'bell', label: 'Crystal Bell' },
  { id: 'radar', label: 'Sonar Radar' },
  { id: 'siren', label: 'Emergency Siren' },
  { id: 'none', label: 'Silent / Muted' },
];

const InlineSettingsMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = useAdministrator();
  const readonly = useRestriction('readonly');
  const userId = useSelector((state) => state.session.user?.id);

  const menuItems = [
    { title: 'Account User', path: `/settings/user/${userId}`, icon: <PersonOutlinedIcon fontSize="small" /> },
    { title: 'Vehicles & Devices', path: '/settings/devices', icon: <DirectionsCarOutlinedIcon fontSize="small" /> },
    { title: 'Device Groups', path: '/settings/groups', icon: <GroupOutlinedIcon fontSize="small" /> },
    { title: 'Drivers', path: '/settings/drivers', icon: <BadgeOutlinedIcon fontSize="small" /> },
    { title: 'Geofences', path: '/settings/geofences', icon: <LayersOutlinedIcon fontSize="small" /> },
    { title: 'Notifications & Alerts', path: '/settings/notifications', icon: <NotificationsActiveOutlinedIcon fontSize="small" /> },
    { title: 'Maintenance Schedules', path: '/settings/maintenances', icon: <BuildOutlinedIcon fontSize="small" /> },
    { title: 'Saved Commands', path: '/settings/commands', icon: <SendOutlinedIcon fontSize="small" /> },
    { title: 'Preferences', path: '/settings/preferences', icon: <TuneOutlinedIcon fontSize="small" /> },
  ];

  const adminItems = [
    { title: 'Server Settings', path: '/settings/server', icon: <DnsOutlinedIcon fontSize="small" /> },
    { title: 'Users Management', path: '/settings/users', icon: <PeopleAltOutlinedIcon fontSize="small" /> },
  ];

  return (
    <List sx={{ width: '100%', py: 0.5 }}>
      {menuItems.map((item) => {
        const selected = location.pathname === item.path || (item.path.includes('/user/') && location.pathname.includes('/user/'));
        return (
          <ListItemButton
            key={item.path}
            selected={selected}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: '8px',
              mx: 1,
              my: 0.4,
              py: 0.8,
              '&.Mui-selected': {
                backgroundColor: PRIMARY_LIGHT,
                color: PRIMARY_DARK,
                fontWeight: 700,
                '& .MuiListItemIcon-root': { color: PRIMARY },
              },
              '&:hover': {
                backgroundColor: '#f8fafc',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: '32px', color: selected ? PRIMARY : TEXT_SECONDARY }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: '13px',
                fontWeight: selected ? 700 : 500,
                color: selected ? '#0f172a' : TEXT,
                fontFamily: FONT_FAMILY,
              }}
            />
          </ListItemButton>
        );
      })}

      {admin && !readonly && (
        <>
          <Divider sx={{ my: 1, mx: 1.5, borderColor: BORDER_LIGHT }} />
          {adminItems.map((item) => {
            const selected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  mx: 1,
                  my: 0.4,
                  py: 0.8,
                  '&.Mui-selected': {
                    backgroundColor: PRIMARY_LIGHT,
                    color: PRIMARY_DARK,
                    fontWeight: 700,
                    '& .MuiListItemIcon-root': { color: PRIMARY },
                  },
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: '32px', color: selected ? PRIMARY : TEXT_SECONDARY }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '13px',
                    fontWeight: selected ? 700 : 500,
                    color: selected ? '#0f172a' : TEXT,
                    fontFamily: FONT_FAMILY,
                  }}
                />
              </ListItemButton>
            );
          })}
        </>
      )}
    </List>
  );
};

const useStyles = makeStyles()(() => ({
  container: {
    paddingTop: '20px',
    paddingBottom: '30px',
    fontFamily: FONT_FAMILY,
    '&, & *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
  accordion: {
    borderRadius: '10px !important',
    marginBottom: '12px !important',
    border: `1.5px solid ${BORDER_LIGHT} !important`,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04) !important',
    overflow: 'hidden',
    backgroundColor: SURFACE,
    '&:before': {
      display: 'none',
    },
  },
  accordionSummary: {
    backgroundColor: SURFACE,
    padding: '0 18px',
    minHeight: '52px !important',
    '& .MuiAccordionSummary-content': {
      margin: '12px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
  },
  sectionIcon: {
    color: PRIMARY,
    fontSize: '20px',
  },
  sectionTitle: {
    fontWeight: '700 !important',
    fontSize: '14px !important',
    color: '#0f172a',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px 20px 22px 20px',
    backgroundColor: SURFACE,
    borderTop: `1px solid ${BORDER_LIGHT}`,
  },
  formControl: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
    },
    '& .MuiInputLabel-root': {
      fontSize: '13.5px',
    },
    '& .MuiSelect-select, & input': {
      fontSize: '13px',
      padding: '10px 14px',
    },
  },
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  gridCardTiles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
    padding: '4px 0',
  },
  cardTile: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '6px',
    border: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: PRIMARY_LIGHT,
      borderColor: PRIMARY,
    },
  },
  cardTileActive: {
    backgroundColor: PRIMARY_LIGHT,
    borderColor: PRIMARY,
  },
  buttonBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    color: '#ffffff',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '13px',
    borderRadius: '8px',
    padding: '8px 24px',
    boxShadow: '0 2px 6px rgba(0, 171, 142, 0.25)',
    '&:hover': {
      backgroundColor: PRIMARY_DARK,
    },
  },
  cancelBtn: {
    borderColor: BORDER,
    color: TEXT_SECONDARY,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '13px',
    borderRadius: '8px',
    padding: '8px 20px',
    '&:hover': {
      backgroundColor: SURFACE_SOFT,
      borderColor: '#94a3b8',
    },
  },
}));

const PreferencesPage = () => {
  const { classes, cx } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const user = useSelector((state) => state.session.user);
  const server = useSelector((state) => state.session.server || {});
  const [attributes, setAttributes] = useState(user?.attributes || {});

  const versionApp = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const versionServer = server.version || '6.0';
  const socket = useSelector((state) => state.session.socket);

  const [token, setToken] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(() =>
    dayjs().add(1, 'month').format('YYYY-MM-DD')
  );

  const mapStyles = useMapStyles();
  const mapOverlays = useMapOverlays();
  const positionAttributes = usePositionAttributes(t);
  const filter = createFilterOptions();

  const userSavedCards = useMemo(() => {
    const pref = attributes.cardPreferences;
    if (pref && typeof pref === 'object') return pref;
    const initial = {};
    CARD_OPTIONS.forEach((c) => {
      initial[c.id] = true;
    });
    return initial;
  }, [attributes.cardPreferences]);

  const [cardPrefs, setCardPrefs] = useState(userSavedCards);

  const toggleCardPref = (id) => {
    const updated = { ...cardPrefs, [id]: !cardPrefs[id] };
    setCardPrefs(updated);
    setAttributes((prev) => ({
      ...prev,
      cardPreferences: updated,
    }));
  };

  const generateToken = useCatch(async () => {
    const expiration = dayjs(tokenExpiration, 'YYYY-MM-DD').toISOString();
    const response = await fetchOrThrow('/api/session/token', {
      method: 'POST',
      body: new URLSearchParams(`expiration=${expiration}`),
    });
    setToken(await response.text());
  });

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const handleSave = useCatch(async () => {
    const payload = {
      ...user,
      attributes: {
        ...attributes,
        cardPreferences: cardPrefs,
      },
    };

    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const updated = await response.json();
    dispatch(sessionActions.updateUser(updated));

    if (user?.id) {
      try {
        localStorage.setItem(`tracklink_user_${user.id}_card_preferences`, JSON.stringify(cardPrefs));
      } catch (e) {}
    }

    Swal.fire({
      icon: 'success',
      title: 'Preferences Saved',
      text: 'Your custom configuration has been updated successfully.',
      timer: 1800,
      showConfirmButton: false,
    });

    navigate(-1);
  });

  const handleReboot = useCatch(async () => {
    const result = await Swal.fire({
      title: 'Reboot GPS Server?',
      text: 'Are you sure you want to reboot the backend tracking engine?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Reboot',
    });

    if (result.isConfirmed) {
      await fetch('/api/server/reboot', { method: 'POST' });
      Swal.fire('Rebooting', 'Server is restarting...', 'info');
    }
  });

  return (
    <PageLayout menu={<InlineSettingsMenu />} breadcrumbs={['settingsTitle', 'sharedPreferences']}>
      <Container maxWidth="md" className={classes.container}>
        {!readonly && (
          <>
            {/* 1. Units & Localization */}
            <Accordion defaultExpanded className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
                <SpeedOutlinedIcon className={classes.sectionIcon} />
                <Typography className={classes.sectionTitle}>Units & Localization</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <div className={classes.gridTwoCols}>
                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>Speed Units</InputLabel>
                    <Select
                      label="Speed Units"
                      value={attributes.speedUnit || 'kmh'}
                      onChange={(e) => setAttributes({ ...attributes, speedUnit: e.target.value })}
                    >
                      <MenuItem value="kmh">Kilometers per hour (km/h)</MenuItem>
                      <MenuItem value="mph">Miles per hour (mph)</MenuItem>
                      <MenuItem value="kn">Knots (kn)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>Distance Units</InputLabel>
                    <Select
                      label="Distance Units"
                      value={attributes.distanceUnit || 'km'}
                      onChange={(e) => setAttributes({ ...attributes, distanceUnit: e.target.value })}
                    >
                      <MenuItem value="km">Kilometers (km)</MenuItem>
                      <MenuItem value="mi">Miles (mi)</MenuItem>
                      <MenuItem value="nmi">Nautical Miles (nmi)</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className={classes.gridTwoCols}>
                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>Temperature Units</InputLabel>
                    <Select
                      label="Temperature Units"
                      value={attributes.temperatureUnit || 'celsius'}
                      onChange={(e) => setAttributes({ ...attributes, temperatureUnit: e.target.value })}
                    >
                      <MenuItem value="celsius">Celsius (°C)</MenuItem>
                      <MenuItem value="fahrenheit">Fahrenheit (°F)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>Volume Units</InputLabel>
                    <Select
                      label="Volume Units"
                      value={attributes.volumeUnit || 'liter'}
                      onChange={(e) => setAttributes({ ...attributes, volumeUnit: e.target.value })}
                    >
                      <MenuItem value="liter">Liters (L)</MenuItem>
                      <MenuItem value="gallon">Gallons (US Gal)</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className={classes.gridTwoCols}>
                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>Coordinate Format</InputLabel>
                    <Select
                      label="Coordinate Format"
                      value={attributes.coordinateFormat || 'dd'}
                      onChange={(e) => setAttributes({ ...attributes, coordinateFormat: e.target.value })}
                    >
                      <MenuItem value="dd">Decimal Degrees (15.3875°, 28.2814°)</MenuItem>
                      <MenuItem value="dms">Degrees, Minutes, Seconds (DMS)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      label="Time Format"
                      value={attributes.twelveHourFormat ? '12h' : '24h'}
                      onChange={(e) =>
                        setAttributes({ ...attributes, twelveHourFormat: e.target.value === '12h' })
                      }
                    >
                      <MenuItem value="24h">24-Hour Clock (14:30:00)</MenuItem>
                      <MenuItem value="12h">12-Hour Clock (02:30:00 PM)</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </AccordionDetails>
            </Accordion>

            {/* 2. Map & Live Tracking */}
            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
                <MapOutlinedIcon className={classes.sectionIcon} />
                <Typography className={classes.sectionTitle}>{t('mapTitle')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <FormControl className={classes.formControl} fullWidth size="small">
                  <InputLabel>{t('mapActive')}</InputLabel>
                  <Select
                    label={t('mapActive')}
                    value={
                      attributes.activeMapStyles?.split(',') || [
                        'googleHybrid',
                        'googleRoad',
                        'googleSatellite',
                        'osm',
                      ]
                    }
                    onChange={(e, child) => {
                      const clicked = mapStyles.find((s) => s.id === child.props.value);
                      if (clicked?.available) {
                        setAttributes({ ...attributes, activeMapStyles: e.target.value.join(',') });
                      } else if (clicked && clicked.id !== 'custom') {
                        const query = new URLSearchParams({ attribute: clicked.attribute });
                        navigate(`/settings/user/${user.id}?${query.toString()}`);
                      }
                    }}
                    multiple
                  >
                    {mapStyles.map((style) => (
                      <MenuItem key={style.id} value={style.id}>
                        <Typography
                          component="span"
                          sx={{ fontSize: '13px', color: style.available ? '#0f172a' : 'error.main' }}
                        >
                          {style.title}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <div className={classes.gridTwoCols}>
                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>{t('mapLiveRoutes')}</InputLabel>
                    <Select
                      label={t('mapLiveRoutes')}
                      value={attributes.mapLiveRoutes || 'selected'}
                      onChange={(e) => setAttributes({ ...attributes, mapLiveRoutes: e.target.value })}
                    >
                      <MenuItem value="none">{t('sharedDisabled')}</MenuItem>
                      <MenuItem value="selected">{t('deviceSelected')}</MenuItem>
                      <MenuItem value="all">{t('notificationAlways')}</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>{t('mapDirection')}</InputLabel>
                    <Select
                      label={t('mapDirection')}
                      value={attributes.mapDirection || 'selected'}
                      onChange={(e) => setAttributes({ ...attributes, mapDirection: e.target.value })}
                    >
                      <MenuItem value="none">{t('sharedDisabled')}</MenuItem>
                      <MenuItem value="selected">{t('deviceSelected')}</MenuItem>
                      <MenuItem value="all">{t('notificationAlways')}</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={attributes.mapFollow !== false}
                        onChange={(e) => setAttributes({ ...attributes, mapFollow: e.target.checked })}
                        sx={{ color: BORDER, '&.Mui-checked': { color: PRIMARY } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{t('deviceFollow')}</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={attributes.mapCluster !== false}
                        onChange={(e) => setAttributes({ ...attributes, mapCluster: e.target.checked })}
                        sx={{ color: BORDER, '&.Mui-checked': { color: PRIMARY } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{t('mapClustering')}</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={attributes.mapOnSelect !== false}
                        onChange={(e) => setAttributes({ ...attributes, mapOnSelect: e.target.checked })}
                        sx={{ color: BORDER, '&.Mui-checked': { color: PRIMARY } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{t('mapOnSelect')}</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(attributes.showTraffic)}
                        onChange={(e) => setAttributes({ ...attributes, showTraffic: e.target.checked })}
                        sx={{ color: BORDER, '&.Mui-checked': { color: PRIMARY } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '13px', fontWeight: 500 }}>Live Google Traffic Overlay</Typography>}
                  />
                </FormGroup>

                <Autocomplete
                  multiple
                  freeSolo
                  options={Object.keys(positionAttributes)}
                  getOptionLabel={(option) => {
                    if (typeof option === 'object' && option.inputValue) return option.inputValue;
                    return positionAttributes[option]?.name || option;
                  }}
                  value={
                    attributes.positionItems?.split(',') || [
                      'fixTime',
                      'address',
                      'speed',
                      'totalDistance',
                    ]
                  }
                  onChange={(_, newValue) => {
                    setAttributes({
                      ...attributes,
                      positionItems: newValue
                        .map((x) => (typeof x === 'string' ? x : x.inputValue))
                        .join(','),
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label={t('attributePopupInfo')} size="small" className={classes.formControl} />
                  )}
                />
              </AccordionDetails>
            </Accordion>

            {/* 3. Device Markers & Labels */}
            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
                <DirectionsCarOutlinedIcon className={classes.sectionIcon} />
                <Typography className={classes.sectionTitle}>{t('deviceTitle')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <div className={classes.gridTwoCols}>
                  <SelectField
                    value={attributes.devicePrimary || 'name'}
                    onChange={(e) => setAttributes({ ...attributes, devicePrimary: e.target.value })}
                    data={deviceFields}
                    titleGetter={(it) => t(it.name)}
                    label={t('devicePrimaryInfo')}
                    className={classes.formControl}
                  />
                  <SelectField
                    value={attributes.deviceSecondary || 'motion'}
                    onChange={(e) => setAttributes({ ...attributes, deviceSecondary: e.target.value })}
                    data={deviceFields}
                    titleGetter={(it) => t(it.name)}
                    label={t('deviceSecondaryInfo')}
                    className={classes.formControl}
                  />
                </div>
              </AccordionDetails>
            </Accordion>

            {/* 4. Default Status Cards Visibility */}
            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
                <ViewCarouselOutlinedIcon className={classes.sectionIcon} />
                <Typography className={classes.sectionTitle}>Dashboard Status Cards</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <Typography sx={{ fontSize: '12.5px', color: TEXT_SECONDARY, mb: 1 }}>
                  Choose which telemetry cards are visible by default in the bottom status panel:
                </Typography>
                <div className={classes.gridCardTiles}>
                  {CARD_OPTIONS.map((c) => {
                    const active = Boolean(cardPrefs[c.id]);
                    return (
                      <div
                        key={c.id}
                        className={cx(classes.cardTile, active && classes.cardTileActive)}
                        onClick={() => toggleCardPref(c.id)}
                      >
                        <Checkbox
                          size="small"
                          checked={active}
                          sx={{ p: 0.4, mr: 0.8, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                        />
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: active ? '#0f172a' : TEXT_SECONDARY }}>
                          {c.label}
                        </Typography>
                      </div>
                    );
                  })}
                </div>
              </AccordionDetails>
            </Accordion>

            {/* 5. Audio & Sounds */}
            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
                <VolumeUpOutlinedIcon className={classes.sectionIcon} />
                <Typography className={classes.sectionTitle}>{t('sharedSound')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <div className={classes.gridTwoCols}>
                  <FormControl className={classes.formControl} fullWidth size="small">
                    <InputLabel>Default Alert Sound</InputLabel>
                    <Select
                      label="Default Alert Sound"
                      value={attributes.defaultSound || 'chime'}
                      onChange={(e) => setAttributes({ ...attributes, defaultSound: e.target.value })}
                      endAdornment={
                        <InputAdornment position="end" sx={{ mr: 2 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              playAlertSound(attributes.defaultSound || 'chime');
                            }}
                          >
                            <PlayArrowIcon sx={{ fontSize: 18, color: PRIMARY }} />
                          </IconButton>
                        </InputAdornment>
                      }
                    >
                      {SOUND_PRESETS.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <SelectField
                    multiple
                    value={attributes.soundAlarms?.split(',') || ['sos']}
                    onChange={(e) =>
                      setAttributes({ ...attributes, soundAlarms: e.target.value.join(',') })
                    }
                    data={alarms}
                    keyGetter={(it) => it.key}
                    label={t('eventsSoundAlarms')}
                    className={classes.formControl}
                  />
                </div>

                <SelectField
                  multiple
                  value={attributes.soundEvents?.split(',') || []}
                  onChange={(e) =>
                    setAttributes({ ...attributes, soundEvents: e.target.value.join(',') })
                  }
                  endpoint="/api/notifications/types"
                  keyGetter={(it) => it.type}
                  titleGetter={(it) => t(prefixString('event', it.type))}
                  label={t('eventsSoundEvents')}
                  className={classes.formControl}
                />
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* 6. User API Token */}
        <Accordion className={classes.accordion}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
            <VpnKeyOutlinedIcon className={classes.sectionIcon} />
            <Typography className={classes.sectionTitle}>{t('userToken')}</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <TextField
              label={t('userExpirationTime')}
              type="date"
              size="small"
              value={tokenExpiration}
              className={classes.formControl}
              onChange={(e) => {
                setTokenExpiration(e.target.value);
                setToken(null);
              }}
            />
            <FormControl className={classes.formControl} fullWidth>
              <OutlinedInput
                multiline
                rows={4}
                readOnly
                placeholder="Click the refresh button to generate an API session token..."
                value={token || ''}
                sx={{ fontSize: '12px', fontFamily: 'monospace !important' }}
                endAdornment={
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Tooltip title="Generate Token" arrow>
                        <IconButton size="small" onClick={generateToken} sx={{ color: PRIMARY }}>
                          <CachedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy to Clipboard" arrow>
                        <IconButton
                          size="small"
                          disabled={!token}
                          onClick={() => {
                            navigator.clipboard.writeText(token);
                            Swal.fire({
                              toast: true,
                              position: 'top-end',
                              icon: 'success',
                              title: 'Token copied to clipboard',
                              showConfirmButton: false,
                              timer: 1500,
                            });
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </InputAdornment>
                }
              />
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* 7. System Diagnostics & Actions */}
        {!readonly && (
          <Accordion className={classes.accordion}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
              <InfoOutlinedIcon className={classes.sectionIcon} />
              <Typography className={classes.sectionTitle}>{t('sharedInfoTitle')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <div className={classes.gridTwoCols}>
                <TextField
                  value={versionApp}
                  label={t('settingsAppVersion')}
                  disabled
                  size="small"
                  className={classes.formControl}
                />
                <TextField
                  value={versionServer || '-'}
                  label={t('settingsServerVersion')}
                  disabled
                  size="small"
                  className={classes.formControl}
                />
              </div>

              <div className={classes.gridTwoCols}>
                <TextField
                  value={socket ? 'Connected (Live)' : 'Disconnected (Offline)'}
                  label={t('settingsConnection')}
                  disabled
                  size="small"
                  className={classes.formControl}
                />
                <Button
                  variant="outlined"
                  onClick={() => navigate('/emulator')}
                  sx={{
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: PRIMARY_LIGHT, borderColor: PRIMARY_DARK },
                  }}
                >
                  Launch Device Protocol Emulator
                </Button>
              </div>

              {admin && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RestartAltIcon />}
                    onClick={handleReboot}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                  >
                    {t('serverReboot')}
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Action Buttons */}
        {!readonly && (
          <div className={classes.buttonBar}>
            <Button
              type="button"
              variant="outlined"
              className={classes.cancelBtn}
              onClick={() => navigate(-1)}
            >
              {t('sharedCancel')}
            </Button>
            <Button
              type="button"
              variant="contained"
              className={classes.saveBtn}
              onClick={handleSave}
            >
              Save Preferences
            </Button>
          </div>
        )}
      </Container>
    </PageLayout>
  );
};

export default PreferencesPage;