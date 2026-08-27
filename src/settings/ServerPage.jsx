import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Divider,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import RefreshIcon from '@mui/icons-material/Refresh';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { sessionActions } from '../store';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';

const FONT_FAMILY = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const DEFAULT_PRIMARY = '#00a79d';
const DEFAULT_PRIMARY_DARK = '#008f86';
const DEFAULT_SIDEBAR = '#ffffff';
const DEFAULT_HEADER = '#ffffff';
const DEFAULT_SECONDARY = '#ffffff';
const DEFAULT_BUTTON = '#00a79d';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const BORDER = '#cbd5e1';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const MEDIA_CONFIG = [
  { key: 'frontpageLogo', title: 'Header Logo', maxW: 120, maxH: 30 },
  { key: 'favicon', title: 'Favicon', maxW: 32, maxH: 32 },
  { key: 'loginLogo', title: 'Login Logo', maxW: 120, maxH: 30 },
  { key: 'backgroundImage', title: 'Login Wallpaper / URL', maxW: 160, maxH: 90 },
];

const THEME_KEYS = ['colorPrimary', 'color', 'colorSecondary', 'sidebarColor', 'headerColor', 'buttonColor'];
const TEXT_KEYS = ['titleText', 'welcomeText', 'bottomText'];
const LOGIN_KEYS = ['registrationEnabled', 'loginTextColor', 'loginBgColor', 'loginPanelBgColor', 'loginPanelTransparency'];
const MEDIA_KEYS = ['frontpageLogo', 'favicon', 'loginLogo', 'backgroundImage', 'brandingUpdatedAt'];

const showAlertModal = (icon, title, text) => {
  Swal.fire({
    target: document.body,
    icon,
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
    customClass: {
      container: 'swal-top-layer',
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = '9999999';
      }
    },
  });
};

const optimizeImageFile = (file, maxW = 120, maxH = 30) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.max(1, Math.round(w * ratio));
        h = Math.max(1, Math.round(h * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, w, h);

        // Compress using WebP/JPEG or compact PNG to ensure size stays under safe threshold
        let dataUrl = canvas.toDataURL('image/webp', 0.65);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

const applyLiveThemeToDOM = (colors) => {
  const root = document.documentElement;
  if (colors.primary) {
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--primary', colors.primary);
  }
  if (colors.sidebar) root.style.setProperty('--color-sidebar', colors.sidebar);
  if (colors.header) root.style.setProperty('--color-header', colors.header);
  if (colors.button) root.style.setProperty('--color-button', colors.button);
  if (colors.secondary) root.style.setProperty('--color-secondary', colors.secondary);
};

const useStyles = makeStyles()(() => ({
  root: {
    height: '100%',
    width: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: SURFACE_SOFT,
    overflow: 'hidden',
    fontFamily: FONT_FAMILY,
    boxSizing: 'border-box',
    padding: '16px',
    gap: '12px',
    fontSize: '12px',
    '&, & *': { fontFamily: `${FONT_FAMILY} !important` },
    '@media (max-width: 600px)': { padding: '10px 8px', gap: '8px' },
  },
}));

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': { width: '4px', height: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
};

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '7px', backgroundColor: SURFACE, fontSize: '12px' },
  '& .MuiInputLabel-root': { fontFamily: FONT_FAMILY, fontSize: '12px' },
  '& input': { fontSize: '12px', fontWeight: 500, color: TEXT, fontFamily: FONT_FAMILY },
};

export default function ServerPage() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const server = useSelector((state) => state.session?.server || {}, shallowEqual);
  const serverAttributes = server?.attributes || {};
  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';

  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mediaData, setMediaData] = useState({});

  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
  const [sidebarColor, setSidebarColor] = useState(DEFAULT_SIDEBAR);
  const [headerColor, setHeaderColor] = useState(DEFAULT_HEADER);
  const [buttonColor, setButtonColor] = useState(DEFAULT_BUTTON);
  const [titleText, setTitleText] = useState('');
  const [welcomeText, setWelcomeText] = useState('Secure • Reliable • Real-Time Tracking');
  const [bottomText, setBottomText] = useState('');
  const [loginTextColor, setLoginTextColor] = useState('#ffffff');
  const [loginBgColor, setLoginBgColor] = useState('#031c17');
  const [loginPanelBgColor, setLoginPanelBgColor] = useState('#ffffff');
  const [loginPanelTransparency, setLoginPanelTransparency] = useState(100);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [attributesList, setAttributesList] = useState([]);
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');

  useEffect(() => {
    const p = serverAttributes.colorPrimary || serverAttributes.color || DEFAULT_PRIMARY;
    const s = serverAttributes.colorSecondary || DEFAULT_SECONDARY;
    const sb = serverAttributes.sidebarColor || DEFAULT_SIDEBAR;
    const h = serverAttributes.headerColor || DEFAULT_HEADER;
    const b = serverAttributes.buttonColor || DEFAULT_BUTTON;

    setPrimaryColor(p);
    setSecondaryColor(s);
    setSidebarColor(sb);
    setHeaderColor(h);
    setButtonColor(b);
    setTitleText(serverAttributes.titleText || '');
    setWelcomeText(serverAttributes.welcomeText || 'Secure • Reliable • Real-Time Tracking');
    setBottomText(serverAttributes.bottomText || '');
    setLoginTextColor(serverAttributes.loginTextColor || '#ffffff');
    setLoginBgColor(serverAttributes.loginBgColor || '#031c17');
    setLoginPanelBgColor(serverAttributes.loginPanelBgColor || '#ffffff');
    setLoginPanelTransparency(serverAttributes.loginPanelTransparency !== undefined ? Number(serverAttributes.loginPanelTransparency) : 100);
    setRegistrationEnabled(serverAttributes.registrationEnabled !== undefined ? Boolean(serverAttributes.registrationEnabled) : true);

    const loaded = {};
    MEDIA_CONFIG.forEach(({ key }) => {
      const val = serverAttributes[key];
      loaded[key] = (val && !val.startsWith('/api/server/file')) ? val : '';
    });
    setMediaData(loaded);

    applyLiveThemeToDOM({ primary: p, sidebar: sb, header: h, button: b, secondary: s });
    document.title = serverAttributes.titleText || document.title;

    const customAttrs = Object.entries(serverAttributes)
      .filter(([key]) =>
        !MEDIA_KEYS.includes(key) &&
        !THEME_KEYS.includes(key) &&
        !TEXT_KEYS.includes(key) &&
        !LOGIN_KEYS.includes(key) &&
        key !== 'notificationTemplates' &&
        !key.endsWith('Version')
      )
      .map(([key, value]) => ({ key, value: String(value) }));

    setAttributesList(customAttrs);
  }, [serverAttributes]);

  const updateServerAttributes = async (attributes) => {
    const sanitized = { ...attributes };
    [
      'frontpageLogoVersion',
      'faviconVersion',
      'loginLogoVersion',
      'backgroundImageVersion',
      'brandingUpdatedAt'
    ].forEach((k) => delete sanitized[k]);

    Object.keys(sanitized).forEach((k) => {
      if (typeof sanitized[k] === 'string' && sanitized[k].startsWith('/api/server/file')) {
        delete sanitized[k];
      }
    });

    const payloadJson = JSON.stringify(sanitized);
    if (payloadJson.length > 3800) {
      throw new Error(`Branding attributes payload exceeds safe database column limit (${payloadJson.length} bytes / 3800 max). Please use direct image URLs or smaller images.`);
    }

    const response = await fetchOrThrow('/api/server', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: server.id || 1,
        registration: server.registration || false,
        readonly: server.readonly || false,
        deviceReadonly: server.deviceReadonly || false,
        map: server.map || 'osm',
        latitude: server.latitude || 0,
        longitude: server.longitude || 0,
        zoom: server.zoom || 0,
        forceSettings: server.forceSettings || false,
        coordinateFormat: server.coordinateFormat || 'deg',
        attributes: sanitized,
      }),
    });

    const updatedServer = await response.json();
    dispatch(sessionActions.updateServer(updatedServer));
    return updatedServer;
  };

  const handleColorChange = (type, value) => {
    if (type === 'primary') { setPrimaryColor(value); applyLiveThemeToDOM({ primary: value }); }
    if (type === 'sidebar') { setSidebarColor(value); applyLiveThemeToDOM({ sidebar: value }); }
    if (type === 'header') { setHeaderColor(value); applyLiveThemeToDOM({ header: value }); }
    if (type === 'button') { setButtonColor(value); applyLiveThemeToDOM({ button: value }); }
    if (type === 'secondary') { setSecondaryColor(value); applyLiveThemeToDOM({ secondary: value }); }
  };

  const handleImageSelect = async (key, event, maxW, maxH) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await optimizeImageFile(file, maxW, maxH);
      setMediaData((prev) => ({ ...prev, [key]: base64 }));
    } catch {
      showAlertModal('error', 'Error', 'Failed to process image file.');
    }
  };

  const handleSaveMedia = useCatch(async () => {
    setSaving(true);
    try {
      const nextAttributes = {
        ...serverAttributes,
        ...mediaData,
      };

      const updated = await updateServerAttributes(nextAttributes);
      
      const loaded = {};
      MEDIA_CONFIG.forEach(({ key }) => {
        loaded[key] = updated.attributes?.[key] || '';
      });
      setMediaData(loaded);

      showAlertModal('success', 'Saved', 'Logo and media updated successfully.');
    } finally {
      setSaving(false);
    }
  });

  const handleRemoveMedia = (key) => {
    setMediaData((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSaveThemeAndTexts = useCatch(async () => {
    setSaving(true);
    try {
      const updatedAttributes = {
        ...serverAttributes,
        colorPrimary: primaryColor,
        color: primaryColor,
        colorSecondary: secondaryColor,
        sidebarColor,
        headerColor,
        buttonColor,
        titleText,
        welcomeText,
        bottomText,
      };

      await updateServerAttributes(updatedAttributes);
      applyLiveThemeToDOM({ primary: primaryColor, sidebar: sidebarColor, header: headerColor, button: buttonColor, secondary: secondaryColor });
      document.title = titleText || document.title;
      showAlertModal('success', 'Saved', 'Theme and display texts applied.');
    } finally {
      setSaving(false);
    }
  });

  const handleResetTheme = useCatch(async () => {
    setSaving(true);
    try {
      const nonThemeAttrs = {};
      Object.entries(serverAttributes).forEach(([k, v]) => {
        if (
          !THEME_KEYS.includes(k) &&
          !TEXT_KEYS.includes(k) &&
          !LOGIN_KEYS.includes(k) &&
          !MEDIA_KEYS.includes(k) &&
          k !== 'notificationTemplates' &&
          !k.endsWith('Version')
        ) {
          nonThemeAttrs[k] = v;
        }
      });

      const resetAttributes = {
        ...nonThemeAttrs,
        colorPrimary: DEFAULT_PRIMARY,
        color: DEFAULT_PRIMARY,
        colorSecondary: DEFAULT_SECONDARY,
        sidebarColor: DEFAULT_SIDEBAR,
        headerColor: DEFAULT_HEADER,
        buttonColor: DEFAULT_BUTTON,
        titleText: '',
        welcomeText: 'Secure • Reliable • Real-Time Tracking',
        bottomText: '',
        loginTextColor: '#ffffff',
        loginBgColor: '#031c17',
        loginPanelBgColor: '#ffffff',
        loginPanelTransparency: 100,
        registrationEnabled: true,
        frontpageLogo: '',
        favicon: '',
        loginLogo: '',
        backgroundImage: '',
      };

      await updateServerAttributes(resetAttributes);

      setPrimaryColor(DEFAULT_PRIMARY);
      setSecondaryColor(DEFAULT_SECONDARY);
      setSidebarColor(DEFAULT_SIDEBAR);
      setHeaderColor(DEFAULT_HEADER);
      setButtonColor(DEFAULT_BUTTON);
      setTitleText('');
      setWelcomeText('Secure • Reliable • Real-Time Tracking');
      setBottomText('');
      setLoginTextColor('#ffffff');
      setLoginBgColor('#031c17');
      setLoginPanelBgColor('#ffffff');
      setLoginPanelTransparency(100);
      setRegistrationEnabled(true);
      setMediaData({
        frontpageLogo: '',
        favicon: '',
        loginLogo: '',
        backgroundImage: '',
      });

      applyLiveThemeToDOM({
        primary: DEFAULT_PRIMARY,
        sidebar: DEFAULT_SIDEBAR,
        header: DEFAULT_HEADER,
        button: DEFAULT_BUTTON,
        secondary: DEFAULT_SECONDARY,
      });

      showAlertModal('success', 'Reset Complete', 'All appearance and login settings restored to default.');
    } finally {
      setSaving(false);
    }
  });

  const handleSaveLoginCustomization = useCatch(async () => {
    setSaving(true);
    try {
      const updatedAttributes = {
        ...serverAttributes,
        loginTextColor,
        loginBgColor,
        loginPanelBgColor,
        loginPanelTransparency,
        registrationEnabled,
        welcomeText,
      };

      await updateServerAttributes(updatedAttributes);
      showAlertModal('success', 'Saved', 'Login appearance saved.');
    } finally {
      setSaving(false);
    }
  });

  const handleAddAttribute = () => {
    const key = attrKey.trim();
    const value = attrValue.trim();
    if (!key || !value) return;
    setAttributesList((current) => {
      const filtered = current.filter((item) => item.key !== key);
      return [...filtered, { key, value }];
    });
    setAttrKey('');
    setAttrValue('');
  };

  const handleDeleteAttribute = (index) => {
    setAttributesList((current) => current.filter((_, i) => i !== index));
  };

  const handleSaveAttributes = useCatch(async () => {
    setSaving(true);
    try {
      const merged = { ...serverAttributes };
      attributesList.forEach(({ key, value }) => { merged[key] = value; });
      await updateServerAttributes(merged);
      showAlertModal('success', 'Saved', 'Server attributes updated.');
    } finally {
      setSaving(false);
    }
  });

  const primaryButtonSx = {
    height: '36px',
    px: 2.5,
    borderRadius: '7px',
    backgroundColor: `${buttonColor} !important`,
    color: '#ffffff !important',
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '12px',
    boxShadow: 'none',
    '&:hover': { backgroundColor: `${primaryDarkColor(buttonColor)} !important`, boxShadow: 'none' },
  };

  return (
    <Box className={classes.root}>
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettingsOutlinedIcon sx={{ color: primaryColor, fontSize: 22 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '15px', color: TEXT }}>Server Settings</Typography>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: '36px',
            backgroundColor: SURFACE,
            borderRadius: '8px',
            border: `1px solid ${BORDER}`,
            p: 0.3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12px',
              color: TEXT_SECONDARY,
              minHeight: '30px',
              borderRadius: '6px',
              px: 2,
              fontFamily: FONT_FAMILY,
            },
            '& .Mui-selected': { color: '#ffffff !important', backgroundColor: `${primaryColor} !important` },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          <Tab icon={<PaletteOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Theme & Texts" />
          <Tab icon={<ImageIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Branding & Media" />
          <Tab icon={<TextFieldsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Login Screen" />
          <Tab icon={<SettingsSuggestOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Attributes" />
        </Tabs>
      </Box>

      <Box sx={{ flex: '1 1 auto', height: 0, minHeight: 0, overflowY: 'auto', ...scrollableSx }}>
        {activeTab === 0 && (
          <Paper elevation={0} sx={panelSx}>
            <Typography sx={sectionTitleSx}>Color Palette</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {[
                { label: 'Primary Brand', type: 'primary', val: primaryColor },
                { label: 'Sidebar Background', type: 'sidebar', val: sidebarColor },
                { label: 'Header Background', type: 'header', val: headerColor },
                { label: 'Buttons & Accents', type: 'button', val: buttonColor },
              ].map(({ label, type, val }) => (
                <Box key={type} sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: TEXT_SECONDARY }}>{label}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input type="color" value={val} onChange={(e) => handleColorChange(type, e.target.value)} style={{ width: 36, height: 36, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                    <TextField size="small" fullWidth value={val} onChange={(e) => handleColorChange(type, e.target.value)} sx={inputSx} />
                  </Box>
                </Box>
              ))}
            </Box>

            <Divider />

            <Typography sx={sectionTitleSx}>System Display Texts</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Platform Title" size="small" fullWidth value={titleText} onChange={(e) => setTitleText(e.target.value)} sx={inputSx} />
              <TextField label="Welcome Message" size="small" fullWidth value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} sx={inputSx} />
            </Box>
            <TextField label="Footer Signature" size="small" fullWidth value={bottomText} onChange={(e) => setBottomText(e.target.value)} sx={inputSx} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, gap: 1 }}>
              <Button variant="outlined" disabled={saving} startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} onClick={handleResetTheme} sx={secondaryButtonSx}>
                Reset Defaults
              </Button>
              <Button variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />} onClick={handleSaveThemeAndTexts} sx={primaryButtonSx}>
                {saving ? 'Saving...' : 'Save Theme'}
              </Button>
            </Box>
          </Paper>
        )}

        {activeTab === 1 && (
          <Paper elevation={0} sx={panelSx}>
            <Box>
              <Typography sx={sectionTitleSx}>Logo & Media Assets</Typography>
              <Typography sx={{ mt: 0.4, fontSize: '11px', color: TEXT_SECONDARY }}>
                Uploaded images are saved securely inside the system attributes.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {MEDIA_CONFIG.map(({ key, title, maxW, maxH }) => {
                const imgStr = mediaData[key];

                return (
                  <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: SURFACE_SOFT }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>{title}</Typography>

                    <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', borderRadius: '6px', backgroundColor: SURFACE, overflow: 'hidden' }}>
                      {imgStr ? (
                        <img
                          src={imgStr}
                          alt={title}
                          style={{ maxHeight: 24, maxWidth: '90%', objectFit: 'contain', display: 'block' }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: '11px', color: TEXT_MUTED }}>No image</Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        placeholder="Image URL or upload"
                        value={imgStr || ''}
                        onChange={(e) => setMediaData((prev) => ({ ...prev, [key]: e.target.value }))}
                        sx={{ ...inputSx, flex: 1, fontSize: '11px' }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        component="label"
                        size="small"
                        startIcon={<PhotoCameraIcon sx={{ fontSize: 14 }} />}
                        sx={{ textTransform: 'none', fontSize: '11.5px', fontWeight: 700, color: buttonColor, borderColor: buttonColor }}
                      >
                        Upload & Compress
                        <input type="file" hidden accept="image/*" onChange={(e) => handleImageSelect(key, e, maxW, maxH)} />
                      </Button>

                      {imgStr && (
                        <IconButton size="small" onClick={() => handleRemoveMedia(key)} sx={{ color: '#ef4444' }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
              <Button
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
                onClick={handleSaveMedia}
                sx={primaryButtonSx}
              >
                {saving ? 'Saving...' : 'Save Media'}
              </Button>
            </Box>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper elevation={0} sx={panelSx}>
            <Typography sx={sectionTitleSx}>Login Appearance & Registration</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <ColorField label="Text Color" value={loginTextColor} onChange={setLoginTextColor} />
              <ColorField label="Backdrop Base Color" value={loginBgColor} onChange={setLoginBgColor} />
              <ColorField label="Card Background" value={loginPanelBgColor} onChange={setLoginPanelBgColor} />
            </Box>

            <TextField
              label="Card Opacity (%)"
              size="small"
              fullWidth
              type="number"
              value={loginPanelTransparency}
              onChange={(e) => setLoginPanelTransparency(Math.max(0, Math.min(100, Number(e.target.value))))}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              sx={inputSx}
            />

            <Box sx={{ p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>User Registration</Typography>
                <Typography sx={{ mt: 0.3, fontSize: '11px', color: TEXT_SECONDARY }}>Enable or disable the Create Account option on the login card.</Typography>
              </Box>
              <FormControlLabel
                sx={{ m: 0 }}
                control={<Switch checked={registrationEnabled} onChange={(e) => setRegistrationEnabled(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: buttonColor }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: buttonColor, opacity: 1 } }} />}
                label={registrationEnabled ? 'Registration Enabled' : 'Registration Disabled'}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />} onClick={handleSaveLoginCustomization} sx={primaryButtonSx}>
                {saving ? 'Saving...' : 'Save Appearance'}
              </Button>
            </Box>
          </Paper>
        )}

        {activeTab === 3 && (
          <Paper elevation={0} sx={panelSx}>
            <Typography sx={sectionTitleSx}>Custom Parameters</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField label="Key" size="small" placeholder="e.g. speedLimit" value={attrKey} onChange={(e) => setAttrKey(e.target.value)} sx={{ ...inputSx, flex: 1, minWidth: 160 }} />
              <TextField label="Value" size="small" placeholder="e.g. 120" value={attrValue} onChange={(e) => setAttrValue(e.target.value)} sx={{ ...inputSx, flex: 1, minWidth: 160 }} />
              <Button variant="outlined" startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={handleAddAttribute} sx={secondaryButtonSx}>Add Key</Button>
            </Box>

            <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '11.5px' }}>Key</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '11.5px' }}>Value</TableCell>
                    <TableCell align="center" sx={{ width: 80, fontWeight: 700, fontSize: '11.5px' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attributesList.length ? attributesList.map((item, index) => (
                    <TableRow key={`${item.key}-${index}`} hover>
                      <TableCell sx={{ fontWeight: 600, color: TEXT, fontSize: '12px' }}>{item.key}</TableCell>
                      <TableCell sx={{ color: TEXT_SECONDARY, fontSize: '12px' }}>{item.value}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteAttribute(index)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: TEXT_MUTED, fontSize: '12px' }}>No attributes configured</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />} onClick={handleSaveAttributes} sx={primaryButtonSx}>
                {saving ? 'Saving...' : 'Save Attributes'}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      <Box sx={{ mt: 'auto', pt: 1, px: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', width: '100%', flexShrink: 0, gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DnsOutlinedIcon sx={{ fontSize: 14, color: primaryColor }} />
            <span style={{ color: '#64748b', fontSize: 11.5 }}>Server:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: 11.5 }}>{serverHostIp}</strong>
          </Box>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: primaryColor }} />
            <span style={{ color: '#64748b', fontSize: 11.5 }}>Version:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: 11.5 }}>v{serverVersion}</strong>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', px: 1.2, py: 0.3, borderRadius: '20px' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#047857' }}>Server Core Online</span>
        </Box>
      </Box>
    </Box>
  );
}

const panelSx = {
  p: { xs: 2, sm: 2.5 },
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  backgroundColor: SURFACE,
  display: 'flex',
  flexDirection: 'column',
  gap: 2.5,
  width: '100%',
  boxSizing: 'border-box',
};

const sectionTitleSx = { fontWeight: 700, fontSize: '12px', color: TEXT };

const secondaryButtonSx = {
  height: '34px',
  px: 2.5,
  borderRadius: '7px',
  borderColor: BORDER,
  color: TEXT_SECONDARY,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '12px',
};

function ColorField({ label, value, onChange }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: TEXT_SECONDARY, mb: 0.6 }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 36, height: 36 }} />
        <TextField size="small" fullWidth value={value} onChange={(e) => onChange(e.target.value)} sx={inputSx} />
      </Box>
    </Box>
  );
}

function primaryDarkColor(color) {
  if (!color || !color.startsWith('#')) return DEFAULT_PRIMARY_DARK;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return DEFAULT_PRIMARY_DARK;
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 20);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 20);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 20);
  return `rgb(${r}, ${g}, ${b})`;
}