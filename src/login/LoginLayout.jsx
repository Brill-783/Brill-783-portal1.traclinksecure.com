import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useSelector, shallowEqual } from 'react-redux';
import SensorsIcon from '@mui/icons-material/Sensors';

const FONT_FAMILY = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const useStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    minHeight: '100dvh',
    height: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#021814',
    boxSizing: 'border-box',
    padding: theme.spacing(2),
    position: 'relative',
    fontFamily: FONT_FAMILY,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    overflowX: 'hidden',
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      padding: '16px 12px',
    },
  },

  backdropOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.18) 0%, rgba(2, 24, 20, 0.5) 70%, rgba(2, 24, 20, 0.9) 100%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  centerWrapper: {
    width: '100%',
    maxWidth: '430px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
    boxSizing: 'border-box',
  },

  cardPaper: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    border: 'none',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
    padding: '36px 36px 32px 36px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      padding: '26px 20px 24px 20px',
      borderRadius: '20px',
    },
    '@media (max-width: 360px)': {
      padding: '22px 14px',
    },
  },

  // Crisp, clear border line separating the logo from inputs
  logoContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '24px',
    marginBottom: '26px',
    borderBottom: '1.5px solid #e2e8f0',
    minHeight: '34px',
    [theme.breakpoints.down('sm')]: {
      paddingBottom: '18px',
      marginBottom: '20px',
      minHeight: '28px',
      borderBottom: '1.2px solid #e2e8f0',
    },
  },

  logoImg: {
    height: '34px',
    maxHeight: '34px',
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
    display: 'block',
    opacity: 0.95,
    imageRendering: '-webkit-optimize-contrast',
    [theme.breakpoints.down('sm')]: {
      height: '28px',
      maxHeight: '28px',
    },
  },

  brandFallback: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    height: '34px',
    maxWidth: '100%',
    opacity: 0.95,
    [theme.breakpoints.down('sm')]: {
      height: '28px',
      gap: '8px',
    },
  },

  brandText: {
    fontFamily: FONT_FAMILY,
    fontWeight: 800,
    fontSize: '22px',
    lineHeight: '34px',
    letterSpacing: '1px',
    color: '#0f172a',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      fontSize: '18px',
      lineHeight: '28px',
    },
  },

  contentWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },

  bottomMessageText: {
    width: '100%',
    marginTop: '12px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    wordBreak: 'break-word',
    color: '#ffffff',
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.95)',
    fontFamily: FONT_FAMILY,
    lineHeight: 1.4,
    padding: '0 12px',
    boxSizing: 'border-box',
    [theme.breakpoints.down('sm')]: {
      fontSize: '11px',
      marginTop: '10px',
    },
  },
}));

const LoginLayout = ({ children, headerActions }) => {
  const { classes } = useStyles();

  const server = useSelector((state) => state.session?.server, shallowEqual) || {};
  const attributes = server?.attributes || {};

  const rawLogo = attributes.loginLogo || attributes.frontpageLogo || attributes.logo || '';
  const loginLogo = (rawLogo && !rawLogo.startsWith('/api/server/file')) ? rawLogo : '';

  const rawBg = attributes.backgroundImage || '';
  const backgroundImage = (rawBg && !rawBg.startsWith('/api/server/file')) ? rawBg : '';

  const welcomeText = attributes.welcomeText || 'Secure • Reliable • Real-Time Tracking';
  const loginBgColor = attributes.loginBgColor || '#021814';
  const loginTextColor = attributes.loginTextColor || '#ffffff';
  const titleText = attributes.titleText || 'TRACKLINK';

  return (
    <main
      className={classes.root}
      style={{
        backgroundColor: loginBgColor,
        backgroundImage: backgroundImage ? `url("${backgroundImage}")` : 'none',
      }}
    >
      <div className={classes.backdropOverlay} />

      {headerActions}

      <Box className={classes.centerWrapper}>
        <Paper className={classes.cardPaper}>
          <Box className={classes.logoContainer}>
            {loginLogo ? (
              <img 
                src={loginLogo} 
                alt="Logo" 
                className={classes.logoImg}
              />
            ) : (
              <Box className={classes.brandFallback}>
                <SensorsIcon sx={{ color: '#00a79d', fontSize: { xs: '26px', sm: '30px' } }} />
                <Typography className={classes.brandText}>
                  {titleText}
                </Typography>
              </Box>
            )}
          </Box>

          <Box className={classes.contentWrapper}>
            {children}
          </Box>
        </Paper>

        {welcomeText && (
          <Typography
            className={classes.bottomMessageText}
            style={{ color: loginTextColor }}
          >
            {welcomeText}
          </Typography>
        )}
      </Box>
    </main>
  );
};

export default LoginLayout;