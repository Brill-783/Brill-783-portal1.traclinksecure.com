import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Paper, Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import Swal from 'sweetalert2';

import MapView, { map } from '../map/core/MapView';
import MapCurrentLocation from '../map/MapCurrentLocation';
import MapGeofenceEdit from '../map/draw/MapGeofenceEdit';
import GeofenceDraw from '../geofence/GeofenceDraw';
import GeofenceSidebar from '../geofence/GeofenceSidebar';
import MapToolbar from '../map/main/MapToolbar';
import MapGeocoder from '../map/control/MapGeocoder';
import { geofencesActions } from '../store';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
  },
  drawer: {
    display: 'flex',
    flexDirection: 'column',
    width: theme.dimensions?.drawerWidthDesktop || '320px',
    borderRight: '1px solid #cbd5e1',
    zIndex: 10,
  },
  mapContainer: {
    flexGrow: 1,
    position: 'relative',
  },
  mapToolbarWrapper: {
    position: 'absolute !important',
    top: '12px !important',
    right: '12px !important',
    zIndex: '2000 !important',
    pointerEvents: 'auto !important',
  },
}));

const GeofencesPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const [selectedGeofenceId, setSelectedGeofenceId] = useState(null);
  const [drawMode, setDrawMode] = useState(null);
  const [drawingStatus, setDrawingStatus] = useState(null);
  const [pendingGeofenceMeta, setPendingGeofenceMeta] = useState(null);
  const [mapStyleAnchor, setMapStyleAnchor] = useState(null);

  const handleDrawComplete = async ({ area }) => {
    setDrawMode(null);
    try {
      const newItem = {
        name: pendingGeofenceMeta?.name || 'New Geofence',
        area,
        attributes: { color: pendingGeofenceMeta?.color || '#00ab8e' },
      };
      const response = await fetchOrThrow('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      const savedGeofence = await response.json();
      dispatch(geofencesActions.add([savedGeofence]));

      if (Array.isArray(pendingGeofenceMeta?.deviceIds) && pendingGeofenceMeta.deviceIds.length > 0) {
        await Promise.all(
          pendingGeofenceMeta.deviceIds.map((deviceId) =>
            fetchOrThrow('/api/permissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceId, geofenceId: savedGeofence.id }),
            }).catch(() => null)
          )
        );
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Geofence Saved',
        text: `Zone "${savedGeofence.name}" established.`,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: error.message || 'Could not save geofence to the system.',
        confirmButtonColor: '#00ab8e',
      });
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Paper square className={classes.drawer} elevation={0}>
          <GeofenceSidebar
            onDrawModeChange={(mode, meta) => {
              setPendingGeofenceMeta(meta);
              setDrawMode(mode);
            }}
            drawMode={drawMode}
            drawingStatus={drawingStatus}
            onGeofenceSelect={setSelectedGeofenceId}
          />
        </Paper>
        <div className={classes.mapContainer}>
          <MapView
            selectedStyleId="osm"
            anchorEl={mapStyleAnchor}
            setAnchorEl={setMapStyleAnchor}
          >
            <MapGeofenceEdit selectedGeofenceId={selectedGeofenceId} />
            {drawMode && (
              <GeofenceDraw
                mode={drawMode}
                pendingMeta={pendingGeofenceMeta}
                onComplete={handleDrawComplete}
                onCancel={() => setDrawMode(null)}
                onStatusChange={setDrawingStatus}
              />
            )}
          </MapView>

          <div className={classes.mapToolbarWrapper}>
            <MapToolbar
              map={map}
              onMapTypeChange={(e) => setMapStyleAnchor(e?.currentTarget || null)}
              onToggleGeofences={() => {}}
              onToggleTraffic={() => {}}
              showSnackbar={(msg) => Swal.fire({ toast: true, position: 'top-end', title: msg, timer: 2000, showConfirmButton: false })}
            />
          </div>

          <MapScale />
          <MapCurrentLocation />
          <MapGeocoder />
        </div>
      </div>
    </div>
  );
};

export default GeofencesPage;