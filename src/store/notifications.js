import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import fetchOrThrow from '../common/util/fetchOrThrow';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      if (params.keyword) query.set('keyword', params.keyword);
      if (params.userId) query.set('userId', params.userId);

      const response = await fetchOrThrow(`/api/notifications?${query.toString()}`);
      const data = await response.json();
      return Array.isArray(data) ? data : Object.values(data || {});
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const createNotification = createAsyncThunk(
  'notifications/createNotification',
  async (body, { rejectWithValue }) => {
    try {
      const response = await fetchOrThrow('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create notification');
    }
  }
);

export const updateNotification = createAsyncThunk(
  'notifications/updateNotification',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const response = await fetchOrThrow(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...body, id }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update notification');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id, { rejectWithValue }) => {
    try {
      await fetchOrThrow(`/api/notifications/${id}`, { 
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

const { reducer, actions } = createSlice({
  name: 'notifications',
  initialState: {
    items: {},
    loading: false,
    error: null,
    lastFetchTime: null,
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
      state.lastFetchTime = Date.now();
      state.error = null;
    },
    set(state, action) {
      state.items = {};
      const payload = Array.isArray(action.payload) ? action.payload : Object.values(action.payload || {});
      payload.forEach((item) => {
        if (item && item.id != null) {
          state.items[item.id] = item;
        }
      });
      state.lastFetchTime = Date.now();
      state.error = null;
    },
    add(state, action) {
      const item = action.payload;
      if (item && item.id != null) {
        state.items[item.id] = item;
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
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = {};
        action.payload.forEach((item) => {
          if (item && item.id != null) {
            state.items[item.id] = item;
          }
        });
        state.loading = false;
        state.error = null;
        state.lastFetchTime = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        if (action.payload?.id != null) {
          state.items[action.payload.id] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateNotification.fulfilled, (state, action) => {
        if (action.payload?.id != null) {
          state.items[action.payload.id] = action.payload;
        }
        state.loading = false;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        delete state.items[action.payload];
        state.loading = false;
      });
  },
});

export { actions as notificationsActions };
export { reducer as notificationsReducer };