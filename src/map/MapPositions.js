import React, {
  useEffect,
  useRef,
  memo,
  useMemo,
  useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import L from 'leaflet';

import { map } from './core/MapView';
import { devicesActions } from '../store';
import { evaluateLiveStatus } from '../common/components/StatusCard';
import './MapPositions.css';

const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const formatTimestamp = (timeStr) => {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatDateOnly = (timeStr) => {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const getCardinalHeading = (course) => {
  if (course === undefined || course === null || Number.isNaN(Number(course))) {
    return 'N';
  }
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const normalized = ((Number(course) % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
};

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getShortestAngleDelta = (startAngle, endAngle) => {
  return (((endAngle - startAngle + 540) % 360) - 180);
};

const easeLinear = (t) => Math.min(Math.max(t, 0), 1);

const TELEPORT_THRESHOLD_METERS = 3000;
const MIN_ANIMATION_DURATION = 1200;
const MAX_ANIMATION_DURATION = 3500;
const DEFAULT_ANIMATION_DURATION = 2000;
const MIN_MOVEMENT_METERS = 0.5;

// EXACT ANCHOR CENTERING TO PREVENT DRIFT AT ANY ZOOM LEVEL
const MARKER_ICON_SIZE = 34;
const MARKER_ICON_ANCHOR = MARKER_ICON_SIZE / 2;

const MapPositions = ({
  positions = [],
  onMarkerClick,
  showMarkers = true,
  showLabels = true,
  allowPopup = true,
}) => {
  const dispatch = useDispatch();
  const markersRef = useRef(new Map());
  const animationFramesRef = useRef(new Map());
  const animStatesRef = useRef(new Map());

  const devices = useSelector((state) => state.devices.items || {});
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const latestPositions = useMemo(() => {
    const list = Array.isArray(positions) ? positions : Object.values(positions || {});
    const latestMap = {};

    list.forEach((pos) => {
      if (!pos || pos.deviceId == null) return;
      const deviceId = pos.deviceId;
      const device = devices[deviceId];
      if (!device) return;

      const positionTime = new Date(pos.deviceTime || pos.fixTime || pos.serverTime || 0).getTime();
      const existing = latestMap[deviceId];
      const existingTime = existing
        ? new Date(existing.deviceTime || existing.fixTime || existing.serverTime || 0).getTime()
        : 0;

      if (!existing || positionTime >= existingTime) {
        latestMap[deviceId] = pos;
      }
    });

    return Object.values(latestMap);
  }, [positions, devices]);

  const getCurrentAnimatedPosition = useCallback((deviceId) => {
    const state = animStatesRef.current.get(deviceId);
    if (!state) return null;
    if (!state.duration) {
      return {
        lat: state.targetLat,
        lng: state.targetLng,
        course: state.targetCourse || 0,
      };
    }

    const elapsed = performance.now() - state.startTime;
    const progress = Math.min(elapsed / state.duration, 1);
    const eased = easeLinear(progress);

    const lat = state.startLat + (state.targetLat - state.startLat) * eased;
    const lng = state.startLng + (state.targetLng - state.startLng) * eased;
    const course = (state.startCourse + state.deltaCourse * eased + 360) % 360;

    return { lat, lng, course };
  }, []);

  const updateMarkerRotation = useCallback((marker, course) => {
    const element = marker.getElement();
    if (!element) return;
    const arrow = element.querySelector('.arrow-rotation-container');
    if (!arrow) return;
    arrow.style.transform = `rotate(${course}deg)`;
  }, []);

  const hideVehicleLabel = useCallback((marker) => {
    const element = marker.getElement();
    if (!element) return;
    const badge = element.querySelector('.vehicle-badge-pill');
    const tail = element.querySelector('.vehicle-badge-tail');
    if (badge) badge.style.setProperty('display', 'none', 'important');
    if (tail) tail.style.setProperty('display', 'none', 'important');
  }, []);

  const showVehicleLabel = useCallback((marker) => {
    if (marker.isPopupOpen() || !showLabels) return;
    const element = marker.getElement();
    if (!element) return;
    const badge = element.querySelector('.vehicle-badge-pill');
    const tail = element.querySelector('.vehicle-badge-tail');
    if (badge) badge.style.setProperty('display', 'flex', 'important');
    if (tail) tail.style.setProperty('display', 'block', 'important');
  }, [showLabels]);

  const cancelDeviceAnimation = useCallback((deviceId) => {
    const frame = animationFramesRef.current.get(deviceId);
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      animationFramesRef.current.delete(deviceId);
    }
  }, []);

  const startInterpolationLoop = useCallback((deviceId) => {
    const oldFrame = animationFramesRef.current.get(deviceId);
    if (oldFrame !== undefined) {
      cancelAnimationFrame(oldFrame);
    }

    const animate = (currentTime) => {
      const marker = markersRef.current.get(deviceId);
      const state = animStatesRef.current.get(deviceId);

      if (!marker || !state) {
        animationFramesRef.current.delete(deviceId);
        return;
      }

      if (state.duration <= 0) {
        const finalLatLng = [state.targetLat, state.targetLng];
        marker.setLatLng(finalLatLng);
        updateMarkerRotation(marker, state.targetCourse);

        state.currentLat = state.targetLat;
        state.currentLng = state.targetLng;
        state.currentCourse = state.targetCourse;

        animationFramesRef.current.delete(deviceId);
        return;
      }

      const elapsed = currentTime - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);
      const eased = easeLinear(progress);

      const currentLat = state.startLat + (state.targetLat - state.startLat) * eased;
      const currentLng = state.startLng + (state.targetLng - state.startLng) * eased;
      const currentLatLng = [currentLat, currentLng];
      const currentCourse = (state.startCourse + state.deltaCourse * eased + 360) % 360;

      marker.setLatLng(currentLatLng);
      state.currentLat = currentLat;
      state.currentLng = currentLng;
      state.currentCourse = currentCourse;

      updateMarkerRotation(marker, currentCourse);

      if (marker.isPopupOpen()) {
        const popup = marker.getPopup();
        if (popup) {
          popup.setLatLng(currentLatLng);
        }
      }

      if (progress < 1) {
        const frame = requestAnimationFrame(animate);
        animationFramesRef.current.set(deviceId, frame);
      } else {
        const finalLatLng = [state.targetLat, state.targetLng];
        marker.setLatLng(finalLatLng);
        state.currentLat = state.targetLat;
        state.currentLng = state.targetLng;
        state.currentCourse = state.targetCourse;
        updateMarkerRotation(marker, state.targetCourse);
        animationFramesRef.current.delete(deviceId);
      }
    };

    const frame = requestAnimationFrame(animate);
    animationFramesRef.current.set(deviceId, frame);
  }, [updateMarkerRotation]);

  useEffect(() => {
    if (!selectedDeviceId || !map || !allowPopup) return;

    markersRef.current.forEach((marker, id) => {
      if (id !== selectedDeviceId && marker.isPopupOpen()) {
        marker.closePopup();
      }
    });

    const targetMarker = markersRef.current.get(selectedDeviceId);
    if (targetMarker && !targetMarker.isPopupOpen()) {
      targetMarker.openPopup();
    }
  }, [selectedDeviceId, allowPopup]);

  useEffect(() => {
    if (!map) return;
    const activeIds = new Set();

    // TOOLBAR TOGGLE FOR ALL MARKERS
    if (!showMarkers) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      animStatesRef.current.clear();
      return;
    }

    latestPositions.forEach((position) => {
      const deviceId = position.deviceId;
      const device = devices[deviceId];
      if (!device || !isValidCoordinate(position.latitude, position.longitude)) return;

      activeIds.add(deviceId);

      const evalResult = evaluateLiveStatus(device, position);
      const speedKph = evalResult.speedKph;
      const rotation = Number(position.course) || 0;
      const headingText = getCardinalHeading(rotation);

      const lastUpdateRaw = position.fixTime || position.deviceTime || position.serverTime || device.lastUpdate;
      const plateNameText = device.name || 'Unit';
      const locationName = position.address || `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`;
      const lastUpdateFormatted = formatTimestamp(lastUpdateRaw);

      const satellitesValue = position.attributes?.sat ?? position.attributes?.satellites;
      const hasSatellites = satellitesValue !== undefined && satellitesValue !== null;

      const temperatureValue = position.attributes?.temp1 ?? position.attributes?.temperature;
      const hasTemperature = temperatureValue !== undefined && temperatureValue !== null && Number.isFinite(Number(temperatureValue));

      const fuelValue = position.attributes?.fuel1 ?? position.attributes?.fuel;
      const hasFuelSensor = fuelValue !== undefined && fuelValue !== null && Number.isFinite(Number(fuelValue));

      const expirationDateText = device.expirationTime ? formatDateOnly(device.expirationTime) : null;

      const existingMarker = markersRef.current.get(deviceId);
      const popupAlreadyOpen = existingMarker ? existingMarker.isPopupOpen() : false;

      // CLEAN FLAT SVG ARROW (NO GRADIENTS)
      const iconHtml = `
        <div class="marker-interactive-container">
          ${showLabels ? `
            <div class="vehicle-badge-pill" style="display:${popupAlreadyOpen ? 'none' : 'flex'};">
              <span class="vehicle-name">${plateNameText}</span>
              <span class="vehicle-speed">(${speedKph} kph)</span>
            </div>
            <div class="vehicle-badge-tail" style="display:${popupAlreadyOpen ? 'none' : 'block'};"></div>
          ` : ''}
          <div class="arrow-rotation-container" style="transform:rotate(${rotation}deg);">
            <svg class="vehicle-arrow-svg" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L21 21L12 17L3 21L12 2Z" fill="${evalResult.color}" />
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'leaflet-exact-reference-marker',
        html: iconHtml,
        iconSize: [MARKER_ICON_SIZE, MARKER_ICON_SIZE],
        iconAnchor: [MARKER_ICON_ANCHOR, MARKER_ICON_ANCHOR],
      });

      const popupContent = `
        <div class="vehicle-popup-card">
          <div class="vehicle-popup-header" style="background:${evalResult.color}; color:#ffffff;">
            <span class="vehicle-popup-title">${plateNameText}</span>
            <span class="vehicle-popup-status">${evalResult.label}</span>
          </div>
          <div class="vehicle-popup-body">
            <div class="vehicle-popup-row">
              <span>Speed</span>
              <strong>${speedKph} kph</strong>
            </div>
            <div class="vehicle-popup-row">
              <span>Heading</span>
              <strong>${headingText}</strong>
            </div>
            <div class="vehicle-popup-row">
              <span>Last Update</span>
              <strong>${lastUpdateFormatted}</strong>
            </div>
            ${hasSatellites ? `
            <div class="vehicle-popup-row">
              <span>Satellites</span>
              <strong>${satellitesValue}</strong>
            </div>` : ''}
            ${hasTemperature ? `
            <div class="vehicle-popup-row">
              <span>Temperature</span>
              <strong>${Number(temperatureValue).toFixed(1)}&deg;C</strong>
            </div>` : ''}
            ${hasFuelSensor ? `
            <div class="vehicle-popup-row">
              <span>Fuel Level</span>
              <strong>${Math.round(Number(fuelValue))}%</strong>
            </div>` : ''}
            ${expirationDateText ? `
            <div class="vehicle-popup-row">
              <span>Expires</span>
              <strong>${expirationDateText}</strong>
            </div>` : ''}
            <div class="vehicle-popup-location">
              <span>Location</span>
              <strong>${locationName}</strong>
            </div>
          </div>
        </div>
      `;

      const targetLat = position.latitude;
      const targetLng = position.longitude;
      const targetLatLng = [targetLat, targetLng];

      const gpsTimestampRaw = position.fixTime || position.deviceTime || position.serverTime;
      const gpsTimestamp = gpsTimestampRaw ? new Date(gpsTimestampRaw).getTime() : 0;
      const now = performance.now();

      if (existingMarker) {
        const marker = existingMarker;
        marker.setIcon(customIcon);
        if (allowPopup) {
          marker.setPopupContent(popupContent);
        }

        if (marker.isPopupOpen()) hideVehicleLabel(marker);

        const animatedPosition = getCurrentAnimatedPosition(deviceId);
        const existingState = animStatesRef.current.get(deviceId);

        let startLat, startLng, currentCourse;
        if (animatedPosition) {
          startLat = animatedPosition.lat;
          startLng = animatedPosition.lng;
          currentCourse = animatedPosition.course;
        } else {
          const markerLatLng = marker.getLatLng();
          startLat = markerLatLng.lat;
          startLng = markerLatLng.lng;
          currentCourse = existingState?.currentCourse ?? rotation;
        }

        cancelDeviceAnimation(deviceId);

        const distanceMeters = calculateHaversineDistance(startLat, startLng, targetLat, targetLng);

        if (distanceMeters > TELEPORT_THRESHOLD_METERS) {
          marker.setLatLng(targetLatLng);
          updateMarkerRotation(marker, rotation);

          animStatesRef.current.set(deviceId, {
            startLat: targetLat,
            startLng: targetLng,
            currentLat: targetLat,
            currentLng: targetLng,
            targetLat,
            targetLng,
            startCourse: rotation,
            currentCourse: rotation,
            targetCourse: rotation,
            deltaCourse: 0,
            startTime: now,
            duration: 0,
            lastGpsTimestamp: gpsTimestamp,
            lastBrowserUpdateTime: now,
          });
          return;
        }

        const deltaCourse = getShortestAngleDelta(currentCourse, rotation);
        let duration = DEFAULT_ANIMATION_DURATION;

        if (existingState?.lastGpsTimestamp && gpsTimestamp && gpsTimestamp > existingState.lastGpsTimestamp) {
          const gpsDelta = gpsTimestamp - existingState.lastGpsTimestamp;
          duration = Math.min(Math.max(gpsDelta, MIN_ANIMATION_DURATION), MAX_ANIMATION_DURATION);
        }

        if (distanceMeters < MIN_MOVEMENT_METERS && Math.abs(deltaCourse) < 0.1) {
          duration = 0;
        }

        const newState = {
          startLat,
          startLng,
          currentLat: startLat,
          currentLng: startLng,
          targetLat,
          targetLng,
          startCourse: currentCourse,
          currentCourse,
          targetCourse: rotation,
          deltaCourse,
          startTime: now,
          duration,
          lastGpsTimestamp: gpsTimestamp,
          lastBrowserUpdateTime: now,
        };

        animStatesRef.current.set(deviceId, newState);

        if (duration > 0) {
          startInterpolationLoop(deviceId);
        } else {
          marker.setLatLng(targetLatLng);
          updateMarkerRotation(marker, rotation);
        }
      } else {
        const marker = L.marker(targetLatLng, {
          icon: customIcon,
          keyboard: true,
          riseOnHover: true,
          autoPan: false,
          draggable: false,
        }).addTo(map);

        if (allowPopup) {
          marker.bindPopup(popupContent, {
            offset: [0, -10],
            closeButton: false,
            className: 'clean-white-popup-card',
            autoPan: false,
            keepInView: false,
            autoClose: true,
            closeOnClick: true,
          });

          marker.on('popupopen', () => {
            hideVehicleLabel(marker);
            const curPos = marker.getLatLng();
            const p = marker.getPopup();
            if (p) p.setLatLng(curPos);
          });

          marker.on('popupclose', () => {
            requestAnimationFrame(() => {
              showVehicleLabel(marker);
            });
          });
        }

        marker.on('click', (event) => {
          L.DomEvent.stopPropagation(event);

          markersRef.current.forEach((m, id) => {
            if (id !== deviceId && m.isPopupOpen()) {
              m.closePopup();
            }
          });

          dispatch(devicesActions.selectId(deviceId));

          const curPos = marker.getLatLng();

          if (allowPopup) {
            const p = marker.getPopup();
            if (p) p.setLatLng(curPos);
            marker.openPopup();
          }

          if (onMarkerClick) {
            onMarkerClick(position.id, deviceId, curPos);
          }
        });

        markersRef.current.set(deviceId, marker);

        animStatesRef.current.set(deviceId, {
          startLat: targetLat,
          startLng: targetLng,
          currentLat: targetLat,
          currentLng: targetLng,
          targetLat,
          targetLng,
          startCourse: rotation,
          currentCourse: rotation,
          targetCourse: rotation,
          deltaCourse: 0,
          startTime: now,
          duration: 0,
          lastGpsTimestamp: gpsTimestamp,
          lastBrowserUpdateTime: now,
        });
      }
    });

    for (const [id, marker] of markersRef.current.entries()) {
      if (!activeIds.has(id)) {
        cancelDeviceAnimation(id);
        marker.remove();
        markersRef.current.delete(id);
        animStatesRef.current.delete(id);
      }
    }
  }, [
    latestPositions,
    devices,
    showMarkers,
    showLabels,
    allowPopup,
    dispatch,
    onMarkerClick,
    cancelDeviceAnimation,
    getCurrentAnimatedPosition,
    startInterpolationLoop,
    updateMarkerRotation,
    hideVehicleLabel,
    showVehicleLabel,
  ]);

  useEffect(() => {
    return () => {
      animationFramesRef.current.forEach((frameId) => cancelAnimationFrame(frameId));
      animationFramesRef.current.clear();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      animStatesRef.current.clear();
    };
  }, []);

  return null;
};

export default memo(MapPositions);