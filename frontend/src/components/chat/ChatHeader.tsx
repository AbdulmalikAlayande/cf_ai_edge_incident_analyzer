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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4 md:px-8">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Incident Investigation Assistant</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border/80 bg-background/70 text-xs text-muted-foreground">
            Session: {formatSession(sessionId)}
          </Badge>
          <Badge
            variant="outline"
            className="border-border/80 bg-background/70 text-xs text-muted-foreground"
          >
            <Activity className={`size-3 ${isSending ? "animate-pulse" : ""}`} />
            {isSending ? "Analyzing" : "Idle"}
          </Badge>
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onResetSession}>
        <RotateCcw className="size-4" />
        New session
      </Button>
    </header>
  );
}

export default ChatHeader;
