"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, loadAuthSession } from "@/lib/authStorage";
import { useAppDispatch } from "@/redux/hooks";
import { fetchCurrentUser, hydrateFromStorage, logout } from "@/redux/slices/authSlice";

export default function AuthGuard({ children }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const session = loadAuthSession();
      const access = getAccessToken();

      if (!access) {
        dispatch(hydrateFromStorage(null));
        dispatch(logout());
        router.replace(`/login?from=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }

      if (session) dispatch(hydrateFromStorage(session));

      const result = await dispatch(fetchCurrentUser());
      if (cancelled) return;

      if (fetchCurrentUser.fulfilled.match(result)) {
        setChecking(false);
        return;
      }

      dispatch(logout());
      router.replace(`/login?from=${encodeURIComponent(pathname || "/dashboard")}`);
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [dispatch, pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Loading session...
      </div>
    );
  }

  return children;
}
