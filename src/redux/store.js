import { configureStore } from "@reduxjs/toolkit";
import alertsReducer from "./slices/alertsSlice";
import attacksReducer from "./slices/attacksSlice";
import authReducer from "./slices/authSlice";
import logsReducer from "./slices/logsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alerts: alertsReducer,
    attacks: attacksReducer,
    logs: logsReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

/** @typedef {ReturnType<typeof store.getState>} RootState */
/** @typedef {typeof store.dispatch} AppDispatch */
