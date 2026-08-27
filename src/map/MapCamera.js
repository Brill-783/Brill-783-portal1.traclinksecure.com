import { useEffect, memo } from 'react';
import L from 'leaflet';
import { map } from './core/MapView';

const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
};

const MapCamera = ({
  latitude,
  longitude,
  positions,
  coordinates,
  zoom,
  maxZoom = 17,
  padding = 60,
  animated = true,
}) => {
  useEffect(() => {
    if (!map) return;

    // 1. Process multiple points / coordinates / positions
    if (coordinates || positions) {
      const validPoints = [];

      if (Array.isArray(coordinates) && coordinates.length > 0) {
        coordinates.forEach((coord) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            const lat = Number(coord[0]);
            const lng = Number(coord[1]);
            if (isValidCoordinate(lat, lng)) {
              validPoints.push([lat, lng]);
            }
          }
        });
      } else if (Array.isArray(positions) && positions.length > 0) {
        positions.forEach((pos) => {
          if (pos) {
            const lat = Number(pos.latitude);
            const lng = Number(pos.longitude);
            if (isValidCoordinate(lat, lng)) {
              validPoints.push([lat, lng]);
            }
          }
        });
      }

      if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [padding, padding],
            maxZoom,
            animate: animated,
            duration: 0.5,
          });
        }
      } else if (validPoints.length === 1) {
        const targetZoom = typeof zoom === 'number' ? zoom : Math.max(map.getZoom() || 15, 15);
        map.setView(validPoints[0], targetZoom, { animate: animated });
      }
    } else if (isValidCoordinate(Number(latitude), Number(longitude))) {
      // 2. Direct single center coordinate passed
      const targetLat = Number(latitude);
      const targetLng = Number(longitude);
      const targetZoom = typeof zoom === 'number' ? zoom : Math.max(map.getZoom() || 17, 17);
      map.setView([targetLat, targetLng], targetZoom, { animate: animated });
    }
  }, [latitude, longitude, positions, coordinates, zoom, maxZoom, padding, animated]);

  return null;
};

export default memo(MapCamera);