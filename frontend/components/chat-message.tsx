"use client";

import { Message } from "@/lib/types";
import { RouteBadge } from "@/components/route-badge";
import { SqlPanel } from "@/components/sql-panel";
import { Citations } from "@/components/citations";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const isApiLimit =
    message.content.toLowerCase().includes("429") ||
    message.content.toLowerCase().includes("exhausted") ||
    message.content.toLowerCase().includes("quota") ||
    message.content.toLowerCase().includes("rate limit");

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] flex flex-col gap-2">
        {message.route && (
          <RouteBadge route={message.route} reason={message.routeReason} />
        )}

        <div
          className={cn(
            "rounded-2xl rounded-tl-sm border px-4 py-3 text-sm leading-relaxed shadow-sm",
            isApiLimit
              ? "border-destructive/30 bg-destructive/5 space-y-3"
              : "bg-card border-border",
            message.isStreaming && !message.content && "min-h-[40px] flex items-center"
          )}
        >
          {isApiLimit ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">API limit hits. contact support</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The service has reached its request limit. Please try again shortly or contact support.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="mailto:anirudholiyan@gmail.com?subject=RAG Chatbot API Limit Support"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Mail className="w-3.5 h-3.5" />
                    Email Support
                  </Button>
                </a>
                <a
                  href="tel:+917678256344"
                  className="inline-flex"
                >
                  <Button variant="default" size="sm" className="h-8 gap-1.5 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    <Phone className="w-3.5 h-3.5" />
                    Call Support
                  </Button>
                </a>
              </div>
            </div>
          ) : message.content ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : message.isStreaming ? (
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </span>
          ) : null}
        </div>

        <SqlPanel query={message.sqlQuery} results={message.sqlResults} />
        <Citations sources={message.citations ?? []} />
      </div>
    </div>
  );
}
