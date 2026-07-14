export type RouteType = "sql" | "rag" | "both" | "none";

export type SSEEvent =
  | { event: "route"; data: { route: RouteType; reason: string } }
  | { event: "sql"; data: string }
  | { event: "sql_result"; data: Record<string, unknown>[] }
  | { event: "sql_error"; data: string }
  | { event: "citations"; data: string[] }
  | { event: "content"; data: string }
  | { event: "error"; data: string }
  | { event: "done"; data: Record<string, never> };

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  route?: RouteType;
  routeReason?: string;
  sqlQuery?: string;
  sqlResults?: Record<string, unknown>[];
  citations?: string[];
  isStreaming?: boolean;
}
