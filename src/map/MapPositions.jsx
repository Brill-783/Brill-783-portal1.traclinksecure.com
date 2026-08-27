import { useEffect, useRef, memo, useMemo, useId } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { toMapCoordinates } from './core/mapUtil';

const getVehicleStatus = (position, device) => {
  const speedKph = position?.speed ? Math.round(position.speed * 1.852) : 0;
  const ignitionOn = position?.attributes?.ignition === true;
  const motionActive = position?.attributes?.motion === true || speedKph > 0;

  if (device?.status === 'offline') return 'offline';
  if (motionActive) return 'moving';
  if (ignitionOn) return 'idling';
  return 'parked';
};

const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    !(lat === 0 && lng === 0)
  );
};

const STATUS_COLORS = {
  moving: '#16a34a',
  parked: '#1d4ed8',
  idling: '#ca8a04',
  offline: '#dc2626',
};

const createClusterElement = (count, color) => {
  const container = document.createElement('div');
  container.className = 'radar-cluster-container';

  const ring1 = document.createElement('div');
  ring1.className = 'radar-ring radar-ring-1';
  ring1.style.borderColor = color;

  const ring2 = document.createElement('div');
  ring2.className = 'radar-ring radar-ring-2';
  ring2.style.borderColor = color;

  const badge = document.createElement('div');
  badge.className = 'radar-center-badge';
  badge.style.backgroundColor = color;
  badge.textContent = count;

  container.appendChild(ring1);
  container.appendChild(ring2);
  container.appendChild(badge);

  return container;
};

const clusterPositions = (positions, devices, zoom) => {
  if (!positions || !positions.length || zoom >= 15) return { markers: positions, clusters: [] };

  const clusterRadius = 60;
  const clusters = [];
  const assigned = new Set();

  for (let i = 0; i < positions.length; i++) {
    if (assigned.has(i)) continue;
    const pos = positions[i];
    const cluster = { points: [pos], lats: [pos.latitude], lngs: [pos.longitude] };

    for (let j = i + 1; j < positions.length; j++) {
      if (assigned.has(j)) continue;
      const other = positions[j];

      const latDiff = Math.abs(pos.latitude - other.latitude) * 111000;
      const lngDiff =
        Math.abs(pos.longitude - other.longitude) *
        111000 *
        Math.cos((pos.latitude * Math.PI) / 180);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      if (distance < clusterRadius) {
        cluster.points.push(other);
        cluster.lats.push(other.latitude);
        cluster.lngs.push(other.longitude);
        assigned.add(j);
      }
    }

    assigned.add(i);

    if (cluster.points.length > 1) {
      const avgLat = cluster.lats.reduce((a, b) => a + b, 0) / cluster.lats.length;
      const avgLng = cluster.lngs.reduce((a, b) => a + b, 0) / cluster.lngs.length;
      clusters.push({
        count: cluster.points.length,
        latitude: avgLat,
        longitude: avgLng,
        points: cluster.points,
      });
    }
  }

  const clusteredPositions = [];
  const clusteredIds = new Set();

  clusters.forEach((c) => {
    c.points.forEach((p) => clusteredIds.add(p.deviceId));
  });

  positions.forEach((p) => {
    if (!clusteredIds.has(p.deviceId)) {
      clusteredPositions.push(p);
    }
  });

  return { markers: clusteredPositions, clusters };
};

const MapPositions = ({
  positions = [],
  onMarkerClick,
  showLabels = true,
  showMarkers = true,
  showTail = false,
  titleField,
}) => {
  const id = useId();
  const markersRef = useRef(new Map());
  const clusterMarkersRef = useRef(new Map());
  const animationsRef = useRef(new Map());
  const trailsRef = useRef(new Map());
  const clusterClickTargets = useRef(new Map());

  const devices = useSelector((state) => state.devices.items || {});
  const clusterEnabled = useAttributePreference('mapCluster', true);

  const latestPositions = useMemo(() => {
    if (!positions || !Array.isArray(positions)) return [];
    const latestMap = {};
    positions.forEach((pos) => {
      const deviceId = pos.deviceId;
      const posTime = new Date(pos.fixTime || 0).getTime();
      if (
        !latestMap[deviceId] ||
        posTime >= (new Date(latestMap[deviceId].fixTime || 0).getTime() || 0)
      ) {
        latestMap[deviceId] = pos;
      }
    });
    return Object.values(latestMap);
  }, [positions]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      clusterMarkersRef.current.forEach((marker) => marker.remove());
      clusterMarkersRef.current.clear();
      animationsRef.current.forEach((rafId) => cancelAnimationFrame(rafId));
      animationsRef.current.clear();
      clusterClickTargets.current.clear();
    };
  }, []);

  const animateMarker = (deviceId, marker, targetLng, targetLat, targetRotation, iconEl) => {
    if (animationsRef.current.has(deviceId)) {
      cancelAnimationFrame(animationsRef.current.get(deviceId));
      animationsRef.current.delete(deviceId);
    }

    const startLngLat = marker.getLngLat();
    const startLng = startLngLat.lng;
    const startLat = startLngLat.lat;

    let currentRotation = 0;
    const transformStr = iconEl.style.transform || '';
    const match = transformStr.match(/rotate\(([-\d.]+)deg\)/);
    if (match) {
      currentRotation = parseFloat(match[1]);
    }

    let diff = (targetRotation - currentRotation) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    const finalTargetRotation = currentRotation + diff;

    const duration = 1500;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const currentLng = startLng + (targetLng - startLng) * progress;
      const currentLat = startLat + (targetLat - startLat) * progress;
      marker.setLngLat([currentLng, currentLat]);

      const currentRot = currentRotation + (finalTargetRotation - currentRotation) * progress;
      iconEl.style.transform = `rotate(${currentRot}deg)`;

      if (progress < 1) {
        const rafId = requestAnimationFrame(step);
        animationsRef.current.set(deviceId, rafId);
      } else {
        animationsRef.current.delete(deviceId);
      }
    };

    const rafId = requestAnimationFrame(step);
    animationsRef.current.set(deviceId, rafId);
  };

  useEffect(() => {
    if (!latestPositions || !devices || !map) return;

    const processMarkers = () => {
      const currentZoom = map.getZoom ? map.getZoom() : 10;
      const { markers: individualMarkers, clusters } = clusterEnabled
        ? clusterPositions(latestPositions, devices, currentZoom)
        : { markers: latestPositions, clusters: [] };

      const activeDeviceIds = new Set(individualMarkers.map((p) => p.deviceId));

      for (const [deviceId, marker] of markersRef.current.entries()) {
        if (!activeDeviceIds.has(deviceId)) {
          if (animationsRef.current.has(deviceId)) {
            cancelAnimationFrame(animationsRef.current.get(deviceId));
            animationsRef.current.delete(deviceId);
          }
          marker.remove();
          markersRef.current.delete(deviceId);
        }
      }

      individualMarkers.forEach((position) => {
        const deviceId = position.deviceId;
        if (!devices.hasOwnProperty(deviceId)) return;
        if (!isValidCoordinate(position.latitude, position.longitude)) return;

        const device = devices[deviceId];
        const speedKph = position.speed ? Math.round(position.speed * 1.852) : 0;
        const rotation = position.course || 0;

        let statusColor = STATUS_COLORS.parked;
        if (device.status === 'offline') {
          statusColor = STATUS_COLORS.offline;
        } else if (speedKph > 1) {
          statusColor = STATUS_COLORS.moving;
        } else if (position.attributes && position.attributes.ignition === true) {
          statusColor = STATUS_COLORS.idling;
        }

        const modelStr = device.model || '';
        const bubbleHtmlText = `${device.name}${modelStr ? ` - ${modelStr}` : ''} (${speedKph} kph)`;
        
        const coords = toMapCoordinates ? toMapCoordinates(position.longitude, position.latitude) : [position.longitude, position.latitude];
        const targetLng = coords[0];
        const targetLat = coords[1];

        if (markersRef.current.has(deviceId)) {
          const marker = markersRef.current.get(deviceId);
          const markerEl = marker.getElement();

          const labelEl = markerEl.querySelector('.vehicle-label-box');
          if (labelEl && labelEl.textContent !== bubbleHtmlText) {
            labelEl.textContent = bubbleHtmlText;
          }

          const iconEl = markerEl.querySelector('.vehicle-icon-circle');
          if (iconEl) {
            iconEl.style.backgroundColor = statusColor;
            animateMarker(deviceId, marker, targetLng, targetLat, rotation, iconEl);
          }

          markerEl.style.display = showMarkers ? '' : 'none';
          if (labelEl) {
            labelEl.style.display = showLabels ? '' : 'none';
          }
        } else {
          const markerEl = document.createElement('div');
          markerEl.className = 'vehicle-marker-wrapper';
          markerEl.style.display = showMarkers ? '' : 'none';

          markerEl.addEventListener('click', (e) => {
            e.preventDefault();
            if (onMarkerClick) {
              onMarkerClick(position.id, deviceId);
            }
          });

          const labelBox = document.createElement('div');
          labelBox.className = 'vehicle-label-box';
          labelBox.style.display = showLabels ? '' : 'none';
          labelBox.textContent = bubbleHtmlText;

          const iconCircle = document.createElement('div');
          iconCircle.className = 'vehicle-icon-circle';
          iconCircle.style.backgroundColor = statusColor;
          iconCircle.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L22 22L12 17L2 22L12 2Z" fill="#ffffff"/>
            </svg>
          `;

          markerEl.appendChild(labelBox);
          markerEl.appendChild(iconCircle);

          const marker = new maplibregl.Marker({
            element: markerEl,
            anchor: 'center',
          })
            .setLngLat([targetLng, targetLat])
            .addTo(map);

          markersRef.current.set(deviceId, marker);
        }
      });

      const activeClusterKeys = new Set();
      clusters.forEach((cluster) => {
        const clusterKey = cluster.points.map((p) => p.deviceId).sort().join('-');
        activeClusterKeys.add(clusterKey);

        if (clusterMarkersRef.current.has(clusterKey)) {
          const marker = clusterMarkersRef.current.get(clusterKey);
          marker.setLngLat([cluster.longitude, cluster.latitude]);
          const el = marker.getElement();
          const badge = el.querySelector('.radar-center-badge');
          if (badge) badge.textContent = String(cluster.count);
          return;
        }

        const clusterColor = '#06b6d4';
        const clusterEl = createClusterElement(cluster.count, clusterColor);
        clusterEl.addEventListener('click', (e) => {
          e.preventDefault();
          if (map && cluster.longitude && cluster.latitude) {
            map.flyTo({
              center: [cluster.longitude, cluster.latitude],
              zoom: Math.min((map.getZoom ? map.getZoom() : 10) + 2, 18),
              duration: 450,
              essential: true,
            });
          }
        });

        const clusterMarker = new maplibregl.Marker({
          element: clusterEl,
          anchor: 'center',
        })
          .setLngLat([cluster.longitude, cluster.latitude])
          .addTo(map);

        clusterMarkersRef.current.set(clusterKey, clusterMarker);
        clusterClickTargets.current.set(clusterKey, cluster);
      });

      for (const [key, marker] of clusterMarkersRef.current.entries()) {
        if (!activeClusterKeys.has(key)) {
          marker.remove();
          clusterMarkersRef.current.delete(key);
          clusterClickTargets.current.delete(key);
        }
      }
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      processMarkers();
    } else if (map.once) {
      map.once('styledata', processMarkers);
    } else {
      processMarkers();
    }
  }, [
    latestPositions,
    devices,
    onMarkerClick,
    clusterEnabled,
    showLabels,
    showMarkers,
    showTail,
  ]);

  return null;
};

export default memo(MapPositions);