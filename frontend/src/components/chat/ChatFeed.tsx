import { useEffect, useRef, type ComponentType } from "react";
import { ClipboardPaste, FileChartColumnIncreasing, Upload } from "lucide-react";
import MessageCard from "@/components/chat/MessageCard";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatMessage } from "@/hooks/useChat";
import type { ChatMode } from "@/lib/api";

export interface QuickActionPayload {
  mode: ChatMode;
  text: string;
}

interface ChatFeedProps {
  messages: ChatMessage[];
  onQuickAction: (payload: QuickActionPayload) => void;
}

const QUICK_ACTIONS: Array<{
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  payload: QuickActionPayload;
}> = [
  {
    title: "Paste logs",
    description: "Paste service and infrastructure logs for immediate pattern detection.",
    icon: ClipboardPaste,
    payload: {
      mode: "logs",
      text: "Paste recent logs here and identify the likely failure pattern.",
    },
  },
  {
    title: "Describe incident",
    description: "Summarize customer impact, affected regions, and recent deployment context.",
    icon: FileChartColumnIncreasing,
    payload: {
      mode: "describe",
      text: "Describe the incident timeline, impacted services, and what changed recently.",
    },
  },
  {
    title: "Upload log file",
    description: "Attach a .txt, .log, or .json file and provide investigation context.",
    icon: Upload,
    payload: {
      mode: "logs",
      text: "I attached logs. Use them to identify probable causes and next checks.",
    },
  },
];

function ChatFeed({ messages, onQuickAction }: ChatFeedProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <section className="flex min-h-0 flex-1 flex-col justify-center px-4 py-6 md:px-8" aria-live="polite">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="space-y-3 text-center md:text-left">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Distributed Systems Investigation
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Investigate incidents with structured, iterative analysis.
            </h1>
            <p className="text-pretty text-sm text-muted-foreground md:max-w-3xl">
              Provide logs, describe observed impact, and refine hypotheses over multiple turns with
              consistent session context.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => onQuickAction(action.payload)}
                  className="text-left"
                >
                  <Card className="h-full gap-2 border-border/80 bg-card/75 py-4 shadow-none transition hover:border-ring/50 hover:bg-card/95">
                    <CardContent className="space-y-3 px-4 py-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Icon className="size-4" />
                        <span>{action.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:px-8" aria-live="polite">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pt-6">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </section>
  );
}

export default ChatFeed;

