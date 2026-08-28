import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  InputBase,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  Tabs,
  Tab,
  Chip,
  Paper,
  Avatar,
  CircularProgress,
} from '@mui/material';

import Swal from 'sweetalert2';

import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ContactEmergencyOutlinedIcon from '@mui/icons-material/ContactEmergencyOutlined';
import DriveEtaOutlinedIcon from '@mui/icons-material/DriveEtaOutlined';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useTranslation } from '../common/components/LocalizationProvider';
import { driversActions, devicesActions } from '../store';
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
const BORDER_LIGHT = '#f1f5f9';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const RELATIONSHIP_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
  { value: 'other', label: 'Other' },
];

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': { width: '4px', height: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
};

const initialFormData = {
  fullName: '',
  rfid: '',
  phone: '',
  email: '',
  address: '',
  nrcNumber: '',
  licenseNumber: '',
  licenseClass: '',
  licenseExpiry: '',
  drivingExperience: '',
  nextOfKin: '',
  nextOfKinPhone: '',
  relationship: '',
  assignedDeviceId: null,
  description: '',
  notes: '',
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
  },
  header: {
    padding: '14px 18px',
    backgroundColor: SURFACE,
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: '12px 14px',
    },
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  headerTitle: {
    fontWeight: '700 !important',
    fontSize: '17px !important',
    color: TEXT,
    letterSpacing: '-0.02em',
    fontFamily: FONT_FAMILY,
    lineHeight: 1.2,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '@media (max-width: 600px)': {
      width: '100%',
    },
  },
  searchPill: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '20px',
    paddingLeft: '12px',
    paddingRight: '6px',
    height: '38px',
    width: '260px',
    border: `1.5px solid ${BORDER}`,
    transition: 'all 0.15s ease',
    '&:focus-within': {
      borderColor: PRIMARY,
      backgroundColor: SURFACE,
      boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
    },
    '@media (max-width: 600px)': {
      flex: 1,
      width: 'auto',
    },
  },
  searchInput: {
    fontSize: '13px !important',
    fontWeight: '400 !important',
    flex: 1,
    color: TEXT,
    fontFamily: FONT_FAMILY,
  },
  createButton: {
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
    '&:hover': {
      backgroundColor: PRIMARY_DARK,
    },
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  tableContainer: {
    backgroundColor: SURFACE,
    borderRadius: '10px',
    border: `1.5px solid ${BORDER}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  tableWrapper: {
    flex: 1,
    overflow: 'auto',
    ...scrollableSx,
  },
  table: {
    minWidth: 720,
    fontFamily: FONT_FAMILY,
  },
  tableHeaderCell: {
    backgroundColor: `${SURFACE_SOFT} !important`,
    color: `${TEXT_MUTED} !important`,
    fontSize: '11px !important',
    fontWeight: '600 !important',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: `1.5px solid ${BORDER} !important`,
    padding: '10px 14px',
    fontFamily: `${FONT_FAMILY} !important`,
    whiteSpace: 'nowrap',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: `${SURFACE_SOFT} !important`,
    },
  },
  tableCell: {
    fontSize: '13px !important',
    fontWeight: '500 !important',
    color: `${TEXT} !important`,
    borderBottom: `1px solid ${BORDER_LIGHT} !important`,
    padding: '10px 14px',
    fontFamily: `${FONT_FAMILY} !important`,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 18px',
    borderTop: `1px solid ${BORDER}`,
    backgroundColor: SURFACE,
    flexShrink: 0,
    fontFamily: FONT_FAMILY,
  },
  paginationInfo: {
    fontSize: '12px',
    fontWeight: '500',
    color: TEXT_SECONDARY,
    fontFamily: FONT_FAMILY,
  },
  pageButton: {
    minWidth: '32px',
    height: '32px',
    borderRadius: '6px',
    fontSize: '12px !important',
    fontWeight: '600 !important',
    textTransform: 'none',
    fontFamily: FONT_FAMILY,
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
    '& .MuiInputLabel-root': {
      fontSize: '13px',
      fontFamily: FONT_FAMILY,
    },
  },
  textAreaField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      backgroundColor: SURFACE,
    },
    '& textarea': {
      fontSize: '13px !important',
      fontWeight: '400 !important',
      color: TEXT,
      fontFamily: FONT_FAMILY,
    },
    '& .MuiInputLabel-root': {
      fontSize: '13px',
      fontFamily: FONT_FAMILY,
    },
  },
}));

const DriverTableRow = memo(({
  driver,
  assignedDevice,
  displayTag,
  onEdit,
  onDelete,
}) => {
  const attrs = driver.attributes || {};
  const initials = (driver.name || 'D').substring(0, 2).toUpperCase();

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
        onClick={() => onEdit(driver)}
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
          <span>{driver.name || attrs.fullName || '—'}</span>
        </Box>
      </TableCell>

      <TableCell>
        <Chip
          label={displayTag}
          size="small"
          sx={{
            height: '20px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: '#f1f5f9',
            color: TEXT_SECONDARY,
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell sx={{ color: '#475569' }}>
        {attrs.phone || '—'}
      </TableCell>

      <TableCell sx={{ color: '#475569' }}>
        {attrs.licenseNumber || '—'}
      </TableCell>

      <TableCell sx={{ color: '#475569' }}>
        {attrs.licenseExpiry ? new Date(attrs.licenseExpiry).toLocaleDateString() : '—'}
      </TableCell>

      <TableCell>
        {assignedDevice ? (
          <Chip
            icon={<DirectionsCarOutlinedIcon style={{ fontSize: 13, color: '#15803d' }} />}
            label={assignedDevice.name}
            size="small"
            sx={{
              height: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              ...fontStyle,
            }}
          />
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
            Unassigned
          </span>
        )}
      </TableCell>

      <TableCell align="center" sx={{ borderRight: 'none !important', pr: 1.2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(driver); }}
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
            onClick={(e) => { e.stopPropagation(); onDelete(driver.id); }}
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
DriverTableRow.displayName = 'DriverTableRow';

export default function DriversPage() {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const server = useSelector((state) => state.session?.server || {});
  const impersonatedUserId = localStorage.getItem('impersonated_user_id');

  const isAdmin = useMemo(() => {
    if (!currentUser || Boolean(impersonatedUserId)) return false;
    return Boolean(currentUser.administrator || currentUser.admin || currentUser.id === 1);
  }, [currentUser, impersonatedUserId]);

  const rawDevices = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const rawDrivers = useSelector((state) => state.drivers?.items || {}, shallowEqual);

  const devicesList = useMemo(() => {
    return Array.isArray(rawDevices) ? rawDevices : Object.values(rawDevices || {});
  }, [rawDevices]);

  const driversList = useMemo(() => {
    return Array.isArray(rawDrivers) ? rawDrivers : Object.values(rawDrivers || {});
  }, [rawDrivers]);

  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';

  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 12;
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getAssignedDevice = useCallback(
    (driverId) => {
      return devicesList.find((device) => String(device?.attributes?.driverId) === String(driverId));
    },
    [devicesList]
  );

  const loadDriversData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = impersonatedUserId
        ? `/api/drivers?userId=${impersonatedUserId}`
        : '/api/drivers';

      const [driverRes, devRes] = await Promise.all([
        fetchOrThrow(endpoint),
        fetchOrThrow('/api/devices'),
      ]);

      const dData = await driverRes.json();
      const dList = Array.isArray(dData) ? dData : Object.values(dData || {});
      if (driversActions?.refresh) {
        dispatch(driversActions.refresh(dList));
      }

      const devData = await devRes.json();
      const devList = Array.isArray(devData) ? devData : Object.values(devData || {});
      if (devicesActions?.refresh) {
        dispatch(devicesActions.refresh(devList));
      }
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Sync Failed',
        text: 'Failed to synchronize driver and device data from the system.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch, impersonatedUserId]);

  useEffect(() => {
    loadDriversData();
  }, [loadDriversData]);

  const sortedDrivers = useMemo(() => {
    let result = driversList.filter(Boolean);

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (d) =>
          (d?.name || '').toLowerCase().includes(q) ||
          (d?.uniqueId || '').toLowerCase().includes(q) ||
          (d?.attributes?.rfid || '').toLowerCase().includes(q) ||
          (d?.attributes?.phone || '').toLowerCase().includes(q) ||
          (d?.attributes?.licenseNumber || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [driversList, searchKeyword]);

  const resetForm = () => {
    setFormData(initialFormData);
    setActiveTab(0);
  };

  const handleCreateDriver = () => {
    resetForm();
    setSelectedDriver(null);
    setDialogOpen(true);
  };

  const handleEditDriver = (driver) => {
    resetForm();
    setSelectedDriver(driver);
    const attrs = driver.attributes || {};
    const assignedDevice = getAssignedDevice(driver.id);

    setFormData({
      fullName: driver.name || attrs.fullName || '',
      rfid: attrs.rfid || (driver.uniqueId && !String(driver.uniqueId).startsWith('DRV-') ? driver.uniqueId : ''),
      phone: attrs.phone || '',
      email: attrs.email || '',
      address: attrs.address || '',
      nrcNumber: attrs.nrcNumber || '',
      licenseNumber: attrs.licenseNumber || '',
      licenseClass: attrs.licenseClass || '',
      licenseExpiry: attrs.licenseExpiry || '',
      drivingExperience: attrs.drivingExperience || '',
      nextOfKin: attrs.nextOfKin || '',
      nextOfKinPhone: attrs.nextOfKinPhone || '',
      relationship: attrs.relationship || '',
      assignedDeviceId: assignedDevice?.id || null,
      description: attrs.description || '',
      notes: attrs.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSaveDriver = async (e) => {
    if (e) e.preventDefault();
    const isEdit = Boolean(selectedDriver);
    const cleanName = formData.fullName.trim();
    const cleanEmail = formData.email.trim();
    const manualRfid = formData.rfid.trim();

    if (!cleanName) {
      setActiveTab(0);
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter the driver full name.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (cleanEmail) {
      const emailUsedInSystem = driversList.some(
        (driver) =>
          driver.attributes?.email &&
          driver.attributes.email.trim().toLowerCase() === cleanEmail.toLowerCase() &&
          (!isEdit || String(driver.id) !== String(selectedDriver.id))
      );

      if (emailUsedInSystem) {
        setActiveTab(0);
        showAlert({
          icon: 'warning',
          title: 'Email In Use',
          text: 'That email is already being used on the system. Please try using a different one.',
          confirmButtonColor: PRIMARY,
        });
        return;
      }
    }

    setSubmitting(true);

    let finalUniqueId = manualRfid;
    if (!finalUniqueId) {
      finalUniqueId = isEdit && selectedDriver?.uniqueId
        ? selectedDriver.uniqueId
        : `DRV-${Date.now()}`;
    }

    const driverData = {
      ...(isEdit ? { id: selectedDriver.id } : {}),
      name: cleanName,
      uniqueId: finalUniqueId,
      attributes: {
        ...(selectedDriver?.attributes || {}),
        ...formData,
        fullName: cleanName,
        rfid: manualRfid || undefined,
        ...(isEdit ? {} : { createdAt: new Date().toISOString() }),
      },
    };

    const url = isEdit ? `/api/drivers/${selectedDriver.id}` : '/api/drivers';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetchOrThrow(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData),
      });

      const savedDriver = await response.json();

      if (!isEdit && currentUser?.id) {
        await fetchOrThrow('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            driverId: savedDriver.id,
          }),
        }).catch(() => null);
      }

      const deviceUpdates = [];
      devicesList.forEach((dev) => {
        const currentlyAssigned = String(dev?.attributes?.driverId) === String(savedDriver.id);
        const shouldBeAssigned = formData.assignedDeviceId && String(dev?.id) === String(formData.assignedDeviceId);

        if (shouldBeAssigned && !currentlyAssigned) {
          deviceUpdates.push(
            fetchOrThrow(`/api/devices/${dev.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...dev,
                attributes: {
                  ...dev.attributes,
                  driverId: savedDriver.id,
                  driverName: cleanName,
                  driverUniqueId: manualRfid || savedDriver.uniqueId,
                },
              }),
            })
              .then((r) => r.json())
              .then((updated) => dispatch(devicesActions.update([updated])))
          );
        } else if (!shouldBeAssigned && currentlyAssigned) {
          deviceUpdates.push(
            fetchOrThrow(`/api/devices/${dev.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...dev,
                attributes: {
                  ...dev.attributes,
                  driverId: null,
                  driverName: null,
                  driverUniqueId: null,
                },
              }),
            })
              .then((r) => r.json())
              .then((updated) => dispatch(devicesActions.update([updated])))
          );
        }
      });

      await Promise.all(deviceUpdates);

      if (isEdit) {
        dispatch(driversActions.update([savedDriver]));
      } else {
        dispatch(driversActions.add(savedDriver));
      }

      setDialogOpen(false);
      showAlert({
        icon: 'success',
        title: 'Success',
        text: isEdit ? 'Driver updated successfully in the system.' : 'Driver registered successfully in the system.',
        timer: 2000,
        showConfirmButton: false,
      });
      loadDriversData();
    } catch (err) {
      let msg = err.message || 'Failed to save driver in the system.';
      if (
        msg.includes('UNIQUEID') ||
        msg.includes('Unique') ||
        msg.includes('Constraint') ||
        msg.includes('Duplicate')
      ) {
        msg = 'That identifier or tag number is already being used on the system. Please try using a different one.';
      }
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: msg,
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    const result = await showAlert({
      title: 'Delete Driver?',
      text: 'Are you sure you want to remove this driver from the system? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetchOrThrow(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const assignedDevice = devicesList.find((d) => String(d?.attributes?.driverId) === String(driverId));
        if (assignedDevice) {
          const updateResponse = await fetchOrThrow(`/api/devices/${assignedDevice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...assignedDevice,
              attributes: {
                ...assignedDevice.attributes,
                driverId: null,
                driverName: null,
                driverUniqueId: null,
              },
            }),
          });
          if (updateResponse.ok) {
            const updatedDevice = await updateResponse.json();
            dispatch(devicesActions.update([updatedDevice]));
          }
        }

        dispatch(driversActions.remove(driverId));
        showAlert({
          icon: 'success',
          title: 'Deleted',
          text: 'Driver record removed from the system.',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Failed to delete driver from the system.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  const totalDrivers = sortedDrivers.length;
  const totalPages = Math.ceil(totalDrivers / rowsPerPage) || 1;
  const paginatedDrivers = sortedDrivers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

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
      <Box sx={{ flexShrink: 0, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ color: PRIMARY, fontSize: '24px' }} />
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
              Drivers
            </Typography>
          </Box>
        </Box>

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
                placeholder="Search drivers, RFID, phone..."
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

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={handleCreateDriver}
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
            Add Driver
          </Button>
        </Box>
      </Box>

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
                    width: 220,
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
                  Driver Name
                </TableCell>
                <TableCell
                  sx={{
                    width: 140,
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
                  RFID / Tag ID
                </TableCell>
                <TableCell
                  sx={{
                    width: 140,
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
                  Phone
                </TableCell>
                <TableCell
                  sx={{
                    width: 130,
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
                  License
                </TableCell>
                <TableCell
                  sx={{
                    width: 130,
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
                  Expiry
                </TableCell>
                <TableCell
                  sx={{
                    width: 150,
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
                  Assigned Unit
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
              {loading && sortedDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={26} sx={{ color: PRIMARY }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: TEXT_SECONDARY, mt: 1, fontFamily: FONT_FAMILY }}>
                      Loading drivers directory...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedDrivers.length > 0 ? (
                paginatedDrivers.map((driver) => {
                  const assignedDevice = getAssignedDevice(driver.id);
                  const attrs = driver.attributes || {};
                  const displayTag = attrs.rfid || (driver.uniqueId && !String(driver.uniqueId).startsWith('DRV-') ? driver.uniqueId : '—');

                  return (
                    <DriverTableRow
                      key={driver.id}
                      driver={driver}
                      assignedDevice={assignedDevice}
                      displayTag={displayTag}
                      onEdit={handleEditDriver}
                      onDelete={handleDeleteDriver}
                    />
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      py: 5,
                      color: '#64748b',
                      fontSize: '13px',
                      fontWeight: 400,
                      ...fontStyle,
                    }}
                  >
                    No drivers found in the system.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {totalDrivers > 0 && (
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
              Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalDrivers)} of {totalDrivers} Drivers
            </span>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page === 0}
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
                disabled={page >= totalPages - 1}
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

      {isAdmin && (
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


      <Dialog
        open={dialogOpen}
        onClose={(_, reason) => {
          if (submitting || reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          setDialogOpen(false);
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px',
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
              width: { xs: '95vw', sm: '680px' },
              maxWidth: '680px',
              margin: 'auto',
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
            <PeopleIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
            <Typography sx={{ fontWeight: 600, fontSize: '15px !important', color: TEXT, fontFamily: FONT_FAMILY }}>
              {selectedDriver ? 'Edit Driver' : 'Add Driver'}
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

        <form onSubmit={handleSaveDriver} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, nv) => setActiveTab(nv)}
            variant="scrollable"
            scrollButtons="auto"
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
                fontFamily: FONT_FAMILY,
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
            <Tab icon={<BadgeOutlinedIcon />} iconPosition="start" label="General" />
            <Tab icon={<DriveEtaOutlinedIcon />} iconPosition="start" label="License" />
            <Tab icon={<ContactEmergencyOutlinedIcon />} iconPosition="start" label="Emergency" />
            <Tab icon={<DirectionsCarOutlinedIcon />} iconPosition="start" label="Unit Assignment" />
            <Tab icon={<NoteAltOutlinedIcon />} iconPosition="start" label="Notes" />
          </Tabs>

          <DialogContent
            sx={{
              padding: '20px 22px',
              minHeight: '300px',
              maxHeight: '440px',
              overflowY: 'auto',
              backgroundColor: SURFACE,
              ...scrollableSx,
            }}
          >
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                    <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Driver Full Name
                  </Typography>
                  <TextField
                    size="small"
                    required
                    fullWidth
                    autoFocus
                    placeholder="Insert driver full name..."
                    value={formData.fullName}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& input': {
                        fontSize: '13px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                        padding: '8.5px 12px',
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                    RFID / Tag Number (Optional)
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter manual tag ID or leave blank..."
                    value={formData.rfid}
                    disabled={!isAdmin}
                    onChange={(e) => handleFieldChange('rfid', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& input': {
                        fontSize: '13px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                        padding: '8.5px 12px',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      Phone Number
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="+260..."
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      Email Address
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="driver@example.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      Physical Address
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Street address..."
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      NRC / National ID
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="NRC or Passport ID..."
                      value={formData.nrcNumber}
                      onChange={(e) => handleFieldChange('nrcNumber', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      License Number
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="License ID..."
                      value={formData.licenseNumber}
                      onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      License Class
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="e.g. Class C, CE, PSV..."
                      value={formData.licenseClass}
                      onChange={(e) => handleFieldChange('licenseClass', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      License Expiry Date
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) => handleFieldChange('licenseExpiry', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      Years of Experience
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="e.g. 5 Years"
                      value={formData.drivingExperience}
                      onChange={(e) => handleFieldChange('drivingExperience', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                    Contact Name
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Full name of emergency contact..."
                    value={formData.nextOfKin}
                    onChange={(e) => handleFieldChange('nextOfKin', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& input': {
                        fontSize: '13px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                        padding: '8.5px 12px',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      Contact Phone
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="+260..."
                      value={formData.nextOfKinPhone}
                      onChange={(e) => handleFieldChange('nextOfKinPhone', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '8.5px 12px',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                      Relationship
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={formData.relationship}
                        IconComponent={KeyboardArrowDownIcon}
                        onChange={(e) => handleFieldChange('relationship', e.target.value)}
                        displayEmpty
                        sx={{
                          borderRadius: '6px',
                          fontFamily: FONT_FAMILY,
                          fontSize: '13px',
                          '& .MuiSelect-select': { padding: '8.5px 12px' },
                        }}
                      >
                        <MenuItem value="" sx={{ fontSize: '13px', color: TEXT_MUTED, fontFamily: FONT_FAMILY }}>
                          Select relationship...
                        </MenuItem>
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px', fontFamily: FONT_FAMILY }}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>
            )}

            {activeTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, color: TEXT, fontFamily: FONT_FAMILY }}>
                    Select Vehicle Unit Assignment
                  </Typography>
                  {formData.assignedDeviceId && (
                    <Button
                      size="small"
                      onClick={() => handleFieldChange('assignedDeviceId', null)}
                      sx={{ textTransform: 'none', color: '#dc2626', fontWeight: 600, fontSize: '12px', p: 0, fontFamily: FONT_FAMILY }}
                    >
                      Clear Assignment
                    </Button>
                  )}
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
                      const isChecked = String(formData.assignedDeviceId) === String(device.id);
                      return (
                        <Box
                          key={device.id}
                          onClick={() => handleFieldChange('assignedDeviceId', isChecked ? null : device.id)}
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
                          <DirectionsCarOutlinedIcon sx={{ fontSize: 16, mr: 0.8, color: isChecked ? PRIMARY : TEXT_MUTED }} />
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
            )}

            {activeTab === 4 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                    Description
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Driver responsibilities or role overview..."
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& textarea': {
                        fontSize: '13px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
                    Internal Notes
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Private fleet manager notes..."
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& textarea': {
                        fontSize: '13px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
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