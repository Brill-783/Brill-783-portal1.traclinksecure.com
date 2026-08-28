import './styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { CssBaseline, StyledEngineProvider, GlobalStyles } from '@mui/material';

import store from './store';
import { LocalizationProvider } from './common/components/LocalizationProvider';
import ErrorHandler from './common/components/ErrorHandler';
import Navigation from './Navigation';
import preloadImages from './map/core/preloadImages';
import NativeInterface from './common/components/NativeInterface';
import ServerProvider from './ServerProvider';
import ErrorBoundary from './ErrorBoundary';
import AppThemeProvider from './AppThemeProvider';

preloadImages();

const FONT_FAMILY = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important";

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <LocalizationProvider>
        <StyledEngineProvider injectFirst>
          <AppThemeProvider>
            <CssBaseline />
            <GlobalStyles
              styles={{
                'html, body, #root': {
                  width: '100%',
                  height: '100%',
                  minHeight: '100%',
                  margin: 0,
                  padding: 0,
                  overflow: 'hidden',
                  backgroundColor: '#f8fafc',
                  fontFamily: FONT_FAMILY,
                  fontSize: '12px !important',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                },
                '*, *::before, *::after': {
                  boxSizing: 'border-box',
                  fontFamily: FONT_FAMILY,
                },
                'body, .MuiTypography-root, .MuiButton-root, .MuiTableCell-root, .MuiInputBase-input': {
                  fontFamily: FONT_FAMILY,
                },
                '.maplibregl-map, .maplibregl-canvas-container, .maplibregl-canvas, #map, .map-container': {
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                },
                '.maplibregl-marker': {
                  zIndex: 100,
                },
                '.map-current-location-dot, .custom-vehicle-marker, .vehicle-marker-wrapper': {
                  zIndex: 9999,
                  pointerEvents: 'auto',
                },
                '::-webkit-scrollbar': {
                  width: '4px',
                  height: '4px',
                },
                '::-webkit-scrollbar-track': {
                  background: '#f1f5f9',
                },
                '::-webkit-scrollbar-thumb': {
                  backgroundColor: '#cbd5e1',
                  borderRadius: '4px',
                },
                '::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#00ab8e',
                },
              }}
            />
            <ServerProvider>
              <BrowserRouter>
                <Navigation />
              </BrowserRouter>
              <ErrorHandler />
              <NativeInterface />
            </ServerProvider>
          </AppThemeProvider>
        </StyledEngineProvider>
      </LocalizationProvider>
    </Provider>
  </ErrorBoundary>
);