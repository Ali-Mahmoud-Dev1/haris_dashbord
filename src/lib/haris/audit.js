import { createResourceApi } from "@/lib/haris/helpers";

/** haris_api_contract — audit */
export const logs = createResourceApi("audit/logs");

export const getAuditLogs = logs.list;
