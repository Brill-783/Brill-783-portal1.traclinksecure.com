import { useEffect, useRef, useState, memo } from 'react';
import { useSelector } from 'react-redux';
import L from 'leaflet';
import { usePreference } from '../../common/util/preferences';
import { map } from './core/MapView';

const MapDefaultCamera = ({ filteredPositions }) => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions || {});

  const defaultLatitude = usePreference('latitude');
  const defaultLongitude = usePreference('longitude');
  const defaultZoom = usePreference('zoom', 0);

  const [initialized, setInitialized] = useState(false);

  // Initial view (fleet bounds or default coordinates) - runs only once.
  useEffect(() => {
    if (initialized || !map) return;

    if (defaultLatitude && defaultLongitude && !isNaN(Number(defaultLatitude)) && !isNaN(Number(defaultLongitude))) {
      map.setView(
        [Number(defaultLatitude), Number(defaultLongitude)],
        defaultZoom > 0 ? defaultZoom : map.getZoom() || 10,
        { animate: false }
      );
      setInitialized(true);
    } else {
      const posList = Array.isArray(filteredPositions)
        ? filteredPositions
        : Object.values(positions);

      const validCoordinates = posList
        .filter((item) => item && typeof item.latitude === 'number' && typeof item.longitude === 'number' && !isNaN(item.latitude) && !isNaN(item.longitude))
        .map((item) => [item.latitude, item.longitude]);

      if (validCoordinates.length > 1) {
        const bounds = L.latLngBounds(validCoordinates);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 18,
            animate: false,
          });
          setInitialized(true);
        }
      } else if (validCoordinates.length === 1) {
        map.setView(
          validCoordinates[0],
          Math.max(defaultZoom > 0 ? defaultZoom : map.getZoom() || 15, 15),
          { animate: false }
        );
        setInitialized(true);
      }
    }
  }, [
    initialized,
    defaultLatitude,
    defaultLongitude,
    defaultZoom,
    positions,
    filteredPositions,
  ]);

  // Center the map on the selected device whenever the selection changes.
  // A ref tracks the last centered selection so real-time position ticks and
  // manual pan/zoom are not overridden.
  const centeredSelection = useRef(null);
  useEffect(() => {
    if (!map) return;
    if (selectedDeviceId === centeredSelection.current) return;

    if (!selectedDeviceId) {
      centeredSelection.current = selectedDeviceId;
      return;
    }

    const position = positions[selectedDeviceId];
    if (position && typeof position.latitude === 'number' && typeof position.longitude === 'number') {
      map.setView(
        [position.latitude, position.longitude],
        Math.max(defaultZoom > 0 ? defaultZoom : map.getZoom() || 16, 16),
        { animate: true }
      );
      centeredSelection.current = selectedDeviceId;
    }
  }, [selectedDeviceId, positions, map, defaultZoom]);

  return null;
};

export default memo(MapDefaultCamera);