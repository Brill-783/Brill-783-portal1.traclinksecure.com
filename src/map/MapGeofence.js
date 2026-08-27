import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { map } from './core/MapView';

const MapGeofence = ({ visible = true }) => {
  const geofencesById = useSelector((state) => state.geofences?.items || {});
  const geofences = Object.values(geofencesById);

  useEffect(() => {
    if (!map) return;

    const SOURCE_ID = 'saved-geofences-source';
    const FILL_LAYER = 'saved-geofences-fill';
    const LINE_LAYER = 'saved-geofences-line';
    const LABEL_LAYER = 'saved-geofences-label';

    const updateGeofenceLayers = () => {
      try {
        if (!map.isStyleLoaded || !map.isStyleLoaded()) return;

        const features = geofences
          .map((item) => {
            if (!item.area) return null;
            const color = item.attributes?.color || '#00ab8e';

            // Parse CIRCLE
            if (item.area.startsWith('CIRCLE')) {
              const parts = item.area.replace(/CIRCLE|\(|\)|,/g, ' ').trim().split(/ +/);
              const lat = Number(parts[0]);
              const lng = Number(parts[1]);
              const radius = Number(parts[2]);

              if (isNaN(lat) || isNaN(lng) || isNaN(radius)) return null;

              const coords = [];
              const km = radius / 1000;
              const distanceX = km / (111.320 * Math.cos((lat * Math.PI) / 180));
              const distanceY = km / 110.574;

              for (let i = 0; i < 64; i++) {
                const theta = (i / 64) * (2 * Math.PI);
                coords.push([lng + distanceX * Math.cos(theta), lat + distanceY * Math.sin(theta)]);
              }
              coords.push(coords[0]);

              return {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coords] },
                properties: { id: item.id, name: item.name, color },
              };
            }

            // Parse POLYGON
            if (item.area.startsWith('POLYGON')) {
              const raw = item.area.replace(/POLYGON|\(|\)/g, '').trim();
              const pairs = raw.split(',').map((p) => p.trim().split(/ +/));
              const coords = pairs
                .map((pair) => [Number(pair[1]), Number(pair[0])])
                .filter((c) => !isNaN(c[0]) && !isNaN(c[1]));

              if (coords.length < 3) return null;

              return {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coords] },
                properties: { id: item.id, name: item.name, color },
              };
            }

            return null;
          })
          .filter(Boolean);

        const geojson = {
          type: 'FeatureCollection',
          features,
        };

        const layerVisibility = visible ? 'visible' : 'none';

        if (map.getSource(SOURCE_ID)) {
          map.getSource(SOURCE_ID).setData(geojson);

          if (map.getLayer(FILL_LAYER)) map.setLayoutProperty(FILL_LAYER, 'visibility', layerVisibility);
          if (map.getLayer(LINE_LAYER)) map.setLayoutProperty(LINE_LAYER, 'visibility', layerVisibility);
          if (map.getLayer(LABEL_LAYER)) map.setLayoutProperty(LABEL_LAYER, 'visibility', layerVisibility);
        } else {
          map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

          map.addLayer({
            id: FILL_LAYER,
            type: 'fill',
            source: SOURCE_ID,
            layout: { visibility: layerVisibility },
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.28,
            },
          });

          map.addLayer({
            id: LINE_LAYER,
            type: 'line',
            source: SOURCE_ID,
            layout: { visibility: layerVisibility },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 3,
            },
          });

          map.addLayer({
            id: LABEL_LAYER,
            type: 'symbol',
            source: SOURCE_ID,
            layout: {
              visibility: layerVisibility,
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#0f172a',
              'text-halo-width': 2,
            },
          });
        }
      } catch (err) {
        console.warn('Geofence render deferred:', err);
      }
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      updateGeofenceLayers();
    } else {
      map.once('style.load', updateGeofenceLayers);
    }
  }, [geofences, visible]);

  return null;
};

export default MapGeofence;