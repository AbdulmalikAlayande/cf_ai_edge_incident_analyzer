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
    description: "Drop in service and infrastructure logs for immediate pattern detection.",
    icon: ClipboardPaste,
    payload: {
      mode: "logs",
      text: "Paste recent logs here and identify the likely failure pattern.",
    },
  },
  {
    title: "Describe incident",
    description: "Summarize user impact, affected region, and what changed before failure.",
    icon: FileChartColumnIncreasing,
    payload: {
      mode: "describe",
      text: "Describe the incident timeline, impacted services, and what changed recently.",
    },
  },
  {
    title: "Upload log file",
    description: "Attach .txt, .log, or .json logs and investigate with session context.",
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
      <section className="flex min-h-0 flex-1 flex-col justify-center px-4 py-6 sm:px-6 md:px-8" aria-live="polite">
        <div className="mx-auto w-full max-w-5xl space-y-7">
          <div className="space-y-3 text-center sm:text-left">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">Incident Analysis</p>
            <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Provide evidence, iterate hypotheses, and isolate root cause faster.
            </h2>
            <p className="text-pretty text-sm text-muted-foreground sm:max-w-3xl sm:text-base">
              Start with logs or a symptom summary. Continue the same session to refine hypotheses
              across services, regions, retries, and dependencies.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => onQuickAction(action.payload)}
                  className="text-left"
                >
                  <Card className="h-full gap-3 border-0 bg-card/78 py-4 shadow-lg shadow-background/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/95">
                    <CardContent className="space-y-3 px-4 py-0">
                      <div className="inline-flex items-center gap-2 rounded-full bg-background/75 px-2.5 py-1 text-xs font-medium text-foreground">
                        <Icon className="size-3.5" />
                        {action.title}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{action.description}</p>
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
    <section className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6 md:px-8" aria-live="polite">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pt-5 sm:pt-7">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </section>
  );
}

export default ChatFeed;
