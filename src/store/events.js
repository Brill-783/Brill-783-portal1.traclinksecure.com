import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import fetchOrThrow from '../common/util/fetchOrThrow';

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async ({ deviceId, from, to, type, alarm, page = 0, pageSize = 100 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (deviceId) params.set('deviceId', String(deviceId));
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (type) params.set('type', type);
      if (alarm) params.set('alarm', alarm);

      const response = await fetchOrThrow(`/api/reports/events?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch events');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await fetchOrThrow(`/api/events/${eventId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch event');
    }
  }
);

export const markEventAsRead = createAsyncThunk(
  'events/markEventAsRead',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await fetchOrThrow(`/api/events/${eventId}/read`, {
        method: 'PUT',
      });
      const data = await response.json();
      return { eventId, read: true, data };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark event as read');
    }
  }
);

export const markEventAsUnread = createAsyncThunk(
  'events/markEventAsUnread',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await fetchOrThrow(`/api/events/${eventId}/unread`, {
        method: 'PUT',
      });
      const data = await response.json();
      return { eventId, read: false, data };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark event as unread');
    }
  }
);

const { reducer, actions } = createSlice({
  name: 'events',
  initialState: {
    items: [],
    historicalItems: [],
    totalCount: 0,
    currentPage: 0,
    pageSize: 100,
    loading: false,
    error: null,
    readStatus: {},
    lastFetchTime: null,
  },
  reducers: {
    add(state, action) {
      const newEvents = action.payload || [];
      const payloadArray = Array.isArray(newEvents) ? newEvents : [newEvents];

      payloadArray.forEach((event) => {
        if (event && event.id) {
          const existingIndex = state.items.findIndex((item) => item.id === event.id);
          if (existingIndex >= 0) {
            state.items[existingIndex] = { ...state.items[existingIndex], ...event };
          } else {
            state.items.unshift(event);
          }
        }
      });

      state.items = state.items.slice(0, 500);
    },
    mergeHistorical(state, action) {
      const newItems = action.payload || [];
      const payloadArray = Array.isArray(newItems) ? newItems : [newItems];
      const existingIds = new Set(state.historicalItems.map((it) => it.id));

      payloadArray.forEach((event) => {
        if (event && event.id && !existingIds.has(event.id)) {
          state.historicalItems.unshift(event);
          existingIds.add(event.id);
        }
      });

      state.historicalItems = state.historicalItems.slice(0, 2000);
    },
    delete(state, action) {
      const id = action.payload;
      state.items = state.items.filter((item) => item.id !== id);
      state.historicalItems = state.historicalItems.filter((item) => item.id !== id);
    },
    deleteAll(state) {
      state.items = [];
    },
    reset(state) {
      state.items = [];
      state.historicalItems = [];
      state.totalCount = 0;
      state.currentPage = 0;
      state.pageSize = 100;
      state.loading = false;
      state.error = null;
      state.readStatus = {};
      state.lastFetchTime = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.fulfilled, (state, action) => {
        const fetched = action.payload?.items || action.payload || [];
        const fetchedArray = Array.isArray(fetched) ? fetched : [];
        const existingIds = new Set(state.historicalItems.map((it) => it.id));

        fetchedArray.forEach((event) => {
          if (event && event.id && !existingIds.has(event.id)) {
            state.historicalItems.unshift(event);
            existingIds.add(event.id);
          }
        });

        state.historicalItems = state.historicalItems.slice(0, 2000);
        state.totalCount = action.payload?.totalCount || state.totalCount;
        state.currentPage = action.meta.arg.page || 0;
        state.pageSize = action.meta.arg.pageSize || 100;
        state.loading = false;
        state.lastFetchTime = Date.now();
      })
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        const event = action.payload;
        if (event && event.id) {
          const existingIndex = state.items.findIndex((item) => item.id === event.id);
          if (existingIndex >= 0) {
            state.items[existingIndex] = { ...state.items[existingIndex], ...event };
          } else {
            state.items.unshift(event);
          }

          const histIndex = state.historicalItems.findIndex((item) => item.id === event.id);
          if (histIndex >= 0) {
            state.historicalItems[histIndex] = { ...state.historicalItems[histIndex], ...event };
          } else {
            state.historicalItems.unshift(event);
          }
        }
      })
      .addCase(markEventAsRead.fulfilled, (state, action) => {
        const { eventId, read } = action.payload;
        state.readStatus[eventId] = read;
        const existingIndex = state.items.findIndex((item) => item.id === eventId);
        if (existingIndex >= 0) {
          state.items[existingIndex] = { ...state.items[existingIndex], read };
        }
        const histIndex = state.historicalItems.findIndex((item) => item.id === eventId);
        if (histIndex >= 0) {
          state.historicalItems[histIndex] = { ...state.historicalItems[histIndex], read };
        }
      })
      .addCase(markEventAsUnread.fulfilled, (state, action) => {
        const { eventId, read } = action.payload;
        state.readStatus[eventId] = read;
        const existingIndex = state.items.findIndex((item) => item.id === eventId);
        if (existingIndex >= 0) {
          state.items[existingIndex] = { ...state.items[existingIndex], read };
        }
        const histIndex = state.historicalItems.findIndex((item) => item.id === eventId);
        if (histIndex >= 0) {
          state.historicalItems[histIndex] = { ...state.historicalItems[histIndex], read };
        }
      });
  },
});

export { actions as eventsActions };
export { reducer as eventsReducer };
