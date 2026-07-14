"use client";

import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CitationsProps {
  sources: string[];
}

export function Citations({ sources }: CitationsProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      {sources.map((src) => (
        <Badge
          key={src}
          variant="secondary"
          className="text-xs font-normal px-2 py-0.5 rounded-md"
        >
          {src}
        </Badge>
      ))}
    </div>
  );
}
