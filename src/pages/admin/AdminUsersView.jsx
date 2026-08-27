import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
  useRef,
} from 'react';

import { makeStyles } from 'tss-react/mui';

import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  InputBase,
  CircularProgress,
  Paper,
  Avatar,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import Swal from 'sweetalert2';

import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { startImpersonation } from '../../common/util/impersonation';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#f1f5f9';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const fontStyle = {
  fontFamily: FONT_FAMILY,
};

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': {
    width: '4px',
    height: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#cbd5e1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#94a3b8',
  },
};

const showAlert = (options) =>
  Swal.fire({
    target: document.body,
    customClass: {
      container: 'swal-top-layer',
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = '999999';
      }
    },
    ...options,
  });

const isUserExpired = (user) => {
  if (user?.disabled) {
    return true;
  }
  if (!user?.expirationTime) {
    return false;
  }
  const expTimestamp = new Date(user.expirationTime).getTime();
  if (Number.isNaN(expTimestamp)) {
    return false;
  }
  return Date.now() > expTimestamp;
};

const formatLastLogin = (value) => {
  if (!value) return 'Never';
  let date;
  if (typeof value === 'string' && !value.endsWith('Z') && !value.includes('+') && !value.includes('T')) {
    date = new Date(`${value.replace(' ', 'T')}Z`);
  } else if (typeof value === 'string' && !value.endsWith('Z') && !value.includes('+')) {
    date = new Date(`${value}Z`);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Never';
  }

  const pad = (n) => String(n).padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

const useStyles = makeStyles()(() => ({
  root: {
    height: '100%',
    width: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: SURFACE_SOFT,
    overflow: 'hidden',
    fontFamily: FONT_FAMILY,
    boxSizing: 'border-box',
    padding: '16px',
    gap: '12px',
    '@media (max-width: 600px)': {
      padding: '10px 8px',
      gap: '8px',
    },
    '&, & *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
}));

const UserTableRow = memo(({ user, isCurrentActiveUser, liveLoginTime, deviceCount, onLogin, onEdit, onDelete }) => {
  const initials = String(user.name || 'U')
    .substring(0, 2)
    .toUpperCase();

  const expired = isUserExpired(user);
  
  const lastLoginRaw = isCurrentActiveUser
    ? (liveLoginTime || user.attributes?.lastLogin || new Date().toISOString())
    : (liveLoginTime ||
       user.attributes?.lastLogin ||
       user.attributes?.lastLoginTime ||
       user.attributes?.lastActive ||
       user.lastUpdate ||
       user.attributes?.lastUpdate ||
       null);

  const lastLoginFormatted = formatLastLogin(lastLoginRaw);

  return (
    <TableRow
      hover
      sx={{
        height: { xs: '42px', sm: '46px' },
        '&:hover': {
          backgroundColor: '#e6f7f5 !important',
        },
        '& td': {
          py: { xs: '6px', sm: '9px' },
          px: { xs: '8px', sm: '14px' },
          fontSize: { xs: '12px', sm: '13px' },
          fontWeight: 400,
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...fontStyle,
        },
      }}
    >
      <TableCell
        onClick={() => onEdit(user)}
        sx={{
          color: '#0f172a !important',
          fontWeight: '600 !important',
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
          <Avatar
            sx={{
              width: { xs: 24, sm: 28 },
              height: { xs: 24, sm: 28 },
              fontSize: { xs: '10px', sm: '11px' },
              fontWeight: 700,
              backgroundColor: '#f0fdfa',
              color: PRIMARY,
              border: '1.5px solid #ccfbf1',
            }}
          >
            {initials}
          </Avatar>
          <span style={{ color: PRIMARY, fontWeight: 700 }}>{user.name}</span>
        </Box>
      </TableCell>

      <TableCell sx={{ color: '#475569' }}>
        {user.email || '—'}
      </TableCell>

      <TableCell align="center">
        <Chip
          label={deviceCount}
          size="small"
          sx={{
            minWidth: { xs: '28px', sm: '34px' },
            height: { xs: '20px', sm: '22px' },
            fontSize: { xs: '10.5px', sm: '11.5px' },
            fontWeight: 700,
            backgroundColor: deviceCount > 0 ? '#e6f7f5' : '#f1f5f9',
            color: deviceCount > 0 ? PRIMARY_DARK : TEXT_SECONDARY,
            border: `1.5px solid ${deviceCount > 0 ? '#b7eee5' : '#cbd5e1'}`,
            borderRadius: '5px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell>
        <Chip
          label={user.administrator ? 'Admin' : 'Standard User'}
          size="small"
          sx={{
            height: { xs: '18px', sm: '20px' },
            fontSize: { xs: '10px', sm: '11px' },
            fontWeight: 700,
            backgroundColor: user.administrator ? '#dcfce7' : '#f1f5f9',
            color: user.administrator ? '#15803d' : TEXT_SECONDARY,
            border: `1.5px solid ${user.administrator ? '#bbf7d0' : '#cbd5e1'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell align="center">
        <Chip
          label={expired ? 'EXPIRED' : 'ACTIVE'}
          size="small"
          sx={{
            height: { xs: '18px', sm: '20px' },
            fontSize: { xs: '9.5px', sm: '10.5px' },
            fontWeight: 700,
            letterSpacing: '0.03em',
            backgroundColor: expired ? '#fee2e2' : '#dcfce7',
            color: expired ? '#991b1b' : '#15803d',
            border: `1.5px solid ${expired ? '#fca5a5' : '#86efac'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell sx={{ color: '#475569', fontSize: { xs: '11.5px !important', sm: '12.5px !important' }, fontWeight: 500 }}>
        {lastLoginFormatted}
      </TableCell>

      <TableCell
        align="center"
        sx={{
          borderRight: 'none !important',
          pr: { xs: 0.8, sm: 1.5 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLogin(user);
            }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '5px',
              border: '1.5px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dbeafe';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '5px',
              border: `1.5px solid ${BORDER}`,
              backgroundColor: '#f8fafc',
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(user.id);
            }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '5px',
              border: '1.5px solid #fecaca',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.color = '#dc2626';
            }}
          >
            Delete
          </button>
        </Box>
      </TableCell>
    </TableRow>
  );
});

UserTableRow.displayName = 'UserTableRow';

export default function AdminUsersView() {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();
  const hiddenDateInputRef = useRef(null);

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const server = useSelector((state) => state.session?.server || {}, shallowEqual);
  const reduxDevices = useSelector((state) => state.devices?.items || {}, shallowEqual);

  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';

  const [users, setUsers] = useState([]);
  const [deviceUserMap, setDeviceUserMap] = useState({});
  const [userLoginAuditMap, setUserLoginAuditMap] = useState({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userExpirationTime, setUserExpirationTime] = useState('');
  const [userDisabled, setUserDisabled] = useState(false);
  const [userAdmin, setUserAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const allDevicesList = useMemo(() => {
    return Array.isArray(reduxDevices)
      ? reduxDevices
      : Object.values(reduxDevices || {});
  }, [reduxDevices]);

  const userDevicesMap = useMemo(() => {
    const counts = {};
    const totalCount = allDevicesList.length;

    allDevicesList.forEach((d) => {
      if (Array.isArray(d?.userIds)) {
        d.userIds.forEach((uId) => {
          counts[uId] = (counts[uId] || 0) + 1;
        });
      }
    });

    Object.entries(deviceUserMap).forEach(([uId, count]) => {
      counts[uId] = Math.max(counts[uId] || 0, count);
    });

    users.forEach((u) => {
      if (u.administrator || u.admin || u.id === 1) {
        counts[u.id] = totalCount;
      } else if (counts[u.id] === undefined) {
        counts[u.id] = 0;
      }
    });

    return counts;
  }, [allDevicesList, deviceUserMap, users]);

  // Real-time login sync with backend database
  useEffect(() => {
    if (!currentUser?.id) return;
    const nowIso = new Date().toISOString();

    const syncCurrentLogin = async () => {
      try {
        await fetch(`/api/users/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...currentUser,
            attributes: {
              ...(currentUser.attributes || {}),
              lastLogin: nowIso,
            },
          }),
        });
      } catch {}
    };

    syncCurrentLogin();
  }, [currentUser?.id]);

  const fetchUsers = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const usersRes = await fetchOrThrow('/api/users');
      const usersData = await usersRes.json();
      const normalizedUsers = Array.isArray(usersData)
        ? usersData
        : Object.values(usersData || {});

      setUsers(normalizedUsers);

      const counts = {};
      const loginTimes = {};
      const nonAdminUsers = normalizedUsers.filter(
        (u) => !u.administrator && !u.admin && u.id !== 1
      );

      // Query live reports and device mappings concurrently
      await Promise.all([
        ...nonAdminUsers.map(async (u) => {
          try {
            const devRes = await fetch(`/api/devices?userId=${u.id}`, {
              credentials: 'include',
            });
            if (devRes.ok) {
              const devData = await devRes.json();
              if (Array.isArray(devData)) {
                counts[u.id] = devData.length;
              }
            }
          } catch {}
        }),
        (async () => {
          try {
            const auditRes = await fetch('/api/reports/events?type=userLogin', {
              credentials: 'include',
            });
            if (auditRes.ok) {
              const auditData = await auditRes.json();
              if (Array.isArray(auditData)) {
                auditData.forEach((evt) => {
                  if (evt.userId && evt.eventTime) {
                    if (!loginTimes[evt.userId] || new Date(evt.eventTime) > new Date(loginTimes[evt.userId])) {
                      loginTimes[evt.userId] = evt.eventTime;
                    }
                  }
                });
              }
            }
          } catch {}
        })()
      ]);

      setDeviceUserMap(counts);
      if (Object.keys(loginTimes).length > 0) {
        setUserLoginAuditMap(loginTimes);
      }
    } catch (error) {
      if (!isBackground) {
        showAlert({
          icon: 'error',
          title: 'Sync Failed',
          text: error?.message || 'Failed to fetch users from the system.',
          confirmButtonColor: PRIMARY,
        });
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(false);

    const pollInterval = setInterval(() => {
      fetchUsers(true);
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [fetchUsers]);

  // Priority sorting: Administrators always appear at the top, followed by user name
  const filteredUsers = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    let result = users;

    if (q) {
      result = users.filter(
        (user) =>
          String(user.name || '').toLowerCase().includes(q) ||
          String(user.email || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      const aAdmin = Boolean(a.administrator || a.admin || a.id === 1);
      const bAdmin = Boolean(b.administrator || b.admin || b.id === 1);

      if (aAdmin && !bAdmin) return -1;
      if (!aAdmin && bAdmin) return 1;

      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [users, searchKeyword]);

  const resetForm = () => {
    setSelectedUser(null);
    setActiveTab(0);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserExpirationTime('');
    setUserDisabled(false);
    setUserAdmin(false);
    setShowPassword(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setActiveTab(0);
    setUserName(user.name || '');
    setUserEmail(user.email || '');
    setUserPassword('');
    setUserExpirationTime(
      user.expirationTime ? String(user.expirationTime).split('T')[0] : ''
    );
    setUserDisabled(Boolean(user.disabled));
    setUserAdmin(Boolean(user.administrator));
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openCalendar = () => {
    if (!hiddenDateInputRef.current) return;
    const input = hiddenDateInputRef.current;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch (e) {}
    }
    input.click();
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (submitting) return;

    const name = userName.trim();
    const email = userEmail.trim().toLowerCase();
    const password = userPassword;

    if (!name || !email) {
      setActiveTab(0);
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter both name and email.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    const emailInUse = users.some(
      (u) =>
        String(u.email || '').trim().toLowerCase() === email &&
        (!selectedUser || String(u.id) !== String(selectedUser.id))
    );

    if (emailInUse) {
      setActiveTab(0);
      showAlert({
        icon: 'warning',
        title: 'Email Already Exists',
        text: 'The email already exists, try using a different one.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (!selectedUser && !password) {
      setActiveTab(0);
      showAlert({
        icon: 'error',
        title: 'Password Required',
        text: 'Please create a password for the new user.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setSubmitting(true);
    const isEdit = Boolean(selectedUser);

    try {
      const payload = {
        ...(isEdit ? { id: selectedUser.id } : {}),
        name,
        email,
        disabled: userDisabled,
        expirationTime: userExpirationTime
          ? new Date(`${userExpirationTime}T23:59:59.999Z`).toISOString()
          : null,
        administrator: userAdmin,
        ...(password ? { password } : {}),
      };

      const url = isEdit ? `/api/users/${selectedUser.id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (
          response.status === 400 &&
          (errorText.toLowerCase().includes('unique') ||
            errorText.toLowerCase().includes('duplicate') ||
            errorText.toLowerCase().includes('email'))
        ) {
          showAlert({
            icon: 'warning',
            title: 'Email Already Exists',
            text: 'The email already exists, try using a different one.',
            confirmButtonColor: PRIMARY,
          });
          return;
        }
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const savedItem = await response.json();

      setUsers((prev) => {
        if (isEdit) {
          return prev.map((u) =>
            String(u.id) === String(savedItem.id) ? savedItem : u
          );
        }
        return [...prev, savedItem];
      });

      setDialogOpen(false);

      showAlert({
        icon: 'success',
        title: isEdit ? 'Success' : 'User Created',
        text: isEdit ? 'User updated successfully.' : 'User account created successfully.',
        timer: 1800,
        showConfirmButton: false,
      });

      resetForm();
      fetchUsers(true);
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: error?.message || 'Failed to save user.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const result = await showAlert({
      title: 'Delete User?',
      text: 'Are you sure you want to delete this user from the system?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await fetchOrThrow(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));

      showAlert({
        icon: 'success',
        title: 'Deleted',
        text: 'User removed from the system.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Delete Failed',
        text: error?.message || 'Failed to delete user.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  const handleLoginAsUser = async (user) => {
    if (!user?.id) return;

    const result = await showAlert({
      icon: 'question',
      title: `Login as ${user.name}`,
      html: `
        <div style="font-family:${FONT_FAMILY};font-size:13px;line-height:1.6">
          You will temporarily enter this user's account.
          <br/>
          You will only see the devices, groups, alerts, reports and other data belonging to this account.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Login as User',
      cancelButtonText: 'Cancel',
      confirmButtonColor: PRIMARY,
      cancelButtonColor: '#64748b',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await startImpersonation(currentUser, user.id, dispatch);
      if (res?.token) {
        window.location.assign(`/?token=${encodeURIComponent(res.token)}`);
      } else {
        window.location.assign('/');
      }
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Login Failed',
        text: error?.message || 'Unable to switch to this user account.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  return (
    <Box className={classes.root}>
      {/* Top Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 } }}>
            <PersonOutlinedIcon sx={{ color: PRIMARY, fontSize: { xs: '20px', sm: '24px' } }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px !important', sm: '17px !important' },
                color: TEXT,
                letterSpacing: '-0.02em',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.2,
              }}
            >
              Users Management
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            boxSizing: 'border-box',
            flexWrap: { xs: 'nowrap', sm: 'wrap' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: SURFACE,
              borderRadius: '20px',
              paddingLeft: { xs: '10px', sm: '14px' },
              paddingRight: { xs: '6px', sm: '8px' },
              height: { xs: '34px', sm: '38px' },
              border: `1.5px solid ${BORDER}`,
              flex: { xs: 1, sm: 'none' },
              width: { xs: 'auto', sm: '270px' },
              minWidth: 0,
              transition: 'all 0.15s ease',
              '&:focus-within': {
                borderColor: PRIMARY,
                backgroundColor: SURFACE,
                boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
              },
            }}
          >
            <SearchIcon sx={{ color: TEXT_MUTED, fontSize: { xs: '15px', sm: '17px' }, marginRight: { xs: '4px', sm: '8px' }, flexShrink: 0 }} />
            <InputBase
              placeholder="Search users..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 400,
                color: TEXT,
                fontFamily: FONT_FAMILY,
              }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: { xs: '16px !important', sm: '18px !important' } }} />}
            onClick={handleOpenCreate}
            disableElevation
            sx={{
              height: { xs: '34px', sm: '38px' },
              minWidth: { xs: '96px', sm: '130px' },
              px: { xs: 1.2, sm: 2 },
              borderRadius: '8px',
              backgroundColor: PRIMARY,
              color: SURFACE,
              textTransform: 'none',
              fontSize: { xs: '12px !important', sm: '13px !important' },
              fontWeight: '600 !important',
              fontFamily: FONT_FAMILY,
              boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
              flexShrink: 0,
              '&:hover': { backgroundColor: PRIMARY_DARK },
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Main Table Container */}
      <Paper
        elevation={0}
        sx={{
          flex: '1 1 auto',
          width: '100%',
          height: 0,
          minHeight: 0,
          border: '1px solid #cbd5e1',
          borderRadius: { xs: '6px', sm: '8px' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            ...scrollableSx,
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              width: '100%',
              minWidth: '800px',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontFamily: FONT_FAMILY,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: { xs: 170, sm: 200 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  User Name
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: 190, sm: 220 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Email
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: { xs: 75, sm: 90 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '8px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Devices
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: 110, sm: 125 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: { xs: 95, sm: 105 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '8px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: 165, sm: 180 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Last Login
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: { xs: 175, sm: 200 },
                    fontWeight: '700 !important',
                    fontSize: { xs: '12px !important', sm: '13px !important' },
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    py: { xs: '7px', sm: '9px' },
                    px: { xs: '10px', sm: '14px' },
                    position: 'sticky',
                    top: 0,
                    right: 0,
                    zIndex: 3,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={24} sx={{ color: PRIMARY }} />
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: TEXT_SECONDARY, mt: 1, fontFamily: FONT_FAMILY }}>
                      Loading users and devices...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    isCurrentActiveUser={Boolean(currentUser?.id && String(currentUser.id) === String(user.id))}
                    liveLoginTime={userLoginAuditMap[user.id] || null}
                    deviceCount={userDevicesMap[user.id] ?? 0}
                    onLogin={handleLoginAsUser}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteUser}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      py: 4,
                      color: '#64748b',
                      fontSize: '12.5px',
                      fontWeight: 400,
                      ...fontStyle,
                    }}
                  >
                    No users found in the system.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Footer System Status Bar */}
      <Box
        sx={{
          mt: 'auto',
          pt: { xs: '6px', sm: '10px' },
          pb: '2px',
          px: { xs: '2px', sm: '6px' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          borderTop: '1px solid #e2e8f0',
          width: '100%',
          flexShrink: 0,
          gap: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DnsOutlinedIcon sx={{ fontSize: '14px', color: '#00ab8e' }} />
            <span style={{ color: '#64748b', fontSize: '11.5px', ...fontStyle }}>Server:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '11.5px', ...fontStyle }}>{serverHostIp}</strong>
          </Box>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: '14px', color: '#00ab8e' }} />
            <span style={{ color: '#64748b', fontSize: '11.5px', ...fontStyle }}>Version:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '11.5px', ...fontStyle }}>v{serverVersion}</strong>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            px: { xs: 1, sm: 1.4 },
            py: 0.4,
            borderRadius: '20px',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
            }}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#047857', letterSpacing: '0.2px', ...fontStyle }}>
            Live Connection Active
          </span>
        </Box>
      </Box>

      {/* FULLY RESPONSIVE POPUP MODAL */}
      <Dialog
        open={dialogOpen}
        onClose={(_, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown' || submitting) return;
          setDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: { xs: '10px', sm: '14px' },
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: FONT_FAMILY,
              width: { xs: 'calc(100% - 16px)', sm: '100%' },
              maxWidth: { xs: '100%', sm: '580px' },
              margin: { xs: '8px auto', sm: '24px auto' },
              maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 48px)' },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            margin: 0,
            padding: { xs: '12px 14px', sm: '14px 18px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SURFACE,
            borderBottom: `1px solid ${BORDER_LIGHT}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOutlinedIcon
              sx={{
                color: PRIMARY,
                fontSize: { xs: '18px', sm: '20px' },
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '14px !important', sm: '15px !important' },
                color: TEXT,
                fontFamily: FONT_FAMILY,
              }}
            >
              {selectedUser ? 'Edit User' : 'Add User'}
            </Typography>
          </Box>

          <IconButton
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
            size="small"
            sx={{
              color: TEXT_SECONDARY,
              padding: '4px',
              '&:hover': { backgroundColor: SURFACE_SOFT, color: TEXT },
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: '18px', sm: '20px' } }} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${BORDER}`,
              backgroundColor: SURFACE,
              minHeight: { xs: '38px', sm: '42px' },
              px: 0.5,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '11px !important', sm: '12px !important' },
                color: TEXT_SECONDARY,
                minHeight: { xs: '38px', sm: '42px' },
                padding: { xs: '4px 6px', sm: '6px 10px' },
                fontFamily: FONT_FAMILY,
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                gap: '4px',
                '& svg': {
                  margin: 0,
                  fontSize: { xs: '14px', sm: '16px' },
                },
              },
              '& .Mui-selected': {
                color: `${PRIMARY} !important`,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: PRIMARY,
                height: '2.5px',
              },
            }}
          >
            <Tab icon={<PersonOutlinedIcon />} iconPosition="start" label="General" />
            <Tab icon={<SecurityOutlinedIcon />} iconPosition="start" label="Security" />
            <Tab icon={<TuneIcon />} iconPosition="start" label="Roles" />
          </Tabs>

          <DialogContent
            sx={{
              padding: { xs: '14px', sm: '18px 20px' },
              minHeight: { xs: '240px', sm: '280px' },
              overflowY: 'auto',
              backgroundColor: SURFACE,
              boxSizing: 'border-box',
              ...scrollableSx,
            }}
          >
            {/* Tab 0: General Profile */}
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '11.5px', sm: '12px' }, color: TEXT, marginBottom: '4px', fontFamily: FONT_FAMILY }}>
                    <span style={{ color: '#ef4444', marginRight: '3px' }}>*</span>Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    placeholder="Enter full name..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: SURFACE, height: { xs: '36px', sm: '38px' } },
                      '& input': { fontSize: { xs: '12px', sm: '13px' }, fontWeight: 500, color: TEXT, fontFamily: FONT_FAMILY, padding: '6px 10px' },
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '11.5px', sm: '12px' }, color: TEXT, marginBottom: '4px', fontFamily: FONT_FAMILY }}>
                    <span style={{ color: '#ef4444', marginRight: '3px' }}>*</span>Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    size="small"
                    required
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    helperText={
                      !selectedUser
                        ? 'This email will serve as the username and will receive account credentials.'
                        : ''
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: SURFACE, height: { xs: '36px', sm: '38px' } },
                      '& input': { fontSize: { xs: '12px', sm: '13px' }, fontWeight: 500, color: TEXT, fontFamily: FONT_FAMILY, padding: '6px 10px' },
                      '& .MuiFormHelperText-root': { fontSize: { xs: '10.5px', sm: '11.5px' }, mt: 0.5 },
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '11.5px', sm: '12px' }, color: TEXT, marginBottom: '4px', fontFamily: FONT_FAMILY }}>
                    Account Expiration Date
                  </Typography>
                  <Box
                    onClick={openCalendar}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: { xs: '36px', sm: '38px' },
                      border: `1px solid ${BORDER}`,
                      borderRadius: '6px',
                      padding: '4px 10px',
                      backgroundColor: SURFACE,
                      cursor: 'pointer',
                      '&:hover': { borderColor: PRIMARY },
                    }}
                  >
                    <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 500, color: userExpirationTime ? TEXT : TEXT_MUTED, fontFamily: FONT_FAMILY }}>
                      {userExpirationTime || 'Select expiration date...'}
                    </Typography>
                    <CalendarMonthIcon sx={{ color: PRIMARY, fontSize: { xs: '16px', sm: '18px' } }} />
                    <input
                      ref={hiddenDateInputRef}
                      type="date"
                      value={userExpirationTime}
                      onChange={(e) => setUserExpirationTime(e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {/* Tab 1: Security */}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={userEmail}
                  readOnly
                  style={{ display: 'none' }}
                />

                <Box sx={{ position: 'relative', width: '100%' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '11.5px', sm: '12px' }, color: TEXT, marginBottom: '4px', fontFamily: FONT_FAMILY }}>
                    {!selectedUser && <span style={{ color: '#ef4444', marginRight: '3px' }}>*</span>}Password
                  </Typography>
                  <TextField
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    required={!selectedUser}
                    size="small"
                    autoComplete={selectedUser ? 'current-password' : 'new-password'}
                    placeholder={
                      selectedUser
                        ? 'Leave blank to keep existing password'
                        : 'Create password'
                    }
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                        backgroundColor: SURFACE,
                        height: { xs: '36px', sm: '38px' },
                        paddingRight: '40px',
                      },
                      '& input': { fontSize: { xs: '12px', sm: '13px' }, fontWeight: 500, color: TEXT, fontFamily: FONT_FAMILY, padding: '6px 10px' },
                    }}
                  />

                  <IconButton
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    sx={{
                      position: 'absolute',
                      right: '4px',
                      top: '28px',
                      width: 30,
                      height: 30,
                      color: '#64748b',
                    }}
                  >
                    {showPassword ? <VisibilityOffIcon sx={{ fontSize: '18px' }} /> : <VisibilityIcon sx={{ fontSize: '18px' }} />}
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Tab 2: Permissions */}
            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: { xs: 1.2, sm: 1.5 },
                    border: `1px solid ${BORDER}`,
                    borderRadius: '6px',
                    backgroundColor: SURFACE_SOFT,
                  }}
                >
                  <Box sx={{ pr: 1 }}>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 700, fontFamily: FONT_FAMILY }}>
                      Administrator Privileges
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '10.5px', sm: '11px' }, color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>
                      Grants full access to all devices, users, alerts, and system settings.
                    </Typography>
                  </Box>
                  <Checkbox
                    size="small"
                    checked={userAdmin}
                    onChange={(e) => setUserAdmin(e.target.checked)}
                    sx={{
                      color: '#cbd5e1',
                      p: { xs: 0.5, sm: 1 },
                      '&.Mui-checked': { color: PRIMARY },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: { xs: 1.2, sm: 1.5 },
                    border: `1px solid ${BORDER}`,
                    borderRadius: '6px',
                    backgroundColor: SURFACE_SOFT,
                  }}
                >
                  <Box sx={{ pr: 1 }}>
                    <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 700, fontFamily: FONT_FAMILY, color: userDisabled ? '#ef4444' : TEXT }}>
                      Disable Account
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '10.5px', sm: '11px' }, color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>
                      Temporarily prevent the user from logging in.
                    </Typography>
                  </Box>
                  <Checkbox
                    size="small"
                    checked={userDisabled}
                    onChange={(e) => setUserDisabled(e.target.checked)}
                    sx={{
                      color: '#cbd5e1',
                      p: { xs: 0.5, sm: 1 },
                      '&.Mui-checked': { color: '#ef4444' },
                    }}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ padding: { xs: '10px 14px', sm: '12px 18px' }, backgroundColor: SURFACE, borderTop: `1px solid ${BORDER_LIGHT}`, gap: 1 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: '6px',
                color: PRIMARY,
                borderColor: PRIMARY,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '11.5px !important', sm: '12px !important' },
                px: { xs: 1.8, sm: 2.2 },
                py: 0.4,
                fontFamily: FONT_FAMILY,
                '&:hover': { borderColor: PRIMARY_DARK, backgroundColor: '#f0fdfa' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              size="small"
              sx={{
                borderRadius: '6px',
                backgroundColor: PRIMARY,
                color: SURFACE,
                '&:hover': { backgroundColor: PRIMARY_DARK },
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '11.5px !important', sm: '12px !important' },
                px: { xs: 2.2, sm: 2.8 },
                py: 0.4,
                boxShadow: 'none',
                fontFamily: FONT_FAMILY,
              }}
            >
              {submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : selectedUser ? (
                'Update'
              ) : (
                'Save'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}