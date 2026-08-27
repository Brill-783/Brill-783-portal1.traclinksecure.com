import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'maintenances',
  initialState: {
    items: {},
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      const payload = Array.isArray(action.payload) ? action.payload : Object.values(action.payload || {});
      payload.forEach((item) => {
        if (item && item.id != null) {
          state.items[item.id] = item;
        }
      });
    },
    add(state, action) {
      if (action.payload && action.payload.id != null) {
        state.items[action.payload.id] = action.payload;
      }
    },
    update(state, action) {
      const items = Array.isArray(action.payload) ? action.payload : [action.payload];
      items.forEach((item) => {
        if (item && item.id != null) {
          state.items[item.id] = { ...state.items[item.id], ...item };
        }
      });
    },
    remove(state, action) {
      delete state.items[action.payload];
    },
  },
});

export { actions as maintenancesActions };
export { reducer as maintenancesReducer };