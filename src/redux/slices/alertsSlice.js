import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAlerts } from "@/lib/harisApi";

function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return fallback;
}

function formatDate(value) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

/** @param {Record<string, unknown>} row */
export function mapAlert(row) {
  const id = pick(row, ["id", "uuid", "alert_id"], "unknown");
  const time = pick(row, ["created_at", "timestamp", "timeIso", "last_seen"]);
  return {
    id: String(id),
    attackType: pick(row, ["attack_type", "attackType", "type", "title"], "Alert"),
    ip: pick(row, ["source_ip", "ip", "src_ip"], "unknown"),
    timeIso: time || "",
    timeLabel: formatDate(time),
    status: String(pick(row, ["status"], "open")).toLowerCase(),
  };
}

export const fetchAlerts = createAsyncThunk(
  "alerts/fetchAlerts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await getAlerts(params);
      const rows = Array.isArray(data?.results) ? data.results : [];
      return {
        items: rows.map(mapAlert),
        count: data?.count ?? rows.length,
      };
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Alerts could not be loaded.");
    }
  }
);

const initialState = {
  /** @type {ReturnType<typeof mapAlert>[]} */
  items: [],
  count: 0,
  /** 'idle' | 'loading' | 'succeeded' | 'failed' */
  status: "idle",
  error: null,
};

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    clearAlertsError(state) {
      state.error = null;
      if (state.status === "failed") state.status = "idle";
    },
    resetAlerts(state) {
      state.items = [];
      state.count = 0;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.count = action.payload.count;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Alerts could not be loaded.";
      });
  },
});

export const { clearAlertsError, resetAlerts } = alertsSlice.actions;

export default alertsSlice.reducer;

export const selectAlerts = (state) => state.alerts;
export const selectAlertItems = (state) => state.alerts.items;
export const selectAlertsCount = (state) => state.alerts.count;
export const selectAlertsStatus = (state) => state.alerts.status;
export const selectAlertsError = (state) => state.alerts.error;
export const selectAlertsLoading = (state) => state.alerts.status === "loading";
