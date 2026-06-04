import { api } from "@/lib/api";
import { createResourceApi, getPaginated } from "@/lib/haris/helpers";

/** haris_api_contract — logs */
export const activity = createResourceApi("logs/activity");

export function bulkCreateActivityLogs(body) {
  return api.post("logs/bulk", body);
}

export function uploadJsonLogs(body) {
  return api.post("logs/upload/json", body);
}

export function uploadCsvLogs(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("logs/upload/csv", formData);
}

export function ingestSyslog(payload) {
  return api.post("logs/syslog", payload);
}

export function ingestBulkSyslog(payload) {
  return api.post("logs/syslog/bulk", payload);
}

export function clearLogs() {
  return api.delete("logs/clear");
}

/** @deprecated use activity.list */
export const getActivityLogs = activity.list;

/** @deprecated use activity.create */
export const createActivityLog = activity.create;
