import { useEffect, useRef, type ComponentType } from "react";
import {
	ClipboardPaste,
	FileChartColumnIncreasing,
	Upload,
} from "lucide-react";
import MessageCard from "@/components/chat/MessageCard";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatMessage } from "@/hooks/useChat";
import type { ChatMode } from "@/lib/api";

export interface QuickActionPayload {
	mode: ChatMode;
	text: string;
}

interface ChatFeedProps {
	messages: ChatMessage[];
	onQuickAction: (payload: QuickActionPayload) => void;
}

const QUICK_ACTIONS: Array<{
	title: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	payload: QuickActionPayload;
}> = [
	{
		title: "Paste logs",
		description:
			"Drop in service and infrastructure logs for immediate pattern detection.",
		icon: ClipboardPaste,
		payload: {
			mode: "logs",
			text: "Paste recent logs here and identify the likely failure pattern.",
		},
	},
	{
		title: "Describe incident",
		description:
			"Summarize user impact, affected region, and what changed before failure.",
		icon: FileChartColumnIncreasing,
		payload: {
			mode: "describe",
			text: "Describe the incident timeline, impacted services, and what changed recently.",
		},
	},
	{
		title: "Upload log file",
		description:
			"Attach .txt, .log, or .json logs and investigate with session context.",
		icon: Upload,
		payload: {
			mode: "logs",
			text: "I attached logs. Use them to identify probable causes and next checks.",
		},
	},
];

function ChatFeed({ messages, onQuickAction }: ChatFeedProps) {
	const endOfMessagesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		endOfMessagesRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end",
		});
	}, [messages]);

	if (messages.length === 0) {
		return (
			<section
				className="relative flex min-h-0 flex-1 flex-col justify-center px-4 py-6 sm:px-6 md:px-8"
				aria-live="polite"
			>
				<div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-72 -translate-y-1/2 bg-[radial-gradient(circle_at_center,hsl(196_100%_90%/0.3),transparent_66%)] blur-3xl" />

				<div className="mx-auto grid w-full max-w-6xl gap-8 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
					<div className="space-y-5 text-center xl:text-left">
						<div className="space-y-3">
							<h1 className="max-w-3xl text-balance text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl lg:text-5xl">
								Distributed Systems Incident Assistant
							</h1>
							<p className="max-w-3xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
								Paste logs, describe impact, and keep iterating on the same
								session until the failure pattern becomes clear.
							</p>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
							{QUICK_ACTIONS.map((action) => {
								const Icon = action.icon;
								return (
									<button
										key={action.title}
										type="button"
										onClick={() => onQuickAction(action.payload)}
										className="group text-left"
									>
										<Card className="h-full overflow-hidden border border-border/70 bg-white/75 py-0 shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-sky-400/40 group-hover:shadow-[0_20px_50px_rgba(56,189,248,0.12)] dark:bg-white/5">
											<CardContent className="space-y-4 px-4 py-4">
												<div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
													<span className="flex size-6 items-center justify-center rounded-full bg-sky-500/12 text-sky-700 dark:text-sky-200">
														<Icon className="size-3.5" />
													</span>
													{action.title}
												</div>
												<p className="text-sm leading-relaxed text-muted-foreground">
													{action.description}
												</p>
											</CardContent>
										</Card>
									</button>
								);
							})}
						</div>
					</div>

					<div className="relative hidden overflow-hidden rounded-[2rem] border border-border/70 bg-white/75 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm xl:block dark:bg-white/5">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(196_100%_90%/0.35),transparent_50%),radial-gradient(circle_at_bottom_right,hsl(245_100%_90%/0.24),transparent_42%)]" />
						<div className="relative space-y-4">
							<p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
								Distributed signal map
							</p>
							<svg
								viewBox="0 0 420 300"
								className="h-56 w-full"
								aria-hidden="true"
							>
								<defs>
									<linearGradient id="feed-line" x1="0" x2="1" y1="0" y2="1">
										<stop offset="0%" stopColor="rgba(56,189,248,0.9)" />
										<stop offset="100%" stopColor="rgba(99,102,241,0.65)" />
									</linearGradient>
								</defs>
								<g
									fill="none"
									stroke="url(#feed-line)"
									strokeWidth="1.2"
									strokeLinecap="round"
								>
									<path d="M56 92 C 122 42, 180 42, 244 98 S 360 162, 372 82" />
									<path d="M48 182 C 116 136, 184 144, 246 184 S 350 240, 374 170" />
									<path d="M86 230 C 164 194, 210 192, 290 230 S 350 270, 384 220" />
								</g>
								{[
									[56, 92],
									[120, 58],
									[186, 52],
									[244, 98],
									[306, 136],
									[372, 82],
									[48, 182],
									[128, 150],
									[196, 148],
									[246, 184],
									[324, 224],
									[374, 170],
									[86, 230],
									[154, 204],
									[226, 196],
									[290, 230],
									[342, 248],
									[384, 220],
								].map(([cx, cy], index) => (
									<g key={`${cx}-${cy}`}>
										<circle
											cx={cx}
											cy={cy}
											r={index % 4 === 0 ? 12 : 8}
											fill="rgba(56,189,248,0.12)"
										/>
										<circle
											cx={cx}
											cy={cy}
											r={index % 4 === 0 ? 5 : 3.5}
											fill={
												index % 3 === 0
													? "rgba(56,189,248,0.95)"
													: "rgba(99,102,241,0.78)"
											}
										/>
									</g>
								))}
							</svg>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div className="rounded-2xl border border-border/60 bg-background/80 p-4">
									<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
										Signal focus
									</p>
									<p className="mt-2 font-medium text-foreground">
										Service logs, traces, and impact summary
									</p>
								</div>
								<div className="rounded-2xl border border-border/60 bg-background/80 p-4">
									<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
										Session state
									</p>
									<p className="mt-2 font-medium text-foreground">
										Durable history with iterative follow-up
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section
			className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6 md:px-8"
			aria-live="polite"
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pt-5 sm:pt-7">
				{messages.map((message) => (
					<MessageCard
						key={message.id}
						message={message}
						files={message.files}
					/>
				))}
				<div ref={endOfMessagesRef} />
			</div>
		</section>
	);
}

export default ChatFeed;
