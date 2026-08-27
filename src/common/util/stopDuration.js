const deviceStopState = new Map();

function getDeviceStopState(deviceId) {
  if (!deviceStopState.has(deviceId)) {
    deviceStopState.set(deviceId, {
      baselineTime: null,
      prevIsMoving: null,
      lastCoords: null,
    });
  }
  return deviceStopState.get(deviceId);
}

export function getStopBaseline(deviceId, position) {
  if (!position || position.latitude == null || position.longitude == null) {
    return null;
  }

  const state = getDeviceStopState(deviceId);

  const isMoving = (position.speed || 0) > 0;
  const currentCoords = `${position.longitude},${position.latitude}`;
  const locationChanged = currentCoords !== state.lastCoords;

  const wasStationary = state.prevIsMoving === false || state.prevIsMoving === null;
  const transitioningToMoving = wasStationary && isMoving;

  if (transitioningToMoving) {
    state.baselineTime = Date.now();
    state.lastCoords = currentCoords;
  } else if (isMoving && locationChanged) {
    state.baselineTime = Date.now();
    state.lastCoords = currentCoords;
  }

  if (state.baselineTime === null) {
    const serverTime =
      position.attributes?.stopTime || position.attributes?.motionTime || position.fixTime;
    const serverTimestamp = serverTime ? new Date(serverTime).getTime() : null;
    state.baselineTime = Number.isFinite(serverTimestamp) ? serverTimestamp : Date.now();
    if (!state.lastCoords) {
      state.lastCoords = currentCoords;
    }
  } else if (locationChanged && state.lastCoords === null) {
    state.lastCoords = currentCoords;
  }

  state.prevIsMoving = isMoving;

  return state.baselineTime;
}

export function formatStopDuration(ms) {
  if (!ms || ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatStopDurationShort(ms) {
  if (!ms || ms < 0) return '—';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${m} min`;
}
