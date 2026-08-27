import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect, useRef } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

import { map } from '../core/MapView';
import { findFonts, geofenceToFeature, geometryToArea } from '../core/mapUtil';
import { errorsActions, geofencesActions } from '../../store';
import { useCatchCallback } from '../../reactHelper';
import drawTheme from './theme';
import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';

MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

let drawInstance = null;

const MapGeofenceEdit = ({
  mode,
  selectedGeofenceId,
  onDrawComplete,
  onDrawCancel,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const drawRef = useRef(null);
  const previousModeRef = useRef(mode);

  const geofences = useSelector((state) => state.geofences.items);

  if (!drawInstance) {
    drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        trash: true,
      },
      userProperties: true,
      styles: [
        ...drawTheme,
        {
          id: 'gl-draw-title',
          type: 'symbol',
          filter: ['all'],
          layout: {
            'text-field': '{user_name}',
            'text-font': findFonts(map),
            'text-size': 12,
          },
          paint: {
            'text-halo-color': 'white',
            'text-halo-width': 1,
          },
        },
      ],
    });
  }

  drawRef.current = drawInstance;

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedGeofenceId) return;

    const geofence = geofences[selectedGeofenceId];

    if (!geofence) return;

    const feature = geofenceToFeature(theme, geofence);

    if (!feature?.geometry?.coordinates) return;

    const coordinates = feature.geometry.coordinates.flat(Infinity);

    const lngs = [];
    const lats = [];

    for (let i = 0; i < coordinates.length; i += 2) {
      if (
        Number.isFinite(coordinates[i]) &&
        Number.isFinite(coordinates[i + 1])
      ) {
        lngs.push(coordinates[i]);
        lats.push(coordinates[i + 1]);
      }
    }

    if (!lngs.length || !lats.length) return;

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: 80,
        duration: 1000,
      },
    );
  }, [selectedGeofenceId, geofences, theme]);

  useEffect(() => {
    if (previousModeRef.current && !mode) {
      if (onDrawCancel) onDrawCancel();
    }

    previousModeRef.current = mode;
  }, [mode, onDrawCancel]);

  useEffect(() => {
    if (!mode) return;

    const activateDraw = () => {
      map.addControl(
        drawRef.current,
        theme.direction === 'rtl' ? 'top-right' : 'top-left',
      );

      map.getCanvas().style.cursor = 'crosshair';

      if (mode === 'polygon') {
        drawRef.current.changeMode('draw_polygon');
      } else if (mode === 'circle') {
        drawRef.current.changeMode('simple_select');
      }
    };

    if (!map.loaded()) {
      const waiting = () => {
        if (map.loaded()) {
          activateDraw();
        } else {
          setTimeout(waiting, 50);
        }
      };

      waiting();
    } else {
      activateDraw();
    }

    return () => {
      try {
        map.removeControl(drawRef.current);
      } catch {
      }

      map.getCanvas().style.cursor = '';
    };
  }, [mode, theme.direction]);
    useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];

      const area = geometryToArea(feature.geometry);

      const newItem = {
        name: t('sharedGeofence'),
        area,
      };

      drawRef.current.delete(feature.id);

      try {
        const response = await fetchOrThrow('/api/geofences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newItem),
        });

        const item = await response.json();

        if (onDrawComplete) {
          onDrawComplete();
        }

        navigate(`/settings/geofence/${item.id}`);
      } catch (error) {
        dispatch(errorsActions.push(error.message));
      }
    };

    map.on('draw.create', listener);

    return () => {
      map.off('draw.create', listener);
    };
  }, [dispatch, navigate, t, onDrawComplete]);

  useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];

      try {
        await fetchOrThrow(`/api/geofences/${feature.id}`, {
          method: 'DELETE',
        });

        refreshGeofences();
      } catch (error) {
        dispatch(errorsActions.push(error.message));
      }
    };

    map.on('draw.delete', listener);

    return () => {
      map.off('draw.delete', listener);
    };
  }, [dispatch, refreshGeofences]);

  useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];

      const item = Object.values(geofences).find(
        (i) => i.id === feature.id,
      );

      if (item) {
        const updatedItem = {
          ...item,
          area: geometryToArea(feature.geometry),
        };

        try {
          await fetchOrThrow(`/api/geofences/${feature.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedItem),
          });

          refreshGeofences();
        } catch (error) {
          dispatch(errorsActions.push(error.message));
        }
      }
    };

    map.on('draw.update', listener);

    return () => {
      map.off('draw.update', listener);
    };
  }, [dispatch, geofences, refreshGeofences]);

  useEffect(() => {
    if (!mode && drawRef.current) {
      drawRef.current.deleteAll();

      const hasValidNumbers = (coords) => {
        if (!Array.isArray(coords) || coords.length === 0) {
          return false;
        }

        if (typeof coords[0] === 'number') {
          return (
            coords.length >= 2 &&
            coords.every((value) => Number.isFinite(value))
          );
        }

        return coords.every((child) => hasValidNumbers(child));
      };

      const features = Object.values(geofences)
        .map((geofence) => {
          try {
            const feature = geofenceToFeature(theme, geofence);

            if (
              feature?.geometry?.coordinates &&
              hasValidNumbers(feature.geometry.coordinates)
            ) {
              return feature;
            }

            return null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      drawRef.current.add({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [geofences, mode, theme]);

  return null;
};

export default MapGeofenceEdit;