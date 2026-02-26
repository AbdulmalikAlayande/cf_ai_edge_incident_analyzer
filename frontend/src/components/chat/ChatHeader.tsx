import { Activity, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  sessionId: string | null;
  isSending: boolean;
  onResetSession: () => void;
}

function formatSession(sessionId: string | null): string {
  if (!sessionId) {
    return "No active session";
  }

  if (sessionId.length <= 14) {
    return sessionId;
  }

  return `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}`;
}

function ChatHeader({ sessionId, isSending, onResetSession }: ChatHeaderProps) {
  return (
    <header className="flex flex-col gap-4 px-4 pt-6 sm:px-6 md:px-8 md:pt-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Investigation Workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Distributed Systems Incident Assistant</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-background/70 text-xs text-muted-foreground">
            Session: {formatSession(sessionId)}
          </Badge>
          <Badge variant="secondary" className="bg-background/70 text-xs text-muted-foreground">
            <Activity className={`size-3 ${isSending ? "animate-pulse" : ""}`} />
            {isSending ? "Analyzing" : "Idle"}
          </Badge>
        </div>
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={onResetSession} className="self-start bg-background/70">
        <RotateCcw className="size-4" />
        New session
      </Button>
    </header>
  );
}

export default ChatHeader;
