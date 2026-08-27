import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  memo,
} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import usePersistedState from '../../common/util/usePersistedState';
import MapSwitcher from '../control/MapSwitcher';

export const MapStyleContext = createContext(0);

export let map = null;

const TILE_LAYERS = {
  googleHybrid: 'https://mt{s}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
  googleRoad: 'https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
  googleNormal: 'https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
  googleSatellite: 'https://mt{s}.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
  googleTerrain: 'https://mt{s}.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}',
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

// Pure transparent overlay - leaves your selected base map untouched
const PURE_TRAFFIC_OVERLAY_URL = 'https://mt{s}.google.com/vt/lyrs=h,traffic&hl=en&x={x}&y={y}&z={z}';

export const resetMapCanvas = () => {
  if (!map) return;
  try {
    map.invalidateSize({ animate: false, pan: false });
  } catch (err) {
    console.warn('Leaflet map resize error:', err);
  }
};

const DEFAULT_LAT = -15.3875;
const DEFAULT_LNG = 28.2814;
const DEFAULT_ZOOM = 5;

const AVAILABLE_STYLES = [
  { id: 'googleHybrid', title: 'Google Hybrid' },
  { id: 'googleRoad', title: 'Google Normal' },
  { id: 'googleSatellite', title: 'Google Satellite' },
  { id: 'googleTerrain', title: 'Google Terrain' },
  { id: 'osm', title: 'OpenStreetMap' },
];

const MapView = ({
  children,
  selectedStyleId = 'googleHybrid',
  onSelect,
  anchorEl,
  setAnchorEl,
  showTraffic = false,
}) => {
  const containerRef = useRef(null);
  const activeTileLayerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const resizeObserverRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  const [savedState] = usePersistedState('mapState', {
    lng: DEFAULT_LNG,
    lat: DEFAULT_LAT,
    zoom: DEFAULT_ZOOM,
  });

  useEffect(() => {
    if (!containerRef.current || map || mapInitializedRef.current) return;

    mapInitializedRef.current = true;

    const initialLat = Number.isFinite(Number(savedState?.lat)) ? Number(savedState.lat) : DEFAULT_LAT;
    const initialLng = Number.isFinite(Number(savedState?.lng)) ? Number(savedState.lng) : DEFAULT_LNG;
    const initialZoom = Number.isFinite(Number(savedState?.zoom)) ? Number(savedState.zoom) : DEFAULT_ZOOM;

    map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      preferCanvas: true,
      maxZoom: 22,
      minZoom: 2,
    });

    const initialUrl = TILE_LAYERS[selectedStyleId] || TILE_LAYERS.googleHybrid;
    activeTileLayerRef.current = L.tileLayer(initialUrl, {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 22,
      maxNativeZoom: 20,
      minZoom: 2,
      zIndex: 1,
      opacity: 1,
    }).addTo(map);

    const saveMapState = () => {
      if (!map) return;
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        localStorage.setItem(
          'mapState',
          JSON.stringify({ lng: center.lng, lat: center.lat, zoom })
        );
      } catch (err) {}
    };

    map.on('moveend', saveMapState);
    map.on('zoomend', saveMapState);

    const handleInvalidate = () => {
      if (!map) return;
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch (err) {}
    };

    if (window.ResizeObserver && containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        requestAnimationFrame(handleInvalidate);
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    const timer = setTimeout(() => {
      handleInvalidate();
      setMapReady(true);
    }, 80);

    return () => {
      clearTimeout(timer);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (map) {
        try {
          map.off('moveend', saveMapState);
          map.off('zoomend', saveMapState);
          map.remove();
        } catch (e) {}
      }
      map = null;
      activeTileLayerRef.current = null;
      trafficLayerRef.current = null;
      mapInitializedRef.current = false;
      setMapReady(false);
    };
  }, []);

  // Smooth Cross-Fade Basemap Switching
  useEffect(() => {
    if (!map) return;

    const newUrl = TILE_LAYERS[selectedStyleId] || TILE_LAYERS.googleHybrid;
    const oldLayer = activeTileLayerRef.current;

    if (oldLayer && oldLayer._url === newUrl) return;

    const newLayer = L.tileLayer(newUrl, {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 22,
      maxNativeZoom: 20,
      minZoom: 2,
      zIndex: 1,
      opacity: 0,
    }).addTo(map);

    let fadeTimer = null;

    newLayer.once('load', () => {
      newLayer.setOpacity(1);
      fadeTimer = setTimeout(() => {
        if (oldLayer && map && map.hasLayer(oldLayer)) {
          map.removeLayer(oldLayer);
        }
      }, 250);
    });

    // Fallback if load fires immediately or is cached
    const fallbackTimer = setTimeout(() => {
      newLayer.setOpacity(1);
      if (oldLayer && map && map.hasLayer(oldLayer)) {
        map.removeLayer(oldLayer);
      }
    }, 400);

    activeTileLayerRef.current = newLayer;

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      clearTimeout(fallbackTimer);
    };
  }, [selectedStyleId]);

  // Pure Transparent Traffic Overlay Management
  useEffect(() => {
    if (!map) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = L.tileLayer(PURE_TRAFFIC_OVERLAY_URL, {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 22,
          maxNativeZoom: 20,
          minZoom: 2,
          pane: 'overlayPane',
          zIndex: 650, // Floats cleanly above basemap and under markers
          opacity: 1,
        }).addTo(map);
      }
    } else {
      if (trafficLayerRef.current) {
        map.removeLayer(trafficLayerRef.current);
        trafficLayerRef.current = null;
      }
    }
  }, [showTraffic, mapReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      <MapSwitcher
        styles={AVAILABLE_STYLES}
        selectedId={selectedStyleId}
        onSelect={onSelect}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
      />
      {mapReady && children}
    </div>
  );
};

export default memo(MapView);