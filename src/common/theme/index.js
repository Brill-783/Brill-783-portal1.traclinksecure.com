import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';

export default (server, darkMode, direction) => {
  const dynamicPalette = palette(server, darkMode);
  const primaryColor = dynamicPalette.primary.main;
  const buttonColor = dynamicPalette.themeColors?.button || primaryColor;

  return createTheme({
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
      fontSize: 12,
      htmlFontSize: 16,
      body1: { fontSize: '12px', lineHeight: 1.45, fontWeight: 400 },
      body2: { fontSize: '12px', lineHeight: 1.4, fontWeight: 400 },
      button: { fontSize: '12px', fontWeight: 500, lineHeight: 1.4, textTransform: 'none' },
      caption: { fontSize: '12px', fontWeight: 400, lineHeight: 1.35 },
      subtitle1: { fontSize: '12px', fontWeight: 600, lineHeight: 1.4 },
      subtitle2: { fontSize: '12px', fontWeight: 500, lineHeight: 1.35 },
      overline: { fontSize: '12px', fontWeight: 600, lineHeight: 1.2 },
      h1: { fontSize: '16px', fontWeight: 600, lineHeight: 1.2 },
      h2: { fontSize: '15px', fontWeight: 600, lineHeight: 1.25 },
      h3: { fontSize: '14px', fontWeight: 600, lineHeight: 1.3 },
      h4: { fontSize: '13px', fontWeight: 600, lineHeight: 1.35 },
      h5: { fontSize: '12px', fontWeight: 600, lineHeight: 1.35 },
      h6: { fontSize: '12px', fontWeight: 600, lineHeight: 1.4 },
    },
    palette: dynamicPalette,
    direction,
    dimensions,
    components: {
      ...components,
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
          },
          containedPrimary: {
            backgroundColor: buttonColor,
            color: '#ffffff',
            '&:hover': {
              filter: 'brightness(0.92)',
              backgroundColor: buttonColor,
            },
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: `${primaryColor} !important`,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            fontSize: '0.85rem',
            '& fieldset': {
              borderColor: '#cbd5e1',
            },
            '&:hover fieldset': {
              borderColor: primaryColor,
            },
            '&.Mui-focused fieldset': {
              borderColor: primaryColor,
              borderWidth: '1.5px',
            },
          },
          input: {
            padding: '8px 12px',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            maxWidth: '100% !important',
            width: '100% !important',
            paddingLeft: '0px !important',
            paddingRight: '0px !important',
            marginLeft: '0px !important',
            marginRight: '0px !important',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            backgroundImage: 'none',
            boxSizing: 'border-box !important',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            width: '100% !important',
            maxWidth: '100% !important',
            boxSizing: 'border-box !important',
          },
        },
      },
    },
  });
};