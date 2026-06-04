import { api } from "@/lib/api";

/** haris_api_contract — health */
export function getHealth() {
  return api.get("health");
}
