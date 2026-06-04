import { createResourceApi } from "@/lib/haris/helpers";

/** haris_api_contract — inventory */
export const networks = createResourceApi("inventory/networks");
export const vlans = createResourceApi("inventory/vlans");
export const devices = createResourceApi("inventory/devices");
