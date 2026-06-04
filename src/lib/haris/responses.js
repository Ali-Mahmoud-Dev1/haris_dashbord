import { api } from "@/lib/api";
import { createResourceApi } from "@/lib/haris/helpers";

/** haris_api_contract — responses */
export const actions = createResourceApi("responses/actions");

export function approveResponseAction(id) {
  return api.post(`responses/actions/${id}/approve`, {});
}

export function rejectResponseAction(id, reason = "Needs manual review.") {
  return api.post(`responses/actions/${id}/reject`, { reason });
}

export function postponeResponseAction(id) {
  return api.post(`responses/actions/${id}/postpone`, {});
}

export function markResponseExecuted(id, execution_notes = "") {
  return api.post(`responses/actions/${id}/mark-executed`, { execution_notes });
}

export function generateResponsePreview(payload) {
  return api.post("responses/generate-preview", payload);
}

export const getResponseActions = actions.list;
