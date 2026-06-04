import { api, buildQuery, normalizeListResponse } from "@/lib/api";

export async function getPaginated(path, params = {}) {
  const data = await api.get(`${path}${buildQuery(params)}`);
  return normalizeListResponse(data);
}

export function createResourceApi(basePath) {
  const base = basePath.replace(/^\/+|\/+$/g, "");
  return {
    list: (params = {}) => getPaginated(base, params),
    create: (body) => api.post(base, body),
    get: (id) => api.get(`${base}/${id}`),
    update: (id, body) => api.put(`${base}/${id}`, body),
    patch: (id, body) => api.patch(`${base}/${id}`, body),
    remove: (id) => api.delete(`${base}/${id}`),
  };
}
