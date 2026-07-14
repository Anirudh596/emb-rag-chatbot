"use client";

import { Badge } from "@/components/ui/badge";
import { RouteType } from "@/lib/types";
import { Database, FileText, GitMerge, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RouteBadgeProps {
  route: RouteType;
  reason?: string;
}

const config: Record<
  RouteType,
  { label: string; icon: React.ReactNode; className: string }
> = {
  sql: {
    label: "SQL Query",
    icon: <Database className="w-3 h-3" />,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  rag: {
    label: "Document Search",
    icon: <FileText className="w-3 h-3" />,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  both: {
    label: "SQL + Docs",
    icon: <GitMerge className="w-3 h-3" />,
    className: "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400",
  },
  none: {
    label: "No Tool",
    icon: <HelpCircle className="w-3 h-3" />,
    className: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-400",
  },
};

export function RouteBadge({ route, reason }: RouteBadgeProps) {
  const { label, icon, className } = config[route];

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant="outline"
        className={cn("flex items-center gap-1.5 w-fit text-xs font-medium px-2 py-0.5", className)}
      >
        {icon}
        {label}
      </Badge>
      {reason && (
        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-prose">
          {reason}
        </p>
      )}
    </div>
  );
}
