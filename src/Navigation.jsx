import React, {
  lazy,
  Suspense,
  useState,
  useCallback,
  useMemo,
  memo,
  createContext,
  useContext,
} from 'react';

import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  Outlet,
} from 'react-router-dom';

import {
  useDispatch,
  useSelector,
  shallowEqual,
} from 'react-redux';

import MainPage from './main/MainPage';
import App from './App';

import { sessionActions } from './store';
import fetchOrThrow from './common/util/fetchOrThrow';

import {
  IconButton,
  Tooltip,
  Box,
  Drawer,
  useMediaQuery,
  useTheme,
  Divider,
  Typography,
} from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import NearMeIcon from '@mui/icons-material/NearMe';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import LayersIcon from '@mui/icons-material/Layers';
import SendIcon from '@mui/icons-material/Send';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ShareIcon from '@mui/icons-material/Share';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';

/* =========================================================
   LAZY PAGES
========================================================= */

const ServerPage = lazy(() => import('./settings/ServerPage'));

/* =========================================================
   NAVIGATION CONTEXT
========================================================= */

export const NavCollapseContext = createContext(null);

export const NavCollapseProvider = ({ children }) => {
  const [navCollapsed, setNavCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      navCollapsed,
      setNavCollapsed,
    }),
    [navCollapsed]
  );

  return (
    <NavCollapseContext.Provider value={value}>
      {children}
    </NavCollapseContext.Provider>
  );
};

export const useNavCollapse = () => {
  const context = useContext(NavCollapseContext);

  if (!context) {
    return {
      navCollapsed: false,
      setNavCollapsed: () => {},
    };
  }

  return context;
};

const LOGO_SRC = '/logo.png';

/* =========================================================
   FULL PAGE LOADER
========================================================= */

const FullPageLoader = memo(() => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="img"
        src={LOGO_SRC}
        alt="TrackLink"
        style={{
          width: '160px',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
});

FullPageLoader.displayName = 'FullPageLoader';

/* =========================================================
   MAIN LAYOUT
========================================================= */

const MainLayout = () => {
  const theme = useTheme();

  const isTabletOrMobile = useMediaQuery(
    theme.breakpoints.down('md')
  );

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { navCollapsed, setNavCollapsed } = useNavCollapse();

  const server =
    useSelector((state) => state.session.server, shallowEqual) || {};

  const user =
    useSelector((state) => state.session.user, shallowEqual) || {};

  const attributes = server?.attributes || {};

  const headerColor = useMemo(() => {
    return (
      attributes.headerColor ||
      theme.palette.background.paper
    );
  }, [attributes.headerColor, theme.palette.background.paper]);

  const sidebarColor = useMemo(() => {
    return (
      attributes.sidebarColor ||
      theme.palette.background.paper
    );
  }, [attributes.sidebarColor, theme.palette.background.paper]);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  /* =========================================================
     MAIN NAVIGATION ITEMS
  ========================================================= */

  const mainMenuItems = useMemo(
    () => [
      {
        key: 'Home',
        label: 'Home',
        path: '/?tab=Objects',
        icon: <HomeIcon fontSize="small" />,
        isHome: true,
      },
      {
        key: 'Objects',
        label: 'Objects',
        path: '/?tab=Objects',
        icon: <NearMeIcon fontSize="small" />,
      },
      {
        key: 'Alerts',
        label: 'Alerts',
        path: '/?tab=Alerts',
        icon: <NotificationsIcon fontSize="small" />,
      },
      {
        key: 'History',
        label: 'History',
        path: '/?tab=History',
        icon: <HistoryIcon fontSize="small" />,
      },
      {
        key: 'Geofences',
        label: 'Geofences',
        path: '/?tab=Geofences',
        icon: <LayersIcon fontSize="small" />,
      },
      {
        key: 'Reports',
        label: 'Reports',
        path: '/reports',
        icon: <BarChartIcon fontSize="small" />,
      },
      {
        key: 'SendCommand',
        label: 'Send command',
        path: '/settings/commands',
        icon: <SendIcon fontSize="small" />,
      },
      {
        key: 'CameraMedia',
        label: 'Camera / Media',
        path: '/camera',
        icon: <CameraAltIcon fontSize="small" />,
      },
      {
        key: 'Sharing',
        label: 'Sharing',
        path: '/settings/share',
        icon: <ShareIcon fontSize="small" />,
      },
      {
        key: 'Activation',
        label: 'GPS device activation',
        path: '/settings/devices',
        icon: <GpsFixedIcon fontSize="small" />,
      },
      {
        key: 'Maintenance',
        label: 'Maintenance',
        path: '/settings/maintenances',
        icon: <BuildIcon fontSize="small" />,
      },
      {
        key: 'Tasks',
        label: 'Tasks',
        path: '/settings/calendars',
        icon: <AssignmentTurnedInIcon fontSize="small" />,
      },
      {
        key: 'Drivers',
        label: 'Drivers',
        path: '/settings/drivers',
        icon: <PeopleIcon fontSize="small" />,
      },
    ],
    []
  );

  /* =========================================================
     NAVIGATION HANDLER
  ========================================================= */

  const handleMenuClick = useCallback(
    (item) => {
      if (isTabletOrMobile) {
        setMobileDrawerOpen(false);
      }

      navigate(item.path);
    },
    [navigate, isTabletOrMobile]
  );

  /* =========================================================
     LOGOUT HANDLER
  ========================================================= */

  const handleLogout = useCallback(async () => {
    try {
      await fetchOrThrow('/api/session', {
        method: 'DELETE',
      });

      dispatch(sessionActions.updateUser(null));
      navigate('/login');
    } catch (e) {
      console.error('Unable to log out:', e);
    }
  }, [dispatch, navigate]);

  /* =========================================================
     ACTIVE MENU ITEM
  ========================================================= */

  const renderMenuItem = useCallback(
    (item, index) => {
      const basePath = item.path.split('?')[0];

      const searchParams = new URLSearchParams(location.search);
      const currentTab = searchParams.get('tab');

      let isActive = false;

      if (basePath === '/') {
        isActive =
          location.pathname === '/' &&
          currentTab === item.key;
      } else {
        isActive =
          location.pathname === basePath ||
          location.pathname.startsWith(`${basePath}/`);
      }

      const itemElement = (
        <div
          key={item.key}
          className={[
            'app-nav-item',
            navCollapsed ? 'app-nav-item-collapsed' : '',
            isActive ? 'app-nav-item-active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => handleMenuClick(item)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleMenuClick(item);
            }
          }}
          aria-current={isActive ? 'page' : undefined}
        >
          <div className="app-nav-icon">
            {item.icon}
          </div>

          {!navCollapsed && (
            <span className="app-nav-label">
              {item.label}
            </span>
          )}
        </div>
      );

      const wrappedItem = navCollapsed ? (
        <Tooltip
          key={item.key}
          title={item.label}
          placement="right"
          arrow
        >
          {itemElement}
        </Tooltip>
      ) : (
        itemElement
      );

      if (index === 0) {
        return (
          <React.Fragment key={item.key}>
            {!navCollapsed && (
              <Box
                sx={{
                  px: 1.5,
                  pt: 1.2,
                  pb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'text.disabled',
                }}
              >
                <HomeIcon sx={{ fontSize: '14px', color: 'inherit' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'block',
                    fontFamily: 'inherit',
                  }}
                >
                  HOME
                </Typography>
              </Box>
            )}
            {wrappedItem}
          </React.Fragment>
        );
      }

      if (index === 1) {
        return wrappedItem;
      }
    },
    [
      location.pathname,
      location.search,
      navCollapsed,
      handleMenuClick,
    ]
  );

  return (
    <div className="app-layout-root" style={{ backgroundColor: theme.palette.background.default }}>
      {/* MOBILE HEADER */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: headerColor,
          borderBottom: `1px solid ${theme.palette.divider}`,
          alignItems: 'center',
          px: 1.5,
          zIndex: 8888,
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
          }}
        >
          <IconButton
            onClick={() => setMobileDrawerOpen(true)}
            size="small"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="img"
            src={LOGO_SRC}
            alt="TrackLink"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Box>

      {/* LEFT NAVIGATION SIDEBAR */}
      <div
        className={[
          'app-left-sidebar',
          navCollapsed ? 'app-left-sidebar-collapsed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          width: navCollapsed ? '72px' : '260px',
          minWidth: navCollapsed ? '72px' : '260px',
          backgroundColor: sidebarColor,
          transition: 'width 0.2s ease, min-width 0.2s ease, background-color 0.2s ease',
        }}
      >
        {/* BRAND HEADER */}
        <div
          className={[
            'app-brand-header',
            navCollapsed ? 'app-brand-header-collapsed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ backgroundColor: headerColor }}
        >
          {!navCollapsed ? (
            <div className="app-brand-logo-wrap">
              <img
                src={LOGO_SRC}
                alt="TrackLink"
                className="app-brand-logo"
              />
            </div>
          ) : (
            <img
              src={LOGO_SRC}
              alt="TrackLink"
              style={{
                width: '38px',
                height: '38px',
                objectFit: 'contain',
              }}
            />
          )}

          <Tooltip
            title={
              navCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
            placement="right"
            arrow
          >
            <button
              type="button"
              className="app-collapse-btn"
              onClick={() =>
                setNavCollapsed((collapsed) => !collapsed)
              }
              aria-label={
                navCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
            >
              {navCollapsed ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </button>
          </Tooltip>
        </div>

        {/* DESKTOP MENU */}
        <div className="app-menu-list" style={{ backgroundColor: sidebarColor }}>
          {user.administrator && !navCollapsed && (
            <div
              className="app-nav-item"
              onClick={() => navigate('/admin/users')}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  navigate('/admin/users');
                }
              }}
            >
              <div className="app-nav-icon">
                <ArrowBackIcon fontSize="small" />
              </div>

              <span className="app-nav-label">
                Back to admin
              </span>
            </div>
          )}

          {mainMenuItems.map((item, index) => renderMenuItem(item, index))}
        </div>

        {/* ACCOUNT AND LOGOUT */}
        {!navCollapsed && (
          <div className="app-sidebar-bottom" style={{ backgroundColor: sidebarColor }}>
            <div className="app-account-section">
              <PersonIcon fontSize="small" color="action" />

              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email || 'user@gmail.com'}
              </span>
            </div>

            <div
              className="app-logout-row"
              onClick={handleLogout}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleLogout();
                }
              }}
            >
              <LogoutIcon fontSize="small" />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          zIndex: 99999,
          '& .MuiDrawer-paper': {
            width: '280px',
            padding: '14px',
            gap: '6px',
            backgroundColor: sidebarColor,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '48px',
            px: 1,
          }}
        >
          <Box
            component="img"
            src={LOGO_SRC}
            alt="TrackLink"
            style={{
              height: '38px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />

          <IconButton
            size="small"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close navigation menu"
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        <Divider />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '16px',
            overflowY: 'auto',
          }}
        >
          {mainMenuItems.map((item, index) => renderMenuItem(item, index))}

          <Divider sx={{ my: 1 }} />

          <div
            className="app-logout-row"
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleLogout();
              }
            }}
          >
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </div>
        </div>
      </Drawer>

      {/* MAIN CONTENT AREA */}
      <div
        className="app-main-area"
        style={{
          marginTop: isTabletOrMobile ? '56px' : 0,
          height: isTabletOrMobile
            ? 'calc(100vh - 56px)'
            : '100vh',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '100%',
            minHeight: 0,
            position: 'relative',
          }}
        >
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   APPLICATION ROUTES
========================================================= */

const AppRoutes = () => (
  <Suspense fallback={<FullPageLoader />}>
    <Routes>
      <Route path="/" element={<App />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<MainPage />} />
          <Route
            path="settings/server"
            element={<ServerPage />}
          />
        </Route>
      </Route>
    </Routes>
  </Suspense>
);

/* =========================================================
   NAVIGATION ROOT
========================================================= */

const Navigation = () => (
  <NavCollapseProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </NavCollapseProvider>
);

export default Navigation;
