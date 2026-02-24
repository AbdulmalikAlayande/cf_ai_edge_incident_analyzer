import {
	AppState,
	AssistantSection,
	ChatResponseError,
	ChatResponseSuccess,
	JsonChatPayload,
	MessageOptions,
} from "./types";

export {};

const state: AppState = {
	sessionId: null,
	inputMode: "logs",
	sending: false,
};

const knownSections: Record<string, string> = {
	"most likely pattern": "Most likely pattern",
	"why i think so": "Why I think so",
	"top 3 hypotheses": "Top 3 hypotheses",
	"what to check next": "What to check next",
	"what would change my mind": "What would change my mind",
};

function queryRequired<T extends Element>(selector: string): T {
	const element = document.querySelector(selector);
	if (!(element instanceof Element)) {
		throw new Error(`Missing required element: ${selector}`);
	}
	return element as T;
}

const chatFeed = queryRequired<HTMLElement>("#chat-feed");
const emptyState = queryRequired<HTMLElement>("#empty-state");
const sessionStatus = queryRequired<HTMLElement>("#session-status");
const newSessionBtn = queryRequired<HTMLButtonElement>("#new-session-btn");
const modeButtons = Array.from(
	document.querySelectorAll<HTMLButtonElement>(".toggle-btn"),
);
const fileInput = queryRequired<HTMLInputElement>("#file-input");
const fileName = queryRequired<HTMLElement>("#file-name");
const messageInput = queryRequired<HTMLTextAreaElement>("#message-input");
const clearInputBtn = queryRequired<HTMLButtonElement>("#clear-input-btn");
const sendBtn = queryRequired<HTMLButtonElement>("#send-btn");
const exampleButtons = Array.from(
	document.querySelectorAll<HTMLButtonElement>(".example-chip"),
);

function setSessionStatus(active: boolean): void {
	sessionStatus.textContent = active ? "Session: active" : "Not started";
}

function syncEmptyState(): void {
	const hasMessages = chatFeed.querySelector(".message-card") !== null;
	emptyState.hidden = hasMessages;
}

function autoResizeComposer(): void {
	messageInput.style.height = "auto";
	const nextHeight = Math.min(messageInput.scrollHeight, 220);
	messageInput.style.height = `${Math.max(nextHeight, 94)}px`;
}

function setInputMode(mode: AppState["inputMode"]): void {
	state.inputMode = mode;
	modeButtons.forEach((button) => {
		button.classList.toggle("active", button.dataset.mode === mode);
	});
}

function updateSelectedFileUI(): void {
	const file = fileInput.files?.[0];
	if (!file) {
		fileName.hidden = true;
		fileName.textContent = "";
		return;
	}

	fileName.hidden = false;
	fileName.textContent = `Attached: ${file.name}`;
}

function clearComposerInput(): void {
	messageInput.value = "";
	fileInput.value = "";
	updateSelectedFileUI();
	autoResizeComposer();
}

function parseAssistantSections(text: string): AssistantSection[] | null {
	const lines = text.split(/\r?\n/);
	const sections: AssistantSection[] = [];
	let current: AssistantSection | null = null;
	let prefaceDetected = false;

	lines.forEach((line) => {
		const match = line.match(/^([^:]{3,80}):\s*(.*)$/);
		if (match) {
			const key = match[1].trim().toLowerCase();
			const sectionTitle = knownSections[key];
			if (sectionTitle) {
				if (current && current.content.trim()) {
					sections.push(current);
				}
				current = {
					title: sectionTitle,
					content: match[2] || "",
				};
				return;
			}
		}

		if (!current) {
			if (line.trim()) {
				prefaceDetected = true;
			}
			return;
		}

		current.content += `${current.content ? "\n" : ""}${line}`;
	});

	if (current && current.content.trim()) {
		sections.push(current);
	}

	if (prefaceDetected || sections.length < 2) {
		return null;
	}

	return sections;
}

function appendAssistantBody(container: HTMLElement, text: string): void {
	const parsedSections = parseAssistantSections(text);
	if (!parsedSections) {
		container.textContent = text;
		return;
	}

	const wrapper = document.createElement("div");
	wrapper.className = "assistant-sections";

	parsedSections.forEach((section) => {
		const item = document.createElement("section");
		item.className = "assistant-section";

		const title = document.createElement("h3");
		title.textContent = section.title;

		const body = document.createElement("p");
		body.textContent = section.content;

		item.append(title, body);
		wrapper.append(item);
	});

	container.append(wrapper);
}

function createMessage(
	role: "user" | "assistant",
	text: string,
	options: MessageOptions = {},
): HTMLElement {
	const card = document.createElement("article");
	card.className = `message-card ${role}`;

	const meta = document.createElement("div");
	meta.className = "message-meta";

	const sender = document.createElement("span");
	sender.textContent = role === "assistant" ? "Assistant" : "You";

	const stamp = document.createElement("span");
	stamp.textContent = new Date().toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

	meta.append(sender, stamp);

	const body = document.createElement("div");
	body.className = "message-body";

	if (options.error) {
		body.classList.add("error-message");
	}

	if (role === "assistant" && !options.pending && !options.error) {
		appendAssistantBody(body, text);
	} else {
		body.textContent = text;
	}

	card.append(meta, body);

	if (options.attachment) {
		const attachment = document.createElement("span");
		attachment.className = "attachment-badge";
		attachment.textContent = `Attached: ${options.attachment}`;
		card.append(attachment);
	}

	chatFeed.append(card);
	syncEmptyState();
	chatFeed.scrollTop = chatFeed.scrollHeight;

	return card;
}

function updateMessage(
	card: HTMLElement,
	role: "user" | "assistant",
	text: string,
	options: MessageOptions = {},
): void {
	card.className = `message-card ${role}`;

	const body = card.querySelector<HTMLElement>(".message-body");
	if (!body) {
		return;
	}

	body.className = "message-body";
	body.textContent = "";

	if (options.error) {
		body.classList.add("error-message");
		body.textContent = text;
	} else if (role === "assistant") {
		appendAssistantBody(body, text);
	} else {
		body.textContent = text;
	}

	chatFeed.scrollTop = chatFeed.scrollHeight;
}

function resetSession(): void {
	state.sessionId = null;
	Array.from(chatFeed.querySelectorAll(".message-card")).forEach((node) =>
		node.remove(),
	);
	setSessionStatus(false);
	syncEmptyState();
	clearComposerInput();
}

function buildRequestBody(
	message: string,
	attachment: File | null,
): { body: FormData | string; headers: HeadersInit | undefined } {
	const activeSession = state.sessionId;

	if (attachment) {
		const formData = new FormData();
		formData.append("message", message);
		formData.append("file", attachment);

		if (activeSession) {
			formData.append("sessionId", activeSession);
		}

		return { body: formData, headers: undefined };
	}

	const payload: JsonChatPayload = {
		message,
	};

	if (state.inputMode === "logs") {
		payload.textLogs = message;
	}

	if (activeSession) {
		payload.sessionId = activeSession;
	}

	return {
		body: JSON.stringify(payload),
		headers: {
			"content-type": "application/json",
		},
	};
}

async function sendMessage(): Promise<void> {
	if (state.sending) {
		return;
	}

	const attachment = fileInput.files?.[0] ?? null;
	const rawInput = messageInput.value.trim();

	if (!rawInput && !attachment) {
		messageInput.focus();
		return;
	}

	const message =
		rawInput ||
		"Please analyze the attached log file and suggest the next checks.";

	createMessage("user", message, {
		attachment: attachment?.name,
	});

	clearComposerInput();

	state.sending = true;
	sendBtn.disabled = true;

	const pending = createMessage("assistant", "Analyzing incident context...", {
		pending: true,
	});

	try {
		const request = buildRequestBody(message, attachment);
		const response = await fetch("/chat", {
			method: "POST",
			headers: request.headers,
			body: request.body,
		});

		let data: ChatResponseSuccess | ChatResponseError = {};
		try {
			data = (await response.json()) as ChatResponseSuccess | ChatResponseError;
		} catch {
			data = {};
		}

		if (!response.ok) {
			throw new Error((data as ChatResponseError).error || "Request failed.");
		}

		if (!("response" in data) || typeof data.response !== "string") {
			throw new Error("Invalid response format from server.");
		}

		if (typeof data.sessionId === "string" && data.sessionId) {
			state.sessionId = data.sessionId;
			setSessionStatus(true);
		}

		updateMessage(pending, "assistant", data.response);
	} catch (error: unknown) {
		const messageText =
			error instanceof Error ? error.message : "Unexpected error occurred.";
		updateMessage(pending, "assistant", `Error: ${messageText}`, {
			error: true,
		});
	} finally {
		state.sending = false;
		sendBtn.disabled = false;
	}
}

newSessionBtn.addEventListener("click", () => {
	resetSession();
	messageInput.focus();
});

modeButtons.forEach((button) => {
	button.addEventListener("click", () => {
		const mode = button.dataset.mode;
		if (mode === "logs" || mode === "describe") {
			setInputMode(mode);
		}
	});
});

clearInputBtn.addEventListener("click", () => {
	clearComposerInput();
	messageInput.focus();
});

sendBtn.addEventListener("click", () => {
	void sendMessage();
});

fileInput.addEventListener("change", updateSelectedFileUI);

messageInput.addEventListener("input", autoResizeComposer);

messageInput.addEventListener("keydown", (event: KeyboardEvent) => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		void sendMessage();
	}
});

exampleButtons.forEach((button) => {
	button.addEventListener("click", () => {
		const example = button.dataset.example;
		if (!example) {
			return;
		}

		messageInput.value = example;
		autoResizeComposer();
		messageInput.focus();
	});
});

setSessionStatus(false);
syncEmptyState();
autoResizeComposer();
