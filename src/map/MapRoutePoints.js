import { useId, useEffect } from 'react';
import { map } from './core/MapView';
import { toMapCoordinates } from './core/mapUtil';

const MapRoutePoints = ({ positions, onClick }) => {
  const id = useId();

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    map.addLayer({
      source: id,
      id: `${id}-points`,
      type: 'circle',
      paint: {
        'circle-radius': 4,
        'circle-color': '#00ab8e',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
      },
    });

    const onPointClick = (event) => {
      const feature = event.features?.[0];
      if (feature && onClick) {
        onClick(feature.properties.id);
      }
    };

    map.on('click', `${id}-points`, onPointClick);

    return () => {
      map.off('click', `${id}-points`, onPointClick);
      if (map.getLayer(`${id}-points`)) {
        map.removeLayer(`${id}-points`);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id, onClick]);

  useEffect(() => {
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: (positions || []).map((position) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: toMapCoordinates(position.longitude, position.latitude),
        },
        properties: {
          id: position.id,
        },
      })),
    });
  }, [positions, id]);

  return null;
};

export default MapRoutePoints;
