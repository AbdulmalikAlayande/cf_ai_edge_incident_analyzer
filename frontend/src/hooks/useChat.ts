import { useCallback, useState } from "react";
import { sendChat, type ChatMode } from "@/lib/api";

export type MessageRole = "user" | "assistant";
export type MessageStatus = "sent" | "loading" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
}

export interface SendMessageInput {
  mode: ChatMode;
  message: string;
  file?: File | null;
}

interface UseChatResult {
  sessionId: string | null;
  messages: ChatMessage[];
  isSending: boolean;
  sendMessage: (input: SendMessageInput) => Promise<void>;
  resetSession: () => void;
}

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getUserDisplayMessage(input: SendMessageInput): string {
  const trimmed = input.message.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }

  if (input.file) {
    return `Attached file: ${input.file.name}`;
  }

  return "";
}

export function useChat(): UseChatResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(
    async (input: SendMessageInput) => {
      const userContent = getUserDisplayMessage(input);
      if (userContent.length === 0) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createMessageId("user"),
        role: "user",
        content: userContent,
        createdAt: Date.now(),
        status: "sent",
      };

      const assistantPlaceholderId = createMessageId("assistant");
      const assistantPlaceholder: ChatMessage = {
        id: assistantPlaceholderId,
        role: "assistant",
        content: "Analyzing incident context...",
        createdAt: Date.now(),
        status: "loading",
      };

      setMessages((current) => [...current, userMessage, assistantPlaceholder]);
      setIsSending(true);

      try {
        const result = await sendChat({
          sessionId: sessionId ?? undefined,
          message: input.message,
          mode: input.mode,
          file: input.file,
        });

        setSessionId(result.sessionId);

        setMessages((current) =>
          current.map((item) =>
            item.id === assistantPlaceholderId
              ? {
                  ...item,
                  content: result.response,
                  status: "sent",
                }
              : item
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to process this request.";

        setMessages((current) =>
          current.map((item) =>
            item.id === assistantPlaceholderId
              ? {
                  ...item,
                  content: `Request failed: ${message}`,
                  status: "error",
                }
              : item
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [sessionId]
  );

  const resetSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
  }, []);

  return {
    sessionId,
    messages,
    isSending,
    sendMessage,
    resetSession,
  };
}
