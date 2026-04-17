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
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(196_100%_94%/0.92),transparent_26%),radial-gradient(circle_at_85%_15%,hsl(245_100%_96%/0.9),transparent_22%),linear-gradient(180deg,hsl(210_50%_99%),hsl(220_40%_97%))]" />
			<div className="pointer-events-none absolute inset-0 opacity-[0.38] bg-[linear-gradient(to_right,rgba(148,163,184,0.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.28)_1px,transparent_1px)] bg-size-[72px_72px]" />
			<div className="pointer-events-none absolute inset-0 animate-network-drift opacity-70">
				<svg
					viewBox="0 0 1440 960"
					preserveAspectRatio="none"
					className="h-full w-full"
					aria-hidden="true"
				>
					<defs>
						<linearGradient id="network-stroke" x1="0" x2="1" y1="0" y2="1">
							<stop offset="0%" stopColor="rgba(56,189,248,0.45)" />
							<stop offset="50%" stopColor="rgba(99,102,241,0.25)" />
							<stop offset="100%" stopColor="rgba(16,185,129,0.18)" />
						</linearGradient>
						<filter id="soft-glow">
							<feGaussianBlur stdDeviation="3.5" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
					<g
						fill="none"
						stroke="url(#network-stroke)"
						strokeWidth="1.2"
						opacity="0.9"
					>
						<path d="M 150 150 C 280 120, 350 180, 470 140 S 720 100, 820 220 S 1110 360, 1260 150" />
						<path d="M 120 650 C 240 560, 380 560, 500 670 S 730 840, 920 700 S 1150 470, 1320 620" />
						<path d="M 210 330 C 350 290, 470 360, 610 315 S 870 220, 990 330 S 1180 510, 1360 430" />
						<path d="M 220 860 C 360 780, 530 800, 690 720 S 980 590, 1120 660 S 1280 820, 1420 760" />
					</g>
					<g filter="url(#soft-glow)" className="animate-network-pulse">
						{[
							[150, 150],
							[470, 140],
							[820, 220],
							[1260, 150],
							[120, 650],
							[500, 670],
							[920, 700],
							[1320, 620],
							[210, 330],
							[610, 315],
							[990, 330],
							[1360, 430],
							[220, 860],
							[690, 720],
							[1120, 660],
							[1420, 760],
						].map(([cx, cy], index) => (
							<circle
								key={`${cx}-${cy}`}
								cx={cx}
								cy={cy}
								r={index % 4 === 0 ? 9 : 6}
								fill={
									index % 3 === 0
										? "rgba(56,189,248,0.35)"
										: "rgba(14,165,233,0.22)"
								}
							/>
						))}
					</g>
				</svg>
			</div>
			<div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_center,hsl(196_100%_85%/0.38),transparent_70%)] blur-3xl" />

			<main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pb-4 pt-3 sm:px-5 sm:pb-6 sm:pt-5 lg:px-8">
				{/* <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/55 bg-white/60 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/55"> */}
				<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-400/70 to-transparent" />
				<ChatHeader
					sessionId={sessionId}
					isSending={isSending}
					onResetSession={handleResetSession}
				/>
				<ChatFeed messages={messages} onQuickAction={handleQuickAction} />
				<Composer
					key={composerPreset?.token ?? 0}
					isSending={isSending}
					onSend={sendMessage}
					preset={composerPreset}
				/>
				{/* </section> */}
			</main>
		</div>
	);
}

export default ChatContainer;
