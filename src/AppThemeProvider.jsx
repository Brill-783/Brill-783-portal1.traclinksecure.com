import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import getTheme from './common/theme';
import { useLocalization } from './common/components/LocalizationProvider';

const cache = {
  ltr: createCache({
    key: 'muiltr',
    prepend: true,
    stylisPlugins: [prefixer],
  }),
  rtl: createCache({
    key: 'muirtl',
    prepend: true,
    stylisPlugins: [prefixer, rtlPlugin],
  }),
};

const AppThemeProvider = ({ children }) => {
  const server = useSelector((state) => state.session.server);
  const { direction = 'ltr' } = useLocalization();

  const themeInstance = useMemo(() => {
    return getTheme(server, false, direction);
  }, [server, direction]);

  return (
    <CacheProvider value={cache[direction] || cache.ltr}>
      <ThemeProvider theme={themeInstance}>{children}</ThemeProvider>
    </CacheProvider>
  );
};

export default AppThemeProvider;