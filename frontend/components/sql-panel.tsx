"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Code2, Table } from "lucide-react";
import { cn } from "@/lib/utils";

interface SqlPanelProps {
  query?: string;
  results?: Record<string, unknown>[];
}

export function SqlPanel({ query, results }: SqlPanelProps) {
  const [open, setOpen] = useState(true);

  if (!query) return null;

  const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden text-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-muted hover:bg-muted/80 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <Code2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="font-medium text-xs text-muted-foreground">SQL Query</span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[600px]" : "max-h-0"
        )}
      >
        <pre className="px-3 py-2.5 text-xs font-mono bg-zinc-950 text-emerald-400 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
          {query}
        </pre>

        {results && results.length > 0 && (
          <div className="border-t border-border">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-muted">
              <Table className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">
                {results.length} row{results.length !== 1 ? "s" : ""} returned
              </span>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 20).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-3 py-1.5 text-foreground/80 whitespace-nowrap"
                        >
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
