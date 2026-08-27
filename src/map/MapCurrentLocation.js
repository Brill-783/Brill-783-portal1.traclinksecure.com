import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';

const MapCurrentLocation = ({ location }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (!location || !location.latitude || !location.longitude) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const coords = [location.longitude, location.latitude];

    if (!markerRef.current) {
      // Container
      const el = document.createElement('div');
      el.className = 'google-user-location-marker';
      el.style.cssText = `
        width: 22px !important;
        height: 22px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
        z-index: 99 !important;
      `;

      // Pulsing accuracy halo
      const halo = document.createElement('div');
      halo.style.cssText = `
        position: absolute !important;
        width: 40px !important;
        height: 40px !important;
        border-radius: 50% !important;
        background-color: rgba(26, 115, 232, 0.2) !important;
        animation: user-pulse 2s infinite ease-out !important;
        pointer-events: none !important;
      `;

      // Google Blue Dot Container
      const dotOuter = document.createElement('div');
      dotOuter.style.cssText = `
        width: 18px !important;
        height: 18px !important;
        border-radius: 50% !important;
        background-color: #ffffff !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35) !important;
        position: relative !important;
        z-index: 2 !important;
      `;

      // Solid Inner Blue Circle
      const dotInner = document.createElement('div');
      dotInner.style.cssText = `
        width: 12px !important;
        height: 12px !important;
        border-radius: 50% !important;
        background-color: #1a73e8 !important;
      `;

      dotOuter.appendChild(dotInner);
      el.appendChild(halo);
      el.appendChild(dotOuter);

      // Add Keyframe animation for halo pulse if not already present
      if (!document.getElementById('user-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'user-pulse-style';
        style.innerHTML = `
          @keyframes user-pulse {
            0% { transform: scale(0.5); opacity: 0.8; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      markerRef.current = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map);
    } else {
      markerRef.current.setLngLat(coords);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [location]);

  return null;
};

export default MapCurrentLocation;