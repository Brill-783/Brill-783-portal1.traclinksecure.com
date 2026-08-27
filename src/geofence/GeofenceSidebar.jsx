import React, { useState, useMemo, useEffect } from 'react';
import {
  TextField,
  List,
  ListItem,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Typography,
  Select,
  MenuItem,
  Checkbox,
  Box,
  InputBase,
  FormControl,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useSelector, useDispatch } from 'react-redux';
import { geofencesActions } from '../store';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LayersIcon from '@mui/icons-material/Layers';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ConstructionIcon from '@mui/icons-material/Construction';
import PersonIcon from '@mui/icons-material/Person';
import Swal from 'sweetalert2';
import { map } from '../map/core/MapView';
import GradientColorPicker from '../common/components/GradientColorPicker';
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

const getDeviceCategoryIcon = (category) => {
  const cat = String(category || 'default').toLowerCase();
  switch (cat) {
    case 'motorcycle':
    case 'scooter':
    case 'bicycle':
      return <TwoWheelerIcon sx={{ fontSize: 16 }} />;
    case 'truck':
    case 'pickup':
      return <LocalShippingIcon sx={{ fontSize: 16 }} />;
    case 'bus':
      return <DirectionsBusIcon sx={{ fontSize: 16 }} />;
    case 'van':
      return <AirportShuttleIcon sx={{ fontSize: 16 }} />;
    case 'tractor':
      return <AgricultureIcon sx={{ fontSize: 16 }} />;
    case 'construction':
      return <ConstructionIcon sx={{ fontSize: 16 }} />;
    case 'person':
      return <PersonIcon sx={{ fontSize: 16 }} />;
    case 'car':
    case 'auto':
    case 'default':
    default:
      return <DirectionsCarFilledIcon sx={{ fontSize: 16 }} />;
  }
};

const useStyles = makeStyles()((theme) => ({
  sidebarContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: SURFACE_SOFT,
    fontFamily: FONT_FAMILY,
    borderRight: `1px solid ${BORDER}`,
    overflow: 'hidden',
    boxSizing: 'border-box',
    '& *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
  },
  headerWrapper: {
    padding: '12px 14px 10px',
    backgroundColor: SURFACE,
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  headerTitle: {
    fontWeight: '700 !important',
    fontSize: '16px !important',
    color: TEXT,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  searchBoxContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SURFACE_SOFT,
    borderRadius: '20px',
    border: `1.5px solid ${BORDER}`,
    padding: '0 10px',
    height: '36px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease',
    '&:focus-within': {
      borderColor: PRIMARY,
      backgroundColor: SURFACE,
      boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
    },
  },
  addButton: {
    height: '34px',
    borderRadius: '8px',
    backgroundColor: PRIMARY,
    color: '#ffffff',
    textTransform: 'none',
    fontSize: '12.5px !important',
    fontWeight: '600 !important',
    boxShadow: '0 2px 6px rgba(0, 171, 142, 0.22)',
    '&:hover': { backgroundColor: PRIMARY_DARK },
  },
  geofenceListContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '8px 10px',
    ...scrollableSx,
  },
  geofenceItem: {
    padding: '8px 10px',
    borderRadius: '8px',
    marginBottom: '6px',
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: PRIMARY,
      backgroundColor: '#fbfffe',
    },
  },
  geofenceItemSelected: {
    backgroundColor: `${PRIMARY_LIGHT} !important`,
    borderColor: `${PRIMARY} !important`,
  },
  geofenceContentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  geofenceName: {
    fontSize: '13px !important',
    fontWeight: '600 !important',
    color: TEXT,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  geofenceMeta: {
    fontSize: '11px',
    color: TEXT_SECONDARY,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  geofenceTypeChip: {
    fontSize: '10px !important',
    height: '18px',
    padding: '0 4px',
    borderRadius: '4px',
    fontWeight: 600,
    backgroundColor: '#f1f5f9',
    color: TEXT_SECONDARY,
    border: '1px solid #e2e8f0',
  },
  geofenceColorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '8px',
    border: '1.5px solid #ffffff',
    boxShadow: '0 0 2px rgba(0,0,0,0.2)',
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      backgroundColor: SURFACE,
      '& fieldset': { borderColor: BORDER },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused fieldset': { borderColor: `${PRIMARY} !important`, borderWidth: '1.5px' },
    },
    '& input': {
      fontSize: '13px !important',
      fontWeight: '400 !important',
      color: TEXT,
      fontFamily: FONT_FAMILY,
      padding: '8.5px 12px',
    },
  },
  selectField: {
    borderRadius: '6px',
    backgroundColor: SURFACE,
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
    fontWeight: 400,
    color: TEXT,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: `${PRIMARY} !important`, borderWidth: '1.5px' },
    '& .MuiSelect-select': { padding: '8.5px 12px' },
  },
  unitSelectionUnifiedContainer: {
    border: `1.5px solid ${BORDER}`,
    borderRadius: '8px',
    backgroundColor: SURFACE_SOFT,
    padding: '12px 14px',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  },
  dialogSearchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: '20px',
    border: `1px solid ${BORDER}`,
    padding: '0 10px',
    height: '32px',
    width: '180px',
    maxWidth: '100%',
    transition: 'all 0.15s ease',
    '&:focus-within': {
      borderColor: PRIMARY,
      boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
    },
  },
  unitListScroll: {
    maxHeight: '200px',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '8px',
    marginTop: '10px',
    paddingRight: '4px',
    boxSizing: 'border-box',
    ...scrollableSx,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
      maxHeight: '160px',
    },
  },
  unitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minWidth: 0,
    height: '38px',
    boxSizing: 'border-box',
    '&:hover': {
      borderColor: PRIMARY,
    },
  },
  unitItemSelected: {
    border: `1.5px solid ${PRIMARY} !important`,
    backgroundColor: '#f0fdfa !important',
  },
  categoryIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: PRIMARY,
  },
  drawingStatusContainer: {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2000,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    padding: '10px 18px',
    color: '#ffffff',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)',
    pointerEvents: 'none',
    textAlign: 'center',
  },
}));

const GeofenceSidebar = ({ onDrawModeChange, onGeofenceSelect, drawMode, drawingStatus }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalUnitSearch, setModalUnitSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState(null);

  const [geofenceName, setGeofenceName] = useState('');
  const [geofenceType, setGeofenceType] = useState('polygon');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [geofenceColor, setGeofenceColor] = useState(PRIMARY);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState(null);

  const geofences = useSelector((state) => state.geofences?.items || {});
  const devicesObj = useSelector((state) => state.devices?.items || {});

  const deviceList = useMemo(() => {
    return devicesObj ? Object.values(devicesObj) : [];
  }, [devicesObj]);

  const filteredModalDevices = useMemo(() => {
    const q = modalUnitSearch.trim().toLowerCase();
    if (!q) return deviceList;
    return deviceList.filter((d) =>
      String(d.name || '').toLowerCase().includes(q) ||
      String(d.uniqueId || '').toLowerCase().includes(q)
    );
  }, [deviceList, modalUnitSearch]);

  const geofenceList = useMemo(() => {
    if (!geofences) return [];
    return Object.values(geofences).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );
  }, [geofences]);

  const filteredGeofences = useMemo(() => {
    if (!searchQuery) return geofenceList;
    return geofenceList.filter((g) =>
      (g.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [geofenceList, searchQuery]);

  useEffect(() => {
    return () => {
      setCreateDialogOpen(false);
      setEditingGeofence(null);
    };
  }, []);

  const handleCreateClick = () => {
    setEditingGeofence(null);
    setGeofenceName('');
    setGeofenceType('polygon');
    setSelectedDeviceIds([]);
    setModalUnitSearch('');
    setGeofenceColor(PRIMARY);
    setCreateDialogOpen(true);
  };

  const handleEditClick = async (e, geofence) => {
    e.stopPropagation();
    setEditingGeofence(geofence);
    setGeofenceName(geofence.name || '');
    setGeofenceType(geofence.area?.includes('CIRCLE') ? 'circle' : 'polygon');
    setGeofenceColor(geofence.attributes?.color || PRIMARY);
    setModalUnitSearch('');

    try {
      const response = await fetchOrThrow(`/api/permissions?geofenceId=${geofence.id}`);
      if (response.ok) {
        const permissions = await response.json();
        const linkedDeviceIds = permissions.map((p) => p.deviceId).filter(Boolean);
        setSelectedDeviceIds(linkedDeviceIds);
      }
    } catch (err) {
      setSelectedDeviceIds([]);
    }

    setCreateDialogOpen(true);
  };

  const handleToggleUnit = (id) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnits = () => {
    setSelectedDeviceIds((prev) => {
      const selected = new Set(prev);
      filteredModalDevices.forEach((device) => selected.add(device.id));
      return Array.from(selected);
    });
  };

  const handleDeselectAllUnits = () => {
    const visibleIds = new Set(filteredModalDevices.map((device) => device.id));
    setSelectedDeviceIds((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  const handleSaveGeofenceDetails = async () => {
    if (!geofenceName.trim()) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a name for the geofence.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (editingGeofence) {
      try {
        const res = await fetchOrThrow(`/api/geofences/${editingGeofence.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editingGeofence,
            name: geofenceName.trim(),
            attributes: { ...editingGeofence.attributes, color: geofenceColor },
          }),
        });
        const updated = await res.json();
        dispatch(geofencesActions.update([updated]));

        if (Array.isArray(selectedDeviceIds) && selectedDeviceIds.length > 0) {
          await Promise.all(
            selectedDeviceIds.map((deviceId) =>
              fetchOrThrow('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, geofenceId: updated.id }),
              })
            )
          );
        }

        setCreateDialogOpen(false);
        showAlert({
          icon: 'success',
          title: 'Updated',
          text: 'Geofence updated successfully in the system.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        showAlert({
          icon: 'error',
          title: 'Update Failed',
          text: err.message || 'Failed to update geofence details.',
          confirmButtonColor: PRIMARY,
        });
      }
    } else {
      setCreateDialogOpen(false);
      if (typeof onDrawModeChange === 'function') {
        onDrawModeChange(geofenceType, {
          name: geofenceName.trim(),
          color: geofenceColor,
          deviceIds: selectedDeviceIds,
        });
      }
    }
  };

  const handleRedrawShape = () => {
    setCreateDialogOpen(false);
    if (typeof onDrawModeChange === 'function') {
      onDrawModeChange(geofenceType, {
        id: editingGeofence?.id,
        name: geofenceName.trim(),
        color: geofenceColor,
        deviceIds: selectedDeviceIds,
      });
    }
  };

  const handleDelete = async (geofence) => {
    const result = await showAlert({
      title: 'Delete Geofence?',
      text: `Are you sure you want to delete "${geofence.name}" from the system?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await fetchOrThrow(`/api/geofences/${geofence.id}`, { method: 'DELETE' });
      dispatch(geofencesActions.remove(geofence.id));
      showAlert({
        icon: 'success',
        title: 'Deleted',
        text: 'Geofence removed from the system.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Failed to remove geofence.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  const handleGeofenceClick = (geofence) => {
    setSelectedGeofenceId(geofence.id);
    if (geofence.area && map) {
      try {
        if (geofence.area.includes('CIRCLE')) {
          const coords = geofence.area.replace(/CIRCLE|\(|\)|,/g, ' ').trim().split(/ +/);
          const lat = Number(coords[0]);
          const lng = Number(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            map.flyTo({ center: [lng, lat], zoom: 15, duration: 600 });
          }
        } else if (geofence.area.includes('POLYGON')) {
          const raw = geofence.area.replace(/POLYGON|\(|\)/g, '').trim();
          const firstPoint = raw.split(',')[0].trim().split(' ');
          const lat = Number(firstPoint[0]);
          const lng = Number(firstPoint[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            map.flyTo({ center: [lng, lat], zoom: 15, duration: 600 });
          }
        }
      } catch (e) {
        console.warn('FlyTo error:', e);
      }
    }
    if (onGeofenceSelect) onGeofenceSelect(geofence);
  };

  return (
    <div className={classes.sidebarContainer}>
      <div className={classes.headerWrapper}>
        <div className={classes.headerTopRow}>
          <div className={classes.headerTitleWrap}>
            <LayersIcon sx={{ color: PRIMARY, fontSize: 20 }} />
            <Typography className={classes.headerTitle}>Geofences</Typography>
          </div>
          <Button
            variant="contained"
            className={classes.addButton}
            onClick={handleCreateClick}
            startIcon={<AddIcon sx={{ fontSize: '17px !important' }} />}
            disableElevation
          >
            Add Geofence
          </Button>
        </div>

        <div className={classes.searchBoxContainer}>
          <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 16, mr: 0.8, flexShrink: 0 }} />
          <InputBase
            placeholder="Search geofences..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ fontSize: '13px', fontWeight: 400, color: TEXT }}
          />
        </div>
      </div>

      <div className={classes.geofenceListContainer}>
        <List dense sx={{ py: 0 }}>
          {filteredGeofences.map((geofence) => {
            const isSelected = selectedGeofenceId === geofence.id;
            return (
              <ListItem
                key={geofence.id}
                className={`${classes.geofenceItem} ${isSelected ? classes.geofenceItemSelected : ''}`}
                onClick={() => handleGeofenceClick(geofence)}
              >
                <ListItemIcon sx={{ minWidth: '24px' }}>
                  <span
                    className={classes.geofenceColorDot}
                    style={{ backgroundColor: geofence.attributes?.color || PRIMARY }}
                  />
                </ListItemIcon>

                <div className={classes.geofenceContentWrapper}>
                  <Typography component="div" className={classes.geofenceName}>
                    {geofence.name}
                  </Typography>
                  <div className={classes.geofenceMeta}>
                    <Chip
                      label={geofence.area?.includes('CIRCLE') ? 'Circle' : 'Polygon'}
                      size="small"
                      className={classes.geofenceTypeChip}
                    />
                  </div>
                </div>

                <div className={classes.actionButtons}>
                  <button
                    type="button"
                    onClick={(e) => handleEditClick(e, geofence)}
                    style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(geofence);
                    }}
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
                </div>
              </ListItem>
            );
          })}
        </List>
      </div>

      {drawMode && (
        <div className={classes.drawingStatusContainer}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px', color: '#ffffff' }}>
            Drawing {drawMode === 'circle' ? 'Circle' : 'Polygon'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
            {typeof drawingStatus === 'string'
              ? drawingStatus
              : drawMode === 'circle'
              ? 'Click center point & drag outward to set radius.'
              : 'Click points on map, click start point to close.'}
          </div>
        </div>
      )}

      <Dialog
        open={createDialogOpen}
        onClose={(_, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          setCreateDialogOpen(false);
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
            <LayersIcon sx={{ color: PRIMARY, fontSize: '20px' }} />
            <Typography sx={{ fontWeight: 600, fontSize: '15px !important', color: TEXT, fontFamily: FONT_FAMILY }}>
              {editingGeofence ? 'Edit Geofence' : 'Add Geofence'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setCreateDialogOpen(false)} sx={{ color: TEXT_SECONDARY, padding: '4px' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px' }}>
              <span style={{ color: PRIMARY, marginRight: '4px' }}>*</span>Geofence Name
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. Warehouse Yard..."
              value={geofenceName}
              onChange={(e) => setGeofenceName(e.target.value)}
              className={classes.textField}
            />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px' }}>
              Geometry Type
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={geofenceType}
                IconComponent={KeyboardArrowDownIcon}
                onChange={(e) => setGeofenceType(e.target.value)}
                className={classes.selectField}
                disabled={Boolean(editingGeofence)}
              >
                <MenuItem value="polygon">Polygon Zone</MenuItem>
                <MenuItem value="circle">Circular Zone</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Units Selection with compact search and scrollbar */}
          <Box className={classes.unitSelectionUnifiedContainer}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography sx={{ fontSize: '12px !important', fontWeight: '500 !important', color: TEXT, fontFamily: FONT_FAMILY }}>
                Assigned Units ({selectedDeviceIds.length}/{deviceList.length})
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box className={classes.dialogSearchBox}>
                  <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 15, mr: 0.6 }} />
                  <InputBase
                    placeholder="Search units..."
                    value={modalUnitSearch}
                    onChange={(e) => setModalUnitSearch(e.target.value)}
                    sx={{ fontSize: '12px', color: TEXT, fontFamily: FONT_FAMILY }}
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

            <Box className={classes.unitListScroll}>
              {filteredModalDevices.map((dev) => {
                const isChecked = selectedDeviceIds.includes(dev.id);
                return (
                  <Box
                    key={dev.id}
                    className={`${classes.unitItem} ${isChecked ? classes.unitItemSelected : ''}`}
                    onClick={() => handleToggleUnit(dev.id)}
                  >
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      sx={{ p: 0.2, mr: 0.5, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                    />
                    <Box className={classes.categoryIconWrap}>
                      {getDeviceCategoryIcon(dev.category)}
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
                      {dev.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: '12px', color: TEXT, marginBottom: '6px' }}>
              Zone Outline Color
            </Typography>
            <GradientColorPicker value={geofenceColor} onChange={setGeofenceColor} />
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: '14px 20px', backgroundColor: SURFACE, borderTop: '1.5px solid #f1f5f9', gap: 1.5 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
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
              '&:hover': { borderColor: PRIMARY_DARK, backgroundColor: '#f0fdfa' },
            }}
          >
            Cancel
          </Button>

          {editingGeofence && (
            <Button
              onClick={handleRedrawShape}
              variant="outlined"
              sx={{
                borderRadius: '8px',
                color: TEXT_SECONDARY,
                borderColor: BORDER,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                height: '36px',
                px: 2,
              }}
            >
              Redraw Shape
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleSaveGeofenceDetails}
            disableElevation
            sx={{
              borderRadius: '8px',
              backgroundColor: PRIMARY,
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              height: '36px',
              px: 3,
              '&:hover': { backgroundColor: PRIMARY_DARK },
            }}
          >
            {editingGeofence ? 'Save Details' : 'Draw on Map'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GeofenceSidebar;