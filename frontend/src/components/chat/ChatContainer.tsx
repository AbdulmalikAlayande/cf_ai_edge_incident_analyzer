import { useCallback, useState } from "react";
import { Activity, FileText, Home, Settings } from "lucide-react";
import ChatFeed, { type QuickActionPayload } from "@/components/chat/ChatFeed";
import ChatHeader from "@/components/chat/ChatHeader";
import Composer, { type ComposerPreset } from "@/components/chat/Composer";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChat } from "@/hooks/useChat";

const RAIL_ITEMS = [
  {
    label: "Home",
    icon: Home,
  },
  {
    label: "Activity",
    icon: Activity,
  },
  {
    label: "Files",
    icon: FileText,
  },
  {
    label: "Settings",
    icon: Settings,
  },
] as const;

function ChatContainer() {
  const { sessionId, messages, isSending, sendMessage, resetSession } = useChat();
  const [composerPreset, setComposerPreset] = useState<ComposerPreset | undefined>(undefined);

  const handleQuickAction = useCallback((payload: QuickActionPayload) => {
    setComposerPreset({
      token: Date.now(),
      mode: payload.mode,
      text: payload.text,
    });
  }, []);

  const handleResetSession = useCallback(() => {
    resetSession();
    setComposerPreset(undefined);
  }, [resetSession]);

  return (
    <TooltipProvider>
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] gap-4 p-4 md:p-6">
          <aside className="flex w-14 shrink-0 flex-col items-center justify-between rounded-2xl border border-border/80 bg-card/75 py-4 backdrop-blur-xl">
            <div className="space-y-2">
              {RAIL_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" aria-label={item.label}>
                        <Icon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Configuration">
                  <Settings className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Configuration
              </TooltipContent>
            </Tooltip>
          </aside>

          <main className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/80 bg-card/45 backdrop-blur-xl">
            <ChatHeader sessionId={sessionId} isSending={isSending} onResetSession={handleResetSession} />
            <ChatFeed messages={messages} onQuickAction={handleQuickAction} />
            <Composer isSending={isSending} onSend={sendMessage} preset={composerPreset} />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ChatContainer;
