export type ChatMode = "logs" | "describe";

export interface SendChatPayload {
  sessionId?: string;
  message: string;
  mode: ChatMode;
  file?: File | null;
}

export interface ChatApiResponse {
  sessionId: string;
  response: string;
}

interface JsonChatPayload {
  sessionId?: string;
  textLogs?: string;
  message: string;
}

const DEFAULT_FILE_MESSAGE = "Analyze the attached logs and return a structured incident investigation.";

function normalizeMessage(payload: SendChatPayload): string {
  const trimmed = payload.message.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }

  if (payload.file) {
    return DEFAULT_FILE_MESSAGE;
  }

  return "";
}

async function extractError(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const parsed = (await response.json()) as { error?: string };
      return typeof parsed.error === "string" && parsed.error.trim().length > 0
        ? parsed.error
        : fallback;
    }

    const text = await response.text();
    return text.trim().length > 0 ? text : fallback;
  } catch {
    return fallback;
  }
}

export async function sendChat(payload: SendChatPayload): Promise<ChatApiResponse> {
  const normalizedMessage = normalizeMessage(payload);
  if (!normalizedMessage) {
    throw new Error("Message is required before sending.");
  }

  const requestInit: RequestInit = {
    method: "POST",
  };

  if (payload.file) {
    const formData = new FormData();
    formData.set("message", normalizedMessage);

    if (payload.sessionId) {
      formData.set("sessionId", payload.sessionId);
    }

    if (payload.mode === "logs" && payload.message.trim()) {
      formData.set("textLogs", payload.message.trim());
    }

    formData.set("file", payload.file);
    requestInit.body = formData;
  } else {
    const body: JsonChatPayload = {
      message: normalizedMessage,
    };

    if (payload.sessionId) {
      body.sessionId = payload.sessionId;
    }

    if (payload.mode === "logs" && payload.message.trim()) {
      body.textLogs = payload.message.trim();
    }

    requestInit.headers = {
      "Content-Type": "application/json",
    };
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch("/chat", requestInit);
  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const parsed = (await response.json()) as Partial<ChatApiResponse>;
  if (typeof parsed.sessionId !== "string" || typeof parsed.response !== "string") {
    throw new Error("Invalid chat response from server.");
  }

  return {
    sessionId: parsed.sessionId,
    response: parsed.response,
  };
}
