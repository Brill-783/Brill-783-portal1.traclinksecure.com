import { useId, useEffect, useMemo, useContext } from 'react';
import { useAttributePreference } from '../../common/util/preferences';
import { map, MapStyleContext } from '../core/MapView';
import useMapOverlays from './useMapOverlays';

const MapOverlay = () => {
  const id = useId();
  const styleVersion = useContext(MapStyleContext);

  const mapOverlays = useMapOverlays();
  const selectedMapOverlay = useAttributePreference('selectedMapOverlay');

  const activeOverlays = useMemo(() => {
    if (!selectedMapOverlay) {
      return [];
    }

    const selectedIds = selectedMapOverlay.split(',');

    return mapOverlays.filter(
      (overlay) =>
        overlay.available &&
        selectedIds.includes(overlay.id),
    );
  }, [mapOverlays, selectedMapOverlay]);

  useEffect(() => {
    if (!map.loaded()) {
      return;
    }

    const layers = [];

    activeOverlays.forEach((overlay, index) => {
      const layerId = `${id}-${index}`;

      if (map.getSource(layerId)) {
        return;
      }

      map.addSource(layerId, {
        ...overlay.source,
        tileSize: 256,
      });

      map.addLayer({
        id: layerId,
        type: 'raster',
        source: layerId,
        metadata: {
          'traccar:title': overlay.title,
        },
        paint: {
          'raster-opacity': 0.4,
        },
      });

      layers.push(layerId);
    });

    return () => {
      layers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }

        if (map.getSource(layerId)) {
          map.removeSource(layerId);
        }
      });
    };
  }, [activeOverlays, id, styleVersion]);

  return null;
};

export default MapOverlay;