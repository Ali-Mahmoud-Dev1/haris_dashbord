"use client";

import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { hydrateFromStorage } from "@/redux/slices/authSlice";
import { store } from "@/redux/store";

function AuthHydrate() {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        dispatch(hydrateFromStorage(null));
        return;
      }
      const parsed = JSON.parse(raw);
      dispatch(hydrateFromStorage(parsed));
    } catch {
      dispatch(hydrateFromStorage(null));
    }
  }, [dispatch]);

  return null;
}

export function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthHydrate />
      {children}
    </Provider>
  );
}
