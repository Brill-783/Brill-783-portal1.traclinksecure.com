import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'users',
  initialState: {
    items: {},
    loaded: false,
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      action.payload.forEach((item) => (state.items[item.id] = item));
      state.loaded = true;
    },
    update(state, action) {
      action.payload.forEach((item) => (state.items[item.id] = item));
    },
    remove(state, action) {
      delete state.items[action.payload];
    },
  },
});

export { actions as usersActions };
export { reducer as usersReducer };