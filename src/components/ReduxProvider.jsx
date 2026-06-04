"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { loadAuthSession } from "@/lib/authStorage";
import { writeSessionCookie } from "@/lib/session";
import { hydrateFromStorage } from "@/redux/slices/authSlice";
import { store } from "@/redux/store";

function AuthHydrate() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const session = loadAuthSession();
    if (!session) {
      dispatch(hydrateFromStorage(null));
      return;
    }
    dispatch(hydrateFromStorage(session));
    if (session.access) writeSessionCookie();
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
