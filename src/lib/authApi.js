import { api, logoutLocal } from "@/lib/api";
import { getRefreshToken, saveAuthSession } from "@/lib/authStorage";

export async function getCurrentUser() {
  return api.get("auth/me");
}

export async function login(username, password) {
  const tokens = await api.post("auth/login/", { username, password });
  if (!tokens?.access) {
    throw new Error("Invalid login response: missing access token.");
  }

  saveAuthSession({ access: tokens.access, refresh: tokens.refresh ?? null });
  const user = await getCurrentUser();
  saveAuthSession({ user, access: tokens.access, refresh: tokens.refresh ?? null });

  return {
    user,
    access: tokens.access,
    refresh: tokens.refresh ?? null,
  };
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const data = await api.post("auth/refresh", { refresh });
  if (data?.access) saveAuthSession({ access: data.access, refresh });
  return data?.access ?? null;
}

export function logout(options) {
  logoutLocal(options);
}

export const loginApi = login;
