import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  memo,
} from 'react';

import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Radio,
  Checkbox,
  CircularProgress,
} from '@mui/material';

import Swal from 'sweetalert2';

import NearMeIcon from '@mui/icons-material/NearMe';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';

import deviceCategoriesList from '../../common/util/deviceCategories';
import { devicesActions, groupsActions, driversActions, usersActions } from '../../store';
import DeviceRow from './DeviceRow';

const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#f1f5f9';

const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const ROBOTO_FONT =
  "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const unitPrimaryTypographySx = {
  fontFamily: `${ROBOTO_FONT} !important`,
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#1e293b',
  lineHeight: 1.2,
};

const EMPTY_DEVICE_FORM = {
  id: null,
  name: '',
  uniqueId: '',
  disabled: false,
  expirationTime: '',
  userIds: [],
  category: 'default',
  phone: '',
  groupId: 0,
};

const menuPaperSx = {
  borderRadius: '8px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
  width: '180px',
  maxWidth: '220px',
  paddingTop: '3px',
  paddingBottom: '3px',
  border: `1px solid ${BORDER}`,
  marginTop: '4px',
  zIndex: 99999,
  fontFamily: `${ROBOTO_FONT} !important`,
  '&, & *': {
    fontFamily: `${ROBOTO_FONT} !important`,
  },
};

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',

  '&::-webkit-scrollbar': {
    width: '3px',
    height: '3px',
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

  '&::-webkit-scrollbar-corner': {
    backgroundColor: 'transparent',
  },
};

const STATUS_COLORS = {
  moving: '#15803D',       // 🟢 Deep Green (>= 1 km/h)
  parked: '#1D4ED8',       // 🔵 Deep Blue (< 1 km/h)
  notConnected: '#DC2626', // 🔴 Deep Red (Offline)
  expired: '#DC2626',
  unknown: '#64748B',
};

const evaluateLiveStatus = (device, position) => {
  if (!device) {
    return { status: 'notConnected', color: STATUS_COLORS.notConnected, label: 'Not Connected', speedKph: 0 };
  }

  const now = Date.now();
  const expirationTimestamp = device.expirationTime ? new Date(device.expirationTime).getTime() : null;
  if (expirationTimestamp && !Number.isNaN(expirationTimestamp) && now > expirationTimestamp) {
    return { status: 'expired', color: STATUS_COLORS.expired, label: 'Expired', speedKph: 0 };
  }

  const lastUpdateRaw =
    device.lastUpdate ||
    position?.serverTime ||
    position?.fixTime ||
    position?.deviceTime ||
    null;

  const lastUpdateTimestamp = lastUpdateRaw ? new Date(lastUpdateRaw).getTime() : null;
  const isOffline =
    device.status === 'offline' ||
    !lastUpdateTimestamp ||
    now - lastUpdateTimestamp > 3 * 3600000;

  if (isOffline) {
    return { status: 'notConnected', color: STATUS_COLORS.notConnected, label: 'Not Connected', speedKph: 0 };
  }

  const rawSpeed = position?.speed ? Number(position.speed) * 1.852 : 0;
  if (rawSpeed >= 1.0) {
    return { status: 'moving', color: STATUS_COLORS.moving, label: 'Moving', speedKph: Math.round(rawSpeed) };
  }

  return { status: 'parked', color: STATUS_COLORS.parked, label: 'Parked', speedKph: 0 };
};

const showAlertModal = (icon, title, text) => {
  Swal.fire({
    target: document.body,
    icon,
    title,
    text,
    timer: 1800,
    showConfirmButton: false,
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = '9999999';
        container.style.fontFamily = ROBOTO_FONT;
      }
    },
  });
};

const ObjectsView = ({
  positions = {},
  selectedDeviceId,
  onSelectDevice,
  onCollapsePanel,
}) => {
  const dispatch = useDispatch();
  const dateInputRef = useRef(null);

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const server = useSelector((state) => state.session?.server, shallowEqual) || {};
  const serverAttributes = server.attributes || {};

  const PRIMARY = serverAttributes.colorPrimary || serverAttributes.color || '#00ab8e';
  const PRIMARY_DARK = serverAttributes.buttonColor || PRIMARY;

  const reduxDevicesObj = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const reduxGroupsObj = useSelector((state) => state.groups?.items || {}, shallowEqual);
  const reduxUsersObj = useSelector((state) => state.users?.items || {}, shallowEqual);
  const reduxPositionsObj = useSelector((state) => state.session?.positions || {}, shallowEqual);

  const impersonatedUserId = localStorage.getItem('impersonated_user_id');

  const isAuthenticated = Boolean(currentUser);
  const isReadOnly = Boolean(currentUser?.readonly || server.readonly);
  const isDeviceReadOnly = Boolean(currentUser?.deviceReadonly || server.deviceReadonly);
  const canManageDevices = isAuthenticated && !isReadOnly && !isDeviceReadOnly;

  const isAdmin = useMemo(() => {
    if (!currentUser || Boolean(impersonatedUserId)) {
      return false;
    }

    return Boolean(
      currentUser.administrator ||
      currentUser.admin ||
      currentUser.id === 1
    );
  }, [currentUser, impersonatedUserId]);

  const canManageUsers = useMemo(() => {
    return Boolean(
      isAdmin ||
      currentUser?.administrator ||
      currentUser?.admin ||
      currentUser?.id === 1 ||
      (currentUser?.userLimit && currentUser.userLimit > 0)
    );
  }, [isAdmin, currentUser]);

  const devicesList = useMemo(() => {
    const list = Array.isArray(reduxDevicesObj)
      ? reduxDevicesObj
      : Object.values(reduxDevicesObj || {});

    return list.filter(Boolean);
  }, [reduxDevicesObj]);

  const fetchedGroups = useMemo(() => {
    const list = Array.isArray(reduxGroupsObj)
      ? reduxGroupsObj
      : Object.values(reduxGroupsObj || {});

    const byId = new Map();
    list.forEach((group) => {
      if (group && group.id !== undefined && group.id !== null) {
        byId.set(group.id, group);
      }
    });

    return Array.from(byId.values());
  }, [reduxGroupsObj]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [searchUser, setSearchUser] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [deviceData, setDeviceData] = useState(EMPTY_DEVICE_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('main');

  const [folderMenuAnchor, setFolderMenuAnchor] = useState(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupSelectedDeviceIds, setGroupSelectedDeviceIds] = useState([]);
  const [savingGroup, setSavingGroup] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadAllUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Object.values(data || {});
        setFetchedUsers(list);
        if (usersActions?.refresh) {
          dispatch(usersActions.refresh(list));
        }
      }
    } catch (e) {
    } finally {
      setLoadingUsers(false);
    }
  }, [dispatch]);

  const allUsersList = useMemo(() => {
    const fromRedux = Array.isArray(reduxUsersObj)
      ? reduxUsersObj
      : Object.values(reduxUsersObj || {});

    const byId = new Map();
    fromRedux.forEach((user) => {
      if (user && user.id !== undefined && user.id !== null) {
        byId.set(user.id, user);
      }
    });

    fetchedUsers.forEach((user) => {
      if (user && user.id !== undefined && user.id !== null) {
        byId.set(user.id, user);
      }
    });

    return Array.from(byId.values());
  }, [reduxUsersObj, fetchedUsers]);

  const canShowUsersTab = useMemo(() => {
    return Boolean(canManageUsers || allUsersList.length > 0);
  }, [canManageUsers, allUsersList.length]);

  const refreshCoreData = useCallback(async () => {
    try {
      let devicesRes;
      if (impersonatedUserId) {
        devicesRes = await fetch(`/api/devices?userId=${impersonatedUserId}`, { credentials: 'include' });
      } else if (isAdmin) {
        devicesRes = await fetch('/api/devices?all=true', { credentials: 'include' });
        if (!devicesRes.ok) {
          devicesRes = await fetch('/api/devices', { credentials: 'include' });
        }
      } else {
        devicesRes = await fetch('/api/devices', { credentials: 'include' });
      }

      const driverEndpoint = impersonatedUserId
        ? `/api/drivers?userId=${impersonatedUserId}`
        : '/api/drivers';

      const [groupsRes, driversRes] = await Promise.all([
        fetch('/api/groups', { credentials: 'include' }),
        fetch(driverEndpoint, { credentials: 'include' }),
      ]);

      if (devicesRes && devicesRes.ok) {
        const data = await devicesRes.json();
        const list = Array.isArray(data) ? data : Object.values(data || {});
        dispatch(devicesActions.refresh(list));
      }

      if (groupsRes && groupsRes.ok) {
        const groupData = await groupsRes.json();
        const gList = Array.isArray(groupData)
          ? groupData
          : Object.values(groupData || {});
        if (groupsActions?.refresh) {
          dispatch(groupsActions.refresh(gList));
        }
      }

      if (driversRes && driversRes.ok) {
        const driverData = await driversRes.json();
        const drList = Array.isArray(driverData)
          ? driverData
          : Object.values(driverData || {});
        if (driversActions?.refresh) {
          dispatch(driversActions.refresh(drList));
        }
      }
    } catch (e) {}
  }, [dispatch, impersonatedUserId, isAdmin]);

  useEffect(() => {
    refreshCoreData();
    loadAllUsers();
  }, [refreshCoreData, loadAllUsers]);

  const filteredUsersList = useMemo(() => {
    const query = searchUser.trim().toLowerCase();
    if (!query) return allUsersList;
    return allUsersList.filter((user) => {
      const email = String(user?.email || '').toLowerCase();
      const login = String(user?.login || '').toLowerCase();
      const name = String(user?.name || '').toLowerCase();
      return (
        email.includes(query) ||
        login.includes(query) ||
        name.includes(query)
      );
    });
  }, [allUsersList, searchUser]);

  const handleOpenAddDevice = useCallback(() => {
    loadAllUsers();
    const defaultUserIds = currentUser?.id ? [currentUser.id] : [];
    setDeviceData({
      ...EMPTY_DEVICE_FORM,
      userIds: defaultUserIds,
    });
    setSearchUser('');
    setSearchGroup('');
    setActiveTab('main');
    setAddDeviceOpen(true);
  }, [loadAllUsers, currentUser?.id]);

  const filteredGroupsList = useMemo(() => {
    const query = searchGroup.trim().toLowerCase();
    if (!query) return fetchedGroups;
    return fetchedGroups.filter((group) =>
      String(group?.name || '')
        .toLowerCase()
        .includes(query)
    );
  }, [fetchedGroups, searchGroup]);

  // SINGLE-CLICK SELECTION
  const handleDeviceSelection = useCallback(
    (id) => {
      if (addDeviceOpen) {
        setAddDeviceOpen(false);
        setDeviceData(EMPTY_DEVICE_FORM);
      }

      dispatch(devicesActions.selectId(id));
      if (onSelectDevice) onSelectDevice(id);
    },
    [dispatch, onSelectDevice, addDeviceOpen]
  );

  const statusCounts = useMemo(() => {
    const counts = {
      all: devicesList.length,
      moving: 0,
      parked: 0,
      notConnected: 0,
      expired: 0,
    };

    devicesList.forEach((device) => {
      const pos = positions[device.id] || reduxPositionsObj[device.id];
      const { status } = evaluateLiveStatus(device, pos);
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [devicesList, positions, reduxPositionsObj]);

  const groupedDevices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const groupBuckets = {};

    const ungroupedBucket = {
      id: 0,
      name: 'UNGROUPED',
      items: [],
    };

    fetchedGroups.forEach((group) => {
      groupBuckets[group.id] = {
        id: group.id,
        name: group.name,
        items: [],
      };
    });

    devicesList.forEach((device) => {
      const name = (device.name || '').toLowerCase();
      const uniqueId = (device.uniqueId || '').toLowerCase();

      const matchesSearch =
        !query || name.includes(query) || uniqueId.includes(query);

      if (!matchesSearch) return;

      if (statusFilter !== 'all') {
        const pos = positions[device.id] || reduxPositionsObj[device.id];
        const { status } = evaluateLiveStatus(device, pos);
        if (status !== statusFilter) {
          return;
        }
      }

      const gid = device.groupId ? Number(device.groupId) : 0;
      if (gid > 0 && groupBuckets[gid]) {
        groupBuckets[gid].items.push(device);
      } else {
        ungroupedBucket.items.push(device);
      }
    });

    const activeGroups = Object.values(groupBuckets)
      .filter((grp) => grp.items.length > 0)
      .map((grp) => ({
        ...grp,
        items: grp.items.sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', undefined, {
            sensitivity: 'base',
          })
        ),
      }))
      .sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, {
          sensitivity: 'base',
        })
      );

    if (ungroupedBucket.items.length > 0) {
      ungroupedBucket.items.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, {
          sensitivity: 'base',
        })
      );
      activeGroups.push(ungroupedBucket);
    }

    return activeGroups;
  }, [devicesList, fetchedGroups, searchQuery, statusFilter, positions, reduxPositionsObj]);

  const handleOpenAddNewGroup = useCallback(() => {
    if (!canManageDevices) {
      showAlertModal('error', 'Unauthorized', 'You do not have permission to manage groups.');
      return;
    }
    setEditingGroupId(null);
    setGroupTitle('');
    setGroupSelectedDeviceIds([]);
    setFolderMenuAnchor(null);
    setGroupDialogOpen(true);
  }, [canManageDevices]);

  const handleSaveGroupModal = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      const trimmedTitle = groupTitle.trim();

      if (!trimmedTitle) {
        showAlertModal('error', 'Required Field', 'Group title is required.');
        return;
      }

      const isEdit = Boolean(editingGroupId && editingGroupId !== 0);
      if (!isEdit) {
        const nameTaken = fetchedGroups.some(
          (g) => (g.name || '').trim().toLowerCase() === trimmedTitle.toLowerCase()
        );
        if (nameTaken) {
          showAlertModal('error', 'Group Exists', `A group named "${trimmedTitle}" already exists.`);
          return;
        }
      }

      setSavingGroup(true);
      const endpoint = isEdit ? `/api/groups/${editingGroupId}` : '/api/groups';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const payload = {
          ...(isEdit ? { id: editingGroupId } : {}),
          name: trimmedTitle,
        };

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to save group');
        const savedGroup = await response.json();

        if (!isEdit && currentUser?.id) {
          await fetch('/api/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              userId: currentUser.id,
              groupId: savedGroup.id,
            }),
          }).catch(() => null);
        }

        if (isEdit) {
          if (groupsActions?.update) {
            dispatch(groupsActions.update([savedGroup]));
          }
        } else if (groupsActions?.add) {
          dispatch(groupsActions.add([savedGroup]));
        }

        const updates = [];
        devicesList.forEach((device) => {
          const isSelected = groupSelectedDeviceIds.includes(device.id);
          const currentlyInGroup = Number(device.groupId) === Number(savedGroup.id);

          if (isSelected && !currentlyInGroup) {
            updates.push(
              fetch(`/api/devices/${device.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...device, groupId: savedGroup.id }),
              })
                .then((res) => (res.ok ? res.json() : null))
                .then((updated) => {
                  if (updated) dispatch(devicesActions.update([updated]));
                })
            );
          } else if (!isSelected && currentlyInGroup) {
            updates.push(
              fetch(`/api/devices/${device.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...device, groupId: 0 }),
              })
                .then((res) => (res.ok ? res.json() : null))
                .then((updated) => {
                  if (updated) dispatch(devicesActions.update([updated]));
                })
            );
          }
        });

        await Promise.all(updates);
        await refreshCoreData();
        setGroupDialogOpen(false);
        showAlertModal('success', 'Group Saved', `Group "${savedGroup.name}" saved successfully!`);
      } catch (error) {
        showAlertModal('error', 'Error', error.message || 'Failed to save group.');
      } finally {
        setSavingGroup(false);
      }
    },
    [
      dispatch,
      editingGroupId,
      groupSelectedDeviceIds,
      groupTitle,
      devicesList,
      currentUser?.id,
      fetchedGroups,
      refreshCoreData,
    ]
  );

  const handleEditDevice = useCallback(
    async (device) => {
      if (!device) return;
      loadAllUsers();

      let assignedUserIds = [];
      try {
        const usersResponse = await fetch(`/api/users?deviceId=${device.id}`, {
          credentials: 'include',
        });
        if (usersResponse.ok) {
          const userList = await usersResponse.json();
          if (Array.isArray(userList)) {
            assignedUserIds = userList.map((u) => u.id).filter(Boolean);
          }
        }
      } catch (e) {}

      if (assignedUserIds.length === 0 && currentUser?.id) {
        assignedUserIds = [currentUser.id];
      }

      setDeviceData({
        id: device.id,
        name: device.name || '',
        uniqueId: device.uniqueId || '',
        disabled: Boolean(device.disabled),
        expirationTime: device.expirationTime || '',
        category: device.category || 'default',
        phone: device.phone || '',
        groupId: device.groupId ? Number(device.groupId) : 0,
        userIds: assignedUserIds,
      });

      setSearchUser('');
      setSearchGroup('');
      setActiveTab('main');
      setAddDeviceOpen(true);
    },
    [loadAllUsers, currentUser?.id]
  );

  const handleDeleteDevice = useCallback(
    async (device) => {
      if (!device?.id) return;
      if (!isAdmin) {
        showAlertModal('error', 'Unauthorized', 'Only administrators can delete units.');
        return;
      }

      const result = await Swal.fire({
        title: 'Delete Unit?',
        text: `Are you sure you want to delete "${device.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
      });

      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/devices/${device.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Failed to delete unit.');
          dispatch(devicesActions.remove(device.id));
          showAlertModal('success', 'Deleted', `Unit "${device.name}" deleted successfully!`);
        } catch (error) {
          showAlertModal('error', 'Error', error.message || 'Failed to delete unit.');
        }
      }
    },
    [dispatch, isAdmin]
  );

  const handleCloseAddDevice = useCallback(
    (_, reason) => {
      if (reason === 'backdropClick' || reason === 'escapeKeyDown' || saving) {
        return;
      }
      setAddDeviceOpen(false);
      setDeviceData(EMPTY_DEVICE_FORM);
      setActiveTab('main');
      setSearchUser('');
      setSearchGroup('');
    },
    [saving]
  );

  const handleDateChange = useCallback((dateString) => {
    if (!dateString) {
      setDeviceData((prev) => ({ ...prev, expirationTime: '' }));
      return;
    }
    const selectedDate = new Date(dateString);
    selectedDate.setHours(23, 59, 59, 999);
    setDeviceData((prev) => ({
      ...prev,
      expirationTime: selectedDate.toISOString(),
    }));
  }, []);

  const triggerCalendarPicker = useCallback(() => {
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      } catch (err) {
        dateInputRef.current.focus();
      }
    }
  }, []);

  const handleSaveDevice = useCallback(
    async (event) => {
      if (event) event.preventDefault();

      if (!deviceData.name.trim()) {
        setActiveTab('main');
        showAlertModal('error', 'Required Field', 'Unit name is required');
        return;
      }

      if (isAdmin && !deviceData.uniqueId.trim()) {
        setActiveTab('main');
        showAlertModal('error', 'Required Field', 'IMEI is required');
        return;
      }

      setSaving(true);
      const isEdit = Boolean(deviceData.id);
      const endpoint = isEdit ? `/api/devices/${deviceData.id}` : '/api/devices';
      const httpMethod = isEdit ? 'PUT' : 'POST';

      try {
        const payload = {
          ...(isEdit ? { id: deviceData.id } : {}),
          name: deviceData.name.trim(),
          uniqueId: deviceData.uniqueId.trim(),
          disabled: deviceData.disabled,
          expirationTime: deviceData.expirationTime
            ? new Date(deviceData.expirationTime).toISOString()
            : undefined,
          category: deviceData.category || 'default',
          phone: deviceData.phone.trim() || undefined,
          groupId: Number(deviceData.groupId) || 0,
        };

        const response = await fetch(endpoint, {
          method: httpMethod,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to save device');
        const savedDevice = await response.json();

        // Persist User Permissions Associations
        if (deviceData.userIds && Array.isArray(deviceData.userIds)) {
          if (!isEdit) {
            for (const uid of deviceData.userIds) {
              await fetch('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId: uid, deviceId: savedDevice.id }),
              }).catch(() => null);
            }
          } else {
            const initialUsersRes = await fetch(`/api/users?deviceId=${savedDevice.id}`, { credentials: 'include' }).catch(() => null);
            let prevUserIds = [];
            if (initialUsersRes && initialUsersRes.ok) {
              const prevList = await initialUsersRes.json().catch(() => []);
              if (Array.isArray(prevList)) prevUserIds = prevList.map((u) => u.id).filter(Boolean);
            }
            const toAdd = deviceData.userIds.filter((id) => !prevUserIds.includes(id));
            const toRemove = prevUserIds.filter((id) => !deviceData.userIds.includes(id));

            for (const uid of toAdd) {
              await fetch('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId: uid, deviceId: savedDevice.id }),
              }).catch(() => null);
            }
            for (const uid of toRemove) {
              await fetch('/api/permissions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId: uid, deviceId: savedDevice.id }),
              }).catch(() => null);
            }
          }
        }

        if (isEdit) {
          dispatch(devicesActions.update([savedDevice]));
          showAlertModal('success', 'Unit Updated', `Unit "${savedDevice.name}" updated successfully!`);
        } else {
          dispatch(devicesActions.add([savedDevice]));
          showAlertModal('success', 'Unit Created', `Unit "${savedDevice.name}" created successfully!`);
        }

        setAddDeviceOpen(false);
        setDeviceData(EMPTY_DEVICE_FORM);
      } catch (error) {
        showAlertModal('error', 'Error', error.message || 'Failed to save device.');
      } finally {
        setSaving(false);
      }
    },
    [deviceData, dispatch, isAdmin]
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        backgroundColor: SURFACE,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: { xs: '10px 4px 6px 6px', sm: '16px 0 10px 10px' },
        overflow: 'hidden',
        fontFamily: `${ROBOTO_FONT} !important`,
        fontSize: '12px',
        touchAction: 'pan-y',
        WebkitFontSmoothing: 'antialiased',
        '&, & *': {
          fontFamily: `${ROBOTO_FONT} !important`,
        },
      }}
    >
      {/* HEADER ROW */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minWidth: 0,
          marginBottom: '10px',
          flexShrink: 0,
          paddingRight: '6px',
          paddingLeft: '2px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <NearMeIcon
            sx={{
              color: PRIMARY,
              transform: 'rotate(45deg)',
              fontSize: '20px',
              flexShrink: 0,
            }}
          />

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '16px !important',
              color: TEXT,
              letterSpacing: '-0.01em',
              fontFamily: `${ROBOTO_FONT} !important`,
            }}
          >
            Objects
          </Typography>
        </Box>

        {onCollapsePanel && (
          <IconButton
            size="small"
            tabIndex={-1}
            onClick={onCollapsePanel}
            sx={{
              width: '32px',
              height: '32px',
              border: `1.5px solid ${BORDER}`,
              borderRadius: '8px',
              color: TEXT_SECONDARY,
              backgroundColor: SURFACE,
              flexShrink: 0,
              padding: 0,
              '&:hover': {
                backgroundColor: SURFACE_SOFT,
                color: PRIMARY,
                borderColor: '#94a3b8',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: '20px' }} />
          </IconButton>
        )}
      </Box>

      {/* SEARCH / FILTER / ADD ROW */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          width: '100%',
          minWidth: 0,
          flexShrink: 0,
          paddingRight: '6px',
          paddingLeft: '2px',
        }}
      >
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: SURFACE_SOFT,
            borderRadius: '20px',
            paddingLeft: '10px',
            paddingRight: '4px',
            height: '36px',
            border: `1.5px solid ${BORDER}`,
            '&:focus-within': {
              borderColor: PRIMARY,
              backgroundColor: SURFACE,
              boxShadow: `0 0 0 2px ${PRIMARY}25`,
            },
          }}
        >
          <SearchIcon
            sx={{
              color: TEXT_MUTED,
              fontSize: '17px',
              marginRight: '6px',
              flexShrink: 0,
            }}
          />

          <InputBase
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: { xs: '16px', sm: '13px' },
              fontWeight: 400,
              color: TEXT,
              fontFamily: `${ROBOTO_FONT} !important`,
            }}
          />

          <IconButton
            size="small"
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            sx={{
              padding: '4px',
              color: statusFilter !== 'all' ? PRIMARY : TEXT_MUTED,
            }}
          >
            <FilterListIcon sx={{ fontSize: '16px' }} />
          </IconButton>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          sx={{
            width: '36px',
            height: '36px',
            border: statusFilter !== 'all' ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
            borderRadius: '8px',
            backgroundColor: statusFilter !== 'all' ? '#e6f7f4' : SURFACE,
            color: PRIMARY,
            flexShrink: 0,
          }}
        >
          <MenuIcon sx={{ fontSize: '18px' }} />
        </IconButton>

        {canManageDevices && (
          <IconButton
            size="small"
            onClick={handleOpenAddDevice}
            sx={{
              width: '36px',
              height: '36px',
              backgroundColor: `${PRIMARY_DARK} !important`,
              color: `${SURFACE} !important`,
              borderRadius: '8px',
              flexShrink: 0,
              boxShadow: `0 2px 6px ${PRIMARY_DARK}35`,
              '&:hover': {
                filter: 'brightness(0.92)',
              },
            }}
          >
            <AddIcon sx={{ fontSize: '19px' }} />
          </IconButton>
        )}
      </Box>

      {/* FOLDER ICON BAR */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginBottom: '6px',
          paddingBottom: '4px',
          paddingLeft: '2px',
          marginRight: '6px',
          borderBottom: `1.5px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => setFolderMenuAnchor(e.currentTarget)}
          sx={{
            color: PRIMARY,
            borderRadius: '6px',
            padding: '3px',
            backgroundColor: '#f0fdfa',
            border: `1px solid #ccfbf1`,
            '&:hover': {
              backgroundColor: '#ccfbf1',
              borderColor: PRIMARY,
            },
          }}
        >
          <FolderOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ACCORDION GROUPS & DEVICES LIST */}
      <Box
        sx={{
          flex: '1 1 0',
          height: 0,
          minHeight: 0,
          width: '100%',
          minWidth: 0,
          overflowY: 'scroll',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          paddingRight: '2px',
          paddingLeft: 0,
          paddingBottom: '2px',
          boxSizing: 'border-box',
          ...scrollableSx,
        }}
      >
        {groupedDevices.length > 0 ? (
          groupedDevices.map((group) => (
            <Accordion
              key={group.id}
              defaultExpanded
              disableGutters
              elevation={0}
              sx={{
                width: '100%',
                flexShrink: 0,
                border: `1.5px solid ${BORDER}`,
                borderRadius: '10px !important',
                overflow: 'hidden',
                backgroundColor: SURFACE,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                margin: 0,
                '&::before': { display: 'none' },
                '&.Mui-expanded': { margin: 0 },
              }}
            >
              <AccordionSummary
                component="div"
                expandIcon={null}
                sx={{
                  minHeight: '38px',
                  height: '38px',
                  padding: '0 8px',
                  backgroundColor: SURFACE,
                  cursor: 'pointer',
                  borderBottom: 'none',
                  '&.Mui-expanded': {
                    minHeight: '38px',
                    height: '38px',
                    borderBottom: `1.5px solid ${BORDER}`,
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                  <KeyboardArrowDownIcon
                    sx={{
                      color: TEXT_SECONDARY,
                      fontSize: '18px',
                      transition: 'transform 0.2s ease',
                      transform: 'rotate(-90deg)',
                      flexShrink: 0,
                      '.Mui-expanded &': {
                        transform: 'rotate(0deg)',
                      },
                    }}
                  />

                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 700,
                      fontSize: '12.5px !important',
                      color: TEXT,
                      letterSpacing: '-0.01em',
                      textTransform: 'uppercase',
                      fontFamily: `${ROBOTO_FONT} !important`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {group.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <Chip
                    label={group.items.length}
                    size="small"
                    sx={{
                      height: '18px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#f1f5f9',
                      color: TEXT_SECONDARY,
                      borderRadius: '4px',
                      fontFamily: `${ROBOTO_FONT} !important`,
                    }}
                  />

                  {canManageDevices && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGroupId(group.id);
                        setGroupTitle(group.name);
                        setGroupSelectedDeviceIds(group.items.map((d) => d.id));
                        setGroupDialogOpen(true);
                      }}
                      sx={{ padding: '2px', color: '#64748b' }}
                    >
                      <MoreVertIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: SURFACE,
                  minWidth: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                  overflow: 'visible',
                }}
              >
                {group.items.map((device) => {
                  const isSelected =
                    selectedDeviceId != null &&
                    String(device.id) === String(selectedDeviceId);

                  return (
                    <DeviceRow
                      key={device.id}
                      deviceId={device.id}
                      item={device}
                      position={positions[device.id] || reduxPositionsObj[device.id]}
                      selected={isSelected}
                      onSelect={handleDeviceSelection}
                      onEdit={handleEditDevice}
                      onDelete={handleDeleteDevice}
                    />
                  );
                })}
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Box
            sx={{
              padding: '28px 10px',
              textAlign: 'center',
              color: TEXT_MUTED,
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: `${ROBOTO_FONT} !important`,
            }}
          >
            No objects found.
          </Box>
        )}
      </Box>

      {/* GROUP MENU */}
      <Menu
        anchorEl={folderMenuAnchor}
        open={Boolean(folderMenuAnchor)}
        onClose={() => setFolderMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              ...menuPaperSx,
              minWidth: '130px',
            },
          },
        }}
      >
        <MenuItem
          onClick={handleOpenAddNewGroup}
          sx={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500,
            color: TEXT,
            fontFamily: `${ROBOTO_FONT} !important`,
            '&:hover': {
              backgroundColor: '#f0fdfa',
              color: PRIMARY,
            },
          }}
        >
          Add new group
        </MenuItem>
      </Menu>

      {/* FILTER MENU (CLEAN TITLES: MOVING, PARKED, NOT CONNECTED, EXPIRED) */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: menuPaperSx },
        }}
      >
        <Typography
          sx={{
            padding: '4px 10px 2px',
            fontSize: '10.5px !important',
            fontWeight: 700,
            color: TEXT_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontFamily: `${ROBOTO_FONT} !important`,
          }}
        >
          Filter Status
        </Typography>

        <MenuItem
          onClick={() => {
            setStatusFilter('all');
            setFilterMenuAnchor(null);
          }}
          sx={{
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            minHeight: '30px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <ListItemIcon sx={{ minWidth: 'auto', mr: 0.2 }}>
              <DirectionsCarOutlinedIcon sx={{ fontSize: '15px', color: TEXT_SECONDARY }} />
            </ListItemIcon>
            <ListItemText
              primary="All Units"
              primaryTypographyProps={{
                ...unitPrimaryTypographySx,
                fontSize: '12px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            />
          </Box>
          <Chip
            label={statusCounts.all}
            size="small"
            sx={{
              height: '16px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: '#f1f5f9',
              color: TEXT_SECONDARY,
              fontFamily: `${ROBOTO_FONT} !important`,
            }}
          />
        </MenuItem>

        <Divider sx={{ margin: '2px 0', borderColor: BORDER_LIGHT }} />

        {[
          { key: 'moving', label: 'MOVING', bg: '#dcfce7', color: STATUS_COLORS.moving },
          { key: 'parked', label: 'PARKED', bg: '#dbeafe', color: STATUS_COLORS.parked },
          { key: 'notConnected', label: 'NOT CONNECTED', bg: '#fee2e2', color: STATUS_COLORS.notConnected },
          { key: 'expired', label: 'EXPIRED', bg: '#fee2e2', color: STATUS_COLORS.expired },
        ].map((item) => (
          <MenuItem
            key={item.key}
            onClick={() => {
              setStatusFilter(item.key);
              setFilterMenuAnchor(null);
            }}
            sx={{
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              minHeight: '30px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <ListItemIcon sx={{ minWidth: 'auto', mr: 0.2 }}>
                <Box
                  sx={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  ...unitPrimaryTypographySx,
                  fontSize: '11.5px',
                  letterSpacing: '0.01em',
                  fontWeight: 600,
                  color: item.color,
                }}
              />
            </Box>
            <Chip
              label={statusCounts[item.key] || 0}
              size="small"
              sx={{
                height: '16px',
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: item.bg,
                color: item.color,
                fontFamily: `${ROBOTO_FONT} !important`,
              }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* CREATE/EDIT GROUP DIALOG */}
      <Dialog
        open={groupDialogOpen}
        onClose={() => {
          if (!savingGroup) setGroupDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px',
              backgroundColor: SURFACE,
              fontFamily: `${ROBOTO_FONT} !important`,
              '&, & *': {
                fontFamily: `${ROBOTO_FONT} !important`,
              },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            p: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1.5px solid ${BORDER_LIGHT}`,
            fontFamily: `${ROBOTO_FONT} !important`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOutlinedIcon sx={{ color: PRIMARY, fontSize: '18px' }} />
            <Typography sx={{ fontWeight: 600, fontSize: '15px !important', color: TEXT, fontFamily: `${ROBOTO_FONT} !important` }}>
              {editingGroupId ? 'Edit Group' : 'Create Group'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setGroupDialogOpen(false)} disabled={savingGroup}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveGroupModal}>
          <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: TEXT, mb: 0.5, fontFamily: `${ROBOTO_FONT} !important` }}>
                Group Title
              </Typography>
              <TextField
                fullWidth
                size="small"
                required
                placeholder="Enter group name..."
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                sx={{
                  '& input': {
                    fontFamily: `${ROBOTO_FONT} !important`,
                    fontSize: { xs: '16px', sm: '13px' },
                    fontWeight: 400,
                  },
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: TEXT, fontFamily: `${ROBOTO_FONT} !important` }}>
                  Group Units ({groupSelectedDeviceIds.length}/{devicesList.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setGroupSelectedDeviceIds(devicesList.map((d) => d.id))}
                    sx={{ textTransform: 'none', color: PRIMARY, fontWeight: 600, fontSize: '12px', p: 0, fontFamily: `${ROBOTO_FONT} !important` }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setGroupSelectedDeviceIds([])}
                    sx={{ textTransform: 'none', color: TEXT_SECONDARY, fontWeight: 600, fontSize: '12px', p: 0, fontFamily: `${ROBOTO_FONT} !important` }}
                  >
                    Deselect All
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: '8px',
                  p: 1,
                  backgroundColor: SURFACE_SOFT,
                  ...scrollableSx,
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1 }}>
                  {devicesList.map((device) => {
                    const isSelected = groupSelectedDeviceIds.includes(device.id);
                    return (
                      <Box
                        key={device.id}
                        onClick={() =>
                          setGroupSelectedDeviceIds((prev) =>
                            prev.includes(device.id)
                              ? prev.filter((id) => id !== device.id)
                              : [...prev, device.id]
                          )
                        }
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: isSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#f0fdfa' : SURFACE,
                          height: '38px',
                          px: 1,
                          cursor: 'pointer',
                          minWidth: 0,
                        }}
                      >
                        <Radio
                          size="small"
                          checked={isSelected}
                          sx={{
                            p: 0.2,
                            mr: 0.5,
                            color: '#cbd5e1',
                            '&.Mui-checked': { color: PRIMARY },
                          }}
                        />
                        <Typography
                          noWrap
                          sx={{
                            ...unitPrimaryTypographySx,
                            fontSize: '13px',
                            fontWeight: 600,
                            color: isSelected ? '#0f172a' : TEXT,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {device.name}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: '12px 18px', borderTop: `1.5px solid ${BORDER_LIGHT}` }}>
            <Button
              onClick={() => setGroupDialogOpen(false)}
              disabled={savingGroup}
              variant="outlined"
              sx={{
                borderRadius: '8px',
                color: PRIMARY,
                borderColor: PRIMARY,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '13px',
                height: '36px',
                fontFamily: `${ROBOTO_FONT} !important`,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingGroup}
              sx={{
                borderRadius: '8px',
                backgroundColor: `${PRIMARY_DARK} !important`,
                color: `${SURFACE} !important`,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                height: '36px',
                px: 3,
                fontFamily: `${ROBOTO_FONT} !important`,
                '&:hover': { filter: 'brightness(0.92)' },
              }}
            >
              {savingGroup ? 'Saving...' : 'Save Group'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADD/EDIT UNIT DIALOG */}
      <Dialog
        open={addDeviceOpen}
        onClose={handleCloseAddDevice}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px',
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
              fontFamily: `${ROBOTO_FONT} !important`,
              width: '100%',
              maxWidth: '680px',
              margin: { xs: '8px', sm: '24px' },
              '&, & *': {
                fontFamily: `${ROBOTO_FONT} !important`,
              },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            margin: 0,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SURFACE,
            borderBottom: `1.5px solid ${BORDER_LIGHT}`,
            fontFamily: `${ROBOTO_FONT} !important`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <NearMeIcon
              sx={{
                color: PRIMARY,
                fontSize: '18px',
                transform: 'rotate(45deg)',
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontWeight: 600, fontSize: '15px !important', color: TEXT, fontFamily: `${ROBOTO_FONT} !important` }}>
              {deviceData.id ? 'Edit Unit' : 'Add Unit'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseAddDevice} disabled={saving} size="small" sx={{ color: TEXT_SECONDARY, padding: '4px' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveDevice} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              borderBottom: `1.5px solid ${BORDER}`,
              backgroundColor: SURFACE,
              minHeight: '42px',
              px: 1,
              '& .MuiTabs-flexContainer': {
                justifyContent: 'space-between',
                width: '100%',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '13px',
                color: TEXT_SECONDARY,
                minHeight: '42px',
                minWidth: 'auto',
                padding: '0 12px',
                fontFamily: `${ROBOTO_FONT} !important`,
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                gap: '6px',
                '& svg': { margin: 0, fontSize: '16px' },
              },
              '& .Mui-selected': {
                color: `${PRIMARY} !important`,
                fontWeight: '600 !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: PRIMARY,
                height: '2.5px',
              },
            }}
          >
            <Tab value="main" icon={<NearMeIcon sx={{ transform: 'rotate(45deg)' }} />} iconPosition="start" label="Main" />
            <Tab value="users" icon={<PeopleIcon />} iconPosition="start" label={`Users (${deviceData.userIds?.length || 0})`} />
            <Tab value="groups" icon={<FolderOutlinedIcon />} iconPosition="start" label="Groups" />
            {isAdmin && <Tab value="icons" icon={<CategoryIcon />} iconPosition="start" label="Icons" />}
          </Tabs>

          <DialogContent
            sx={{
              padding: '20px 22px',
              minHeight: '340px',
              maxHeight: '480px',
              overflowY: 'auto',
              backgroundColor: SURFACE,
              ...scrollableSx,
            }}
          >
            {activeTab === 'main' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: `${ROBOTO_FONT} !important` }}>
                    <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>
                    Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    placeholder="Insert name..."
                    value={deviceData.name}
                    onChange={(e) => setDeviceData({ ...deviceData, name: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& input': {
                        fontSize: { xs: '16px', sm: '13px' },
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: `${ROBOTO_FONT} !important`,
                        padding: '8.5px 12px',
                      },
                    }}
                  />
                </Box>

                {isAdmin && (
                  <>
                    <Box>
                      <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: `${ROBOTO_FONT} !important` }}>
                        <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>
                        IMEI
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        placeholder="Insert IMEI..."
                        value={deviceData.uniqueId}
                        onChange={(e) => setDeviceData({ ...deviceData, uniqueId: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                          '& input': {
                            fontSize: { xs: '16px', sm: '13px' },
                            fontWeight: 400,
                            color: TEXT,
                            fontFamily: `${ROBOTO_FONT} !important`,
                            padding: '8.5px 12px',
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: `${ROBOTO_FONT} !important` }}>
                        SIM Phone Number
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="+123..."
                        value={deviceData.phone}
                        onChange={(e) => setDeviceData({ ...deviceData, phone: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                          '& input': {
                            fontSize: { xs: '16px', sm: '13px' },
                            fontWeight: 400,
                            color: TEXT,
                            fontFamily: `${ROBOTO_FONT} !important`,
                            padding: '8.5px 12px',
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: `${ROBOTO_FONT} !important` }}>
                        Expiration date
                      </Typography>
                      <Box
                        onClick={triggerCalendarPicker}
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '38px',
                          border: `1.5px solid ${BORDER}`,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          backgroundColor: SURFACE,
                          cursor: 'pointer',
                          userSelect: 'none',
                          touchAction: 'manipulation',
                          '&:hover': { borderColor: PRIMARY },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '13px',
                            fontWeight: 400,
                            color: deviceData.expirationTime ? TEXT : TEXT_MUTED,
                            fontFamily: `${ROBOTO_FONT} !important`,
                            pointerEvents: 'none',
                          }}
                        >
                          {deviceData.expirationTime
                            ? deviceData.expirationTime.split('T')[0]
                            : 'Select the date'}
                        </Typography>
                        <CalendarMonthIcon sx={{ color: PRIMARY, fontSize: '18px', flexShrink: 0, pointerEvents: 'none' }} />
                        <input
                          ref={dateInputRef}
                          type="date"
                          value={deviceData.expirationTime ? deviceData.expirationTime.split('T')[0] : ''}
                          onChange={(e) => handleDateChange(e.target.value)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            zIndex: 10,
                          }}
                        />
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            )}

            {activeTab === 'users' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search user by email or name..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& input': {
                        fontFamily: `${ROBOTO_FONT} !important`,
                        fontSize: { xs: '16px', sm: '13px' },
                        fontWeight: 400,
                        padding: '7px 12px',
                      },
                    }}
                  />
                  {filteredUsersList.length > 0 && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const allFilteredIds = filteredUsersList.map((u) => u.id);
                        const allSelected = allFilteredIds.every((id) => deviceData.userIds?.includes(id));
                        if (allSelected) {
                          setDeviceData({
                            ...deviceData,
                            userIds: (deviceData.userIds || []).filter((id) => !allFilteredIds.includes(id)),
                          });
                        } else {
                          const newIds = Array.from(new Set([...(deviceData.userIds || []), ...allFilteredIds]));
                          setDeviceData({ ...deviceData, userIds: newIds });
                        }
                      }}
                      sx={{
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        fontSize: '12px',
                        height: '36px',
                        color: PRIMARY,
                        borderColor: PRIMARY,
                        fontFamily: `${ROBOTO_FONT} !important`,
                      }}
                    >
                      {filteredUsersList.every((u) => deviceData.userIds?.includes(u.id)) ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </Box>

                <Box sx={{ maxHeight: '240px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1.5px solid ${BORDER}`, ...scrollableSx }}>
                  {loadingUsers && allUsersList.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                      <CircularProgress size={24} sx={{ color: PRIMARY }} />
                    </Box>
                  ) : filteredUsersList.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3, color: TEXT_SECONDARY }}>
                      <Typography sx={{ fontSize: '13px', fontFamily: `${ROBOTO_FONT} !important` }}>
                        {searchUser ? 'No matching users found.' : 'No users available.'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                      {filteredUsersList.map((user) => {
                        const isSuperAdmin = Boolean(user.administrator || user.admin || user.id === 1);
                        const isChecked = Boolean(deviceData.userIds?.includes(user.id));
                        const displayName = user.name || user.email || user.login || `User #${user.id}`;
                        const subInfo = user.email && user.name ? user.email : user.login && user.name ? user.login : '';

                        return (
                          <Box
                            key={user.id}
                            onClick={() => {
                              const currentIds = deviceData.userIds || [];
                              if (currentIds.includes(user.id)) {
                                setDeviceData({ ...deviceData, userIds: currentIds.filter((id) => id !== user.id) });
                              } else {
                                setDeviceData({ ...deviceData, userIds: [...currentIds, user.id] });
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              border: isChecked ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                              borderRadius: '6px',
                              backgroundColor: isChecked ? '#f0fdfa' : SURFACE,
                              height: '46px',
                              px: 1,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:hover': { borderColor: PRIMARY },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                sx={{
                                  padding: '2px',
                                  marginRight: '6px',
                                  color: '#cbd5e1',
                                  '&.Mui-checked': { color: PRIMARY },
                                }}
                              />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography noWrap sx={{ fontSize: '13px', color: isChecked ? '#0f172a' : TEXT, fontWeight: 500, fontFamily: `${ROBOTO_FONT} !important` }}>
                                  {displayName}
                                </Typography>
                                {subInfo && (
                                  <Typography noWrap sx={{ fontSize: '11px', color: TEXT_SECONDARY, fontFamily: `${ROBOTO_FONT} !important` }}>
                                    {subInfo}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            {isSuperAdmin && (
                              <Chip
                                label="Admin"
                                size="small"
                                sx={{
                                  height: '18px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#ffedd5',
                                  color: '#ea580c',
                                  border: '1px solid #fed7aa',
                                  fontFamily: `${ROBOTO_FONT} !important`,
                                  ml: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {activeTab === 'groups' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search groups..."
                  value={searchGroup}
                  onChange={(e) => setSearchGroup(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                    '& input': {
                      fontFamily: `${ROBOTO_FONT} !important`,
                      fontSize: { xs: '16px', sm: '13px' },
                      fontWeight: 400,
                      padding: '7px 12px',
                    },
                  }}
                />
                <Box sx={{ maxHeight: '240px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1.5px solid ${BORDER}`, ...scrollableSx }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                    <Box
                      onClick={() => setDeviceData({ ...deviceData, groupId: 0 })}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: Number(deviceData.groupId) === 0 ? `1.5px solid ${PRIMARY}` : '1.5px dashed #cbd5e1',
                        borderRadius: '6px',
                        backgroundColor: Number(deviceData.groupId) === 0 ? '#f0fdfa' : SURFACE,
                        height: '42px',
                        px: 1,
                        cursor: 'pointer',
                      }}
                    >
                      <Radio size="small" checked={Number(deviceData.groupId) === 0} sx={{ padding: '2px', marginRight: '6px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                      <Typography noWrap sx={{ fontSize: '12px', color: Number(deviceData.groupId) === 0 ? '#0f172a' : TEXT_SECONDARY, fontStyle: 'italic', fontWeight: 500, fontFamily: `${ROBOTO_FONT} !important` }}>
                        None (Ungrouped)
                      </Typography>
                    </Box>
                    {filteredGroupsList.map((group) => {
                      const isGroupSelected = Number(deviceData.groupId) === Number(group.id);
                      return (
                        <Box
                          key={group.id}
                          onClick={() => setDeviceData({ ...deviceData, groupId: isGroupSelected ? 0 : group.id })}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: isGroupSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                            borderRadius: '6px',
                            backgroundColor: isGroupSelected ? '#f0fdfa' : SURFACE,
                            height: '42px',
                            px: 1,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: PRIMARY },
                          }}
                        >
                          <Radio size="small" checked={isGroupSelected} sx={{ padding: '2px', marginRight: '6px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                          <Typography noWrap sx={{ fontSize: '13px', color: isGroupSelected ? '#0f172a' : TEXT, fontWeight: 500, fontFamily: `${ROBOTO_FONT} !important` }}>
                            {group.name}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}

            {isAdmin && activeTab === 'icons' && (
              <Box sx={{ maxHeight: '260px', overflowY: 'auto', p: 1.5, backgroundColor: SURFACE_SOFT, borderRadius: '8px', border: `1.5px solid ${BORDER}`, ...scrollableSx }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                  {deviceCategoriesList.map((catKey) => {
                    const label = catKey.charAt(0).toUpperCase() + catKey.slice(1);
                    const isIconSelected = (deviceData.category || 'default') === catKey;
                    return (
                      <Box
                        key={catKey}
                        onClick={() => setDeviceData({ ...deviceData, category: isIconSelected ? 'default' : catKey })}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: isIconSelected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                          borderRadius: '6px',
                          backgroundColor: isIconSelected ? '#f0fdfa' : SURFACE,
                          height: '42px',
                          px: 1,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: PRIMARY },
                        }}
                      >
                        <Radio size="small" checked={isIconSelected} sx={{ padding: '2px', marginRight: '6px', color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                        <Typography noWrap sx={{ fontSize: '13px', color: isIconSelected ? '#0f172a' : TEXT, fontWeight: 500, fontFamily: `${ROBOTO_FONT} !important` }}>
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ padding: '14px 20px', backgroundColor: SURFACE, borderTop: `1.5px solid ${BORDER_LIGHT}`, gap: 1.5 }}>
            <Button
              onClick={handleCloseAddDevice}
              disabled={saving}
              variant="outlined"
              sx={{
                borderRadius: '8px',
                color: PRIMARY,
                borderColor: PRIMARY,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '13px',
                height: '36px',
                px: 2.5,
                fontFamily: `${ROBOTO_FONT} !important`,
                '&:hover': { borderColor: PRIMARY_DARK, backgroundColor: '#f0fdfa' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                borderRadius: '8px',
                backgroundColor: `${PRIMARY_DARK} !important`,
                color: `${SURFACE} !important`,
                '&:hover': { filter: 'brightness(0.92)' },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                height: '36px',
                px: 3,
                boxShadow: 'none',
                fontFamily: `${ROBOTO_FONT} !important`,
              }}
            >
              {saving ? 'Saving...' : deviceData.id ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default memo(ObjectsView);