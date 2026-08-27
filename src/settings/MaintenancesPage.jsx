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
  CircularProgress,
  Alert,
} from '@mui/material';

import Swal from 'sweetalert2';
import dayjs from 'dayjs';

import AddIcon from '@mui/icons-material/Add';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import { useTranslation } from '../common/components/LocalizationProvider';
import { maintenancesActions, devicesActions } from '../store';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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
const BORDER_LIGHT = '#e2e8f0';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';

const MAINTENANCE_TYPES = [
  { value: 'serviceDate', label: 'Calendar Interval (Insurance, Road Tax, Annual)' },
  { value: 'totalDistance', label: 'Odometer Mileage (Oil, Service, Tires)' },
  { value: 'hours', label: 'Engine Hours (Machinery, Generator)' },
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
  name: '',
  type: 'serviceDate',
  startValue: dayjs().format('YYYY-MM-DD'),
  periodValue: '365',
  assignedDeviceIds: [],
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
    padding: '18px 20px',
    gap: '14px',
    '&, & *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
}));

const MaintenanceTableRow = memo(({
  item,
  assignedDeviceNames,
  displayStart,
  displayPeriod,
  onEdit,
  onDelete,
}) => {
  const isInsurance = (item.name || '').toLowerCase().includes('insurance');
  const isTax = (item.name || '').toLowerCase().includes('tax') || (item.name || '').toLowerCase().includes('fitness');

  return (
    <TableRow
      hover
      sx={{
        height: '46px',
        '&:hover': { backgroundColor: '#e6f7f5 !important' },
        '& td': {
          py: '9px',
          px: '14px',
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
        onClick={() => onEdit(item)}
        sx={{
          color: '#0f172a !important',
          fontWeight: '600 !important',
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ color: PRIMARY, fontWeight: 700 }}>{item.name || '—'}</span>
        </Box>
      </TableCell>

      <TableCell>
        <Chip
          label={isInsurance ? 'Insurance' : isTax ? 'Road Tax' : item.type === 'serviceDate' ? 'Calendar' : 'Odometer'}
          size="small"
          sx={{
            height: '22px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: isInsurance ? '#eff6ff' : isTax ? '#fef3c7' : '#f0fdfa',
            color: isInsurance ? '#1d4ed8' : isTax ? '#b45309' : '#008f77',
            border: `1px solid ${isInsurance ? '#bfdbfe' : isTax ? '#fde68a' : '#a7f3d0'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell sx={{ color: '#475569' }}>
        {displayStart}
      </TableCell>

      <TableCell sx={{ color: '#475569', fontWeight: 600 }}>
        {displayPeriod}
      </TableCell>

      <TableCell>
        {assignedDeviceNames && assignedDeviceNames.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {assignedDeviceNames.slice(0, 2).map((devName, i) => (
              <Chip
                key={i}
                icon={<DirectionsCarOutlinedIcon style={{ fontSize: 13, color: '#15803d' }} />}
                label={devName}
                size="small"
                sx={{
                  height: '22px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  ...fontStyle,
                }}
              />
            ))}
            {assignedDeviceNames.length > 2 && (
              <Chip
                label={`+${assignedDeviceNames.length - 2} more`}
                size="small"
                sx={{
                  height: '22px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: '#f1f5f9',
                  color: TEXT_SECONDARY,
                  borderRadius: '4px',
                }}
              />
            )}
          </Box>
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
            All Vehicles
          </span>
        )}
      </TableCell>

      <TableCell align="center" sx={{ borderRight: 'none !important', pr: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
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
MaintenanceTableRow.displayName = 'MaintenanceTableRow';

export default function MaintenancesPage() {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const server = useSelector((state) => state.session?.server || {});
  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';
  const impersonatedUserId = localStorage.getItem('impersonated_user_id');

  const rawDevices = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const rawMaintenances = useSelector((state) => state.maintenances?.items || {}, shallowEqual);

  const devicesList = useMemo(() => {
    return Array.isArray(rawDevices) ? rawDevices : Object.values(rawDevices || {});
  }, [rawDevices]);

  const maintenancesList = useMemo(() => {
    return Array.isArray(rawMaintenances) ? rawMaintenances : Object.values(rawMaintenances || {});
  }, [rawMaintenances]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 12;
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const [formData, setFormData] = useState(initialFormData);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const applyPreset = (presetName) => {
    if (presetName === 'insurance') {
      setFormData((prev) => ({
        ...prev,
        name: 'Insurance Policy Renewal',
        type: 'serviceDate',
        startValue: dayjs().format('YYYY-MM-DD'),
        periodValue: '365',
        notes: 'Annual comprehensive commercial insurance renewal.',
      }));
    } else if (presetName === 'roadTax') {
      setFormData((prev) => ({
        ...prev,
        name: 'Road Tax & Fitness Certificate',
        type: 'serviceDate',
        startValue: dayjs().format('YYYY-MM-DD'),
        periodValue: '365',
        notes: 'Vehicle inspection certificate and road tax token.',
      }));
    } else if (presetName === 'oilService') {
      setFormData((prev) => ({
        ...prev,
        name: 'Engine Oil & Filter Service',
        type: 'totalDistance',
        startValue: '0',
        periodValue: '5000',
        notes: '15W-40 Full Synthetic Oil and OEM oil filter change.',
      }));
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setSyncError(null);
    try {
      const endpoint = impersonatedUserId
        ? `/api/maintenance?userId=${impersonatedUserId}`
        : '/api/maintenance';

      const [maintRes, devRes] = await Promise.all([
        fetch(endpoint, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/devices', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }).catch(() => null),
      ]);

      if (maintRes && maintRes.ok) {
        const mData = await maintRes.json();
        const mList = Array.isArray(mData) ? mData : Object.values(mData || {});
        if (maintenancesActions?.refresh) {
          dispatch(maintenancesActions.refresh(mList));
        }
      } else if (maintRes && !maintRes.ok) {
        setSyncError(`Server returned status ${maintRes.status}`);
      }

      if (devRes && devRes.ok) {
        const dData = await devRes.json();
        const dList = Array.isArray(dData) ? dData : Object.values(dData || {});
        if (devicesActions?.refresh) {
          dispatch(devicesActions.refresh(dList));
        }
      }
    } catch (err) {
      setSyncError('Could not sync with the backend. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [dispatch, impersonatedUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const convertDisplayAttribute = useCallback((type, isStart, val) => {
    if (val === undefined || val === null || val === '') return '—';
    const num = Number(val);
    if (type === 'serviceDate' || String(type).endsWith('Time')) {
      if (isStart) {
        return dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD') : String(val);
      }
      return `${Math.round(num / 86400000)} Days`;
    }
    if (type === 'hours') {
      return `${(num / 3600000).toFixed(1)} Hours`;
    }
    if (type === 'totalDistance') {
      return `${(num / 1000).toFixed(1)} km`;
    }
    return String(val);
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setActiveTab(0);
  };

  const handleCreateMaintenance = () => {
    resetForm();
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEditMaintenance = (item) => {
    resetForm();
    setSelectedItem(item);

    let startFormatted = item.start;
    let periodFormatted = item.period;

    if (item.type === 'totalDistance') {
      startFormatted = item.start ? item.start / 1000 : '';
      periodFormatted = item.period ? item.period / 1000 : '';
    } else if (item.type === 'hours') {
      startFormatted = item.start ? item.start / 3600000 : '';
      periodFormatted = item.period ? item.period / 3600000 : '';
    } else if (item.type === 'serviceDate') {
      startFormatted = item.start ? dayjs(item.start).format('YYYY-MM-DD') : '';
      periodFormatted = item.period ? item.period / 86400000 : '';
    }

    const assignedDevIds = item.attributes?.deviceIds || [];

    setFormData({
      name: item.name || '',
      type: item.type || 'serviceDate',
      startValue: startFormatted,
      periodValue: periodFormatted,
      assignedDeviceIds: assignedDevIds,
      notes: item.attributes?.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSaveMaintenance = async (e) => {
    if (e) e.preventDefault();
    const isEdit = Boolean(selectedItem);
    const cleanName = formData.name.trim();

    if (!cleanName) {
      setActiveTab(0);
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a maintenance service name.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setSubmitting(true);

    let computedStart = 0;
    let computedPeriod = 0;

    if (formData.type === 'totalDistance') {
      computedStart = Number(formData.startValue || 0) * 1000;
      computedPeriod = Number(formData.periodValue || 0) * 1000;
    } else if (formData.type === 'hours') {
      computedStart = Number(formData.startValue || 0) * 3600000;
      computedPeriod = Number(formData.periodValue || 0) * 3600000;
    } else if (formData.type === 'serviceDate') {
      computedStart = formData.startValue ? new Date(formData.startValue).getTime() : Date.now();
      computedPeriod = Number(formData.periodValue || 0) * 86400000;
    }

    const payload = {
      ...(isEdit ? { id: selectedItem.id } : {}),
      name: cleanName,
      type: formData.type,
      start: computedStart,
      period: computedPeriod,
      attributes: {
        ...(selectedItem?.attributes || {}),
        notes: formData.notes || '',
        deviceIds: formData.assignedDeviceIds,
        updatedAt: new Date().toISOString(),
      },
    };

    const url = isEdit ? `/api/maintenance/${selectedItem.id}` : '/api/maintenance';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server responded with ${response.status}`);
      }

      const savedItem = await response.json();

      if (!isEdit && currentUser?.id) {
        await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser.id,
            maintenanceId: savedItem.id,
          }),
        }).catch(() => null);
      }

      if (Array.isArray(formData.assignedDeviceIds) && formData.assignedDeviceIds.length > 0) {
        await Promise.all(
          formData.assignedDeviceIds.map((deviceId) =>
            fetch('/api/permissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                deviceId,
                maintenanceId: savedItem.id,
              }),
            }).catch(() => null)
          )
        );
      }

      if (isEdit) {
        if (maintenancesActions?.update) dispatch(maintenancesActions.update([savedItem]));
      } else {
        if (maintenancesActions?.add) dispatch(maintenancesActions.add(savedItem));
      }

      setDialogOpen(false);
      showAlert({
        icon: 'success',
        title: isEdit ? 'Maintenance Updated' : 'Maintenance Added',
        text: isEdit
          ? `"${savedItem.name}" has been updated successfully.`
          : `"${savedItem.name}" has been configured successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || 'Could not save maintenance record to the server.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaintenance = async (item) => {
    const itemName = item?.name || 'this schedule';
    const itemId = item?.id;

    const result = await showAlert({
      title: 'Delete Maintenance?',
      html: `Are you sure you want to delete <strong>"${itemName}"</strong>?<br/><span style="font-size: 12.5px; color: #64748b;">This will remove all associated tracking reminders for assigned vehicles.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/maintenance/${itemId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        if (maintenancesActions?.remove) dispatch(maintenancesActions.remove(itemId));
        showAlert({
          icon: 'success',
          title: 'Deleted',
          text: `"${itemName}" was removed from the system.`,
          timer: 1800,
          showConfirmButton: false,
        });
        loadData();
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Failed to remove maintenance schedule.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  const sortedMaintenances = useMemo(() => {
    let result = maintenancesList.filter(Boolean);
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m?.name || '').toLowerCase().includes(q) ||
          (m?.type || '').toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [maintenancesList, searchKeyword]);

  const totalItems = sortedMaintenances.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedItems = sortedMaintenances.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box className={classes.root}>
      {/* Top Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <BuildOutlinedIcon sx={{ color: PRIMARY, fontSize: '24px' }} />
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
              Maintenance Schedules
            </Typography>
          </Box>

          {syncError && (
            <Button
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
              onClick={loadData}
              sx={{
                color: PRIMARY,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              Retry Sync
            </Button>
          )}
        </Box>

        {syncError && (
          <Alert severity="warning" sx={{ py: 0.5, px: 1.5, fontSize: '12px', borderRadius: '6px' }}>
            {syncError}
          </Alert>
        )}

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            boxSizing: 'border-box',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: SURFACE,
                borderRadius: '20px',
                paddingLeft: '14px',
                paddingRight: '8px',
                height: '38px',
                border: `1.5px solid ${BORDER}`,
                width: { xs: '100%', sm: '270px' },
                transition: 'all 0.15s ease',
                '&:focus-within': {
                  borderColor: PRIMARY,
                  backgroundColor: SURFACE,
                  boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
                },
              }}
            >
              <SearchIcon sx={{ color: TEXT_MUTED, fontSize: '17px', marginRight: '8px', flexShrink: 0 }} />
              <InputBase
                placeholder="Search maintenance, interval..."
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
            onClick={handleCreateMaintenance}
            disableElevation
            sx={{
              height: '38px',
              minWidth: '130px',
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
            Add Maintenance
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
          borderRadius: '8px',
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
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Maintenance Name
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
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Type
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
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Start Point
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
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Repeat Interval
                </TableCell>
                <TableCell
                  sx={{
                    width: 200,
                    fontWeight: '700 !important',
                    fontSize: '13px !important',
                    color: '#0f172a',
                    backgroundColor: '#e6f7f5',
                    borderBottom: '2px solid #00ab8e',
                    borderRight: '1px solid #cbd5e1',
                    py: '9px',
                    px: '14px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  Assigned Vehicles
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
                    py: '9px',
                    px: '14px',
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
              {loading && sortedMaintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={26} sx={{ color: PRIMARY }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: TEXT_SECONDARY, mt: 1, fontFamily: FONT_FAMILY }}>
                      Loading maintenance schedules...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item) => {
                  const targetIds = item.attributes?.deviceIds || [];
                  const assignedDeviceNames = devicesList
                    .filter((d) => targetIds.includes(d.id))
                    .map((d) => d.name);

                  return (
                    <MaintenanceTableRow
                      key={item.id}
                      item={item}
                      assignedDeviceNames={assignedDeviceNames}
                      displayStart={convertDisplayAttribute(item.type, true, item.start)}
                      displayPeriod={convertDisplayAttribute(item.type, false, item.period)}
                      onEdit={handleEditMaintenance}
                      onDelete={handleDeleteMaintenance}
                    />
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 5,
                      color: '#64748b',
                      fontSize: '13px',
                      fontWeight: 400,
                      ...fontStyle,
                    }}
                  >
                    No maintenance schedules configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              borderTop: '1px solid #cbd5e1',
              backgroundColor: SURFACE,
              flexShrink: 0,
              flexWrap: 'wrap',
              gap: 1,
              ...fontStyle,
            }}
          >
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: TEXT_SECONDARY, fontFamily: FONT_FAMILY }}>
              Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalItems)} of {totalItems} Schedules
            </span>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
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

      {/* Footer System Status Bar */}
      <Box
        sx={{
          mt: 'auto',
          pt: '10px',
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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            px: 1.4,
            py: 0.5,
            borderRadius: '20px',
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857', letterSpacing: '0.2px', ...fontStyle }}>
            Live Connection Active
          </span>
        </Box>
      </Box>

      {/* Interactive Maintenance Popup Modal Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          if (submitting) return;
          setDialogOpen(false);
        }}
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
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SURFACE,
            borderBottom: '1.5px solid #f1f5f9',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <BuildOutlinedIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
            <Typography sx={{ fontWeight: 600, fontSize: '15px !important', color: TEXT, fontFamily: FONT_FAMILY }}>
              {selectedItem ? 'Edit Maintenance Schedule' : 'Add Maintenance Schedule'}
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

        <form onSubmit={handleSaveMaintenance} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, nv) => setActiveTab(nv)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1.5px solid ${BORDER}`,
              backgroundColor: SURFACE,
              minHeight: '44px',
              px: 2,
              '& .MuiTabs-flexContainer': {
                justifyContent: 'space-between',
                width: '100%',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '13px',
                color: TEXT_SECONDARY,
                minHeight: '44px',
                minWidth: 'auto',
                padding: '0 14px',
                fontFamily: FONT_FAMILY,
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                gap: '8px',
                '& svg': { margin: 0, fontSize: '17px' },
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
            <Tab icon={<VerifiedUserOutlinedIcon />} iconPosition="start" label="General Setup" />
            <Tab icon={<DirectionsCarOutlinedIcon />} iconPosition="start" label="Vehicle Assignment" />
            <Tab icon={<NoteAltOutlinedIcon />} iconPosition="start" label="Notes" />
          </Tabs>

          <DialogContent
            sx={{
              padding: '24px 26px',
              minHeight: '300px',
              maxHeight: '450px',
              overflowY: 'auto',
              backgroundColor: SURFACE,
              ...scrollableSx,
            }}
          >
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Presets */}
                <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 600, mr: 0.5 }}>
                    Quick Presets:
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => applyPreset('insurance')}
                    sx={{ fontSize: '11.5px', textTransform: 'none', py: 0.4, px: 1.2, borderRadius: '6px', borderColor: '#bfdbfe', color: '#1d4ed8', backgroundColor: '#eff6ff' }}
                  >
                    + Insurance Renewal (365d)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => applyPreset('roadTax')}
                    sx={{ fontSize: '11.5px', textTransform: 'none', py: 0.4, px: 1.2, borderRadius: '6px', borderColor: '#fde68a', color: '#b45309', backgroundColor: '#fef3c7' }}
                  >
                    + Road Tax Token (365d)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => applyPreset('oilService')}
                    sx={{ fontSize: '11.5px', textTransform: 'none', py: 0.4, px: 1.2, borderRadius: '6px', borderColor: '#a7f3d0', color: '#008f77', backgroundColor: '#f0fdfa' }}
                  >
                    + Oil Service (5,000 km)
                  </Button>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12.5px', color: TEXT, marginBottom: '8px', fontFamily: FONT_FAMILY }}>
                    <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Maintenance Service Name
                  </Typography>
                  <TextField
                    size="small"
                    required
                    fullWidth
                    autoFocus
                    placeholder="e.g. Engine Oil Service, Tire Replacement, Insurance Renewal..."
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& input': {
                        fontSize: '13px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                        padding: '10px 14px',
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12.5px', color: TEXT, marginBottom: '8px', fontFamily: FONT_FAMILY }}>
                    Trigger Condition Type
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={formData.type}
                      IconComponent={KeyboardArrowDownIcon}
                      onChange={(e) => handleFieldChange('type', e.target.value)}
                      sx={{
                        borderRadius: '6px',
                        fontFamily: FONT_FAMILY,
                        fontSize: '13px',
                        '& .MuiSelect-select': { padding: '10px 14px' },
                      }}
                    >
                      {MAINTENANCE_TYPES.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px', fontFamily: FONT_FAMILY }}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12.5px', color: TEXT, marginBottom: '8px', fontFamily: FONT_FAMILY }}>
                      {formData.type === 'totalDistance'
                        ? 'Current / Start Mileage (km)'
                        : formData.type === 'hours'
                        ? 'Current / Start Engine Hours (h)'
                        : 'Start / Issue Date'}
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      type={formData.type === 'serviceDate' ? 'date' : 'number'}
                      placeholder={formData.type === 'serviceDate' ? '' : '0'}
                      value={formData.startValue}
                      onChange={(e) => handleFieldChange('startValue', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '10px 14px',
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: '12.5px', color: TEXT, marginBottom: '8px', fontFamily: FONT_FAMILY }}>
                      {formData.type === 'totalDistance'
                        ? 'Repeat Interval (Every X km)'
                        : formData.type === 'hours'
                        ? 'Repeat Interval (Every X Hours)'
                        : 'Renewal Interval (Every X Days)'}
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      type="number"
                      placeholder={formData.type === 'serviceDate' ? '365' : '5000'}
                      value={formData.periodValue}
                      onChange={(e) => handleFieldChange('periodValue', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                        '& input': {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TEXT,
                          fontFamily: FONT_FAMILY,
                          padding: '10px 14px',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: TEXT, fontFamily: FONT_FAMILY }}>
                    Select Vehicles Covered By This Schedule
                  </Typography>
                  {formData.assignedDeviceIds.length > 0 && (
                    <Button
                      size="small"
                      onClick={() => handleFieldChange('assignedDeviceIds', [])}
                      sx={{ textTransform: 'none', color: '#dc2626', fontWeight: 600, fontSize: '12px', p: 0, fontFamily: FONT_FAMILY }}
                    >
                      Clear All ({formData.assignedDeviceIds.length})
                    </Button>
                  )}
                </Box>

                <Box
                  sx={{
                    maxHeight: 250,
                    overflowY: 'auto',
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: '8px',
                    p: 1.5,
                    backgroundColor: SURFACE_SOFT,
                    ...scrollableSx,
                  }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 1.2 }}>
                    {devicesList.map((device) => {
                      const isChecked = formData.assignedDeviceIds.includes(device.id);
                      return (
                        <Box
                          key={device.id}
                          onClick={() => {
                            const next = isChecked
                              ? formData.assignedDeviceIds.filter((id) => id !== device.id)
                              : [...formData.assignedDeviceIds, device.id];
                            handleFieldChange('assignedDeviceIds', next);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: isChecked ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                            borderRadius: '6px',
                            backgroundColor: isChecked ? '#f0fdfa' : SURFACE,
                            height: '42px',
                            px: 1.2,
                            cursor: 'pointer',
                            minWidth: 0,
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: PRIMARY },
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={isChecked}
                            sx={{ p: 0.4, mr: 0.6, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                          />
                          <DirectionsCarOutlinedIcon sx={{ fontSize: 17, mr: 0.8, color: isChecked ? PRIMARY : TEXT_MUTED }} />
                          <Typography
                            noWrap
                            sx={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isChecked ? '#0f172a' : TEXT,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: FONT_FAMILY,
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

            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '12.5px', color: TEXT, marginBottom: '8px', fontFamily: FONT_FAMILY }}>
                    Instructions & Workshop Notes
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter technician instructions, oil specifications, filter part numbers, policy token..."
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                      '& textarea': {
                        fontSize: '13px',
                        fontWeight: 400,
                        color: TEXT,
                        fontFamily: FONT_FAMILY,
                        lineHeight: 1.5,
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ padding: '16px 22px', backgroundColor: SURFACE, borderTop: '1.5px solid #f1f5f9', gap: 1.5 }}>
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
                height: '38px',
                px: 2.8,
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
                height: '38px',
                px: 3.2,
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