import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  bulkCreateActivityLogs,
  clearLogs,
  createActivityLog,
  getActivityLogs,
  ingestSyslog,
  uploadCsvLogs,
  uploadJsonLogs,
} from "@/lib/harisApi";

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
export function mapLog(row) {
  const time = pick(row, ["timestamp", "created_at", "timeIso"]);
  return {
    id: String(pick(row, ["id", "uuid"], "log")),
    timeIso: time || "",
    timeLabel: formatDate(time),
    facility: pick(row, ["facility", "event_type", "source"], "activity"),
    severity: String(pick(row, ["severity", "level"], "info")).toLowerCase(),
    host: pick(row, ["host", "source_ip", "src_ip"], "unknown"),
    message: pick(row, ["raw_message", "message", "event_type", "action"], "Activity log"),
  };
}

export const fetchLogs = createAsyncThunk(
  "logs/fetchLogs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await getActivityLogs(params);
      const rows = Array.isArray(data?.results) ? data.results : [];
      return {
        items: rows.map(mapLog),
        count: data?.count ?? rows.length,
      };
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Logs could not be loaded.");
    }
  }
);

async function runIngestAndRefresh(action, { dispatch, rejectWithValue }) {
  try {
    await action();
    await dispatch(fetchLogs());
    return { message: "Ingest completed. Refreshing stream…" };
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Ingest failed.");
  }
}

export const clearActivityLogs = createAsyncThunk(
  "logs/clearActivityLogs",
  async (_, { rejectWithValue }) => {
    try {
      await clearLogs();
      return { message: "All activity logs cleared." };
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Logs could not be cleared.");
    }
  }
);

export const ingestCsvLog = createAsyncThunk(
  "logs/ingestCsv",
  (file, helpers) => runIngestAndRefresh(() => uploadCsvLogs(file), helpers)
);

export const ingestJsonLogs = createAsyncThunk(
  "logs/ingestJson",
  (parsed, helpers) =>
    runIngestAndRefresh(() => {
      if (Array.isArray(parsed)) return uploadJsonLogs({ logs: parsed });
      if (Array.isArray(parsed?.logs)) return uploadJsonLogs(parsed);
      return bulkCreateActivityLogs(parsed);
    }, helpers)
);

export const createLogEntry = createAsyncThunk(
  "logs/createEntry",
  (body, helpers) => runIngestAndRefresh(() => createActivityLog(body), helpers)
);

export const ingestSyslogMessage = createAsyncThunk(
  "logs/ingestSyslog",
  (payload, helpers) => runIngestAndRefresh(() => ingestSyslog(payload), helpers)
);

const initialState = {
  /** @type {ReturnType<typeof mapLog>[]} */
  items: [],
  count: 0,
  /** 'idle' | 'loading' | 'succeeded' | 'failed' */
  status: "idle",
  ingestStatus: "idle",
  error: null,
  ingestError: null,
  successMessage: null,
};

const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    clearLogsMessages(state) {
      state.error = null;
      state.ingestError = null;
      state.successMessage = null;
      if (state.status === "failed") state.status = "idle";
      if (state.ingestStatus === "failed") state.ingestStatus = "idle";
    },
    resetLogs(state) {
      state.items = [];
      state.count = 0;
      state.status = "idle";
      state.ingestStatus = "idle";
      state.error = null;
      state.ingestError = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.count = action.payload.count;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Logs could not be loaded.";
      })
      .addCase(clearActivityLogs.pending, (state) => {
        state.ingestStatus = "loading";
        state.ingestError = null;
        state.successMessage = null;
      })
      .addCase(clearActivityLogs.fulfilled, (state, action) => {
        state.items = [];
        state.count = 0;
        state.ingestStatus = "succeeded";
        state.successMessage = action.payload.message;
      })
      .addCase(clearActivityLogs.rejected, (state, action) => {
        state.ingestStatus = "failed";
        state.ingestError = action.payload ?? action.error.message ?? "Logs could not be cleared.";
      });

    const ingestThunks = [ingestCsvLog, ingestJsonLogs, createLogEntry, ingestSyslogMessage];

    for (const thunk of ingestThunks) {
      builder
        .addCase(thunk.pending, (state) => {
          state.ingestStatus = "loading";
          state.ingestError = null;
          state.successMessage = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.ingestStatus = "succeeded";
          state.successMessage = action.payload.message;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.ingestStatus = "failed";
          state.ingestError = action.payload ?? action.error.message ?? "Ingest failed.";
        });
    }
  },
});

export const { clearLogsMessages, resetLogs } = logsSlice.actions;

export default logsSlice.reducer;

export const selectLogs = (state) => state.logs;
export const selectLogItems = (state) => state.logs.items;
export const selectLogsCount = (state) => state.logs.count;
export const selectLogsStatus = (state) => state.logs.status;
export const selectLogsError = (state) => state.logs.error;
export const selectLogsIngestStatus = (state) => state.logs.ingestStatus;
export const selectLogsIngestError = (state) => state.logs.ingestError;
export const selectLogsSuccessMessage = (state) => state.logs.successMessage;
export const selectLogsIngesting = (state) => state.logs.ingestStatus === "loading";
