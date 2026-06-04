import { api } from "@/lib/api";
import { createResourceApi } from "@/lib/haris/helpers";

/** haris_api_contract — detection */
export const rules = createResourceApi("detection/rules");

export function toggleDetectionRule(id) {
  return api.patch(`detection/rules/${id}/toggle`, {});
}

export function runDetection(payload = {}) {
  return api.post("detection/run", payload);
}

export const jobs = {
  ...createResourceApi("detection/jobs"),
  rerun: (id) => api.post(`detection/jobs/${id}/rerun`, {}),
};

export function scheduleDetectionPreview(payload = {}) {
  return api.post("detection/schedule-preview", payload);
}

export const getDetectionRules = rules.list;
export const getDetectionJobs = jobs.list;
export const getDetectionJob = jobs.get;
export const rerunDetectionJob = jobs.rerun;
