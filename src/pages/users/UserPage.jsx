import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CachedIcon from '@mui/icons-material/Cached';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useDispatch, useSelector } from 'react-redux';
import EditItemView from '../../common/components/EditItemView';
import EditAttributesAccordion from '../../common/components/EditAttributesAccordion';
import { useTranslation } from '../../common/components/LocalizationProvider';
import useUserAttributes from '../../common/attributes/useUserAttributes';
import { sessionActions, devicesActions } from '../../store';
import SelectField from '../../common/components/SelectField';
import PasswordField from '../../common/components/PasswordField';
import useCommonUserAttributes from '../../common/attributes/useCommonUserAttributes';
import { useAdministrator, useRestriction, useManager } from '../../common/util/permissions';
import { useCatch } from '../../reactHelper';
import useMapStyles from '../../map/core/useMapStyles';
import { map } from '../../map/core/MapView';
import useSettingsStyles from '../../common/theme/useSettingsStyles';
import fetchOrThrow from '../../common/util/fetchOrThrow';

const UserPage = () => {
  const { classes } = useSettingsStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const manager = useManager();
  const fixedEmail = useRestriction('fixedEmail');

  const currentUser = useSelector((state) => state.session?.user);
  const registrationEnabled = useSelector((state) => state.session?.server?.registration);
  const openIdForced = useSelector((state) => state.session?.server?.openIdForce);
  const totpEnable = useSelector((state) => state.session?.server?.attributes?.totpEnable);
  const totpForce = useSelector((state) => state.session?.server?.attributes?.totpForce);

  const mapStyles = useMapStyles();
  const commonUserAttributes = useCommonUserAttributes(t);
  const userAttributes = useUserAttributes(t);

  const { id } = useParams();
  const [item, setItem] = useState(currentUser && id === currentUser.id?.toString() ? currentUser : null);

  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeToken, setRevokeToken] = useState('');

  const handleDelete = useCatch(async () => {
    if (currentUser && deleteEmail === currentUser.email) {
      setDeleteFailed(false);
      await fetchOrThrow(`/api/users/${currentUser.id}`, { method: 'DELETE' });
      
      localStorage.removeItem('userToken');
      localStorage.removeItem('impersonated_user_id');
      localStorage.removeItem('impersonated_user_email');
      window.sessionStorage.removeItem('postLogin');
      
      if (devicesActions?.selectId) dispatch(devicesActions.selectId(null));
      dispatch(sessionActions.updateUser(null));
      navigate('/login', { replace: true });
    } else {
      setDeleteFailed(true);
    }
  });

  const handleGenerateTotp = useCatch(async () => {
    const response = await fetchOrThrow('/api/users/totp', { method: 'POST' });
    setItem({ ...item, totpKey: await response.text() });
  });

  const closeRevokeDialog = () => {
    setRevokeDialogOpen(false);
    setRevokeToken('');
  };

  const handleRevokeToken = useCatch(async () => {
    await fetchOrThrow('/api/session/token/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: revokeToken }).toString(),
    });
    closeRevokeDialog();
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const attribute = searchParams.get('attribute');

  useEffect(() => {
    if (item && attribute) {
      const currentAttrs = item.attributes || {};
      if (!Object.prototype.hasOwnProperty.call(currentAttrs, attribute)) {
        setItem({ ...item, attributes: { ...currentAttrs, [attribute]: '' } });

        const newParams = new URLSearchParams(searchParams);
        newParams.delete('attribute');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [item, searchParams, setSearchParams, attribute]);

  const onItemSaved = (result) => {
    if (currentUser && result.id === currentUser.id) {
      dispatch(sessionActions.updateUser(result));
    }
  };

  const validate = () =>
    Boolean(
      item &&
      item.name &&
      item.email &&
      (item.id || item.password || openIdForced) &&
      (admin || !totpForce || item.totpKey)
    );

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      backgroundColor: '#f8fafc',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#00ab8e' },
      '&.Mui-focused fieldset': { borderColor: '#00ab8e' },
    },
  };

  const accordionStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px !important',
    border: '1px solid #e2e8f0',
    boxShadow: 'none',
    mb: 2,
    width: '100% !important',
    maxWidth: '100% !important',
    minWidth: 0,
    overflow: 'hidden',
    '&:before': { display: 'none' },
  };

  return (
    <Box sx={{ width: '100% !important', maxWidth: '100% !important', minWidth: 0, flex: 1, p: { xs: 2, sm: 3 } }}>
      <EditItemView
        endpoint="users"
        item={item}
        setItem={setItem}
        defaultItem={admin ? { deviceLimit: -1 } : {}}
        validate={validate}
        onItemSaved={onItemSaved}
        menu={null}
        breadcrumbs={['settingsTitle', 'settingsUser']}
      >
        {item && (
          <Box sx={{ width: '100% !important', maxWidth: '100% !important', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Required Account Information */}
            <Accordion defaultExpanded={!attribute} sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00ab8e' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ color: '#00ab8e', fontSize: '20px' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                    {t('sharedRequired')}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, p: 2.5, pt: 1 }}>
                <TextField
                  value={item.name || ''}
                  onChange={(e) => setItem({ ...item, name: e.target.value })}
                  label={t('sharedName')}
                  fullWidth
                  size="small"
                  sx={inputStyle}
                />
                <TextField
                  value={item.email || ''}
                  onChange={(e) => setItem({ ...item, email: e.target.value })}
                  label={t('userEmail')}
                  disabled={Boolean(fixedEmail && currentUser && item.id === currentUser.id)}
                  fullWidth
                  size="small"
                  sx={inputStyle}
                />
                {!openIdForced && (
                  <PasswordField
                    onChange={(e) => setItem({ ...item, password: e.target.value })}
                    label={t('userPassword')}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                )}
                {totpEnable && (
                  <FormControl fullWidth size="small" sx={inputStyle}>
                    <InputLabel>{t('loginTotpKey')}</InputLabel>
                    <OutlinedInput
                      readOnly
                      label={t('loginTotpKey')}
                      value={item.totpKey || ''}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end" onClick={handleGenerateTotp} sx={{ color: '#00ab8e' }}>
                            <CachedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={() => setItem({ ...item, totpKey: null })}
                            sx={{ color: '#ef4444' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </FormControl>
                )}
              </AccordionDetails>
            </Accordion>

            {/* User Preferences */}
            <Accordion sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00ab8e' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TuneIcon sx={{ color: '#00ab8e', fontSize: '20px' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                    {t('sharedPreferences')}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, p: 2.5, pt: 1 }}>
                <TextField
                  value={item.phone || ''}
                  onChange={(e) => setItem({ ...item, phone: e.target.value })}
                  label={t('sharedPhone')}
                  fullWidth
                  size="small"
                  sx={inputStyle}
                />
                <FormControl fullWidth size="small" sx={inputStyle}>
                  <InputLabel>{t('mapDefault')}</InputLabel>
                  <Select
                    label={t('mapDefault')}
                    value={item.map || 'locationIqStreets'}
                    onChange={(e) => setItem({ ...item, map: e.target.value })}
                  >
                    {mapStyles
                      .filter((style) => style.available)
                      .map((style) => (
                        <MenuItem key={style.id} value={style.id}>
                          <Typography component="span" sx={{ fontSize: '0.84rem' }}>{style.title}</Typography>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={inputStyle}>
                  <InputLabel>{t('settingsCoordinateFormat')}</InputLabel>
                  <Select
                    label={t('settingsCoordinateFormat')}
                    value={item.coordinateFormat || 'dd'}
                    onChange={(e) => setItem({ ...item, coordinateFormat: e.target.value })}
                  >
                    <MenuItem value="dd">{t('sharedDecimalDegrees')}</MenuItem>
                    <MenuItem value="ddm">{t('sharedDegreesDecimalMinutes')}</MenuItem>
                    <MenuItem value="dms">{t('sharedDegreesMinutesSeconds')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={inputStyle}>
                  <InputLabel>{t('settingsSpeedUnit')}</InputLabel>
                  <Select
                    label={t('settingsSpeedUnit')}
                    value={(item.attributes && item.attributes.speedUnit) || 'kmh'}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        attributes: { ...(item.attributes || {}), speedUnit: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="kn">{t('sharedKn')}</MenuItem>
                    <MenuItem value="kmh">{t('sharedKmh')}</MenuItem>
                    <MenuItem value="mph">{t('sharedMph')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={inputStyle}>
                  <InputLabel>{t('settingsDistanceUnit')}</InputLabel>
                  <Select
                    label={t('settingsDistanceUnit')}
                    value={(item.attributes && item.attributes.distanceUnit) || 'km'}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        attributes: { ...(item.attributes || {}), distanceUnit: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="km">{t('sharedKm')}</MenuItem>
                    <MenuItem value="mi">{t('sharedMi')}</MenuItem>
                    <MenuItem value="nmi">{t('sharedNmi')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={inputStyle}>
                  <InputLabel>{t('settingsAltitudeUnit')}</InputLabel>
                  <Select
                    label={t('settingsAltitudeUnit')}
                    value={(item.attributes && item.attributes.altitudeUnit) || 'm'}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        attributes: { ...(item.attributes || {}), altitudeUnit: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="m">{t('sharedMeters')}</MenuItem>
                    <MenuItem value="ft">{t('sharedFeet')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={inputStyle}>
                  <InputLabel>{t('settingsVolumeUnit')}</InputLabel>
                  <Select
                    label={t('settingsVolumeUnit')}
                    value={(item.attributes && item.attributes.volumeUnit) || 'ltr'}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        attributes: { ...(item.attributes || {}), volumeUnit: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="ltr">{t('sharedLiter')}</MenuItem>
                    <MenuItem value="usGal">{t('sharedUsGallon')}</MenuItem>
                    <MenuItem value="impGal">{t('sharedImpGallon')}</MenuItem>
                  </Select>
                </FormControl>
                <SelectField
                  value={item.attributes && item.attributes.timezone}
                  onChange={(e) =>
                    setItem({ ...item, attributes: { ...(item.attributes || {}), timezone: e.target.value } })
                  }
                  endpoint="/api/server/timezones"
                  keyGetter={(it) => it}
                  titleGetter={(it) => it}
                  label={t('sharedTimezone')}
                  fullWidth
                  size="small"
                  sx={inputStyle}
                />
                <TextField
                  value={item.poiLayer || ''}
                  onChange={(e) => setItem({ ...item, poiLayer: e.target.value })}
                  label={t('mapPoiLayer')}
                  fullWidth
                  size="small"
                  sx={inputStyle}
                />
              </AccordionDetails>
            </Accordion>

            {/* Map Center / Location */}
            <Accordion sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00ab8e' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MyLocationIcon sx={{ color: '#00ab8e', fontSize: '20px' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                    {t('sharedLocation')}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5, pt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <TextField
                    type="number"
                    value={Number.isFinite(item.latitude) ? item.latitude : 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setItem({ ...item, latitude: Number.isFinite(val) ? val : 0 });
                    }}
                    label={t('positionLatitude')}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                  <TextField
                    type="number"
                    value={Number.isFinite(item.longitude) ? item.longitude : 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setItem({ ...item, longitude: Number.isFinite(val) ? val : 0 });
                    }}
                    label={t('positionLongitude')}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                  <TextField
                    type="number"
                    value={Number.isFinite(item.zoom) ? item.zoom : 5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setItem({ ...item, zoom: Number.isFinite(val) ? val : 5 });
                    }}
                    label={t('serverZoom')}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const center = map?.getCenter();
                    const currentZoom = map?.getZoom();
                    if (center) {
                      setItem({
                        ...item,
                        latitude: Number(center.lat.toFixed(6)),
                        longitude: Number(center.lng.toFixed(6)),
                        zoom: currentZoom ? Number(currentZoom.toFixed(1)) : item.zoom,
                      });
                    }
                  }}
                  sx={{
                    borderColor: '#00ab8e',
                    color: '#00ab8e',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    alignSelf: 'flex-start',
                    px: 3,
                    '&:hover': { backgroundColor: '#e6f7f5', borderColor: '#00ab8e' },
                  }}
                >
                  {t('mapCurrentLocation')}
                </Button>
              </AccordionDetails>
            </Accordion>

            {/* Permissions */}
            <Accordion sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00ab8e' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon sx={{ color: '#00ab8e', fontSize: '20px' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                    {t('sharedPermissions')}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5, pt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label={t('userExpirationTime')}
                    type="date"
                    value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                    onChange={(e) => {
                      if (e.target.value) {
                        setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                      }
                    }}
                    disabled={!manager}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                  <TextField
                    type="number"
                    value={Number.isFinite(item.deviceLimit) ? item.deviceLimit : 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setItem({ ...item, deviceLimit: Number.isFinite(val) ? val : 0 });
                    }}
                    label={t('userDeviceLimit')}
                    disabled={!admin}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                  <TextField
                    type="number"
                    value={Number.isFinite(item.userLimit) ? item.userLimit : 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setItem({ ...item, userLimit: Number.isFinite(val) ? val : 0 });
                    }}
                    label={t('userUserLimit')}
                    disabled={!admin}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setRevokeDialogOpen(true)}
                  sx={{
                    borderColor: '#00ab8e',
                    color: '#00ab8e',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    alignSelf: 'flex-start',
                    px: 3,
                    '&:hover': { backgroundColor: '#e6f7f5', borderColor: '#00ab8e' },
                  }}
                >
                  {t('userRevokeToken')}
                </Button>
                <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, pt: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(item.disabled)}
                        onChange={(e) => setItem({ ...item, disabled: e.target.checked })}
                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#ef4444' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{t('sharedDisabled')}</Typography>}
                    disabled={!manager}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(item.administrator)}
                        onChange={(e) => setItem({ ...item, administrator: e.target.checked })}
                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#00ab8e' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{t('userAdmin')}</Typography>}
                    disabled={!admin}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(item.readonly)}
                        onChange={(e) => setItem({ ...item, readonly: e.target.checked })}
                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#00ab8e' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{t('serverReadonly')}</Typography>}
                    disabled={!manager}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(item.deviceReadonly)}
                        onChange={(e) => setItem({ ...item, deviceReadonly: e.target.checked })}
                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#00ab8e' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{t('userDeviceReadonly')}</Typography>}
                    disabled={!manager}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(item.limitCommands)}
                        onChange={(e) => setItem({ ...item, limitCommands: e.target.checked })}
                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#00ab8e' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{t('userLimitCommands')}</Typography>}
                    disabled={!manager}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(item.disableReports)}
                        onChange={(e) => setItem({ ...item, disableReports: e.target.checked })}
                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#00ab8e' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{t('userDisableReports')}</Typography>}
                    disabled={!manager}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(item.fixedEmail)}
                        onChange={(e) => setItem({ ...item, fixedEmail: e.target.checked })}
                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#00ab8e' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{t('userFixedEmail')}</Typography>}
                    disabled={!manager}
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Custom Attributes Accordion */}
            <EditAttributesAccordion
              attribute={attribute}
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{ ...commonUserAttributes, ...userAttributes }}
              focusAttribute={attribute}
            />

            {/* Danger Zone: Delete Account */}
            {registrationEnabled && currentUser && item.id === currentUser.id && !manager && (
              <Accordion sx={{ ...accordionStyle, border: '1px solid #fecaca' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ef4444' }} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberRoundedIcon sx={{ color: '#ef4444', fontSize: '20px' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#ef4444' }}>
                      {t('userDeleteAccount')}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5, pt: 1 }}>
                  <TextField
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    label={t('userEmail')}
                    error={deleteFailed}
                    helperText={deleteFailed ? 'Email address does not match your account email.' : ''}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                    startIcon={<DeleteForeverIcon />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      alignSelf: 'flex-start',
                      px: 3,
                    }}
                  >
                    {t('userDeleteAccount')}
                  </Button>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        {/* Token Revocation Modal */}
        <Dialog open={revokeDialogOpen} onClose={closeRevokeDialog} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              value={revokeToken}
              onChange={(e) => setRevokeToken(e.target.value)}
              label={t('userToken')}
              autoFocus
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={closeRevokeDialog} sx={{ textTransform: 'none', color: '#64748b' }}>
              {t('sharedCancel')}
            </Button>
            <Button
              onClick={handleRevokeToken}
              disabled={!revokeToken}
              variant="contained"
              sx={{
                backgroundColor: '#00ab8e',
                color: '#ffffff',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { backgroundColor: '#008f77' },
              }}
            >
              {t('userRevokeToken')}
            </Button>
          </DialogActions>
        </Dialog>
      </EditItemView>
    </Box>
  );
};

export default UserPage;