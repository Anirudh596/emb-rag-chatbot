import { RouteType } from "@/lib/types";

export async function sendMessage(
  message: string,
  onRoute: (route: RouteType, reason: string) => void,
  onSql: (query: string) => void,
  onSqlResult: (rows: Record<string, unknown>[]) => void,
  onToken: (token: string) => void,
  onCitations: (citations: string[]) => void,
  onError: (msg: string) => void,
  onDone: () => void
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      onError("Request timed out after 90 seconds. Please try again.");
    } else {
      onError("Failed to connect to the server. Make sure the backend is running.");
    }
    onDone();
    return;
  }

  if (!res.ok || !res.body) {
    clearTimeout(timeoutId);
    if (res.status === 429) {
      onError(
        "API rate limit exceeded. Please wait a moment and try again, or contact support."
      );
    } else {
      onError(`Server error (${res.status}). Please try again.`);
    }
    onDone();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gotDone = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const dataLine = part.split("\n").find((l) => l.startsWith("data:"));

        if (!dataLine) continue;

        const raw = dataLine.slice(5).trim();
        if (!raw) continue;

        let parsed: { event: string; data: unknown };
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue;
        }

        const { event, data } = parsed;

        if (event === "route") {
          const d = data as { route: RouteType; reason: string };
          onRoute(d.route, d.reason ?? "");
        } else if (event === "sql") {
          onSql(data as string);
        } else if (event === "sql_result") {
          onSqlResult(data as Record<string, unknown>[]);
        } else if (event === "sql_error") {
          onError(data as string);
        } else if (event === "citations") {
          onCitations(data as string[]);
        } else if (event === "content") {
          onToken(data as string);
        } else if (event === "error") {
          onError(data as string);
        } else if (event === "done") {
          gotDone = true;
          onDone();
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      onError("Request timed out after 90 seconds. Please try again.");
    } else {
      onError("Connection lost. Please try again.");
    }
  } finally {
    clearTimeout(timeoutId);
    if (!gotDone) {
      onDone();
    }
  }
}
