import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Route,
  Routes,
  useSearchParams,
  useLocation,
  useNavigate,
  Outlet,
  Navigate,
} from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import MainPage from './main/MainPage';
import App from './App';
import Loader from './common/components/Loader';
import { devicesActions, sessionActions } from './store';
import {
  generateLoginToken,
  nativePostMessage,
} from './common/components/NativeInterface';
import { useLocalization } from './common/components/LocalizationProvider';
import fetchOrThrow from './common/util/fetchOrThrow';

import {
  IconButton,
  Tooltip,
  Box,
  Dialog,
  Button,
  Typography,
  Drawer,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Skeleton,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import NearMeIcon from '@mui/icons-material/NearMe';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import LayersIcon from '@mui/icons-material/Layers';
import SendIcon from '@mui/icons-material/Send';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RouterIcon from '@mui/icons-material/Router';
import DnsIcon from '@mui/icons-material/Dns';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import SensorsIcon from '@mui/icons-material/Sensors';

const AdminUsersView = lazy(() => import('./pages/admin/AdminUsersView'));
const CameraPage = lazy(() => import('./pages/CameraPage'));
const ChannelsPage = lazy(() => import('./pages/ChannelsPage'));
const PortsPage = lazy(() => import('./settings/PortsView'));
const PositionPage = lazy(() => import('./pages/PositionPage'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const EventPage = lazy(() => import('./pages/EventPage'));
const GeofencesPage = lazy(() => import('./pages/GeofencesPage'));
const EmulatorPage = lazy(() => import('./pages/EmulatorPage'));
const StreamPage = lazy(() => import('./pages/StreamPage'));

const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const UserPage = lazy(() => import('./pages/users/UserPage'));
const UserConnectionsPage = lazy(() => import('./pages/users/UserConnectionsPage'));

const CombinedReportPage = lazy(() => import('./reports/CombinedReportPage'));
const PositionsReportPage = lazy(() => import('./reports/PositionsReportPage'));
const EventReportPage = lazy(() => import('./reports/EventReportPage'));
const GeofenceReportPage = lazy(() => import('./reports/GeofenceReportPage'));
const TripReportPage = lazy(() => import('./reports/TripReportPage'));
const StopReportPage = lazy(() => import('./reports/StopReportPage'));
const SummaryReportPage = lazy(() => import('./reports/SummaryReportPage'));
const ChartReportPage = lazy(() => import('./reports/ChartReportPage'));
const ScheduledPage = lazy(() => import('./reports/ScheduledPage'));
const StatisticsPage = lazy(() => import('./reports/StatisticsPage'));
const AuditPage = lazy(() => import('./reports/AuditPage'));
const LogsPage = lazy(() => import('./reports/LogsPage'));
const ReportsPage = lazy(() => import('./reports/ReportsPage'));

const DeviceConnectionsPage = lazy(() => import('./settings/DeviceConnectionsPage'));
const SettingsDriversPage = lazy(() => import('./settings/DriversPage'));
const SettingsGroupsPage = lazy(() => import('./settings/GroupsPage'));
const GroupConnectionsPage = lazy(() => import('./settings/GroupConnectionsPage'));
const GeofencePage = lazy(() => import('./settings/GeofencePage'));
const NotificationsPage = lazy(() => import('./settings/NotificationsPage'));
const CalendarsPage = lazy(() => import('./settings/CalendarsPage'));
const ComputedAttributesPage = lazy(() => import('./settings/ComputedAttributesPage'));
const SettingsMaintenancesPage = lazy(() => import('./settings/MaintenancesPage'));
const SettingsCommandsPage = lazy(() => import('./settings/CommandsPage'));
const AccumulatorsPage = lazy(() => import('./settings/AccumulatorsPage'));
const PreferencesPage = lazy(() => import('./settings/PreferencesPage'));
const AnnouncementPage = lazy(() => import('./settings/AnnouncementPage'));
const SharePage = lazy(() => import('./settings/SharePage'));
const ServerPage = lazy(() => import('./settings/ServerPage'));

const LoginPage = lazy(() => import('./login/LoginPage'));
const RegisterPage = lazy(() => import('./login/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./login/ResetPasswordPage'));
const ChangeServerPage = lazy(() => import('./login/ChangeServerPage'));

const ROBOTO_FONT = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const useStyles = makeStyles()((theme, { primaryColor, sidebarColor, headerColor }) => ({
  layoutRoot: {
    display: 'flex',
    flexDirection: 'row',
    height: '100dvh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    fontFamily: ROBOTO_FONT,
    fontSize: '12px !important',
    position: 'relative',
    touchAction: 'manipulation',
  },

  leftNavSidebar: {
    width: '205px',
    minWidth: '205px',
    maxWidth: '205px',
    height: '100%',
    maxHeight: '100dvh',
    backgroundColor: sidebarColor || '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1100,
    flexShrink: 0,
    boxSizing: 'border-box',
    position: 'relative',
    userSelect: 'none',
    overflow: 'hidden',
    transition: 'width 0.16s cubic-bezier(0.4, 0, 0.2, 1)',
    [theme.breakpoints.down('sm')]: {
      width: '52px !important',
      minWidth: '52px !important',
      maxWidth: '52px !important',
    },
  },

  leftNavSidebarCollapsed: {
    width: '52px !important',
    minWidth: '52px !important',
    maxWidth: '52px !important',
  },

  mobileDrawerPaper: {
    width: '205px !important',
    maxWidth: '80vw !important',
    height: '100% !important',
    maxHeight: '100dvh !important',
    backgroundColor: `${sidebarColor || '#ffffff'} !important`,
    borderRight: '1px solid #e2e8f0 !important',
    display: 'flex !important',
    flexDirection: 'column !important',
    boxSizing: 'border-box !important',
    zIndex: 3000,
    boxShadow: '4px 0 20px rgba(15, 23, 42, 0.12) !important',
  },

  brandHeader: {
    width: '100%',
    height: '60px',
    minHeight: '60px',
    padding: '0 10px 0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: headerColor || sidebarColor || '#ffffff',
    flexShrink: 0,
    gap: '6px',
    overflow: 'hidden',
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      height: '56px',
      minHeight: '56px',
      padding: '0 !important',
      justifyContent: 'center !important',
    },
  },

  brandHeaderCollapsed: {
    justifyContent: 'center !important',
    padding: '0 !important',
    height: '56px',
    minHeight: '56px',
  },

  brandLogoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '1 1 auto',
    width: 'calc(100% - 40px)',
    minWidth: 0,
    height: '100%',
    overflow: 'hidden',
    paddingLeft: '12px',
    paddingRight: '4px',
    boxSizing: 'border-box',
  },

  brandLogo: {
    display: 'block',
    height: '32px !important',
    maxHeight: '34px !important',
    width: '100% !important',
    maxWidth: '100% !important',
    objectFit: 'contain',
    objectPosition: 'center',
    imageRendering: '-webkit-optimize-contrast',
    flexShrink: 0,
  },

  brandTextFallback: {
    fontFamily: ROBOTO_FONT,
    fontWeight: 700,
    fontSize: '15.5px',
    lineHeight: '32px',
    letterSpacing: '0.6px',
    color: '#0f172a',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  collapseBtn: {
    width: '32px !important',
    height: '32px !important',
    minWidth: '32px !important',
    maxWidth: '32px !important',
    padding: '0 !important',
    margin: '0 !important',
    border: '1px solid #e2e8f0 !important',
    borderRadius: '7px !important',
    display: 'flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    color: '#475569 !important',
    backgroundColor: '#ffffff !important',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: '#f8fafc !important',
      color: `${primaryColor || '#00a79d'} !important`,
      borderColor: `${primaryColor || '#00a79d'} !important`,
    },
  },

  menuList: {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '4px 6px',
    display: 'flex',
    flexDirection: 'column',
    '&::-webkit-scrollbar': {
      width: '3px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#cbd5e1',
      borderRadius: '8px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: primaryColor || '#00a79d',
    },
  },

  menuItem: {
    width: '100%',
    minHeight: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#1e293b',
    fontSize: '13px !important',
    fontWeight: '600 !important',
    fontFamily: ROBOTO_FONT,
    lineHeight: 1.3,
    textDecoration: 'none',
    position: 'relative',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    boxSizing: 'border-box',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    flexShrink: 0,
    '& svg, & .MuiSvgIcon-root': {
      color: '#475569',
      transition: 'color 0.12s ease',
    },
    '&:hover': {
      backgroundColor: '#f0fdfa',
      color: primaryColor || '#00a79d',
      '& svg, & .MuiSvgIcon-root': {
        color: `${primaryColor || '#00a79d'} !important`,
      },
    },
  },

  menuItemCollapsed: {
    width: '38px !important',
    minHeight: '38px !important',
    height: '38px !important',
    justifyContent: 'center !important',
    padding: '0 !important',
    margin: '2px auto !important',
    gap: '0 !important',
    borderRadius: '7px !important',
    borderBottom: 'none !important',
  },

  menuItemActive: {
    backgroundColor: `${primaryColor || '#00a79d'} !important`,
    color: '#ffffff !important',
    fontWeight: '700 !important',
    fontFamily: ROBOTO_FONT,
    borderBottom: `1px solid ${primaryColor || '#00a79d'} !important`,
    boxShadow: '0 2px 6px rgba(0, 167, 157, 0.28)',
    '&, & *': {
      color: '#ffffff !important',
    },
    '& svg, & .MuiSvgIcon-root': {
      color: '#ffffff !important',
      fill: '#ffffff !important',
    },
    '&:hover': {
      backgroundColor: `${primaryColor || '#00a79d'} !important`,
      color: '#ffffff !important',
      filter: 'brightness(0.94)',
      '&, & *': {
        color: '#ffffff !important',
      },
      '& svg, & .MuiSvgIcon-root': {
        color: '#ffffff !important',
        fill: '#ffffff !important',
      },
    },
  },

  menuIcon: {
    width: '20px',
    minWidth: '20px',
    height: '20px',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    '& svg': {
      width: '18px !important',
      height: '18px !important',
      display: 'block',
      color: 'inherit !important',
    },
  },

  sectionDivider: {
    margin: '8px 4px 4px 4px !important',
    borderColor: '#e2e8f0 !important',
  },

  adminCategoryLabel: {
    fontSize: '11px !important',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: '700 !important',
    fontFamily: ROBOTO_FONT,
    color: '#64748b',
    padding: '6px 8px 3px 8px',
  },

  sidebarBottomContainer: {
    marginTop: 'auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: sidebarColor || '#ffffff',
    borderTop: '1px solid #e2e8f0',
    padding: '10px 6px 12px 6px',
    gap: '8px',
    flexShrink: 0,
    boxSizing: 'border-box',
  },

  accountSection: {
    width: '100%',
    minHeight: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    borderRadius: '7px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box',
    overflow: 'hidden',
    cursor: 'default',
    userSelect: 'none',
  },

  accountSectionCollapsed: {
    width: '38px !important',
    minHeight: '38px !important',
    height: '38px !important',
    justifyContent: 'center !important',
    padding: '0 !important',
    margin: '0 auto !important',
    gap: '0 !important',
    borderRadius: '7px !important',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },

  accountTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },

  accountTitle: {
    fontSize: '10px !important',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '700 !important',
    fontFamily: ROBOTO_FONT,
    color: '#64748b',
    lineHeight: 1.1,
    marginBottom: '1px',
  },

  accountEmail: {
    fontSize: '12px !important',
    fontWeight: '600 !important',
    fontFamily: ROBOTO_FONT,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  },

  logoutRow: {
    width: '100%',
    minHeight: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 8px',
    borderRadius: '7px',
    cursor: 'pointer',
    color: '#334155',
    fontSize: '13px !important',
    fontWeight: '600 !important',
    fontFamily: ROBOTO_FONT,
    boxSizing: 'border-box',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      backgroundColor: '#fef2f2',
      color: '#ef4444',
      '& svg': {
        color: '#ef4444 !important',
      },
    },
  },

  logoutRowCollapsed: {
    width: '38px !important',
    minHeight: '38px !important',
    height: '38px !important',
    justifyContent: 'center !important',
    padding: '0 !important',
    margin: '8px auto 0 auto !important',
    gap: '0 !important',
    borderRadius: '7px !important',
  },

  mainArea: {
    flex: '1 1 0%',
    height: '100%',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100vw - 52px)',
    },
  },
}));

const PageSkeletonFallback = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      p: 3,
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
      <Skeleton variant="rectangular" width={200} height={30} sx={{ borderRadius: '6px', bgcolor: '#e2e8f0' }} />
      <Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: '6px', bgcolor: '#e2e8f0' }} />
    </Box>
    <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: '8px', bgcolor: '#ffffff', border: '1px solid #e2e8f0' }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} variant="rectangular" width="100%" height={40} sx={{ borderRadius: '6px', bgcolor: '#ffffff', border: '1px solid #f1f5f9' }} />
      ))}
    </Box>
  </Box>
);

const NavSidebarItem = memo(({ item, isActive, navCollapsed, onClick, classes }) => {
  const handleClick = useCallback(() => {
    onClick(item);
  }, [onClick, item]);

  const content = (
    <Box
      className={[
        classes.menuItem,
        navCollapsed ? classes.menuItemCollapsed : '',
        isActive ? classes.menuItemActive : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
    >
      <Box className={classes.menuIcon}>{item.icon}</Box>
      {!navCollapsed && (
        <Typography
          component="span"
          sx={{
            fontSize: '13px !important',
            fontWeight: isActive ? '700 !important' : '600 !important',
            fontFamily: ROBOTO_FONT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'inherit !important',
          }}
        >
          {item.label}
        </Typography>
      )}
    </Box>
  );

  if (navCollapsed) {
    return (
      <Tooltip title={item.label} placement="right" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
});

NavSidebarItem.displayName = 'NavSidebarItem';

const LogoutModal = memo(({ open, onClose, handleExecuteLogout, isLoggingOut, primaryColor, buttonColor }) => {
  if (!open) return null;

  const activeColor = buttonColor || primaryColor || '#00a79d';

  return createPortal(
    <Dialog
      open={open}
      disableAutoFocus
      disableRestoreFocus
      disableEnforceFocus
      onClose={onClose}
      maxWidth={false}
      transitionDuration={{ enter: 200, exit: 150 }}
      sx={{
        zIndex: 99999,
        '& .MuiDialog-container': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        },
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            p: '16px 18px',
            width: '300px',
            maxWidth: 'calc(100vw - 32px)',
            textAlign: 'center',
            boxSizing: 'border-box',
            boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.35)',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            m: 0,
            fontFamily: ROBOTO_FONT,
            transform: 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <LogoutIcon sx={{ color: '#ef4444', fontSize: '16px', ml: '2px' }} />
        </Box>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '14px !important',
            color: '#0f172a',
            mb: 0.3,
            fontFamily: ROBOTO_FONT,
            lineHeight: 1.2,
          }}
        >
          Log Out
        </Typography>

        <Box
          component="form"
          onSubmit={handleExecuteLogout}
          sx={{
            width: '100%',
            mt: 0.8,
            p: 1.2,
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '12px !important',
              fontWeight: 500,
              color: '#334155',
              textAlign: 'center',
              lineHeight: 1.35,
              mb: 1.2,
              userSelect: 'none',
              fontFamily: ROBOTO_FONT,
            }}
          >
            Are you sure you want to log out?
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, width: '100%' }}>
            <Button
              variant="outlined"
              type="button"
              disabled={isLoggingOut}
              onClick={onClose}
              fullWidth
              sx={{
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                color: '#334155',
                backgroundColor: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '12px !important',
                height: '32px',
                fontFamily: ROBOTO_FONT,
                '&:hover': {
                  borderColor: '#94a3b8',
                  backgroundColor: '#ffffff',
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              type="submit"
              disabled={isLoggingOut}
              fullWidth
              disableElevation
              startIcon={isLoggingOut ? <CircularProgress size={13} sx={{ color: '#ffffff' }} /> : null}
              sx={{
                borderRadius: '20px',
                backgroundColor: `${activeColor} !important`,
                color: '#ffffff !important',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12px !important',
                height: '32px',
                fontFamily: ROBOTO_FONT,
                boxShadow: '0 2px 5px rgba(0, 167, 157, 0.25)',
                '&:hover': {
                  filter: 'brightness(0.92)',
                },
              }}
            >
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>,
    document.body
  );
});

LogoutModal.displayName = 'LogoutModal';

const SidebarContent = memo(
  ({
    navCollapsed,
    onToggleCollapse,
    userMenuItems,
    adminMenuItems,
    isAdmin,
    isMapRoute,
    currentTab,
    locationPath,
    handleMenuClick,
    displayAccountEmail,
    onOpenLogout,
    headerLogo,
    titleText,
    classes,
  }) => (
    <>
      <Box
        className={[
          classes.brandHeader,
          navCollapsed ? classes.brandHeaderCollapsed : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {!navCollapsed && (
          <Box className={classes.brandLogoWrapper}>
            {headerLogo ? (
              <Box
                component="img"
                src={headerLogo}
                alt="Logo"
                className={classes.brandLogo}
              />
            ) : (
              <Box className={classes.brandTextFallback}>
                <SensorsIcon sx={{ color: '#00a79d', fontSize: '22px', flexShrink: 0 }} />
                <span>{titleText || 'TRACKLINK'}</span>
              </Box>
            )}
          </Box>
        )}

        <IconButton
          className={classes.collapseBtn}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleCollapse();
          }}
          tabIndex={-1}
          size="small"
          aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {navCollapsed ? (
            <MenuIcon sx={{ fontSize: '18px', display: 'block', color: '#1e293b' }} />
          ) : (
            <ChevronLeftIcon sx={{ fontSize: '18px', display: 'block', color: '#64748b' }} />
          )}
        </IconButton>
      </Box>

      <Box className={classes.menuList}>
        {userMenuItems.map((item) => {
          const isActive = item.isMapMenu
            ? isMapRoute && currentTab === item.key
            : locationPath.startsWith(item.path);

          return (
            <NavSidebarItem
              key={item.key}
              item={item}
              isActive={isActive}
              navCollapsed={navCollapsed}
              onClick={handleMenuClick}
              classes={classes}
            />
          );
        })}

        {isAdmin && adminMenuItems.length > 0 && (
          <>
            <Divider className={classes.sectionDivider} />

            {!navCollapsed && (
              <Typography className={classes.adminCategoryLabel}>
                Administration
              </Typography>
            )}

            {adminMenuItems.map((item) => {
              const isActive = locationPath.startsWith(item.path);

              return (
                <NavSidebarItem
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  navCollapsed={navCollapsed}
                  onClick={handleMenuClick}
                  classes={classes}
                />
              );
            })}
          </>
        )}
      </Box>

      <Box className={classes.sidebarBottomContainer}>
        <Tooltip title={navCollapsed ? displayAccountEmail : ''} placement="right" arrow>
          <Box className={navCollapsed ? classes.accountSectionCollapsed : classes.accountSection}>
            <PersonIcon sx={{ color: '#475569', fontSize: '20px', flexShrink: 0 }} />
            {!navCollapsed && (
              <Box className={classes.accountTextGroup}>
                <Typography component="span" className={classes.accountTitle}>
                  Account
                </Typography>
                <Typography component="span" className={classes.accountEmail}>
                  {displayAccountEmail}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        <Tooltip title={navCollapsed ? 'Log Out' : ''} placement="right" arrow>
          <Box
            className={navCollapsed ? classes.logoutRowCollapsed : classes.logoutRow}
            onClick={onOpenLogout}
          >
            <Box className={classes.menuIcon}>
              <LogoutIcon sx={{ fontSize: '20px', color: '#475569' }} />
            </Box>
            {!navCollapsed && (
              <Typography
                component="span"
                sx={{
                  fontSize: '13px !important',
                  fontWeight: '600 !important',
                  fontFamily: ROBOTO_FONT,
                  whiteSpace: 'nowrap',
                }}
              >
                Logout
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
    </>
  )
);

SidebarContent.displayName = 'SidebarContent';

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const user = useSelector((state) => state.session.user);
  const server = useSelector((state) => state.session.server, shallowEqual) || {};
  const attributes = server?.attributes || {};

  const primaryColor = attributes.colorPrimary || attributes.color || '#00a79d';
  const buttonColor = attributes.buttonColor || primaryColor;
  const sidebarColor = attributes.sidebarColor || '#ffffff';
  const headerColor = attributes.headerColor || '#ffffff';
  const titleText = attributes.titleText || 'TRACKLINK';

  const headerLogo = attributes.frontpageLogo || attributes.loginLogo || attributes.logo || '';

  const { classes } = useStyles({ primaryColor, sidebarColor, headerColor });

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isMapRoute = location.pathname === '/' || location.pathname === '';
  const currentTab = searchParams.get('tab') || 'Objects';

  const displayAccountEmail = useMemo(() => {
    return user?.email || user?.login || 'user@system.com';
  }, [user]);

  const handleOpenLogout = useCallback(() => setLogoutDialogOpen(true), []);
  const handleCloseLogout = useCallback(() => {
    if (!isLoggingOut) {
      setLogoutDialogOpen(false);
    }
  }, [isLoggingOut]);

  const handleSidebarToggle = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen((prev) => !prev);
      return;
    }
    setNavCollapsed((prev) => !prev);
  }, [isMobile]);

  const isAdmin = Boolean(
    user && (user.administrator || user.admin) && !user.readonly
  );

  const userMenuItems = useMemo(
    () => [
      {
        key: 'Objects',
        label: 'Objects',
        path: '/?tab=Objects',
        isMapMenu: true,
        icon: (
          <NearMeIcon
            sx={{
              transform: 'rotate(45deg)',
              fontSize: '18px !important',
            }}
          />
        ),
      },
      {
        key: 'Alerts',
        label: 'Alerts',
        path: '/?tab=Alerts',
        isMapMenu: true,
        icon: <NotificationsIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'History',
        label: 'History',
        path: '/?tab=History',
        isMapMenu: true,
        icon: <HistoryIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'Geofences',
        label: 'Geofences',
        path: '/?tab=Geofences',
        isMapMenu: true,
        icon: <LayersIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: <BarChartIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'groups',
        label: 'Groups',
        path: '/settings/groups',
        icon: <FolderOutlinedIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'drivers',
        label: 'Drivers',
        path: '/settings/drivers',
        icon: <PeopleIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'cameras',
        label: 'Camera / Media',
        path: '/cameras',
        icon: <CameraAltIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'maintenance',
        label: 'Maintenance',
        path: '/settings/maintenances',
        icon: <BuildIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        path: '/settings/notifications',
        icon: <NotificationsActiveOutlinedIcon sx={{ fontSize: '20px !important' }} />,
      },
    ],
    []
  );

  const adminMenuItems = useMemo(
    () => [
      {
        key: 'admin',
        label: 'Manage Users',
        path: '/admin',
        icon: <AdminPanelSettingsIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'commands',
        label: 'Send Command',
        path: '/settings/commands',
        icon: <SendIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'ports',
        label: 'Listening Ports',
        path: '/settings/ports',
        icon: <DnsIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'channels',
        label: 'Network Channels',
        path: '/channels',
        icon: <RouterIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'audit',
        label: 'Audit Trail',
        path: '/reports/audit',
        icon: <SecurityIcon sx={{ fontSize: '20px !important' }} />,
      },
      {
        key: 'server',
        label: 'Server System',
        path: '/settings/server',
        icon: <StorageIcon sx={{ fontSize: '20px !important' }} />,
      },
    ],
    []
  );

  const handleMenuClick = useCallback(
    (item) => {
      navigate(item.path);
      if (isMobile) {
        setMobileDrawerOpen(false);
      }
    },
    [navigate, isMobile]
  );

  const handleExecuteLogout = async (e) => {
    if (e) e.preventDefault();
    setIsLoggingOut(true);

    try {
      [
        'impersonated_user_id',
        'impersonated_user_email',
        'admin_session_backup_id',
        'admin_session_backup_email',
        'admin_token_backup',
        'userToken',
      ].forEach((k) => localStorage.removeItem(k));

      sessionStorage.removeItem('userToken');
      window.sessionStorage.removeItem('postLogin');

      await fetch('/api/session', {
        method: 'DELETE',
        credentials: 'include',
      });

      nativePostMessage('logout');
    } catch {
    } finally {
      dispatch(devicesActions.selectId(null));
      dispatch(sessionActions.updateUser(null));
      setIsLoggingOut(false);
      setLogoutDialogOpen(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <Box className={classes.layoutRoot}>
      <Box
        className={[
          classes.leftNavSidebar,
          isMobile || navCollapsed ? classes.leftNavSidebarCollapsed : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <SidebarContent
          navCollapsed={isMobile ? true : navCollapsed}
          onToggleCollapse={handleSidebarToggle}
          userMenuItems={userMenuItems}
          adminMenuItems={adminMenuItems}
          isAdmin={isAdmin}
          isMapRoute={isMapRoute}
          currentTab={currentTab}
          locationPath={location.pathname}
          handleMenuClick={handleMenuClick}
          displayAccountEmail={displayAccountEmail}
          onOpenLogout={handleOpenLogout}
          headerLogo={headerLogo}
          titleText={titleText}
          classes={classes}
        />
      </Box>

      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          disableAutoFocus
          disableEnforceFocus
          onClose={() => setMobileDrawerOpen(false)}
          slotProps={{
            paper: {
              className: classes.mobileDrawerPaper,
            },
          }}
        >
          <SidebarContent
            navCollapsed={false}
            onToggleCollapse={() => setMobileDrawerOpen(false)}
            userMenuItems={userMenuItems}
            adminMenuItems={adminMenuItems}
            isAdmin={isAdmin}
            isMapRoute={isMapRoute}
            currentTab={currentTab}
            locationPath={location.pathname}
            handleMenuClick={handleMenuClick}
            displayAccountEmail={displayAccountEmail}
            onOpenLogout={handleOpenLogout}
            headerLogo={headerLogo}
            titleText={titleText}
            classes={classes}
          />
        </Drawer>
      )}

      <Box className={classes.mainArea}>
        <Outlet />
      </Box>

      <LogoutModal
        open={logoutDialogOpen}
        onClose={handleCloseLogout}
        handleExecuteLogout={handleExecuteLogout}
        isLoggingOut={isLoggingOut}
        primaryColor={primaryColor}
        buttonColor={buttonColor}
      />
    </Box>
  );
};

const ProtectedAdminRoute = ({ user, children }) => {
  const isAdmin = Boolean(
    user && (user.administrator || user.admin) && !user.readonly
  );

  if (!isAdmin) {
    return <Navigate to="/?tab=Objects" replace />;
  }
  return children;
};

const RootLandingRedirect = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  if (tab) return null;
  return <Navigate to="/?tab=Objects" replace />;
};

const AppNavigation = () => {
  const dispatch = useDispatch();
  const { setLocalLanguage } = useLocalization();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useSelector((state) => state.session.user);

  const locale = searchParams.get('locale');
  const token = searchParams.get('token');
  const uniqueId = searchParams.get('uniqueId');
  const openid = searchParams.get('openid');

  const hasQueryParams = Boolean(locale || token || uniqueId || openid);

  useEffect(() => {
    if (!hasQueryParams) return;

    let active = true;

    const processQueryParams = async () => {
      const newParams = new URLSearchParams(searchParams);

      if (locale) {
        setLocalLanguage(locale);
        newParams.delete('locale');
      }

      if (token) {
        localStorage.setItem('userToken', token);
        newParams.delete('token');
      }

      if (uniqueId) {
        try {
          const response = await fetchOrThrow(
            `/api/devices?uniqueId=${encodeURIComponent(uniqueId)}`
          );
          const items = await response.json();
          if (items.length > 0 && active) {
            dispatch(devicesActions.selectId(items[0].id));
          }
        } catch {}
        newParams.delete('uniqueId');
      }

      if (openid) {
        if (openid === 'success') {
          generateLoginToken();
        }
        newParams.delete('openid');
      }

      if (active) {
        setSearchParams(newParams, { replace: true });
      }
    };

    processQueryParams();

    return () => {
      active = false;
    };
  }, [
    hasQueryParams,
    locale,
    token,
    uniqueId,
    openid,
    dispatch,
    setLocalLanguage,
    setSearchParams,
    searchParams,
  ]);

  if (hasQueryParams) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<PageSkeletonFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-server" element={<ChangeServerPage />} />

        <Route path="/" element={<App />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<MainPage />}>
              <Route index element={<RootLandingRedirect />} />
              <Route
                path="admin"
                element={
                  <ProtectedAdminRoute user={user}>
                    <AdminUsersView />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedAdminRoute user={user}>
                    <AdminUsersView />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="ports" element={<Navigate to="/settings/ports" replace />} />
              <Route
                path="channels"
                element={
                  <ProtectedAdminRoute user={user}>
                    <ChannelsPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="server-custom" element={<Navigate to="/settings/server" replace />} />
              <Route path="cameras" element={<CameraPage />} />
              <Route path="drivers" element={<SettingsDriversPage />} />
              <Route path="groups" element={<SettingsGroupsPage />} />
              <Route path="maintenance" element={<SettingsMaintenancesPage />} />
              <Route path="position/:id" element={<PositionPage />} />
              <Route path="network/:positionId" element={<NetworkPage />} />
              <Route path="event/:id" element={<EventPage />} />
              <Route path="geofences" element={<GeofencesPage />} />
              <Route path="emulator" element={<EmulatorPage />} />
              <Route path="stream" element={<StreamPage />} />

              <Route path="settings">
                <Route path=":type/:id/share" element={<SharePage />} />
                <Route path="accumulators/:deviceId" element={<AccumulatorsPage />} />
                <Route path="announcement" element={<AnnouncementPage />} />
                <Route
                  path="calendars"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <CalendarsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="commands"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <SettingsCommandsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="attributes"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <ComputedAttributesPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="ports"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <PortsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="device/:id/connections"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <DeviceConnectionsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route path="drivers" element={<SettingsDriversPage />} />
                <Route path="geofence/:id" element={<GeofencePage />} />
                <Route path="geofence" element={<GeofencePage />} />
                <Route path="groups" element={<SettingsGroupsPage />} />
                <Route path="group/:id/connections" element={<GroupConnectionsPage />} />
                <Route path="maintenances" element={<SettingsMaintenancesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="preferences" element={<PreferencesPage />} />
                <Route
                  path="server"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <ServerPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <UsersPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="user/:id/connections"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <UserConnectionsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="user/:id"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <UserPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="user"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <UserPage />
                    </ProtectedAdminRoute>
                  }
                />
              </Route>

              <Route path="reports">
                <Route index element={<ReportsPage />} />
                <Route path="combined" element={<CombinedReportPage />} />
                <Route path="chart" element={<ChartReportPage />} />
                <Route path="events" element={<EventReportPage />} />
                <Route path="geofences" element={<GeofenceReportPage />} />
                <Route path="route" element={<PositionsReportPage />} />
                <Route path="stops" element={<StopReportPage />} />
                <Route path="summary" element={<SummaryReportPage />} />
                <Route path="trips" element={<TripReportPage />} />
                <Route path="scheduled" element={<ScheduledPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route
                  path="audit"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <AuditPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="logs"
                  element={
                    <ProtectedAdminRoute user={user}>
                      <LogsPage />
                    </ProtectedAdminRoute>
                  }
                />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppNavigation;