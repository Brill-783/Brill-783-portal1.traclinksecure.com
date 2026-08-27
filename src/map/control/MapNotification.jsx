import React, { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { createRoot } from 'react-dom/client';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { map } from '../core/MapView';

const useStyles = makeStyles()((theme) => ({
  button: {
    '&&': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569',
      transition: 'color 0.15s ease, background-color 0.15s ease',
      cursor: 'pointer',
      '&:hover': {
        color: '#00ab8e',
        backgroundColor: '#f0fdfa',
      },
    },
    '&&.active': {
      color: '#00ab8e',
      backgroundColor: '#f0fdfa',
    },
  },
}));

const MapNotification = ({ enabled, onClick }) => {
  const theme = useTheme();
  const { classes } = useStyles();

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const buttonRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    let container;
    const control = {
      onAdd: () => {
        container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `maplibregl-ctrl-icon ${classes.button}`;
        button.title = 'Notifications & Alerts';
        button.onclick = (e) => {
          e.stopPropagation();
          if (onClickRef.current) onClickRef.current();
        };
        container.appendChild(button);
        rootRef.current = createRoot(button);
        rootRef.current.render(
          enabled ? (
            <NotificationsActiveOutlinedIcon sx={{ fontSize: '18px', color: '#00ab8e' }} />
          ) : (
            <NotificationsNoneOutlinedIcon sx={{ fontSize: '18px' }} />
          )
        );
        buttonRef.current = button;
        return container;
      },
      onRemove: () => {
        if (rootRef.current) {
          const root = rootRef.current;
          queueMicrotask(() => root.unmount());
        }
        container?.remove();
      },
    };

    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => map.removeControl(control);
  }, [theme.direction, classes.button]);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.classList.toggle('active', Boolean(enabled));
      if (rootRef.current) {
        rootRef.current.render(
          enabled ? (
            <NotificationsActiveOutlinedIcon sx={{ fontSize: '18px', color: '#00ab8e' }} />
          ) : (
            <NotificationsNoneOutlinedIcon sx={{ fontSize: '18px' }} />
          )
        );
      }
    }
  }, [enabled]);

  return null;
};

export default MapNotification;