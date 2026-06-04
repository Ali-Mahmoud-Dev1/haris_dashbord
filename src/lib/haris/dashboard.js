import { api, buildQuery } from "@/lib/api";

/** haris_api_contract — dashboard */
const widgets = {
  summary: "dashboard/summary",
  recentAlerts: "dashboard/recent-alerts",
  recentLogs: "dashboard/recent-logs",
  attackDistribution: "dashboard/attack-distribution",
  topSuspiciousIps: "dashboard/top-suspicious-ips",
  networkMap: "dashboard/network-map",
  securityPosture: "dashboard/security-posture",
  alertsTimeseries: "dashboard/alerts-timeseries",
  severityBreakdown: "dashboard/severity-breakdown",
  vlanRisk: "dashboard/vlan-risk",
  deviceRisk: "dashboard/device-risk",
  detectionHealth: "dashboard/detection-health",
  incidentStatusBreakdown: "dashboard/incident-status-breakdown",
  responseStatusBreakdown: "dashboard/response-status-breakdown",
};

export function getDashboardWidget(key, params = {}) {
  const path = widgets[key];
  if (!path) throw new Error(`Unknown dashboard widget: ${key}`);
  return api.get(`${path}${buildQuery(params)}`);
}

export const getDashboardSummary = () => getDashboardWidget("summary");
export const getRecentAlerts = () => getDashboardWidget("recentAlerts");
export const getRecentLogs = () => getDashboardWidget("recentLogs");
export const getAttackDistribution = () => getDashboardWidget("attackDistribution");
export const getTopSuspiciousIps = () => getDashboardWidget("topSuspiciousIps");
export const getNetworkMap = () => getDashboardWidget("networkMap");
export const getSecurityPosture = () => getDashboardWidget("securityPosture");
export const getAlertsTimeseries = (params = { range: "24h" }) =>
  getDashboardWidget("alertsTimeseries", params);
export const getSeverityBreakdown = () => getDashboardWidget("severityBreakdown");
export const getVlanRisk = () => getDashboardWidget("vlanRisk");
export const getDeviceRisk = () => getDashboardWidget("deviceRisk");
export const getDetectionHealth = () => getDashboardWidget("detectionHealth");
export const getIncidentStatusBreakdown = () => getDashboardWidget("incidentStatusBreakdown");
export const getResponseStatusBreakdown = () => getDashboardWidget("responseStatusBreakdown");
