import { api } from "@/lib/api";
import { createResourceApi } from "@/lib/haris/helpers";

/** haris_api_contract — incidents */
export const alerts = createResourceApi("incidents/alerts");

export function setAlertStatus(id, body) {
  return api.patch(`incidents/alerts/${id}/status`, body);
}

export function getAlertTimeline(id) {
  return api.get(`incidents/alerts/${id}/timeline`);
}

export function startAlertReview(id, body = {}) {
  return api.post(`incidents/alerts/${id}/start-review`, body);
}

export function suggestAlertResponse(id, body = {}) {
  return api.post(`incidents/alerts/${id}/suggest-response`, body);
}

export function markAlertResolved(id, body = {}) {
  return api.post(`incidents/alerts/${id}/mark-resolved`, body);
}

export function markAlertFalsePositive(id, body = {}) {
  return api.post(`incidents/alerts/${id}/mark-false-positive`, body);
}

export function closeAlert(id, body = {}) {
  return api.post(`incidents/alerts/${id}/close`, body);
}

export function addAlertNote(id, message) {
  return api.post(`incidents/alerts/${id}/add-note`, { message });
}

export const getAlerts = alerts.list;
export const getAlert = alerts.get;
