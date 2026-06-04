import { api } from "@/lib/api";

/** haris_api_contract — simulator */
export const SIMULATOR_SCENARIOS = [
  "ssh-bruteforce",
  "port-scan",
  "icmp-flood",
  "vlan-violation",
  "arp-spoofing",
  "mixed",
];

export function generateSimulatorLogs(scenario, payload = {}) {
  return api.post(`simulator/generate/${scenario}`, payload);
}
