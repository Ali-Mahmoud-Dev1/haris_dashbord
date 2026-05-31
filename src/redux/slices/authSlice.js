import { createSlice } from "@reduxjs/toolkit";

/**
 * User shape mirrors what login may persist (e.g. localStorage "user").
 * Extend with `role`, `token`, etc. when backend is wired.
 * @typedef {{ username: string, role?: 'admin' | 'engineer' | 'student' }} AuthUser
 */

const initialState = {
  /** @type {AuthUser | null} */
  user: null,
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
      const username = typeof payload.username === "string" ? payload.username.trim() : "";
      if (!username) {
        state.error = "Invalid credentials payload";
        state.status = "failed";
        return;
      }
      state.user = {
        username,
        role: payload.role ?? state.user?.role,
      };
      state.isAuthenticated = true;
      state.status = "succeeded";
      state.error = null;
    },

    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
    },

    /**
     * Call from the client after reading localStorage (reducers stay pure).
     * @param {{ payload: AuthUser | null }} action
     */
    hydrateFromStorage(state, action) {
      const user = action.payload;
      if (user && typeof user.username === "string" && user.username.trim()) {
        state.user = { username: user.username.trim(), role: user.role };
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.isAuthenticated = false;
      }
      state.status = "idle";
      state.error = null;
    },

    setAuthLoading(state) {
      state.status = "loading";
      state.error = null;
    },

    setAuthError(state, action) {
      state.status = "failed";
      state.error =
        typeof action.payload === "string" ? action.payload : "Authentication failed";
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
});

export const {
  setCredentials,
  logout,
  hydrateFromStorage,
  setAuthLoading,
  setAuthError,
  clearAuthError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;

/** Expect root reducer to mount this slice as `auth`. */
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
