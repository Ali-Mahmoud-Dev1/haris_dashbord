import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCurrentUser, loginApi } from "@/lib/authApi";
import { getAccessToken, loadAuthSession, saveAuthSession } from "@/lib/authStorage";
import { writeSessionCookie } from "@/lib/session";

/**
 * @typedef {{ username: string, role?: string, email?: string }} AuthUser
 */

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const result = await loginApi(username, password);
      writeSessionCookie();
      return result;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Login failed");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await getCurrentUser();
      const session = loadAuthSession();
      const access = getAccessToken();
      saveAuthSession({ user, access, refresh: session?.refresh ?? null });
      writeSessionCookie();
      return { user, access, refresh: session?.refresh ?? null };
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Session invalid");
    }
  }
);

const initialState = {
  /** @type {AuthUser | null} */
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  /** 'idle' | 'loading' | 'succeeded' | 'failed' */
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      const payload = action.payload ?? {};
      const payloadUser = payload.user && typeof payload.user === "object" ? payload.user : null;
      const username =
        typeof payload.username === "string"
          ? payload.username.trim()
          : typeof payloadUser?.username === "string"
            ? payloadUser.username.trim()
            : "";
      const access = payload.access ?? payload.accessToken ?? null;
      if (!username && !access) {
        state.error = "Invalid credentials payload";
        state.status = "failed";
        return;
      }
      state.user = username
        ? { ...payloadUser, username, role: payload.role ?? payloadUser?.role ?? state.user?.role }
        : payloadUser ?? state.user;
      state.accessToken = access;
      state.refreshToken = payload.refresh ?? payload.refreshToken ?? state.refreshToken;
      state.isAuthenticated = Boolean(access || username);
      state.status = "succeeded";
      state.error = null;
    },

    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
    },

    hydrateFromStorage(state, action) {
      const payload = action.payload;
      const user = payload?.user ?? payload;
      const access = payload?.access ?? null;
      const refresh = payload?.refresh ?? null;
      if (user && typeof user.username === "string" && user.username.trim()) {
        state.user = { ...user, username: user.username.trim(), role: user.role };
      } else {
        state.user = null;
      }
      state.accessToken = access;
      state.refreshToken = refresh;
      state.isAuthenticated = Boolean(access || state.user);
      state.status = "idle";
      state.error = null;
    },

    clearAuthError(state) {
      state.error = null;
      if (state.status === "failed") state.status = "idle";
    },

    updateUser(state, action) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, access, refresh } = action.payload;
        state.user = user ?? null;
        state.accessToken = access ?? null;
        state.refreshToken = refresh ?? null;
        state.isAuthenticated = Boolean(access);
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload ?? action.error.message ?? "Login failed");
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        const { user, access, refresh } = action.payload;
        state.user = user ?? null;
        state.accessToken = access ?? null;
        state.refreshToken = refresh ?? state.refreshToken;
        state.isAuthenticated = Boolean(access);
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload ?? action.error.message ?? "Session invalid");
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setCredentials, logout, hydrateFromStorage, clearAuthError, updateUser } =
  authSlice.actions;

export default authSlice.reducer;

export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
