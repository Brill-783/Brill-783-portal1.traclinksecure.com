import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import {
  Typography,
  IconButton,
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
  Checkbox,
  Box,
  InputBase,
  CircularProgress,
  Paper,
  Avatar,
  Fade,
  Card,
  CardContent,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ConstructionIcon from '@mui/icons-material/Construction';
import PersonIcon from '@mui/icons-material/Person';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import Swal from 'sweetalert2';

import { useTranslation } from '../common/components/LocalizationProvider';
import { groupsActions, devicesActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const unitPrimaryTypographySx = {
  fontFamily: FONT_FAMILY,
  fontSize: '13px',
  fontWeight: 600,
  color: '#1e293b',
  lineHeight: 1.3,
};

const fontStyle = {
  fontFamily: FONT_FAMILY,
};

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const PRIMARY_LIGHT = '#f0fdfa';

const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const BORDER = '#cbd5e1';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': { width: '4px', height: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
};

const showAlert = (options) => {
  return Swal.fire({
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
};

const useStyles = makeStyles()(() => ({
  viewToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '8px',
    padding: '3px',
    border: `1.5px solid ${BORDER}`,
  },

  viewButton: {
    fontFamily: FONT_FAMILY,
    fontSize: '12px !important',
    fontWeight: '600 !important',
    minWidth: '65px',
    textTransform: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    color: TEXT_SECONDARY,
    boxShadow: 'none',
    '&.active': {
      backgroundColor: PRIMARY,
      color: SURFACE,
      '&:hover': {
        backgroundColor: PRIMARY_DARK,
      },
    },
  },

  cardGrid: {
    display: 'grid',
    gap: '14px',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    alignContent: 'start',
    padding: '2px',
  },

  groupCard: {
    borderRadius: '10px',
    border: `1.5px solid ${BORDER}`,
    backgroundColor: SURFACE,
    position: 'relative',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: PRIMARY,
      boxShadow: '0 4px 14px rgba(0, 171, 142, 0.1)',
    },
  },

  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      backgroundColor: SURFACE,
    },
    '& input': {
      fontSize: '13px !important',
      fontWeight: '400 !important',
      color: TEXT,
      fontFamily: FONT_FAMILY,
      padding: '8.5px 12px',
    },
    '& textarea': {
      fontSize: '13px !important',
      fontWeight: '400 !important',
      color: TEXT,
      fontFamily: FONT_FAMILY,
    },
  },
}));

const getCategoryIcon = (category) => {
  const cat = String(category || 'default').toLowerCase();
  const sx = { fontSize: 16, color: PRIMARY };

  switch (cat) {
    case 'motorcycle':
    case 'scooter':
    case 'bicycle':
      return <TwoWheelerIcon sx={sx} />;
    case 'truck':
    case 'pickup':
      return <LocalShippingIcon sx={sx} />;
    case 'bus':
      return <DirectionsBusIcon sx={sx} />;
    case 'van':
      return <AirportShuttleIcon sx={sx} />;
    case 'tractor':
      return <AgricultureIcon sx={sx} />;
    case 'construction':
      return <ConstructionIcon sx={sx} />;
    case 'person':
      return <PersonIcon sx={sx} />;
    case 'car':
    case 'auto':
    case 'default':
    default:
      return <DirectionsCarFilledIcon sx={sx} />;
  }
};

const GroupTableRow = memo(({
  group,
  deviceCount,
  onEdit,
  onDelete,
}) => {
  const initials = (group.name || 'G').substring(0, 2).toUpperCase();

  return (
    <TableRow
      hover
      sx={{
        height: '42px',
        '&:hover': { backgroundColor: '#e6f7f5 !important' },
        '& td': {
          py: '6px',
          px: '10px',
          fontSize: '13px',
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
        onClick={() => onEdit(group)}
        sx={{
          color: '#0f172a !important',
          fontWeight: '600 !important',
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 26,
              height: 26,
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: '#f0fdfa',
              color: PRIMARY,
              border: '1px solid #ccfbf1',
            }}
          >
            {initials}
          </Avatar>
          <span>{group.name}</span>
        </Box>
      </TableCell>

      <TableCell sx={{ color: '#475569' }}>
        {group.attributes?.description || '—'}
      </TableCell>

      <TableCell>
        <Chip
          label={`${deviceCount} ${deviceCount === 1 ? 'Unit' : 'Units'} Grouped`}
          size="small"
          sx={{
            height: '20px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: deviceCount > 0 ? '#dcfce7' : '#f1f5f9',
            color: deviceCount > 0 ? '#15803d' : TEXT_SECONDARY,
            border: `1px solid ${deviceCount > 0 ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell align="center" sx={{ borderRight: 'none !important', pr: 1.2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(group); }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '12.5px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
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
            onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '12.5px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid #fecaca',
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
GroupTableRow.displayName = 'GroupTableRow';

export default function GroupsPage() {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const server = useSelector((state) => state.session?.server || {});
  const devices = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const groups = useSelector((state) => state.groups?.items || {}, shallowEqual);

  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';

  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalUnitSearch, setModalUnitSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [page, setPage] = useState(0);
  const rowsPerPage = viewMode === 'grid' ? 24 : 12;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const accessibleDevices = useMemo(() => {
    const list = Array.isArray(devices)
      ? devices
      : Object.values(devices || {});

    return [...list]
      .filter((device) => device && device.id !== undefined && device.id !== null)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, [devices]);

  const filteredModalDevices = useMemo(() => {
    const q = modalUnitSearch.trim().toLowerCase();
    if (!q) return accessibleDevices;

    return accessibleDevices.filter(
      (device) =>
        String(device.name || '').toLowerCase().includes(q) ||
        String(device.uniqueId || '').toLowerCase().includes(q)
    );
  }, [accessibleDevices, modalUnitSearch]);

  const getDeviceCount = useCallback(
    (groupId) => accessibleDevices.filter((device) => Number(device.groupId) === Number(groupId)).length,
    [accessibleDevices]
  );

  const sortedGroups = useMemo(() => {
    const rawList = Array.isArray(groups) ? groups : Object.values(groups || {});
    const byId = new Map();

    rawList.forEach((group) => {
      if (group && group.id !== undefined && group.id !== null) {
        byId.set(Number(group.id), group);
      }
    });

    let result = Array.from(byId.values());
    const q = searchKeyword.trim().toLowerCase();

    if (q) {
      result = result.filter((group) => {
        const name = String(group.name || '').toLowerCase();
        const description = String(group.attributes?.description || '').toLowerCase();
        return name.includes(q) || description.includes(q);
      });
    }

    return result.sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    );
  }, [groups, searchKeyword]);

  const refreshGroupsAndDevices = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsResponse, devicesResponse] = await Promise.all([
        fetchOrThrow('/api/groups'),
        fetchOrThrow('/api/devices'),
      ]);

      const groupData = await groupsResponse.json();
      const groupList = Array.isArray(groupData) ? groupData : Object.values(groupData || {});
      if (groupsActions?.refresh) {
        dispatch(groupsActions.refresh(groupList));
      }

      const deviceData = await devicesResponse.json();
      const deviceList = Array.isArray(deviceData) ? deviceData : Object.values(deviceData || {});
      if (devicesActions?.refresh) {
        dispatch(devicesActions.refresh(deviceList));
      }
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Sync Failed',
        text: 'Failed to synchronize groups and devices from the system.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    refreshGroupsAndDevices();
  }, [refreshGroupsAndDevices]);

  useEffect(() => {
    setPage(0);
  }, [searchKeyword, viewMode]);

  const handleCreateGroup = useCallback(() => {
    setSelectedGroup(null);
    setGroupName('');
    setGroupDescription('');
    setSelectedDeviceIds([]);
    setModalUnitSearch('');
    setDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback(
    (group) => {
      if (!group) return;
      setSelectedGroup(group);
      setGroupName(group.name || '');
      setGroupDescription(group.attributes?.description || '');

      const currentIds = accessibleDevices
        .filter((device) => Number(device.groupId) === Number(group.id))
        .map((device) => device.id);

      setSelectedDeviceIds(currentIds);
      setModalUnitSearch('');
      setDialogOpen(true);
    },
    [accessibleDevices]
  );

  const handleToggleUnit = useCallback((id) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((deviceId) => deviceId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllUnits = useCallback(() => {
    setSelectedDeviceIds((prev) => {
      const selected = new Set(prev);
      filteredModalDevices.forEach((device) => selected.add(device.id));
      return Array.from(selected);
    });
  }, [filteredModalDevices]);

  const handleDeselectAllUnits = useCallback(() => {
    const visibleIds = new Set(filteredModalDevices.map((device) => device.id));
    setSelectedDeviceIds((prev) => prev.filter((id) => !visibleIds.has(id)));
  }, [filteredModalDevices]);

  const handleSaveGroup = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a group name.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    const isEdit = Boolean(selectedGroup);
    const duplicate = sortedGroups.some((group) => {
      if (isEdit && Number(group.id) === Number(selectedGroup.id)) return false;
      return String(group.name || '').trim().toLowerCase() === trimmedName.toLowerCase();
    });

    if (duplicate) {
      showAlert({
        icon: 'warning',
        title: 'Duplicate Name',
        text: `A group named "${trimmedName}" is already being used on the system.`,
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setSubmitting(true);

    try {
      const previousGroupDeviceIds = isEdit
        ? accessibleDevices
            .filter((device) => Number(device.groupId) === Number(selectedGroup.id))
            .map((device) => device.id)
        : [];

      const groupData = {
        ...(isEdit ? { id: selectedGroup.id } : {}),
        name: trimmedName,
        attributes: {
          ...(selectedGroup?.attributes || {}),
          description: groupDescription.trim(),
          ownerUserId: currentUser?.id,
        },
      };

      const url = isEdit ? `/api/groups/${selectedGroup.id}` : '/api/groups';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetchOrThrow(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      const savedGroup = await response.json();

      if (!isEdit && currentUser?.id) {
        await fetchOrThrow('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            groupId: savedGroup.id,
          }),
        }).catch(() => null);
      }

      const selectedIds = new Set(selectedDeviceIds);

      const devicesToAssign = accessibleDevices.filter(
        (device) => selectedIds.has(device.id) && Number(device.groupId) !== Number(savedGroup.id)
      );

      const devicesToRemove = isEdit
        ? accessibleDevices.filter(
            (device) =>
              Number(device.groupId) === Number(savedGroup.id) &&
              !selectedIds.has(device.id) &&
              previousGroupDeviceIds.includes(device.id)
          )
        : [];

      await Promise.all(
        devicesToAssign.map(async (device) => {
          const updated = await fetchOrThrow(`/api/devices/${device.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...device, groupId: savedGroup.id }),
          });
          const updatedDevice = await updated.json();
          dispatch(devicesActions.update([updatedDevice]));
        })
      );

      await Promise.all(
        devicesToRemove.map(async (device) => {
          const updated = await fetchOrThrow(`/api/devices/${device.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...device, groupId: 0 }),
          });
          const updatedDevice = await updated.json();
          dispatch(devicesActions.update([updatedDevice]));
        })
      );

      if (isEdit) {
        dispatch(groupsActions.update([savedGroup]));
      } else {
        dispatch(groupsActions.add([savedGroup]));
      }

      setDialogOpen(false);
      showAlert({
        icon: 'success',
        title: 'Success',
        text: isEdit ? 'Group updated successfully in the system.' : 'Group created successfully in the system.',
        timer: 2000,
        showConfirmButton: false,
      });

      await refreshGroupsAndDevices();
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: error?.message || 'Failed to save group in the system.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!groupId) return;

    const group = sortedGroups.find((item) => Number(item.id) === Number(groupId));
    const groupNameForDialog = group?.name || 'Group';

    const result = await showAlert({
      title: 'Delete Group?',
      text: `Are you sure you want to delete "${groupNameForDialog}"? Grouped units will be returned to Ungrouped.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const groupDevices = accessibleDevices.filter(
        (device) => Number(device.groupId) === Number(groupId)
      );

      const response = await fetchOrThrow(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await Promise.all(
          groupDevices.map(async (device) => {
            const updateResponse = await fetchOrThrow(`/api/devices/${device.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...device, groupId: 0 }),
            });
            const updatedDevice = await updateResponse.json();
            dispatch(devicesActions.update([updatedDevice]));
          })
        );

        dispatch(groupsActions.remove(groupId));
        showAlert({
          icon: 'success',
          title: 'Deleted',
          text: 'Group removed from the system.',
          timer: 1500,
          showConfirmButton: false,
        });

        await refreshGroupsAndDevices();
      }
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Delete Failed',
        text: error?.message || 'Failed to delete group from the system.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  const impersonatedUserId = localStorage.getItem('impersonated_user_id');
  const isSuperAdmin = Boolean(currentUser?.administrator && !impersonatedUserId);

  const totalGroups = sortedGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / rowsPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedGroups = sortedGroups.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        maxHeight: '100%',
        backgroundColor: '#f8fafc',
        p: 1.5,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: '12px',
        ...fontStyle,
      }}
    >
      {/* HEADER SECTION */}
      <Box sx={{ flexShrink: 0, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOutlinedIcon sx={{ color: PRIMARY, fontSize: '24px' }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '17px !important',
                color: TEXT,
                letterSpacing: '-0.02em',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.2,
              }}
            >
              Groups
            </Typography>
          </Box>
        </Box>

        {/* TOOLBAR */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.2,
            boxSizing: 'border-box',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: SURFACE_SOFT,
                borderRadius: '20px',
                paddingLeft: '12px',
                paddingRight: '6px',
                height: '38px',
                border: `1.5px solid ${BORDER}`,
                width: { xs: '100%', sm: '260px' },
                transition: 'all 0.15s ease',
                '&:focus-within': {
                  borderColor: PRIMARY,
                  backgroundColor: SURFACE,
                  boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
                },
              }}
            >
              <SearchIcon sx={{ color: TEXT_MUTED, fontSize: '17px', marginRight: '6px', flexShrink: 0 }} />
              <InputBase
                placeholder="Search groups..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(0);
                }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '13px',
                  fontWeight: 400,
                  color: TEXT,
                  fontFamily: FONT_FAMILY,
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <div className={classes.viewToggle}>
              <Button
                className={`${classes.viewButton} ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                className={`${classes.viewButton} ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
            </div>

            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
              onClick={handleCreateGroup}
              disableElevation
              sx={{
                height: '38px',
                minWidth: '120px',
                borderRadius: '8px',
                backgroundColor: PRIMARY,
                color: SURFACE,
                textTransform: 'none',
                fontSize: '13px !important',
                fontWeight: '600 !important',
                fontFamily: FONT_FAMILY,
                boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
                ml: 'auto',
                '&:hover': { backgroundColor: PRIMARY_DARK },
              }}
            >
              Add Group
            </Button>
          </Box>
        </Box>
      </Box>

      {/* VIEW RENDERER */}
      {viewMode === 'list' ? (
        <Paper
          elevation={0}
          sx={{
            flex: '1 1 auto',
            width: '100%',
            height: 0,
            minHeight: 0,
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
            mb: 1,
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
                minWidth: '760px',
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
                      width: 240,
                      fontWeight: '700 !important',
                      fontSize: '13px !important',
                      color: '#0f172a',
                      backgroundColor: '#e6f7f5',
                      borderBottom: '2px solid #00ab8e',
                      borderRight: '1px solid #cbd5e1',
                      py: '7px',
                      px: '10px',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      ...fontStyle,
                    }}
                  >
                    Group Name
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 260,
                      fontWeight: '700 !important',
                      fontSize: '13px !important',
                      color: '#0f172a',
                      backgroundColor: '#e6f7f5',
                      borderBottom: '2px solid #00ab8e',
                      borderRight: '1px solid #cbd5e1',
                      py: '7px',
                      px: '10px',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      ...fontStyle,
                    }}
                  >
                    Description
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 160,
                      fontWeight: '700 !important',
                      fontSize: '13px !important',
                      color: '#0f172a',
                      backgroundColor: '#e6f7f5',
                      borderBottom: '2px solid #00ab8e',
                      borderRight: '1px solid #cbd5e1',
                      py: '7px',
                      px: '10px',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      ...fontStyle,
                    }}
                  >
                    Grouped Units
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      width: 140,
                      fontWeight: '700 !important',
                      fontSize: '13px !important',
                      color: '#0f172a',
                      backgroundColor: '#e6f7f5',
                      borderBottom: '2px solid #00ab8e',
                      py: '7px',
                      px: '10px',
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
                {loading && sortedGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6 }}>
                      <CircularProgress size={26} sx={{ color: PRIMARY }} />
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, color: TEXT_SECONDARY, mt: 1, fontFamily: FONT_FAMILY }}>
                        Loading groups...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedGroups.length > 0 ? (
                  paginatedGroups.map((group) => {
                    const deviceCount = getDeviceCount(group.id);

                    return (
                      <GroupTableRow
                        key={group.id}
                        group={group}
                        deviceCount={deviceCount}
                        onEdit={handleEditGroup}
                        onDelete={handleDeleteGroup}
                      />
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{
                        py: 5,
                        color: '#64748b',
                        fontSize: '13px',
                        fontWeight: 400,
                        ...fontStyle,
                      }}
                    >
                      No groups found in the system.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          {/* PAGINATION FOOTER */}
          {totalGroups > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderTop: '1px solid #cbd5e1',
                backgroundColor: SURFACE,
                flexShrink: 0,
                flexWrap: 'wrap',
                gap: '6px',
                ...fontStyle,
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>
                Showing {safePage * rowsPerPage + 1} - {Math.min((safePage + 1) * rowsPerPage, totalGroups)} of {totalGroups} Groups
              </span>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  sx={{
                    color: TEXT_SECONDARY,
                    borderColor: BORDER,
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    fontSize: '12px !important',
                    fontWeight: 600,
                    textTransform: 'none',
                    ...fontStyle,
                  }}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    size="small"
                    variant={page === i ? 'contained' : 'outlined'}
                    onClick={() => setPage(i)}
                    sx={{
                      minWidth: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      fontSize: '12px !important',
                      fontWeight: 600,
                      textTransform: 'none',
                      ...(page === i
                        ? { backgroundColor: PRIMARY, color: '#ffffff', '&:hover': { backgroundColor: PRIMARY_DARK } }
                        : { color: TEXT, borderColor: BORDER }),
                      ...fontStyle,
                    }}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  size="small"
                  variant="outlined"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  sx={{
                    color: TEXT_SECONDARY,
                    borderColor: BORDER,
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    fontSize: '12px !important',
                    fontWeight: 600,
                    textTransform: 'none',
                    ...fontStyle,
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            flex: '1 1 auto',
            width: '100%',
            height: 0,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            mb: 1,
            ...scrollableSx,
          }}
        >
          {totalGroups === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '48px 20px',
                color: TEXT_MUTED,
                fontFamily: FONT_FAMILY,
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              <FolderOutlinedIcon sx={{ fontSize: 36, color: '#cbd5e1' }} />
              <span>
                {searchKeyword.trim()
                  ? 'No groups match your search.'
                  : 'No groups yet. Create one to start organizing units.'}
              </span>
            </Box>
          ) : (
            <div className={classes.cardGrid}>
              {paginatedGroups.map((group) => {
                const deviceCount = getDeviceCount(group.id);
                const initials = (group.name || 'G').substring(0, 2).toUpperCase();

                return (
                  <Fade in key={group.id} timeout={200}>
                    <Card
                      className={classes.groupCard}
                      onClick={() => handleEditGroup(group)}
                    >
                      <CardContent sx={{ p: '14px !important' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#f0fdfa',
                                color: PRIMARY,
                                border: '1px solid #ccfbf1',
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Typography
                              noWrap
                              title={group.name}
                              sx={{
                                fontFamily: FONT_FAMILY,
                                fontSize: '13.5px !important',
                                fontWeight: '700 !important',
                                color: TEXT,
                              }}
                            >
                              {group.name}
                            </Typography>
                          </Box>
                        </Box>

                        {group.attributes?.description && (
                          <Typography
                            sx={{
                              fontFamily: FONT_FAMILY,
                              fontSize: '12px !important',
                              color: TEXT_SECONDARY,
                              mt: 0.5,
                              mb: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {group.attributes.description}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '12px',
                          }}
                        >
                          <Chip
                            label={`${deviceCount} ${deviceCount === 1 ? 'Unit' : 'Units'} Grouped`}
                            size="small"
                            sx={{
                              height: '20px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: deviceCount > 0 ? '#dcfce7' : '#f1f5f9',
                              color: deviceCount > 0 ? '#15803d' : TEXT_SECONDARY,
                              border: `1px solid ${deviceCount > 0 ? '#bbf7d0' : '#e2e8f0'}`,
                              borderRadius: '4px',
                              fontFamily: FONT_FAMILY,
                            }}
                          />

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleEditGroup(group); }}
                              style={{
                                fontFamily: FONT_FAMILY,
                                fontSize: '11.5px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#f8fafc',
                                color: '#1e293b',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                              style={{
                                fontFamily: FONT_FAMILY,
                                fontSize: '11.5px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                );
              })}
            </div>
          )}
        </Box>
      )}

      {/* SYSTEM STATUS FOOTER */}
      {isSuperAdmin && (
        <Box
          sx={{
            mt: 'auto',
            pt: '8px',
            pb: '2px',
            px: '6px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #e2e8f0',
            width: '100%',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <DnsOutlinedIcon sx={{ fontSize: '16px', color: '#00ab8e' }} />
              <span style={{ color: '#64748b', fontSize: '12px', ...fontStyle }}>Server:</span>
              <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px', ...fontStyle }}>{serverHostIp}</strong>
            </Box>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <InfoOutlinedIcon sx={{ fontSize: '16px', color: '#00ab8e' }} />
              <span style={{ color: '#64748b', fontSize: '12px', ...fontStyle }}>System Version:</span>
              <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px', ...fontStyle }}>v{serverVersion}</strong>
            </Box>
          </Box>
        </Box>
      )}


      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={(_, reason) => {
          if (submitting || reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          setDialogOpen(false);
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px',
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
              fontFamily: FONT_FAMILY,
              ...fontStyle,
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
            borderBottom: '1.5px solid #f1f5f9',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <FolderOutlinedIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
            <Typography sx={{ fontWeight: 600, fontSize: '15px !important', color: TEXT, fontFamily: FONT_FAMILY }}>
              {selectedGroup ? 'Edit Group' : 'Create Group'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setDialogOpen(false)}
            sx={{ color: TEXT_SECONDARY, padding: '4px' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveGroup} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <DialogContent
            sx={{
              padding: '20px 22px',
              maxHeight: '440px',
              overflowY: 'auto',
              backgroundColor: SURFACE,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              ...scrollableSx,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Group Name
              </Typography>
              <TextField
                size="small"
                required
                fullWidth
                autoFocus
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={classes.textField}
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                Description
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="Optional group description..."
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className={classes.textField}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: TEXT, fontFamily: FONT_FAMILY }}>
                  Group Units ({selectedDeviceIds.length}/{accessibleDevices.length})
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: SURFACE,
                      borderRadius: '20px',
                      paddingLeft: '10px',
                      paddingRight: '6px',
                      height: '32px',
                      border: `1px solid ${BORDER}`,
                      width: '180px',
                      '&:focus-within': {
                        borderColor: PRIMARY,
                      },
                    }}
                  >
                    <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 15, marginRight: '4px' }} />
                    <InputBase
                      placeholder="Search units..."
                      value={modalUnitSearch}
                      onChange={(e) => setModalUnitSearch(e.target.value)}
                      sx={{
                        fontSize: '12px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                      }}
                    />
                  </Box>

                  <Button
                    size="small"
                    onClick={handleSelectAllUnits}
                    sx={{ textTransform: 'none', color: PRIMARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    onClick={handleDeselectAllUnits}
                    sx={{ textTransform: 'none', color: TEXT_SECONDARY, fontWeight: 600, fontSize: '12px', p: 0, minWidth: 0, fontFamily: FONT_FAMILY }}
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
                  {filteredModalDevices.map((device) => {
                    const isChecked = selectedDeviceIds.includes(device.id);
                    return (
                      <Box
                        key={device.id}
                        onClick={() => handleToggleUnit(device.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: isChecked ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                          borderRadius: '6px',
                          backgroundColor: isChecked ? '#f0fdfa' : SURFACE,
                          height: '38px',
                          px: 1,
                          cursor: 'pointer',
                          minWidth: 0,
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: PRIMARY },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          sx={{ p: 0.2, mr: 0.5, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.8 }}>
                          {getCategoryIcon(device.category)}
                        </Box>
                        <Typography
                          noWrap
                          sx={{
                            ...unitPrimaryTypographySx,
                            fontSize: '13px',
                            fontWeight: 600,
                            color: isChecked ? '#0f172a' : TEXT,
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

          <DialogActions sx={{ padding: '14px 20px', backgroundColor: SURFACE, borderTop: '1.5px solid #f1f5f9', gap: 1.5 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
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
                fontFamily: FONT_FAMILY,
                '&:hover': { borderColor: PRIMARY_DARK, backgroundColor: '#f0fdfa' },
              }}
            >
              {t('sharedCancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: '8px',
                backgroundColor: PRIMARY,
                color: SURFACE,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                height: '36px',
                px: 3,
                boxShadow: 'none',
                fontFamily: FONT_FAMILY,
                '&:hover': { backgroundColor: PRIMARY_DARK },
              }}
            >
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}