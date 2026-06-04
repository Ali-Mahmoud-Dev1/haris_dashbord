import { api } from "@/lib/api";
import { createResourceApi } from "@/lib/haris/helpers";

/** haris_api_contract — arp */
export const samples = createResourceApi("arp/samples");

export function analyzeArp(payload = {}) {
  return api.post("arp/analyze", payload);
}

export const getArpSamples = samples.list;
export const createArpSample = samples.create;
