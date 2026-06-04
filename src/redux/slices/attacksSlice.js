import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addAlertNote,
  closeAlert,
  getAlert,
  getAlertTimeline,
  markAlertFalsePositive,
  markAlertResolved,
  startAlertReview,
  suggestAlertResponse,
} from "@/lib/harisApi";

function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return fallback;
}

/** @param {Record<string, unknown>} row */
export function mapIncident(row) {
  const time = pick(row, ["created_at", "timestamp", "timeIso", "last_seen"]);
  return {
    attackType: pick(row, ["attack_type", "attackType", "type", "title"], "Alert"),
    ip: pick(row, ["source_ip", "ip", "src_ip"], "unknown"),
    timeIso: time || "",
    timeLabel: time ? new Date(time).toLocaleString() : "unknown",
    status: String(pick(row, ["status"], "open")).toLowerCase(),
    severity: String(pick(row, ["severity"], "low")).toLowerCase(),
    ruleId: pick(row, ["rule_id", "rule", "rule_name"], "n/a"),
    ruleCategory: pick(row, ["rule_category", "category"], "Detection"),
    reason: pick(row, ["reason", "description", "summary"], "No details were provided by the backend."),
    response: Array.isArray(row.recommended_response)
      ? row.recommended_response
      : Array.isArray(row.response)
        ? row.response
        : ["Review response actions on the Response page."],
    confidence: pick(row, ["confidence"], "unknown"),
    sources: Array.isArray(row.sources) ? row.sources : [pick(row, ["source", "sensor"], "backend")],
  };
}

export const fetchIncident = createAsyncThunk(
  "attacks/fetchIncident",
  async (id, { rejectWithValue }) => {
    try {
      const data = await getAlert(id);
      return { id, incident: mapIncident(data) };
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Incident could not be loaded.");
    }
  }
);

export const fetchIncidentTimeline = createAsyncThunk(
  "attacks/fetchIncidentTimeline",
  async (id, { rejectWithValue }) => {
    try {
      const data = await getAlertTimeline(id);
      const timeline = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      return { id, timeline };
    } catch {
      return { id, timeline: [] };
    }
  }
);

async function runWorkflow(id, action, { dispatch, rejectWithValue }) {
  try {
    await action();
    await dispatch(fetchIncident(id));
    await dispatch(fetchIncidentTimeline(id));
    return { id };
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Action failed.");
  }
}

export const startIncidentReview = createAsyncThunk(
  "attacks/startReview",
  (arg, helpers) => {
    const { id, body = {} } = typeof arg === "string" ? { id: arg } : arg;
    return runWorkflow(id, () => startAlertReview(id, body), helpers);
  }
);

export const markIncidentResolved = createAsyncThunk(
  "attacks/markResolved",
  (arg, helpers) => {
    const { id, body = {} } = typeof arg === "string" ? { id: arg } : arg;
    return runWorkflow(id, () => markAlertResolved(id, body), helpers);
  }
);

export const markIncidentFalsePositive = createAsyncThunk(
  "attacks/markFalsePositive",
  (arg, helpers) => {
    const { id, body = {} } = typeof arg === "string" ? { id: arg } : arg;
    return runWorkflow(id, () => markAlertFalsePositive(id, body), helpers);
  }
);

export const closeIncident = createAsyncThunk(
  "attacks/close",
  (arg, helpers) => {
    const { id, body = {} } = typeof arg === "string" ? { id: arg } : arg;
    return runWorkflow(id, () => closeAlert(id, body), helpers);
  }
);

export const suggestIncidentResponse = createAsyncThunk(
  "attacks/suggestResponse",
  (arg, helpers) => {
    const { id, body = {} } = typeof arg === "string" ? { id: arg } : arg;
    return runWorkflow(id, () => suggestAlertResponse(id, body), helpers);
  }
);

export const addIncidentNote = createAsyncThunk(
  "attacks/addNote",
  ({ id, message }, helpers) => runWorkflow(id, () => addAlertNote(id, message), helpers)
);

const initialState = {
  currentId: null,
  /** @type {ReturnType<typeof mapIncident> | null} */
  incident: null,
  /** @type {unknown[]} */
  timeline: [],
  /** 'idle' | 'loading' | 'succeeded' | 'failed' */
  status: "idle",
  timelineStatus: "idle",
  actionStatus: "idle",
  error: null,
  actionError: null,
};

const attacksSlice = createSlice({
  name: "attacks",
  initialState,
  reducers: {
    clearIncidentError(state) {
      state.error = null;
      state.actionError = null;
      if (state.status === "failed") state.status = "idle";
      if (state.actionStatus === "failed") state.actionStatus = "idle";
    },
    resetIncident(state) {
      state.currentId = null;
      state.incident = null;
      state.timeline = [];
      state.status = "idle";
      state.timelineStatus = "idle";
      state.actionStatus = "idle";
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncident.pending, (state, action) => {
        const id = action.meta.arg;
        if (state.currentId !== id) {
          state.incident = null;
          state.timeline = [];
        }
        state.currentId = id;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchIncident.fulfilled, (state, action) => {
        state.currentId = action.payload.id;
        state.incident = action.payload.incident;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchIncident.rejected, (state, action) => {
        state.status = "failed";
        state.incident = null;
        state.error = action.payload ?? action.error.message ?? "Incident could not be loaded.";
      })
      .addCase(fetchIncidentTimeline.pending, (state) => {
        state.timelineStatus = "loading";
      })
      .addCase(fetchIncidentTimeline.fulfilled, (state, action) => {
        if (state.currentId === action.payload.id) {
          state.timeline = action.payload.timeline;
        }
        state.timelineStatus = "succeeded";
      })
      .addCase(fetchIncidentTimeline.rejected, (state) => {
        state.timeline = [];
        state.timelineStatus = "succeeded";
      });

    const workflowCases = [
      startIncidentReview,
      markIncidentResolved,
      markIncidentFalsePositive,
      closeIncident,
      suggestIncidentResponse,
      addIncidentNote,
    ];

    for (const thunk of workflowCases) {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionStatus = "loading";
          state.actionError = null;
        })
        .addCase(thunk.fulfilled, (state) => {
          state.actionStatus = "succeeded";
          state.actionError = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionStatus = "failed";
          state.actionError = action.payload ?? action.error.message ?? "Action failed.";
        });
    }
  },
});

export const { clearIncidentError, resetIncident } = attacksSlice.actions;

export default attacksSlice.reducer;

export const selectAttacks = (state) => state.attacks;
export const selectCurrentIncident = (state) => state.attacks.incident;
export const selectIncidentTimeline = (state) => state.attacks.timeline;
export const selectIncidentStatus = (state) => state.attacks.status;
export const selectIncidentError = (state) => state.attacks.error;
export const selectIncidentActionStatus = (state) => state.attacks.actionStatus;
export const selectIncidentActionError = (state) => state.attacks.actionError;
export const selectIncidentActionLoading = (state) => state.attacks.actionStatus === "loading";
