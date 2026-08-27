import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Divider, Typography, IconButton, Toolbar, Paper, Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from 'tss-react/mui';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';
import MapView, { map } from '../map/core/MapView';
import MapCurrentLocation from '../map/MapCurrentLocation';
import MapGeofenceEdit from '../map/draw/MapGeofenceEdit';
import GeofencesList from '../pages/GeofencesList';
import GeofenceDraw from '../geofence/GeofenceDraw';
import GeofenceSidebar from '../geofence/GeofenceSidebar';
import MapToolbar from '../map/main/MapToolbar';
import { useTranslation } from '../common/components/LocalizationProvider';
import MapGeocoder from '../map/control/MapGeocoder';
import { errorsActions, geofencesActions } from '../store';
import MapScale from '../map/MapScale';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
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
    width: theme.dimensions.drawerWidthDesktop || '320px',
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
  title: {
    flexGrow: 1,
  },
  fileInput: {
    display: 'none',
  },
}));

const GeofencesPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const [selectedGeofenceId, setSelectedGeofenceId] = useState();
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
        attributes: { color: pendingGeofenceMeta?.color || '#0ea5e9' },
      };
      const response = await fetchOrThrow('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      const savedGeofence = await response.json();
      dispatch(geofencesActions.add([savedGeofence]));
    } catch (error) {
      dispatch(errorsActions.push(error.message));
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Paper square className={classes.drawer}>
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
                onComplete={handleDrawComplete}
                onCancel={() => setDrawMode(null)}
                onStatusChange={setDrawingStatus}
              />
            )}
          </MapView>
          
          {/* Map Toolbar Controls */}
          <div className={classes.mapToolbarWrapper}>
            <MapToolbar
              map={map}
              onMapTypeChange={(e) => setMapStyleAnchor(e?.currentTarget || null)}
              onToggleGeofences={() => {}}
              onToggleTraffic={() => {}}
              showSnackbar={(msg) => dispatch(errorsActions.push(msg))}
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