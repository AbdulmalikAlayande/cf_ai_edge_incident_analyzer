import { useCallback, useState } from "react";
import ChatFeed, { type QuickActionPayload } from "@/components/chat/ChatFeed";
import ChatHeader from "@/components/chat/ChatHeader";
import Composer, { type ComposerPreset } from "@/components/chat/Composer";
import { useChat } from "@/hooks/useChat";

function ChatContainer() {
	const { sessionId, messages, isSending, sendMessage, resetSession } =
		useChat();
	const [composerPreset, setComposerPreset] = useState<
		ComposerPreset | undefined
	>(undefined);

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
		<div className="relative min-h-screen overflow-hidden bg-background">
			<div className="pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[36px_36px]" />
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_0%,hsl(var(--primary)/0.22),transparent_72%)]" />
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/40 via-background/55 to-background" />

			<main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 pb-4 pt-3 sm:px-5 sm:pb-6 sm:pt-5 lg:px-8">
				<section className="flex min-h-0 flex-1 flex-col rounded-3xl bg-card/55 shadow-[0_20px_60px_hsl(var(--background)/0.45)] backdrop-blur-xl">
					<ChatHeader
						sessionId={sessionId}
						isSending={isSending}
						onResetSession={handleResetSession}
					/>
					<ChatFeed messages={messages} onQuickAction={handleQuickAction} />
					<Composer
						isSending={isSending}
						onSend={sendMessage}
						preset={composerPreset}
					/>
				</section>
			</main>
		</div>
	);
}

export default ChatContainer;
