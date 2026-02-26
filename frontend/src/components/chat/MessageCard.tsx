import { AlertTriangle, Bot, Clock3, UserRound } from "lucide-react";
import AssistantSections from "@/components/chat/AssistantSections";
import type { ChatMessage } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface MessageCardProps {
  message: ChatMessage;
}

function MessageCard({ message }: MessageCardProps) {
  const isUser = message.role === "user";

  return (
    <article className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[96%] rounded-2xl p-4 shadow-lg shadow-background/20 sm:max-w-[88%] md:max-w-[82%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card/88 text-card-foreground backdrop-blur-sm",
          message.status === "error" && "bg-destructive/10 text-destructive"
        )}
      >
        <header className="mb-3 flex items-center gap-2 text-[11px] tracking-wide uppercase opacity-80">
          {isUser ? <UserRound className="size-3.5" /> : <Bot className="size-3.5" />}
          <span>{isUser ? "Analyst" : "Assistant"}</span>
        </header>

        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        ) : message.status === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 animate-spin" />
            <span>{message.content}</span>
          </div>
        ) : message.status === "error" ? (
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4" />
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        ) : (
          <AssistantSections content={message.content} />
        )}
      </div>
    </article>
  );
}

export default MessageCard;
