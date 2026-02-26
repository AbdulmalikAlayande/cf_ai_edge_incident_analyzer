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
          "max-w-[92%] rounded-2xl border p-4 md:max-w-[82%]",
          isUser
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border/80 bg-card/85 text-card-foreground backdrop-blur-sm",
          message.status === "error" && "border-destructive/40"
        )}
      >
        <header className="mb-3 flex items-center gap-2 text-xs tracking-wide uppercase">
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
          <div className="flex items-start gap-2 text-sm text-destructive">
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
