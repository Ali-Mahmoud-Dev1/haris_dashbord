import { api, downloadFile } from "@/lib/api";

/** haris_api_contract — reports */
export function downloadAlertsCsv(params = {}) {
  return downloadFile("reports/alerts.csv", "haris-alerts.csv", params);
}

export function downloadLogsCsv(params = {}) {
  return downloadFile("reports/logs.csv", "haris-logs.csv", params);
}

export function getIncidentsSummaryReport() {
  return api.get("reports/incidents-summary.json");
}

export function getSecurityReport() {
  return api.get("reports/security-report");
}
