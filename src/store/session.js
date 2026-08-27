import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'session',

  initialState: {
    server: {},
    user: null,
    socket: null,
    includeLogs: false,
    logs: [],
    positions: {},
    history: {},
    preloadComplete: false,
  },

  reducers: {
    updateServer(state, action) {
      state.server = action.payload || {};
    },

    updateUser(state, action) {
      state.user = action.payload || null;
      state.positions = {};
      state.history = {};
      state.logs = [];
      state.preloadComplete = false;
    },

    updateUserPartial(state, action) {
      if (!action.payload) return;
      state.user = {
        ...(state.user || {}),
        ...action.payload,
        attributes: {
          ...(state.user?.attributes || {}),
          ...(action.payload.attributes || {}),
        },
      };
    },

    updateSocket(state, action) {
      state.socket = action.payload || null;
    },

    enableLogs(state, action) {
      state.includeLogs = Boolean(action.payload);

      if (!action.payload) {
        state.logs = [];
      }
    },

    updateLogs(state, action) {
      if (!Array.isArray(action.payload)) {
        return;
      }

      state.logs.push(...action.payload);
    },

    updatePositions(state, action) {
      if (!Array.isArray(action.payload)) {
        return;
      }

      const liveRoutes =
        state.user?.attributes?.mapLiveRoutes ??
        state.server?.attributes?.mapLiveRoutes ??
        'none';

      const configuredLimit =
        state.user?.attributes?.['web.liveRouteLength'] ??
        state.server?.attributes?.['web.liveRouteLength'] ??
        10;

      const liveRoutesLimit = Math.max(
        1,
        Number(configuredLimit) || 10,
      );

      action.payload.forEach((position) => {
        if (!position || position.deviceId == null) {
          return;
        }

        const deviceId = position.deviceId;

        state.positions[deviceId] = position;

        if (liveRoutes === 'none') {
          state.history = {};
          return;
        }

        const latitude = Number(position.latitude);
        const longitude = Number(position.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return;
        }

        const route = state.history[deviceId] || [];
        const last = route.at(-1);

        if (
          !last ||
          last[0] !== longitude ||
          last[1] !== latitude
        ) {
          state.history[deviceId] = [
            ...route.slice(-(liveRoutesLimit - 1)),
            [longitude, latitude],
          ];
        }
      });
    },

    setPreloadComplete(state, action) {
      state.preloadComplete = Boolean(action.payload);
    },

    clearUserData(state) {
      state.positions = {};
      state.history = {};
      state.logs = [];
      state.preloadComplete = false;
    },

    clearSession(state) {
      state.server = {};
      state.user = null;
      state.socket = null;
      state.includeLogs = false;
      state.logs = [];
      state.positions = {};
      state.history = {};
      state.preloadComplete = false;
    },
  },
});

export { actions as sessionActions };
export { reducer as sessionReducer };