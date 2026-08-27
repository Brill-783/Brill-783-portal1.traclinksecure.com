import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { playAlertSound } from './AddAlertModal';
import { showEventMapPopup } from './ActivityView';
import { eventsActions } from '../../store';

const KNOTS_TO_KMH = 1.852;
const MIN_MOVING_SPEED_KMH = 2.0;

const GlobalAlertController = () => {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.session?.user, shallowEqual);
  const impersonatedUserId = localStorage.getItem('impersonated_user_id');
  const effectiveUserId = impersonatedUserId ? Number(impersonatedUserId) : currentUser?.id;
  const isSuperAdmin = Boolean(currentUser?.administrator || currentUser?.admin || currentUser?.id === 1);

  const devicesObj = useSelector((state) => state.devices?.items || {}, shallowEqual);
  const devices = useMemo(() => (Array.isArray(devicesObj) ? devicesObj : Object.values(devicesObj)), [devicesObj]);
  const allowedDeviceIds = useMemo(() => new Set(devices.map((d) => Number(d.id))), [devices]);

  const positions = useSelector((state) => state.session?.positions || {}, shallowEqual);
  const lastTriggeredTimes = useRef(new Map());
  const configuredRulesRef = useRef([]);
  const isEvaluatingRef = useRef(false);
  const abortControllerRef = useRef(null);

  const loadRules = useCallback(async () => {
    if (!effectiveUserId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const endpoint = isSuperAdmin
        ? '/api/notifications'
        : `/api/notifications?userId=${effectiveUserId}`;

      const res = await fetch(endpoint, {
        credentials: 'include',
        signal: abortControllerRef.current.signal,
      });

      if (res.ok) {
        const notifs = await res.json();
        if (Array.isArray(notifs)) {
          const userRules = notifs.filter((n) => {
            const owner = n.attributes?.ownerUserId;
            return !owner || Number(owner) === Number(effectiveUserId);
          });
          configuredRulesRef.current = userRules.map((n) => ({
            id: n.id,
            name: n.attributes?.ruleName || n.type,
            type: n.type,
            speedLimit: n.attributes?.speedLimit !== undefined ? Math.round(n.attributes.speedLimit * KNOTS_TO_KMH) : undefined,
            sound: n.attributes?.sound || 'chime',
            color: n.attributes?.color || '#00ab8e',
            selectedUnits: n.attributes?.selectedUnits || [],
            ownerUserId: Number(n.attributes?.ownerUserId || effectiveUserId),
          }));
        }
      }
    } catch (e) {}
  }, [effectiveUserId, isSuperAdmin]);

  useEffect(() => {
    loadRules();
    const interval = setInterval(loadRules, 60000);
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadRules]);

  useEffect(() => {
    if (!effectiveUserId || configuredRulesRef.current.length === 0 || isEvaluatingRef.current) return;

    isEvaluatingRef.current = true;
    const positionsList = Array.isArray(positions) ? positions : Object.values(positions || {});
    const deviceMap = new Map(devices.map((d) => [d.id, d]));
    const now = Date.now();

    positionsList.forEach((pos) => {
      const deviceId = pos?.deviceId;
      if (!deviceId || !allowedDeviceIds.has(Number(deviceId))) return;
      const device = deviceMap.get(deviceId);
      if (!device) return;

      const rawKnots = typeof pos.speed === 'number' && Number.isFinite(pos.speed) ? pos.speed : 0;
      const speedKmh = Math.round(rawKnots * KNOTS_TO_KMH);

      const isIgnitionOn = Boolean(
        pos?.attributes?.ignition === true ||
        pos?.attributes?.ignition === 1 ||
        pos?.attributes?.acc === true ||
        pos?.attributes?.acc === 1
      );

      const expirationTimestamp = device.expirationTime ? new Date(device.expirationTime).getTime() : null;
      const daysUntilExpiry = expirationTimestamp ? (expirationTimestamp - now) / (1000 * 3600 * 24) : null;

      configuredRulesRef.current.forEach((rule) => {
        const isDeviceCovered =
          !rule.selectedUnits ||
          rule.selectedUnits.length === 0 ||
          rule.selectedUnits.map(Number).includes(Number(deviceId));

        if (!isDeviceCovered) return;

        let isTriggered = false;
        let eventRuleName = rule.name;

        // 1. Overspeed
        if (rule.type === 'deviceOverspeed' && rule.speedLimit && speedKmh > Number(rule.speedLimit)) {
          isTriggered = true;
          eventRuleName = rule.name || `Over Speed (${rule.speedLimit} km/h)`;
        }

        // 2. Vehicle Moving (> 2.0 km/h)
        if (rule.type === 'deviceMoving' && speedKmh > MIN_MOVING_SPEED_KMH) {
          isTriggered = true;
          eventRuleName = 'Vehicle Moving';
        }

        // 3. Vehicle Stopped (<= 2.0 km/h and ignition OFF)
        if (rule.type === 'deviceStopped' && speedKmh <= MIN_MOVING_SPEED_KMH && !isIgnitionOn) {
          isTriggered = true;
          eventRuleName = 'Vehicle Stopped';
        }

        // 4. Ignition ON
        if (rule.type === 'ignitionOn' && isIgnitionOn) {
          isTriggered = true;
          eventRuleName = 'Ignition Turned ON';
        }

        // 5. Ignition OFF
        if (rule.type === 'ignitionOff' && !isIgnitionOn) {
          isTriggered = true;
          eventRuleName = 'Ignition Turned OFF';
        }

        // 6. Power Cut
        if (rule.type === 'powerCut' && (pos?.attributes?.alarm === 'powerCut' || pos?.attributes?.power === 0)) {
          isTriggered = true;
          eventRuleName = 'Power Cut / Tamper Detected';
        }

        // 7. Low Battery
        if (rule.type === 'lowBattery' && (pos?.attributes?.batteryLevel < 20 || pos?.attributes?.alarm === 'lowBattery')) {
          isTriggered = true;
          eventRuleName = 'Low Battery Warning';
        }

        // 8. Towing Alert
        if (rule.type === 'tow' && (pos?.attributes?.alarm === 'tow' || (speedKmh > 5 && !isIgnitionOn))) {
          isTriggered = true;
          eventRuleName = 'Towing / Unauthorized Movement';
        }

        // 9. Excessive Idle (<= 2.0 km/h and ignition ON)
        if (rule.type === 'idleDuration' && speedKmh <= MIN_MOVING_SPEED_KMH && isIgnitionOn) {
          isTriggered = true;
          eventRuleName = 'Excessive Idling';
        }

        // 10. SOS / Panic
        if (rule.type === 'alarm' && pos?.attributes?.alarm === 'sos') {
          isTriggered = true;
          eventRuleName = 'SOS Panic Alarm Triggered';
        }

        // 11. Subscription Expiration
        if (daysUntilExpiry !== null && rule.type === 'deviceExpiring') {
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            isTriggered = true;
            eventRuleName = `Device Expiring in ${Math.ceil(daysUntilExpiry)} Days`;
          } else if (daysUntilExpiry <= 0) {
            isTriggered = true;
            eventRuleName = 'Device Subscription Expired';
          }
        }

        if (isTriggered) {
          const key = `${effectiveUserId}_${deviceId}_${rule.id}_${rule.type}`;
          const lastTime = lastTriggeredTimes.current.get(key) || 0;
          const debounceWindow = rule.type === 'deviceExpiring' ? 12 * 3600000 : 45000;

          if (now - lastTime > debounceWindow) {
            lastTriggeredTimes.current.set(key, now);

            try {
              if (typeof playAlertSound === 'function') {
                playAlertSound(rule.sound || 'chime');
              }
            } catch (e) {}

            const eventRecord = {
              id: `live_${deviceId}_${now}`,
              deviceId,
              type: rule.type,
              eventTime: new Date().toISOString(),
              serverTime: new Date().toISOString(),
              latitude: pos.latitude,
              longitude: pos.longitude,
              altitude: pos.altitude || 0,
              speed: speedKmh,
              address: pos.address || `${pos.latitude?.toFixed(5)}, ${pos.longitude?.toFixed(5)}`,
              attributes: {
                ruleName: eventRuleName,
                speedLimit: rule.speedLimit,
                speed: pos.speed,
                sound: rule.sound || 'chime',
                color: rule.color || '#ef4444',
                ownerUserId: Number(effectiveUserId),
              },
            };

            if (eventsActions?.add) {
              dispatch(eventsActions.add([eventRecord]));
            }

            try {
              if (typeof showEventMapPopup === 'function') {
                showEventMapPopup(eventRecord, device);
              }
            } catch (e) {}
          }
        }
      });
    });

    isEvaluatingRef.current = false;
  }, [positions, devices, allowedDeviceIds, effectiveUserId, dispatch]);

  return null;
};

export default memo(GlobalAlertController);