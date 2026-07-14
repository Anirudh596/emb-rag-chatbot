"use client";

import { useCallback, useRef, useState } from "react";
import { Chat } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";

export default function Home() {
  const resetTriggerRef = useRef<(() => void) | null>(null);
  const [hasMessages, setHasMessages] = useState(false);

  const handleResetRequest = useCallback((trigger: () => void) => {
    resetTriggerRef.current = trigger;
  }, []);

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">EMB Assistant</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Dual-mode · RAG + SQL
          </span>
          {hasMessages && (
            <Button
              id="new-conversation-btn"
              variant="ghost"
              size="sm"
              onClick={() => resetTriggerRef.current?.()}
              className="flex items-center gap-1.5 text-xs h-8 px-3"
            >
              <SquarePen className="w-3.5 h-3.5" />
              New chat
            </Button>
          )}
        </div>
      </header>

      <Chat
        onHasMessages={setHasMessages}
        onResetRequest={handleResetRequest}
      />
    </main>
  );
}
