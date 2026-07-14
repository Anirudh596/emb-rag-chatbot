"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatMessage } from "@/components/chat-message";
import { sendMessage } from "@/lib/chat";
import { Message, RouteType } from "@/lib/types";
import { ArrowUp, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "emb-chat-history";

const EXAMPLES = [
  "What is the refund window for returns?",
  "How many orders are still pending?",
  "Our policy allows 30-day returns. Did order ORD-1207 qualify?",
  "What was the total revenue last month?",
];

interface ChatProps {
  onHasMessages?: (has: boolean) => void;
  onResetRequest?: (trigger: () => void) => void;
}

export function Chat({ onHasMessages, onResetRequest }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        setMessages(parsed.filter((m) => !m.isStreaming));
      }
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    try {
      const stable = messages.filter((m) => !m.isStreaming);
      if (stable.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stable));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      void 0;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    onHasMessages?.(hasMessages);
  }, [hasMessages, onHasMessages]);

  useEffect(() => {
    if (onResetRequest) {
      onResetRequest(() => setShowResetDialog(true));
    }
  }, [onResetRequest]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (loading) {
      setElapsedSecs(0);
      timerRef.current = setInterval(() => {
        setElapsedSecs((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const doReset = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setShowResetDialog(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      void 0;
    }
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const requestReset = () => {
    if (!hasMessages) return;
    setShowResetDialog(true);
  };

  const submit = useCallback(
    async (text?: string) => {
      const query = (text ?? input).trim();
      if (!query || loading) return;

      setInput("");
      setLoading(true);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
      };

      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      await sendMessage(
        query,
        (route: RouteType, reason: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, route, routeReason: reason } : m
            )
          );
        },
        (sqlQuery: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sqlQuery } : m
            )
          );
        },
        (sqlResults: Record<string, unknown>[]) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sqlResults } : m
            )
          );
        },
        (token: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },
        (citations: string[]) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, citations } : m
            )
          );
        },
        (error: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: error, isStreaming: false }
                : m
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            )
          );
          setLoading(false);
        }
      );

      setLoading(false);
    },
    [input, loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a new conversation?</DialogTitle>
            <DialogDescription>
              This chatbot does not persist history between sessions. Your
              current conversation will be cleared once you start over.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Keep chatting
            </Button>
            <Button variant="destructive" onClick={doReset}>
              Start new
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col flex-1 min-h-0">
        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Company Knowledge Assistant
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask about policies, orders, and company data. Each question is
                routed to the right source automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => submit(ex)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors leading-snug"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="mx-auto max-w-2xl py-6 flex flex-col gap-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {loading && (
          <div className="flex justify-center py-1.5">
            <span className="text-xs text-muted-foreground animate-pulse">
              AI is processing… {elapsedSecs}s
            </span>
          </div>
        )}

        <div className="border-t border-border bg-background/95 backdrop-blur px-4 py-3">
          <div className="mx-auto max-w-2xl flex flex-col gap-2">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition-shadow">
              <Textarea
                ref={textareaRef}
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about policies, orders, or anything else…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm min-h-[24px] max-h-40"
              />
              <Button
                id="send-btn"
                size="icon"
                onClick={() => submit()}
                disabled={!input.trim() || loading}
                className={cn(
                  "h-8 w-8 rounded-lg shrink-0 transition-all",
                  input.trim() && !loading
                    ? "opacity-100"
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>

            {hasMessages && (
              <div className="flex justify-center">
                <button
                  onClick={requestReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SquarePen className="w-3 h-3" />
                  New conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
