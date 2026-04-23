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
		<header className="flex flex-col gap-5 border-b border-border/60 px-4 py-5 sm:px-6 sm:py-6 md:px-8">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="max-w-3xl space-y-3">
					<div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm shadow-sky-500/10 dark:text-sky-200">
						<span className="size-1.5 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(56,189,248,0.14)]" />
						Incident Lens workspace
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 lg:justify-end">
					<Badge
						variant="secondary"
						className="rounded-full border border-border/70 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm shadow-background/10 backdrop-blur-sm dark:bg-white/5"
					>
						Session: {formatSession(sessionId)}
					</Badge>
					<Badge
						variant="secondary"
						className="rounded-full border border-border/70 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm shadow-background/10 backdrop-blur-sm dark:bg-white/5"
					>
						<Activity
							className={`size-3 ${isSending ? "animate-pulse" : ""}`}
						/>
						{isSending ? "Analyzing" : "Idle"}
					</Badge>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={onResetSession}
						className="rounded-full border border-border/70 bg-white/80 shadow-sm shadow-background/10 backdrop-blur-sm dark:bg-white/5"
					>
						<RotateCcw className="size-4" />
						New session
					</Button>
				</div>
			</div>
		</header>
	);
}

export default ChatHeader;
