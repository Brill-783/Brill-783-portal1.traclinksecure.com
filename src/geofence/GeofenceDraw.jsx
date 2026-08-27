import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from '../map/core/MapView';

const calculatePolygonAreaKm2 = (coords) => {
  if (!coords || coords.length < 3) return 0;
  
  const RAD = Math.PI / 180;
  const EARTH_RADIUS = 6378137;
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    area += (p2[0] * RAD - p1[0] * RAD) * (2 + Math.sin(p1[1] * RAD) + Math.sin(p2[1] * RAD));
  }

  area = (Math.abs((area * EARTH_RADIUS * EARTH_RADIUS) / 2)) / 1000000;
  return area.toFixed(4);
};

const SNAP_THRESHOLD_PX = 25;

const GeofenceDraw = ({
  mode,
  defaultColor = '#00ab8e',
  pendingMeta,
  onComplete,
  onStatusChange,
}) => {
  const pointsRef = useRef([]);
  const markersRef = useRef([]);
  const startMarkerRef = useRef(null);
  const popupRef = useRef(null);
  const radiusRef = useRef(0);
  const isSnappedRef = useRef(false);
  const isFinishedRef = useRef(false);

  const SOURCE_ID = 'geofence-draw-source';
  const FILL_LAYER = 'geofence-draw-fill';
  const LINE_LAYER = 'geofence-draw-line';

  const geofenceName = pendingMeta?.name || 'Geofence';
  const geofenceColor = pendingMeta?.color || defaultColor;

  const cleanupLayers = useCallback(() => {
    if (!map) return;
    try {
      if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER);
      if (map.getLayer(LINE_LAYER)) map.removeLayer(LINE_LAYER);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    } catch (e) {
      console.warn('Geofence cleanup warning:', e);
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => {
      if (m && typeof m.remove === 'function') m.remove();
    });
    markersRef.current = [];

    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, []);

  const initDrawLayers = useCallback(() => {
    if (!map) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!map.getLayer(FILL_LAYER)) {
      map.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': geofenceColor,
          'fill-opacity': 0.35,
        },
      });
    }

    if (!map.getLayer(LINE_LAYER)) {
      map.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': geofenceColor,
          'line-width': 3.5,
        },
      });
    }
  }, [geofenceColor]);

  const updateGeoJSON = useCallback((pts, mousePos) => {
    if (!map || !map.getSource(SOURCE_ID)) return;

    const features = [];
    let areaText = '';

    if (mode === 'polygon') {
      const currentPts = [...pts];
      if (mousePos && !isFinishedRef.current) currentPts.push(mousePos);

      if (currentPts.length >= 2) {
        const closed = [...currentPts, currentPts[0]];
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [closed] },
        });

        if (currentPts.length >= 3) {
          const areaKm2 = calculatePolygonAreaKm2(currentPts);
          areaText = `${geofenceName} ${areaKm2} Km²`;
        }
      }
    } else if (mode === 'circle' && pts.length >= 1) {
      const center = pts[0];
      const edge = mousePos || (pts[1] ? pts[1] : center);

      const from = new maplibregl.LngLat(center[0], center[1]);
      const to = new maplibregl.LngLat(edge[0], edge[1]);
      const radius = Math.round(from.distanceTo(to));
      radiusRef.current = radius;

      const coords = [];
      const km = radius / 1000;
      const distanceX = km / (111.320 * Math.cos((center[1] * Math.PI) / 180));
      const distanceY = km / 110.574;

      for (let i = 0; i < 64; i++) {
        const theta = (i / 64) * (2 * Math.PI);
        coords.push([center[0] + distanceX * Math.cos(theta), center[1] + distanceY * Math.sin(theta)]);
      }
      coords.push(coords[0]);

      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
      });

      const areaKm2 = (Math.PI * (radius / 1000) ** 2).toFixed(4);
      areaText = `${geofenceName} ${areaKm2} Km² (${radius}m)`;
    }

    const source = map.getSource(SOURCE_ID);
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }

    if (areaText && pts.length > 0) {
      const anchorPos = pts[0];
      if (!popupRef.current) {
        const el = document.createElement('div');
        el.className = 'geofence-floating-label';
        popupRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(anchorPos)
          .addTo(map);
      } else {
        popupRef.current.setLngLat(anchorPos);
      }
      popupRef.current.getElement().innerText = areaText;
    }
  }, [mode, geofenceName]);

  const generateWKT = useCallback((pts, radius) => {
    if (mode === 'polygon') {
      const closed = [...pts, pts[0]];
      const pairs = closed.map((p) => `${p[1]} ${p[0]}`).join(', ');
      return `POLYGON((${pairs}))`;
    }
    if (mode === 'circle' && pts.length >= 1) {
      const center = pts[0];
      return `CIRCLE (${center[1]} ${center[0]}, ${radius})`;
    }
    return '';
  }, [mode]);

  const addVertexMarker = useCallback((lngLat, isStart = false) => {
    const el = document.createElement('div');
    el.className = isStart ? 'geofence-start-node' : 'geofence-vertex-node';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(lngLat)
      .addTo(map);

    if (isStart) {
      startMarkerRef.current = marker;
    } else {
      markersRef.current.push(marker);
    }
  }, []);

  const finishDrawing = useCallback((areaWKT) => {
    isFinishedRef.current = true;
    clearMarkers();
    cleanupLayers();

    if (onComplete) {
      onComplete({ area: areaWKT });
    }
  }, [cleanupLayers, clearMarkers, onComplete]);

  useEffect(() => {
    if (!map || !mode) return;

    isFinishedRef.current = false;
    initDrawLayers();

    if (map.doubleClickZoom) {
      map.doubleClickZoom.disable();
    }

    if (map.getCanvas()) {
      map.getCanvas().style.cursor = 'crosshair';
    }

    const handleClick = (e) => {
      if (isFinishedRef.current) return;

      if (mode === 'polygon' && pointsRef.current.length >= 3 && isSnappedRef.current) {
        const areaWKT = generateWKT(pointsRef.current, radiusRef.current);
        finishDrawing(areaWKT);
        return;
      }

      let lngLat = [e.lngLat.lng, e.lngLat.lat];
      const isFirst = pointsRef.current.length === 0;
      const newPts = [...pointsRef.current, lngLat];
      pointsRef.current = newPts;

      addVertexMarker(lngLat, isFirst);

      if (mode === 'circle' && newPts.length === 2) {
        const areaWKT = generateWKT(newPts, radiusRef.current);
        finishDrawing(areaWKT);
      } else {
        updateGeoJSON(newPts, null);
      }
    };

    const handleMouseMove = (e) => {
      if (pointsRef.current.length === 0 || isFinishedRef.current) return;

      let mousePos = [e.lngLat.lng, e.lngLat.lat];

      if (mode === 'polygon' && pointsRef.current.length >= 3) {
        const startPt = pointsRef.current[0];
        const startPix = map.project(startPt);
        const mousePix = e.point;

        const distance = Math.hypot(startPix.x - mousePix.x, startPix.y - mousePix.y);

        if (distance <= SNAP_THRESHOLD_PX) {
          mousePos = startPt;
          isSnappedRef.current = true;
          if (startMarkerRef.current) {
            startMarkerRef.current.getElement().classList.add('snapped');
          }
          if (onStatusChange) onStatusChange('Click starting point to close zone.');
        } else {
          isSnappedRef.current = false;
          if (startMarkerRef.current) {
            startMarkerRef.current.getElement().classList.remove('snapped');
          }
        }
      }

      updateGeoJSON(pointsRef.current, mousePos);
    };

    const handleDblClick = (e) => {
      e.preventDefault();
      if (isFinishedRef.current) return;

      if (mode === 'polygon' && pointsRef.current.length >= 3) {
        const areaWKT = generateWKT(pointsRef.current, radiusRef.current);
        finishDrawing(areaWKT);
      }
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);
    map.on('dblclick', handleDblClick);

    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMouseMove);
      map.off('dblclick', handleDblClick);

      if (map.doubleClickZoom) {
        map.doubleClickZoom.enable();
      }

      if (map.getCanvas()) {
        map.getCanvas().style.cursor = '';
      }

      clearMarkers();
      cleanupLayers();
      pointsRef.current = [];
    };
  }, [
    mode,
    initDrawLayers,
    cleanupLayers,
    clearMarkers,
    updateGeoJSON,
    onStatusChange,
    addVertexMarker,
    generateWKT,
    finishDrawing,
  ]);

  return null;
};

export default GeofenceDraw;