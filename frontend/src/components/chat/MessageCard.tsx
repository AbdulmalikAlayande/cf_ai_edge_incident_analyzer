import { AlertTriangle, Bot, Clock3, FileText, UserRound } from "lucide-react";
import AssistantSections from "@/components/chat/AssistantSections";
import type { ChatMessage } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface MessageCardProps {
	message: ChatMessage;
	files?: File[];
}

function MessageCard({ message, files }: MessageCardProps) {
	const isUser = message.role === "user";
	const hasFiles = isUser && Array.isArray(files) && files.length > 0;

	function getFileExtension(filename: string): string {
		const lastDot = filename.lastIndexOf(".");
		if (lastDot === -1) return "";
		return filename.substring(lastDot + 1);
	}

	function formatFileSize(bytes: number): string {
		if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
		const units = ["B", "KB", "MB", "GB"];
		const exp = Math.min(
			Math.floor(Math.log(bytes) / Math.log(1024)),
			units.length - 1,
		);
		const value = bytes / 1024 ** exp;
		return `${value >= 10 || exp === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exp]}`;
	}

	const bubbleWidthClass = "max-w-[88%] sm:max-w-[78%] lg:max-w-[66%]";

	return (
		<article className="flex w-full flex-col gap-2">
			{hasFiles ? (
				<div
					className={cn(
						"flex w-full",
						isUser ? "justify-end" : "justify-start",
					)}
				>
					<div
						className={cn(
							"flex w-full flex-wrap gap-2",
							bubbleWidthClass,
							isUser ? "justify-end" : "justify-start",
						)}
					>
						{files.map((file, index) => {
							const baseName = file.name.replace(/\.[^/.]+$/, "");
							const extension =
								getFileExtension(file.name).toUpperCase() || "FILE";
							return (
								<div
									key={`${file.name}-${index}`}
									className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border/70 bg-card/65 px-3 py-2 text-xs shadow-sm"
								>
									<FileText className="size-3.5 shrink-0 text-muted-foreground" />
									<div className="min-w-0">
										<p className="truncate font-medium text-foreground">
											{baseName}
										</p>
										<p className="text-[11px] uppercase tracking-wide text-muted-foreground">
											{extension} | {formatFileSize(file.size)}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			) : null}

			<div
				className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
			>
				<div
					className={cn(
						bubbleWidthClass,
						"rounded-2xl p-4",
						isUser
							? "bg-primary/95 text-primary-foreground shadow-md shadow-primary/25"
							: "border border-border/70 bg-card/70 text-card-foreground shadow-sm backdrop-blur-sm",
						message.status === "error" && "bg-destructive/10 text-destructive",
					)}
				>
					<header className="mb-3 flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase opacity-75">
						{isUser ? (
							<UserRound className="size-3.5" />
						) : (
							<Bot className="size-3.5" />
						)}
						<span>{isUser ? "You" : "Assistant"}</span>
					</header>

					{isUser ? (
						<p className="whitespace-pre-wrap text-sm leading-relaxed">
							{message.content}
						</p>
					) : message.status === "loading" ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock3 className="size-4 animate-spin" />
							<span>{message.content}</span>
						</div>
					) : message.status === "error" ? (
						<div className="flex items-start gap-2 text-sm">
							<AlertTriangle className="mt-0.5 size-4" />
							<p className="whitespace-pre-wrap leading-relaxed">
								{message.content}
							</p>
						</div>
					) : (
						<AssistantSections content={message.content} />
					)}
				</div>
			</div>
		</article>
	);
}

export default MessageCard;
