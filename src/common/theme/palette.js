const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

const BRAND_TEAL = '#00ab8e';
const BRAND_TEAL_DARK = '#008f77';
const BRAND_TEAL_LIGHT = '#e6f7f5';

export default (server, darkMode) => {
  const attributes = server?.attributes || {};

  const primaryColor =
    validatedColor(attributes.colorPrimary) ||
    validatedColor(attributes.color) ||
    (darkMode ? '#2dd4bf' : BRAND_TEAL);

  const secondaryColor =
    validatedColor(attributes.colorSecondary) ||
    (darkMode ? '#34d399' : '#10b981');

  return {
    mode: darkMode ? 'dark' : 'light',
    background: {
      default: darkMode ? '#0f172a' : '#f8fafc',
      paper: darkMode ? '#1e293b' : '#ffffff',
    },
    primary: {
      main: primaryColor,
      dark: BRAND_TEAL_DARK,
      light: BRAND_TEAL_LIGHT,
      contrastText: '#ffffff',
    },
    secondary: {
      main: secondaryColor,
      contrastText: '#ffffff',
    },
    neutral: {
      main: darkMode ? '#94a3b8' : '#64748b',
    },
    geometry: {
      main: primaryColor,
    },
    alwaysDark: {
      main: '#0f172a',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#22c55e',
    },
    text: {
      primary: darkMode ? '#f1f5f9' : '#0f172a',
      secondary: darkMode ? '#cbd5e1' : '#64748b',
    },
    divider: darkMode ? '#334155' : '#e2e8f0',
    themeColors: {
      primary: primaryColor,
      primaryDark: BRAND_TEAL_DARK,
      primaryLight: BRAND_TEAL_LIGHT,
      sidebar: attributes.sidebarColor || '#ffffff',
      header: attributes.headerColor || '#ffffff',
      button: attributes.buttonColor || primaryColor,
      tableHeaderBg: darkMode ? '#1e293b' : '#f8fafc',
      tableHeaderBorder: primaryColor,
    },
  };
};