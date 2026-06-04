import axios from "axios";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  saveAuthSession,
} from "@/lib/authStorage";
import { clearSessionCookie } from "@/lib/session";

const DEFAULT_API_BASE_URL =
  "http://t12zliy5o7f2azy6tyt1zz3e.76.13.155.172.sslip.io/api";

const DIRECT_API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  ""
).replace(/\/+$/, "");

const SERVER_API_BASE = (
  process.env.API_BASE_URL ||
  DIRECT_API_BASE ||
  DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

/** Browser uses same-origin `/api/*` (Next.js proxy) unless NEXT_PUBLIC_API_BASE_URL is set. */
export const API_BASE_URL =
  typeof window === "undefined" ? SERVER_API_BASE : DIRECT_API_BASE;

function stripSlashes(value = "") {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function baseIncludesApiSuffix(base = "") {
  return /\/api$/i.test(String(base).replace(/\/+$/, ""));
}

function stripApiPrefix(path = "") {
  const clean = stripSlashes(path);
  return clean.startsWith("api/") ? clean.slice(4) : clean;
}

function resolveRequestPath(path = "", base = "") {
  const [rawPath, query = ""] = String(path).split("?");
  let clean = stripSlashes(rawPath);

  if (!base || !baseIncludesApiSuffix(base)) {
    if (!clean.startsWith("api/")) clean = `api/${clean}`;
  } else {
    clean = stripApiPrefix(clean);
  }

  const directBackend = Boolean(base && baseIncludesApiSuffix(base));
  const isFile = /\.[a-z0-9]+$/i.test(clean);
  const normalized =
    directBackend && !isFile && !clean.endsWith("/") ? `${clean}/` : clean;

  return query ? `${normalized}?${query}` : normalized;
}

export function getApiUrl(path = "") {
  const cleanPath = String(path).replace(/^\/+/, "");
  if (!API_BASE_URL) {
    const resolved = resolveRequestPath(cleanPath, "");
    return resolved.startsWith("/") ? resolved : `/${resolved}`;
  }
  const [segment, query = ""] = resolveRequestPath(cleanPath, API_BASE_URL).split("?");
  const url = `${API_BASE_URL}/${segment}`;
  return query ? `${url}?${query}` : url;
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") query.append(key, item);
      });
      return;
    }
    query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  if (data && Array.isArray(data.results)) {
    return {
      count: Number(data.count ?? data.results.length),
      next: data.next ?? null,
      previous: data.previous ?? null,
      results: data.results,
    };
  }
  return { count: 0, next: null, previous: null, results: [] };
}

function normalizePath(path) {
  const base =
    API_BASE_URL || (typeof window !== "undefined" ? "" : SERVER_API_BASE);
  return resolveRequestPath(path, base);
}

function isFormData(data) {
  return typeof FormData !== "undefined" && data instanceof FormData;
}

function parseErrorMessage(error) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Request failed";
  }

  if (!error.response) {
    return "Cannot reach the API server. Ensure the backend is running and API_BASE_URL in .env.local is correct.";
  }

  const status = error.response?.status;
  const data = error.response?.data;
  const fallbackByStatus = {
    400: "Request validation failed.",
    401: "Your session has expired. Please sign in again.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    500: "Server error. Please try again later.",
  };

  if (typeof data === "string" && data.trim()) return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data && typeof data === "object") {
    const validation = Object.entries(data)
      .map(([key, value]) => {
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        return `${key}: ${text}`;
      })
      .join(" ");
    if (validation) return validation;
  }
  return fallbackByStatus[status] || error.message || "Request failed";
}

export class ApiError extends Error {
  constructor(error) {
    super(parseErrorMessage(error));
    this.name = "ApiError";
    this.status = axios.isAxiosError(error) ? error.response?.status : undefined;
    this.data = axios.isAxiosError(error) ? error.response?.data : undefined;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/` : "/",
  maxRedirects: 0,
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const { data } = await axios.post(getApiUrl("auth/refresh/"), { refresh }, { maxRedirects: 0 });
  if (!data?.access) return null;
  saveAuthSession({ access: data.access, refresh });
  return data.access;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const current = `${window.location.pathname}${window.location.search}`;
  const query = current && current !== "/login" ? `?from=${encodeURIComponent(current)}` : "";
  window.location.href = `/login${query}`;
}

export function logoutLocal({ redirect = true } = {}) {
  clearAuthSession();
  clearSessionCookie();
  if (redirect) redirectToLogin();
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isFormData(config.data)) {
    delete config.headers?.["Content-Type"];
  } else {
    config.headers = config.headers || {};
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";
    const isRefreshRequest = url.includes("auth/refresh");
    const isLoginRequest = url.includes("auth/login");

    if (status === 401 && original && !original._retry && !isRefreshRequest && !isLoginRequest) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const access = await refreshPromise;
        refreshPromise = null;
        if (access) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${access}`;
          return apiClient(original);
        }
      } catch {
        refreshPromise = null;
      }
      logoutLocal({ redirect: true });
    }

    return Promise.reject(new ApiError(error));
  }
);

export async function apiRequest(path, config = {}) {
  const response = await apiClient.request({
    url: normalizePath(path),
    ...config,
  });
  return response.data;
}

export const api = {
  get: (path, config) => apiRequest(path, { ...config, method: "GET" }),
  post: (path, data, config) => apiRequest(path, { ...config, method: "POST", data }),
  put: (path, data, config) => apiRequest(path, { ...config, method: "PUT", data }),
  patch: (path, data, config) => apiRequest(path, { ...config, method: "PATCH", data }),
  delete: (path, config) => apiRequest(path, { ...config, method: "DELETE" }),
};

export async function downloadFile(path, filename, params = {}) {
  const query = buildQuery(params);
  const response = await apiClient.get(`${normalizePath(path)}${query}`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
