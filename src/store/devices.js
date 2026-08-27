import { createSlice } from '@reduxjs/toolkit';

const normalizeDevices = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.devices)) {
      return payload.devices;
    }

    return Object.values(payload);
  }

  return [];
};

const getDeviceKey = (device) => {
  if (!device) {
    return null;
  }

  if (device.id != null) {
    return String(device.id);
  }

  return null;
};

const { reducer, actions } = createSlice({
  name: 'devices',

  initialState: {
    items: {},
    selectedId: null,
    selectTime: 0,
    loaded: false,
  },

  reducers: {
    refresh(state, action) {
      const devices = normalizeDevices(action.payload);

      const nextItems = {};

      devices.forEach((device) => {
        const key = getDeviceKey(device);

        if (key === null) {
          return;
        }

        nextItems[key] = device;
      });

      state.items = nextItems;
      state.loaded = true;

      if (
        state.selectedId != null &&
        !state.items[String(state.selectedId)]
      ) {
        state.selectedId = null;
      }
    },

    add(state, action) {
      const devices = normalizeDevices(action.payload);

      devices.forEach((device) => {
        const key = getDeviceKey(device);

        if (key === null) {
          return;
        }

        state.items[key] = {
          ...(state.items[key] || {}),
          ...device,
        };
      });

      state.loaded = true;
    },

    update(state, action) {
      const devices = normalizeDevices(action.payload);

      devices.forEach((device) => {
        const key = getDeviceKey(device);

        if (key === null) {
          return;
        }

        state.items[key] = {
          ...(state.items[key] || {}),
          ...device,
        };
      });
    },

    selectId(state, action) {
      const id = action.payload;

      state.selectedId = id != null ? id : null;
      state.selectTime = Date.now();
    },

    remove(state, action) {
      const deviceId = action.payload;

      if (deviceId == null) {
        return;
      }

      const key = String(deviceId);

      delete state.items[key];

      if (
        state.selectedId != null &&
        String(state.selectedId) === key
      ) {
        state.selectedId = null;
      }
    },

    clear(state) {
      state.items = {};
      state.selectedId = null;
      state.selectTime = 0;
      state.loaded = false;
    },
  },
});

export const devicesActions = actions;
export const devicesReducer = reducer;