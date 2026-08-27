import React, { useMemo, useEffect, useRef, useState, memo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapView, { map } from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapCamera from '../map/MapCamera';
import MapToolbar from '../map/main/MapToolbar';
import dayjs from 'dayjs';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const TRACK_BLUE = '#0284c7';
const TRACK_HIGHLIGHT_BLUE = '#2563eb';
const ARROW_RED = '#ef4444';
const BORDER = '#cbd5e1';

const calculateForwardBearing = (startLat, startLng, endLat, endLng) => {
  if (startLat === undefined || startLng === undefined || endLat === undefined || endLng === undefined) return 0;
  if (startLat === endLat && startLng === endLng) return 0;

  const radians = (deg) => (deg * Math.PI) / 180;
  const degrees = (rad) => (rad * 180) / Math.PI;

  const φ1 = radians(startLat);
  const φ2 = radians(endLat);
  const Δλ = radians(endLng - startLng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (degrees(θ) + 360) % 360;
};

const formatDurationHuman = (ms) => {
  if (!ms || ms < 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const getEventThemeInfo = (type, ruleName) => {
  const norm = `${type || ''} ${ruleName || ''}`.toLowerCase();
  if (norm.includes('overspeed') || norm.includes('speed')) {
    return { color: '#ef4444', label: 'Overspeed Alert', icon: '⚡' };
  }
  if (norm.includes('ignitionon') || norm.includes('ignition on')) {
    return { color: '#10b981', label: 'Ignition ON', icon: '🔑' };
  }
  if (norm.includes('ignitionoff') || norm.includes('ignition off')) {
    return { color: '#64748b', label: 'Ignition OFF', icon: '🔒' };
  }
  if (norm.includes('geofence')) {
    return { color: '#8b5cf6', label: 'Geofence Transition', icon: '📍' };
  }
  if (norm.includes('alarm') || norm.includes('sos') || norm.includes('panic')) {
    return { color: '#dc2626', label: 'Emergency Alarm', icon: '🚨' };
  }
  return { color: '#f59e0b', label: ruleName || type || 'Event', icon: '🔔' };
};

const HistoryMap = ({
  selectedStyleId,
  onSelect,
  allowedMapIds,
  historyPositions = [],
  historyIndex = 0,
  historyStops = [],
  historyEvents = [],
  selectedSegment = null,
  anchorEl,
  setAnchorEl,
}) => {
  const popupRef = useRef(null);
  const [showGeofences, setShowGeofences] = useState(true);

  const mainPolylineRef = useRef(null);
  const highlightPolylineRef = useRef(null);
  const activeVehicleMarkerRef = useRef(null);
  const directionalArrowsGroupRef = useRef(L.featureGroup());
  const stopsFeatureGroupRef = useRef(L.featureGroup());
  const eventsFeatureGroupRef = useRef(L.featureGroup());
  const segmentPinMarkerRef = useRef(null);

  const validPositions = useMemo(() => {
    if (!Array.isArray(historyPositions)) return [];
    return historyPositions.filter(
      (p) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)
    );
  }, [historyPositions]);

  const currentPosition = useMemo(() => {
    return validPositions[historyIndex] || null;
  }, [validPositions, historyIndex]);

  const headingAngle = useMemo(() => {
    if (!currentPosition) return 0;

    if (validPositions.length > 1 && historyIndex < validPositions.length - 1) {
      const next = validPositions[historyIndex + 1];
      const bearing = calculateForwardBearing(
        currentPosition.latitude,
        currentPosition.longitude,
        next.latitude,
        next.longitude
      );
      if (Math.abs(currentPosition.latitude - next.latitude) > 0.000005 || Math.abs(currentPosition.longitude - next.longitude) > 0.000005) {
        return bearing;
      }
    }

    if (historyIndex > 0 && validPositions.length > 1) {
      const prev = validPositions[historyIndex - 1];
      const bearing = calculateForwardBearing(
        prev.latitude,
        prev.longitude,
        currentPosition.latitude,
        currentPosition.longitude
      );
      if (Math.abs(prev.latitude - currentPosition.latitude) > 0.000005 || Math.abs(prev.longitude - currentPosition.longitude) > 0.000005) {
        return bearing;
      }
    }

    return currentPosition.course || 0;
  }, [currentPosition, validPositions, historyIndex]);

  const showHistoryPointPopup = useCallback((pos, customTitle = null) => {
    if (!map || !pos) return;
    if (popupRef.current) {
      try {
        map.closePopup(popupRef.current);
      } catch (e) {}
      popupRef.current = null;
    }

    const lat = pos.latitude || pos.startLatitude || 0;
    const lng = pos.longitude || pos.startLongitude || 0;
    const speedKmh = pos.speed ? Math.round(pos.speed * 1.852) : 0;
    const isMoving = speedKmh > 0;
    const statusText = isMoving ? 'Moving Drive' : 'Parked / Stationary';
    const statusColor = isMoving ? '#10b981' : '#f59e0b';
    const statusBg = isMoving ? '#ecfdf5' : '#fffbeb';

    const altM = Math.round(pos.altitude || 0);
    const address = pos.address || pos.startAddress || pos.attributes?.address || `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    const fixTimeStr = pos.fixTime ? dayjs(pos.fixTime).format('DD-MM-YYYY HH:mm:ss') : pos.deviceTime ? dayjs(pos.deviceTime).format('DD-MM-YYYY HH:mm:ss') : '-';
    const titleText = customTitle || (isMoving ? 'Moving Drive Point' : 'Parked Point');

    const ignitionState = pos.attributes?.ignition !== undefined ? (pos.attributes.ignition ? 'ON' : 'OFF') : null;
    const totalDistKm = pos.attributes?.totalDistance ? (pos.attributes.totalDistance / 1000).toFixed(2) : null;
    const engineHours = pos.attributes?.hours ? (pos.attributes.hours / 3600000).toFixed(1) : null;

    const maxPopupWidth = Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 32 : 300);

    const popupHtml = `
      <div style="font-family:${FONT_FAMILY};font-size:12px;color:#1e293b;width:${maxPopupWidth}px;max-width:100%;box-sizing:border-box;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${BORDER};box-shadow:0 10px 25px rgba(15, 23, 42, 0.18);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#ffffff;border-bottom:1px solid #f1f5f9;box-sizing:border-box;width:100%;">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${PRIMARY}" style="transform:rotate(45deg);flex-shrink:0;">
              <path d="M12 2L21 21L12 17L3 21L12 2Z"/>
            </svg>
            <span style="font-weight:700;font-size:12.5px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;">
              ${titleText}
            </span>
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('close-history-point-popup'))" style="background:#f1f5f9;border:none;cursor:pointer;width:20px;height:20px;min-width:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:11px;font-weight:bold;line-height:1;padding:0;margin-left:6px;flex-shrink:0;">
            ✕
          </button>
        </div>

        <div style="padding:6px 10px;background:${statusBg};border-bottom:1px solid ${statusColor}30;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:11px;font-weight:700;color:${statusColor};display:flex;align-items:center;gap:4px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};display:inline-block;"></span>
            ${statusText}
          </span>
          <span style="font-size:11.5px;font-weight:700;color:${statusColor};">
            ${speedKmh} kph
          </span>
        </div>

        <div style="padding:8px 10px;box-sizing:border-box;width:100%;">
          <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11.5px;">
            <tbody>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="width:75px;padding:3.5px 0;color:#64748b;font-weight:600;vertical-align:top;white-space:nowrap;">Location</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:500;text-align:right;vertical-align:top;overflow-wrap:anywhere;line-height:1.3;">${address}</td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="width:75px;padding:3.5px 0;color:#64748b;font-weight:600;vertical-align:middle;white-space:nowrap;">Preview</td>
                <td style="padding:3.5px 0 3.5px 6px;text-align:right;vertical-align:middle;">
                  <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" rel="noreferrer" style="color:${PRIMARY};font-weight:600;text-decoration:none;">Open Google Maps &gt;&gt;</a>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Coordinates</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:600;text-align:right;">${Number(lat).toFixed(5)}°, ${Number(lng).toFixed(5)}°</td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Altitude</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:600;text-align:right;">${altM} m</td>
              </tr>
              ${
                ignitionState
                  ? `
                <tr style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Ignition</td>
                  <td style="padding:3.5px 0 3.5px 6px;color:${ignitionState === 'ON' ? '#10b981' : '#64748b'};font-weight:700;text-align:right;">${ignitionState}</td>
                </tr>
              `
                  : ''
              }
              ${
                totalDistKm
                  ? `
                <tr style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Odometer</td>
                  <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:600;text-align:right;">${totalDistKm} km</td>
                </tr>
              `
                  : ''
              }
              ${
                engineHours
                  ? `
                <tr style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Engine Hours</td>
                  <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:600;text-align:right;">${engineHours} h</td>
                </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Recorded Time</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#475569;font-weight:600;font-size:11px;text-align:right;">${fixTimeStr}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { animate: true, duration: 0.5 });

    popupRef.current = L.popup({
      className: 'clean-event-leaflet-popup',
      minWidth: Math.min(270, maxPopupWidth),
      maxWidth: maxPopupWidth,
      offset: [0, -10],
      closeButton: false,
      autoPan: true,
      autoClose: true,
      closeOnClick: true,
      closeOnEscapeKey: true,
    })
      .setLatLng([lat, lng])
      .setContent(popupHtml)
      .openOn(map);
  }, []);

  const showStopPopup = useCallback((stop, idx) => {
    if (!map || !stop) return;
    if (popupRef.current) {
      try {
        map.closePopup(popupRef.current);
      } catch (e) {}
      popupRef.current = null;
    }

    const lat = stop.latitude || stop.startLatitude || 0;
    const lng = stop.longitude || stop.startLongitude || 0;
    const address = stop.address || 'Stop Location';
    const arrivalTime = stop.startTime ? dayjs(stop.startTime).format('DD-MM-YYYY HH:mm:ss') : '-';
    const departureTime = stop.endTime ? dayjs(stop.endTime).format('DD-MM-YYYY HH:mm:ss') : '-';
    const durationStr = formatDurationHuman(stop.duration);
    const engineHours = stop.engineHours ? (stop.engineHours / 3600000).toFixed(1) : null;
    const maxPopupWidth = Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 32 : 300);

    const popupHtml = `
      <div style="font-family:${FONT_FAMILY};font-size:12px;color:#1e293b;width:${maxPopupWidth}px;max-width:100%;box-sizing:border-box;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${BORDER};box-shadow:0 10px 25px rgba(15, 23, 42, 0.18);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#ffffff;border-bottom:1px solid #f1f5f9;box-sizing:border-box;width:100%;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:14px;">🅿️</span>
            <span style="font-size:12.5px;font-weight:700;color:#0284c7;">Driving Ended #${idx + 1}</span>
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('close-history-point-popup'))" style="background:#f1f5f9;border:none;cursor:pointer;color:#64748b;font-size:11px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            ✕
          </button>
        </div>

        <div style="padding:6px 10px;background:#eff6ff;border-bottom:1px solid #bfdbfe;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:11px;font-weight:700;color:#0284c7;">Total Stopped Duration</span>
          <span style="font-size:12px;font-weight:800;color:#0284c7;">${durationStr}</span>
        </div>

        <div style="padding:8px 10px;box-sizing:border-box;width:100%;">
          <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11.5px;">
            <tbody>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="width:75px;padding:3.5px 0;color:#64748b;font-weight:600;vertical-align:top;white-space:nowrap;">Stop Address</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:500;text-align:right;vertical-align:top;overflow-wrap:anywhere;line-height:1.3;">${address}</td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="width:75px;padding:3.5px 0;color:#64748b;font-weight:600;vertical-align:middle;white-space:nowrap;">Preview</td>
                <td style="padding:3.5px 0 3.5px 6px;text-align:right;vertical-align:middle;">
                  <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" rel="noreferrer" style="color:#0284c7;font-weight:600;text-decoration:none;">Open Google Maps &gt;&gt;</a>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Arrived Time</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:600;text-align:right;">${arrivalTime}</td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Departed Time</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:600;text-align:right;">${departureTime}</td>
              </tr>
              ${
                engineHours
                  ? `
                <tr style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Idling Hours</td>
                  <td style="padding:3.5px 0 3.5px 6px;color:#d97706;font-weight:700;text-align:right;">${engineHours} h</td>
                </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">GPS Fix</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#475569;font-weight:600;text-align:right;">${Number(lat).toFixed(5)}°, ${Number(lng).toFixed(5)}°</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { animate: true, duration: 0.5 });

    popupRef.current = L.popup({
      className: 'clean-event-leaflet-popup',
      minWidth: Math.min(270, maxPopupWidth),
      maxWidth: maxPopupWidth,
      offset: [0, -10],
      closeButton: false,
      autoPan: true,
      autoClose: true,
      closeOnClick: true,
      closeOnEscapeKey: true,
    })
      .setLatLng([lat, lng])
      .setContent(popupHtml)
      .openOn(map);
  }, []);

  const showEventPopup = useCallback((event) => {
    if (!map || !event) return;
    if (popupRef.current) {
      try {
        map.closePopup(popupRef.current);
      } catch (e) {}
      popupRef.current = null;
    }

    const lat = event.latitude || event.attributes?.latitude || 0;
    const lng = event.longitude || event.attributes?.longitude || 0;
    const theme = getEventThemeInfo(event.type, event.attributes?.ruleName);
    const title = event.attributes?.ruleName || event.type || 'Event Alert';
    const address = event.attributes?.address || event.address || `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    const eventTimeStr = dayjs(event.eventTime || event.serverTime).format('DD-MM-YYYY HH:mm:ss');
    const speedKmh = event.attributes?.speed ? Math.round(event.attributes.speed * 1.852) : 0;
    const maxPopupWidth = Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 32 : 300);

    const popupHtml = `
      <div style="font-family:${FONT_FAMILY};font-size:12px;color:#1e293b;width:${maxPopupWidth}px;max-width:100%;box-sizing:border-box;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${BORDER};box-shadow:0 10px 25px rgba(15, 23, 42, 0.18);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#ffffff;border-bottom:1px solid #f1f5f9;box-sizing:border-box;width:100%;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:13px;">${theme.icon}</span>
            <span style="font-size:12.5px;font-weight:700;color:${theme.color};">${title}</span>
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('close-history-point-popup'))" style="background:#f1f5f9;border:none;cursor:pointer;color:#64748b;font-size:11px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            ✕
          </button>
        </div>

        <div style="padding:6px 10px;background:#fef2f2;border-bottom:1px solid #fecaca;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:11px;font-weight:700;color:#dc2626;">Trigger Status</span>
          <span style="font-size:11.5px;font-weight:700;color:#dc2626;">Active Alert</span>
        </div>

        <div style="padding:8px 10px;box-sizing:border-box;width:100%;">
          <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11.5px;">
            <tbody>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="width:75px;padding:3.5px 0;color:#64748b;font-weight:600;vertical-align:top;white-space:nowrap;">Road Location</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:500;text-align:right;vertical-align:top;overflow-wrap:anywhere;line-height:1.3;">${address}</td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="width:75px;padding:3.5px 0;color:#64748b;font-weight:600;vertical-align:middle;white-space:nowrap;">Preview</td>
                <td style="padding:3.5px 0 3.5px 6px;text-align:right;vertical-align:middle;">
                  <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" rel="noreferrer" style="color:${PRIMARY};font-weight:600;text-decoration:none;">Open Google Maps &gt;&gt;</a>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f8fafc;">
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Occurred Time</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#1e293b;font-weight:600;text-align:right;">${eventTimeStr}</td>
              </tr>
              ${
                speedKmh > 0
                  ? `
                <tr style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Speed on Road</td>
                  <td style="padding:3.5px 0 3.5px 6px;color:${theme.color};font-weight:700;text-align:right;">${speedKmh} kph</td>
                </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding:3.5px 0;color:#64748b;font-weight:600;">Coordinates</td>
                <td style="padding:3.5px 0 3.5px 6px;color:#475569;font-weight:600;text-align:right;">${Number(lat).toFixed(5)}°, ${Number(lng).toFixed(5)}°</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (lat && lng) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { animate: true, duration: 0.5 });
      popupRef.current = L.popup({
        className: 'clean-event-leaflet-popup',
        minWidth: Math.min(270, maxPopupWidth),
        maxWidth: maxPopupWidth,
        offset: [0, -10],
        closeButton: false,
        autoPan: true,
        autoClose: true,
        closeOnClick: true,
        closeOnEscapeKey: true,
      })
        .setLatLng([lat, lng])
        .setContent(popupHtml)
        .openOn(map);
    }
  }, []);

  useEffect(() => {
    const handleClose = () => {
      if (popupRef.current && map) {
        try {
          map.closePopup(popupRef.current);
        } catch (e) {}
        popupRef.current = null;
      }
    };

    const handleMapClick = () => {
      if (popupRef.current && map) {
        try {
          map.closePopup(popupRef.current);
        } catch (e) {}
        popupRef.current = null;
      }
    };

    window.addEventListener('close-history-point-popup', handleClose);
    if (map) {
      map.on('click', handleMapClick);
    }

    return () => {
      window.removeEventListener('close-history-point-popup', handleClose);
      if (map) {
        map.off('click', handleMapClick);
      }
    };
  }, []);

  useEffect(() => {
    if (!map || !selectedSegment) return;

    let targetLat = null;
    let targetLng = null;
    let targetPos = null;

    if (selectedSegment.type === 'stop') {
      targetLat = selectedSegment.data.latitude || selectedSegment.data.startLatitude;
      targetLng = selectedSegment.data.longitude || selectedSegment.data.startLongitude;
      showStopPopup(selectedSegment.data, 0);
    } else if (selectedSegment.type === 'trip') {
      targetLat = selectedSegment.data.startLatitude;
      targetLng = selectedSegment.data.startLongitude;

      targetPos = {
        latitude: targetLat,
        longitude: targetLng,
        address: selectedSegment.data.startAddress,
        speed: selectedSegment.data.maxSpeed || selectedSegment.data.averageSpeed,
        altitude: 0,
        fixTime: selectedSegment.start,
        attributes: selectedSegment.data.attributes,
      };

      showHistoryPointPopup(targetPos, 'Driver Start');
    } else if (selectedSegment.type === 'event') {
      targetLat = selectedSegment.data.latitude || selectedSegment.data.attributes?.latitude;
      targetLng = selectedSegment.data.longitude || selectedSegment.data.attributes?.longitude;
      showEventPopup(selectedSegment.data);
    } else if (selectedSegment.type === 'point' && selectedSegment.data) {
      targetLat = selectedSegment.data.latitude;
      targetLng = selectedSegment.data.longitude;
      showHistoryPointPopup(selectedSegment.data, selectedSegment.data.title || 'Location Info');
    }

    if (targetLat && targetLng) {
      if (segmentPinMarkerRef.current) {
        segmentPinMarkerRef.current.remove();
      }

      const pinIcon = L.divIcon({
        className: 'leaflet-history-pin-point',
        html: `
          <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${PRIMARY}40;animation:alertPulse 1.8s infinite ease-out;"></div>
            <div style="width:18px;height:18px;border-radius:50%;background:${PRIMARY};border:2.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      segmentPinMarkerRef.current = L.marker([targetLat, targetLng], { icon: pinIcon, zIndexOffset: 1500 }).addTo(map);
    }

    return () => {
      if (segmentPinMarkerRef.current) {
        segmentPinMarkerRef.current.remove();
        segmentPinMarkerRef.current = null;
      }
    };
  }, [selectedSegment, showHistoryPointPopup, showStopPopup, showEventPopup]);

  useEffect(() => {
    if (!map || !currentPosition) return;
    map.panTo([currentPosition.latitude, currentPosition.longitude], { animate: false });
  }, [currentPosition]);

  // Main Track Polyline
  useEffect(() => {
    if (!map) return;

    if (mainPolylineRef.current) {
      mainPolylineRef.current.remove();
      mainPolylineRef.current = null;
    }
    if (highlightPolylineRef.current) {
      highlightPolylineRef.current.remove();
      highlightPolylineRef.current = null;
    }

    if (validPositions.length < 2) return;

    const fullLatLngs = validPositions.map((p) => [p.latitude, p.longitude]);

    mainPolylineRef.current = L.polyline(fullLatLngs, {
      color: TRACK_BLUE,
      weight: 3.5,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
      smoothFactor: 1.0,
    }).addTo(map);

    if (selectedSegment && selectedSegment.start && selectedSegment.end) {
      const startTime = new Date(selectedSegment.start).getTime();
      const endTime = new Date(selectedSegment.end).getTime();
      const highlightLatLngs = validPositions
        .filter((p) => {
          const t = new Date(p.fixTime || p.deviceTime).getTime();
          return t >= startTime && t <= endTime;
        })
        .map((p) => [p.latitude, p.longitude]);

      if (highlightLatLngs.length > 1) {
        highlightPolylineRef.current = L.polyline(highlightLatLngs, {
          color: TRACK_HIGHLIGHT_BLUE,
          weight: 4.5,
          opacity: 1.0,
          smoothFactor: 1.0,
        }).addTo(map);
      }
    }

    return () => {
      if (mainPolylineRef.current) mainPolylineRef.current.remove();
      if (highlightPolylineRef.current) highlightPolylineRef.current.remove();
    };
  }, [validPositions, selectedSegment]);

  // Directional Arrows on Track
  useEffect(() => {
    if (!map) return;
    directionalArrowsGroupRef.current.clearLayers();

    if (validPositions.length < 2) return;

    const totalPoints = validPositions.length;
    const step = totalPoints > 2000 ? Math.ceil(totalPoints / 120) : totalPoints > 500 ? 2 : 1;

    const markersToBatch = [];
    for (let i = 0; i < totalPoints - 1; i += step) {
      const p1 = validPositions[i];
      const p2 = validPositions[i + 1] || validPositions[totalPoints - 1];

      const midLat = (p1.latitude + p2.latitude) / 2;
      const midLng = (p1.longitude + p2.longitude) / 2;
      const bearing = calculateForwardBearing(p1.latitude, p1.longitude, p2.latitude, p2.longitude);

      const arrowIcon = L.divIcon({
        className: 'leaflet-history-direction-arrow',
        html: `
          <div style="width:14px;height:14px;display:flex;align-items:center;justify-content:center;transform:rotate(${bearing}deg);transform-origin:50% 50%;pointer-events:auto;cursor:pointer;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="${ARROW_RED}">
              <path d="M12 2L22 22L12 17L2 22L12 2Z" stroke="#ffffff" stroke-width="1.5"/>
            </svg>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const arrowMarker = L.marker([midLat, midLng], { icon: arrowIcon });
      arrowMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        showHistoryPointPopup(p1);
      });

      markersToBatch.push(arrowMarker);
    }

    const arrowGroup = directionalArrowsGroupRef.current;
    markersToBatch.forEach((m) => arrowGroup.addLayer(m));
    arrowGroup.addTo(map);

    return () => {
      arrowGroup.clearLayers();
    };
  }, [validPositions, showHistoryPointPopup]);

  // Centered Vehicle Reference Marker
  useEffect(() => {
    if (!map || !currentPosition) return;

    const latLng = [currentPosition.latitude, currentPosition.longitude];
    const speedKph = currentPosition.speed ? Math.round(currentPosition.speed * 1.852) : 0;

    const iconHtml = `
      <div style="position:relative;width:32px;height:48px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;pointer-events:auto;cursor:pointer;">
        <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);display:flex;font-size:10px;padding:2px 6px;font-weight:700;background:#0f172a;color:#ffffff;border-radius:10px;box-shadow:0 2px 4px rgba(0,0,0,0.35);white-space:nowrap;line-height:1.2;font-family:${FONT_FAMILY};z-index:2;">
          ${speedKph} kph
        </div>
        <div style="position:absolute;bottom:0;left:50%;margin-left:-13px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;transform:rotate(${headingAngle}deg);transform-origin:50% 50%;z-index:1;">
          <svg viewBox="0 0 24 24" fill="none" style="width:26px;height:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));">
            <path d="M12 2L21 21L12 17L3 21L12 2Z" fill="${PRIMARY}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    `;

    const activeIcon = L.divIcon({
      className: 'leaflet-exact-reference-marker',
      html: iconHtml,
      iconSize: [32, 48],
      iconAnchor: [16, 35],
      popupAnchor: [0, -38],
    });

    if (activeVehicleMarkerRef.current) {
      activeVehicleMarkerRef.current.setLatLng(latLng);
      activeVehicleMarkerRef.current.setIcon(activeIcon);
    } else {
      activeVehicleMarkerRef.current = L.marker(latLng, { icon: activeIcon, zIndexOffset: 2000 }).addTo(map);
      activeVehicleMarkerRef.current.on('click', () => showHistoryPointPopup(currentPosition));
    }

    return () => {
      if (activeVehicleMarkerRef.current) {
        activeVehicleMarkerRef.current.remove();
        activeVehicleMarkerRef.current = null;
      }
    };
  }, [currentPosition, headingAngle, showHistoryPointPopup]);

  // Stops Markers
  useEffect(() => {
    if (!map || !historyStops) return;
    stopsFeatureGroupRef.current.clearLayers();

    historyStops.forEach((stop, idx) => {
      if (!stop.latitude || !stop.longitude) return;

      const stopIcon = L.divIcon({
        className: 'leaflet-history-stop-icon',
        html: `
          <div style="width:22px;height:22px;background-color:#0284c7;border:1.5px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer;">
            <span style="transform:rotate(45deg);color:#ffffff;font-family:${FONT_FAMILY};font-size:10px;font-weight:700;">
              ${idx + 1}
            </span>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      const stopMarker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon });
      stopMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        showStopPopup(stop, idx);
      });

      stopsFeatureGroupRef.current.addLayer(stopMarker);
    });

    stopsFeatureGroupRef.current.addTo(map);

    return () => {
      stopsFeatureGroupRef.current.clearLayers();
    };
  }, [historyStops, showStopPopup]);

  // Event Markers
  useEffect(() => {
    if (!map || !historyEvents) return;
    eventsFeatureGroupRef.current.clearLayers();

    historyEvents.forEach((ev) => {
      const lat = ev.latitude || ev.attributes?.latitude;
      const lng = ev.longitude || ev.attributes?.longitude;
      if (!lat || !lng) return;

      const theme = getEventThemeInfo(ev.type, ev.attributes?.ruleName);

      const evIcon = L.divIcon({
        className: 'leaflet-history-event-icon',
        html: `
          <div style="width:20px;height:20px;background-color:${theme.color};border:1.5px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer;font-size:10px;line-height:1;">
            ${theme.icon}
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const evMarker = L.marker([lat, lng], { icon: evIcon, zIndexOffset: 1200 });
      evMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        showEventPopup(ev);
      });

      eventsFeatureGroupRef.current.addLayer(evMarker);
    });

    eventsFeatureGroupRef.current.addTo(map);

    return () => {
      eventsFeatureGroupRef.current.clearLayers();
    };
  }, [historyEvents, showEventPopup]);

  return (
    <>
      <MapView
        selectedStyleId={selectedStyleId}
        onSelect={onSelect}
        allowedMapIds={allowedMapIds}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
      >
        {showGeofences && <MapGeofence />}
      </MapView>

      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2000, pointerEvents: 'auto' }}>
        <MapToolbar
          map={map}
          onMapTypeChange={(e) => setAnchorEl(e?.currentTarget || null)}
          onToggleGeofences={() => setShowGeofences(!showGeofences)}
          onFitBounds={() => {
            if (!validPositions || validPositions.length === 0) return;
            const bounds = L.latLngBounds(validPositions.map((p) => [p.latitude, p.longitude]));
            if (bounds.isValid()) {
              const isSmall = window.innerWidth <= 480;
              map.fitBounds(bounds, { padding: isSmall ? [25, 25] : [60, 60], animate: true, duration: 0.5 });
            }
          }}
        />
      </div>

      <MapScale />
      {validPositions.length > 0 && <MapCamera positions={validPositions} />}
    </>
  );
};

export default memo(HistoryMap);