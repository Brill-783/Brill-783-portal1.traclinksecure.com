import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useDispatch, useSelector } from 'react-redux';
import { sessionActions } from './store';
import Loader from './common/components/Loader';

const FONT_FAMILY = "'Montserrat', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const PRIMARY = '#00a79d';
const PRIMARY_DARK = '#008f86';

const DEFAULT_FALLBACK_SERVER = {
  id: 1,
  registration: false,
  readonly: false,
  deviceReadonly: false,
  map: 'osm',
  zoom: 0,
  latitude: 0,
  longitude: 0,
  forceSettings: true,
  attributes: {},
};

const applyDynamicTheme = (attributes = {}) => {
  const root = document.documentElement;
  const primary = attributes.colorPrimary || attributes.color || PRIMARY;
  const sidebar = attributes.sidebarColor || '#ffffff';
  const header = attributes.headerColor || '#ffffff';
  const button = attributes.buttonColor || PRIMARY;
  const secondary = attributes.colorSecondary || '#ffffff';

  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--color-sidebar', sidebar);
  root.style.setProperty('--color-header', header);
  root.style.setProperty('--color-button', button);
  root.style.setProperty('--color-secondary', secondary);

  if (attributes.titleText) {
    document.title = attributes.titleText;
  }

  if (attributes.favicon) {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = attributes.favicon;
    }
  }
};

const ServerProvider = ({ children }) => {
  const dispatch = useDispatch();
  const initialized = useSelector((state) => Boolean(state.session?.server));
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const fetchServerInfo = async () => {
      try {
        const response = await fetch('/api/server', {
          signal: controller.signal,
          credentials: 'include',
        });

        if (!active || !isMountedRef.current) return;

        if (response.ok) {
          const data = await response.json();
          applyDynamicTheme(data.attributes || {});
          dispatch(sessionActions.updateServer(data));
          setError(null);
        } else {
          applyDynamicTheme(DEFAULT_FALLBACK_SERVER.attributes);
          dispatch(sessionActions.updateServer(DEFAULT_FALLBACK_SERVER));
          setError(null);
        }
      } catch (err) {
        if (!active || !isMountedRef.current) return;
        if (err.name !== 'AbortError') {
          applyDynamicTheme(DEFAULT_FALLBACK_SERVER.attributes);
          dispatch(sessionActions.updateServer(DEFAULT_FALLBACK_SERVER));
          setError(null);
        }
      }
    };

    fetchServerInfo();

    return () => {
      active = false;
      controller.abort();
    };
  }, [dispatch, retryCount]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#031c17',
          p: 2,
          fontFamily: FONT_FAMILY,
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            maxWidth: 420,
            width: '100%',
            p: 4,
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#dc2626', mb: 1, fontFamily: FONT_FAMILY }}>
            Server Connection Issue
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#64748b', mb: 3, lineHeight: 1.5, fontFamily: FONT_FAMILY }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setRetryCount((prev) => prev + 1)}
            startIcon={<ReplayIcon />}
            sx={{
              backgroundColor: `${PRIMARY} !important`,
              color: '#ffffff !important',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '24px',
              height: '44px',
              boxShadow: 'none',
              fontFamily: FONT_FAMILY,
              '&:hover': {
                backgroundColor: `${PRIMARY_DARK} !important`,
                boxShadow: 'none',
              },
            }}
          >
            Retry Connection
          </Button>
        </Box>
      </Box>
    );
  }

  if (!initialized) {
    return <Loader />;
  }

  return children;
};

export default ServerProvider;