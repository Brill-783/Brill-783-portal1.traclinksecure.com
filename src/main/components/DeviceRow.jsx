import React, {
  useMemo,
  useCallback,
  memo,
  useState,
} from 'react';

import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import {
  Typography,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import FlightIcon from '@mui/icons-material/Flight';
import PersonIcon from '@mui/icons-material/Person';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import TrainIcon from '@mui/icons-material/Train';
import ElectricScooterIcon from '@mui/icons-material/ElectricScooter';
import PetsIcon from '@mui/icons-material/Pets';
import RvHookupIcon from '@mui/icons-material/RvHookup';
import NavigationIcon from '@mui/icons-material/Navigation';

import { devicesActions } from '../../store';

const BORDER = '#cbd5e1';
const ROBOTO_FONT = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const STATUS_COLORS = {
  moving: '#15803D',       // 🟢 Deep Green (>= 1 km/h)
  parked: '#1D4ED8',       // 🔵 Deep Blue (< 1 km/h)
  notConnected: '#DC2626', // 🔴 Deep Red (Offline)
  expired: '#DC2626',
  unknown: '#64748B',
};

const getCategoryIcon = (category, color) => {
  const sx = { fontSize: 16, color };

  switch (category) {
    case 'car':
      return <DirectionsCarIcon sx={sx} />;
    case 'motorcycle':
    case 'bicycle':
      return <TwoWheelerIcon sx={sx} />;
    case 'bus':
      return <DirectionsBusIcon sx={sx} />;
    case 'truck':
    case 'van':
      return <LocalShippingIcon sx={sx} />;
    case 'boat':
    case 'ship':
      return <DirectionsBoatIcon sx={sx} />;
    case 'plane':
    case 'helicopter':
      return <FlightIcon sx={sx} />;
    case 'person':
      return <PersonIcon sx={sx} />;
    case 'tractor':
    case 'crane':
      return <AgricultureIcon sx={sx} />;
    case 'train':
    case 'tram':
      return <TrainIcon sx={sx} />;
    case 'scooter':
      return <ElectricScooterIcon sx={sx} />;
    case 'animal':
      return <PetsIcon sx={sx} />;
    case 'camper':
    case 'trailer':
      return <RvHookupIcon sx={sx} />;
    default:
      return (
        <NavigationIcon
          sx={{
            ...sx,
            fontSize: 15,
            transform: 'rotate(45deg)',
          }}
        />
      );
  }
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');

  return (
    `${pad(date.getDate())}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${date.getFullYear()} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
};

const useStyles = makeStyles()((theme, { dynamicPrimary }) => ({
  rowWrapper: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '3px 4px',
    backgroundColor: '#ffffff',
    flexShrink: 0,
    fontFamily: `${ROBOTO_FONT} !important`,
    WebkitFontSmoothing: 'antialiased',
    '&, & *': {
      fontFamily: `${ROBOTO_FONT} !important`,
    },
  },
  card: {
    width: '100%',
    boxSizing: 'border-box',
    margin: 0,
    padding: '7px 8px 7px 10px',
    minHeight: '46px',
    backgroundColor: '#ffffff',
    border: `1.2px solid ${BORDER}`,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    cursor: 'pointer',
    fontFamily: `${ROBOTO_FONT} !important`,
    WebkitFontSmoothing: 'antialiased',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    transition: 'background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
    },
  },
  selected: {
    backgroundColor: '#f0fdfa !important',
    border: `1.2px solid ${dynamicPrimary} !important`,
    boxShadow: `0 0 0 1px ${dynamicPrimary}25`,
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    flex: '1 1 auto',
    gap: '10px',
    paddingRight: '8px',
    overflow: 'hidden',
  },
  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  content: {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: '1px',
  },
  title: {
    fontFamily: `${ROBOTO_FONT} !important`,
    fontSize: '13px !important',
    fontWeight: '700 !important',
    color: '#1e293b !important',
    lineHeight: '1.2 !important',
    textTransform: 'uppercase !important',
    whiteSpace: 'nowrap !important',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis !important',
    display: 'block',
    width: '100%',
  },
  subtitle: {
    fontFamily: `${ROBOTO_FONT} !important`,
    fontSize: '11px !important',
    fontWeight: '400 !important',
    color: '#64748b !important',
    lineHeight: '1.25 !important',
    whiteSpace: 'nowrap !important',
    display: 'block',
    width: '100%',
  },
  rightTelemetryCluster: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    marginLeft: 'auto',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  speedText: {
    fontFamily: `${ROBOTO_FONT} !important`,
    fontSize: '11.5px !important',
    fontWeight: '600 !important',
    color: '#475569 !important',
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: '8px !important',
    height: '8px !important',
    minWidth: '8px !important',
    minHeight: '8px !important',
    borderRadius: '50% !important',
    flexShrink: 0,
  },
  menuButton: {
    padding: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    color: '#64748b',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
    },
  },
  menuItem: {
    minHeight: '34px',
    fontFamily: `${ROBOTO_FONT} !important`,
    '&:hover': {
      backgroundColor: '#f0fdfa',
    },
  },
  deleteMenuItem: {
    minHeight: '34px',
    fontFamily: `${ROBOTO_FONT} !important`,
    '&:hover': {
      backgroundColor: '#fef2f2',
    },
  },
  menuText: {
    fontSize: '12.5px !important',
    fontWeight: '500 !important',
    fontFamily: `${ROBOTO_FONT} !important`,
  },
}));

export const DeviceRow = memo(function DeviceRow({
  deviceId,
  item: itemProp,
  position: positionProp,
  selected = false,
  onSelect,
  onMenuClick,
  onEdit,
  onDelete,
}) {
  const server = useSelector((state) => state.session?.server, shallowEqual) || {};
  const serverAttributes = server.attributes || {};
  const dynamicPrimary = serverAttributes.colorPrimary || serverAttributes.color || '#00ab8e';

  const { classes, cx } = useStyles({ dynamicPrimary });
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const isImpersonating = Boolean(
    typeof localStorage !== 'undefined' && localStorage.getItem('impersonated_user_id')
  );

  const isReadOnly = Boolean(currentUser?.readonly || server.readonly);
  const isDeviceReadOnly = Boolean(currentUser?.deviceReadonly || server.deviceReadonly);
  const canEditDevice = Boolean(currentUser && !isReadOnly && !isDeviceReadOnly);

  const isAdmin = useMemo(() => {
    if (!currentUser || isImpersonating) return false;
    return Boolean(
      currentUser.administrator ||
      currentUser.admin ||
      currentUser.id === 1 ||
      currentUser.userLimit === -1
    );
  }, [currentUser, isImpersonating]);

  const reduxItem = useSelector((state) => {
    const items = state.devices?.items;
    if (!items) return undefined;
    if (Array.isArray(items)) {
      return items.find((device) => device && String(device.id) === String(deviceId));
    }
    return items[deviceId] ?? items[String(deviceId)];
  });

  const reduxPosition = useSelector((state) => {
    const positions = state.session?.positions;
    if (!positions) return undefined;
    if (Array.isArray(positions)) {
      return positions.find(
        (pos) => pos && String(pos.deviceId) === String(deviceId)
      );
    }
    return positions[deviceId] ?? positions[String(deviceId)];
  });

  const item = itemProp ?? reduxItem ?? null;
  const position = positionProp ?? reduxPosition ?? null;
  const isSelected = Boolean(selected);

  const [deviceMenuAnchor, setDeviceMenuAnchor] = useState(null);

  // SINGLE-CLICK INSTANT SELECTION HANDLER
  const handleClick = useCallback(() => {
    const targetId = item?.id !== undefined ? item.id : deviceId;
    dispatch(devicesActions.selectId(targetId));

    if (onSelect) {
      onSelect(targetId);
    }
  }, [dispatch, item, deviceId, onSelect]);

  const telemetry = useMemo(() => {
    if (!item) return null;

    const rawSpeed = position?.speed ? Number(position.speed) * 1.852 : 0;
    const isMoving = rawSpeed >= 1.0;
    const safeSpeed = isMoving ? Math.round(rawSpeed) : 0;

    const lastUpdateRaw =
      item.lastUpdate ||
      position?.serverTime ||
      position?.fixTime ||
      position?.deviceTime ||
      null;

    const lastUpdateTimestamp = lastUpdateRaw ? new Date(lastUpdateRaw).getTime() : null;
    const isOffline =
      item.status === 'offline' ||
      !lastUpdateTimestamp ||
      Date.now() - lastUpdateTimestamp > 3 * 3600000;

    let status = 'notConnected';
    let dotColor = STATUS_COLORS.notConnected;
    let subtitleText = 'Not yet connected';
    let statusLabel = 'Not Connected';

    if (!isOffline && lastUpdateTimestamp) {
      subtitleText = formatDateTime(lastUpdateRaw);

      if (isMoving) {
        status = 'moving';
        dotColor = STATUS_COLORS.moving;
        statusLabel = 'Moving';
      } else {
        status = 'parked';
        dotColor = STATUS_COLORS.parked;
        statusLabel = 'Parked';
      }
    }

    return {
      color: dotColor,
      bgColor: `${dotColor}18`,
      speed: `${safeSpeed} kph`,
      title: item.name || 'Unnamed Unit',
      subtitle: subtitleText,
      status,
      statusLabel,
      category: item.category || 'default',
    };
  }, [item, position]);

  if (!item || !telemetry) return null;

  return (
    <div className={classes.rowWrapper}>
      <div
        className={cx(classes.card, isSelected && classes.selected)}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
      >
        <div className={classes.leftGroup}>
          <div
            className={classes.iconBox}
            style={{ backgroundColor: telemetry.bgColor }}
          >
            {getCategoryIcon(telemetry.category, telemetry.color)}
          </div>

          <div className={classes.content}>
            <Typography className={classes.title} component="div" title={telemetry.title}>
              {telemetry.title}
            </Typography>

            <Typography className={classes.subtitle} component="div" title={telemetry.subtitle}>
              {telemetry.subtitle}
            </Typography>
          </div>
        </div>

        <div className={classes.rightTelemetryCluster}>
          <Typography className={classes.speedText} component="div">
            {telemetry.speed}
          </Typography>

          <span
            className={classes.statusDot}
            style={{ backgroundColor: telemetry.color }}
            title={telemetry.statusLabel}
          />

          {canEditDevice && (
            <IconButton
              size="small"
              className={classes.menuButton}
              aria-label={`Actions for ${telemetry.title}`}
              onClick={(event) => {
                event.stopPropagation();
                if (onMenuClick) {
                  onMenuClick(event, item);
                } else {
                  setDeviceMenuAnchor(event.currentTarget);
                }
              }}
            >
              <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </div>
      </div>

      <Menu
        anchorEl={deviceMenuAnchor}
        open={Boolean(deviceMenuAnchor)}
        onClose={() => setDeviceMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '8px',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
              border: '1px solid #e2e8f0',
              minWidth: '120px',
              py: 0.5,
              zIndex: 99999,
              fontFamily: `${ROBOTO_FONT} !important`,
              '&, & *': {
                fontFamily: `${ROBOTO_FONT} !important`,
              },
            },
          },
        }}
      >
        <MenuItem
          className={classes.menuItem}
          onClick={(event) => {
            event.stopPropagation();
            if (onEdit) onEdit(item);
            setDeviceMenuAnchor(null);
          }}
          sx={{ py: 0.5, px: 1 }}
        >
          <ListItemIcon sx={{ minWidth: '22px !important' }}>
            <EditOutlinedIcon sx={{ fontSize: 15, color: dynamicPrimary }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography className={classes.menuText} sx={{ color: '#1e293b' }}>
                Edit
              </Typography>
            }
          />
        </MenuItem>

        {isAdmin && (
          <MenuItem
            className={classes.deleteMenuItem}
            onClick={(event) => {
              event.stopPropagation();
              if (onDelete) onDelete(item);
              setDeviceMenuAnchor(null);
            }}
            sx={{ py: 0.5, px: 1 }}
          >
            <ListItemIcon sx={{ minWidth: '22px !important' }}>
              <DeleteOutlinedIcon sx={{ fontSize: 15, color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography className={classes.menuText} sx={{ color: '#dc2626' }}>
                  Delete
                </Typography>
              }
            />
          </MenuItem>
        )}
      </Menu>
    </div>
  );
});

DeviceRow.displayName = 'DeviceRow';
export default DeviceRow;