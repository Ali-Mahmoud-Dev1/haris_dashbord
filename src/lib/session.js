export const SESSION_COOKIE_NAME = "hares_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function writeSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}
