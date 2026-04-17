import { useMemo, useState } from "react";
import {
	AudioLines,
	Mic,
	Plus,
	SendHorizontal,
	SlidersHorizontal,
	X,
} from "lucide-react";
import FileUpload from "@/components/chat/FileUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { SendMessageInput } from "@/hooks/useChat";
import type { ChatMode } from "@/lib/api";

export interface ComposerPreset {
	token: number;
	mode: ChatMode;
	text: string;
}

interface ComposerProps {
	isSending: boolean;
	preset?: ComposerPreset;
	onSend: (input: SendMessageInput) => Promise<void>;
}

function Composer({ isSending, preset, onSend }: ComposerProps) {
	const [mode, setMode] = useState<ChatMode>(() => preset?.mode ?? "describe");
	const [message, setMessage] = useState(() => preset?.text ?? "");
	const [files, setFiles] = useState<File[]>([]);
	const [toolsOpen, setToolsOpen] = useState(false);

	const canSend = useMemo(() => {
		return !isSending && (message.trim().length > 0 || files.length > 0);
	}, [files.length, isSending, message]);

	const getFileKey = (file: File) =>
		`${file.name}-${file.size}-${file.lastModified}`;

	const mergeFiles = (incomingFiles: File[]) => {
		if (incomingFiles.length === 0) {
			return;
		}

		setFiles((current) => {
			const seen = new Set(current.map(getFileKey));
			const next = [...current];

			for (const file of incomingFiles) {
				const key = getFileKey(file);
				if (!seen.has(key)) {
					seen.add(key);
					next.push(file);
				}
			}

			return next;
		});
	};

	const removeFile = (fileKey: string) => {
		setFiles((current) =>
			current.filter((file) => getFileKey(file) !== fileKey),
		);
	};

	const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSend) {
			return;
		}

		await onSend({
			mode,
			message,
			files,
		});

		setMessage("");
		setFiles([]);
		setToolsOpen(false);
	};

	return (
		<div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
			<div className="mx-auto w-full max-w-4xl">
				<form onSubmit={handleSubmit}>
					<div className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.72))] shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(15,23,42,0.56))]">
						<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(196_100%_94%/0.8),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(245_100%_94%/0.45),transparent_36%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
						<div className="pointer-events-none absolute inset-x-5 top-4 h-px bg-linear-to-r from-transparent via-sky-400/70 to-transparent" />

						<div className="relative z-10 px-5 pt-5 sm:px-6">
							{files.length > 0 && (
								<div className="mb-3 flex flex-wrap gap-2">
									{files.map((file) => {
										const fileKey = getFileKey(file);
										return (
											<div
												key={fileKey}
												className="flex items-center gap-2 rounded-md bg-sky-50/80 px-3 py-2 dark:bg-sky-950/40"
											>
												<Badge
													variant="secondary"
													className="max-w-48 truncate text-xs"
												>
													{file.name}
												</Badge>
												<Button
													type="button"
													variant="ghost"
													size="icon-xs"
													onClick={() => removeFile(fileKey)}
													disabled={isSending}
													className="h-5 w-5"
												>
													<X className="size-3" />
													<span className="sr-only">Remove file</span>
												</Button>
											</div>
										);
									})}
								</div>
							)}
						</div>

						<textarea
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							placeholder={
								mode === "logs"
									? "Paste logs, traces, and metric snippets..."
									: "Ask anything"
							}
							aria-label="Message input"
							disabled={isSending}
							className="relative z-10 min-h-36 w-full resize-none bg-transparent px-5 pb-18 pt-5 text-[0.98rem] leading-7 text-foreground outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-40 sm:px-6"
						/>

						<div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:flex-nowrap sm:px-4">
							<div className="flex min-w-0 items-center gap-1 sm:gap-2">
								<FileUpload onFilesChange={mergeFiles} disabled={isSending} />

								<Popover open={toolsOpen} onOpenChange={setToolsOpen}>
									<PopoverTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											disabled={isSending}
											className="rounded-full border border-border/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm hover:bg-white dark:bg-white/5 dark:text-slate-200"
										>
											<Plus className="size-4" />
											<span className="sr-only">More tools</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent
										align="start"
										className="w-[min(92vw,26rem)] space-y-3 border-border/60 bg-white/92 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:bg-slate-950/90"
									>
										<div className="space-y-2">
											<p className="text-xs font-medium text-muted-foreground">
												Tools
											</p>
											<p className="text-xs text-muted-foreground/70">
												More tools coming soon: web search, tone adjustment, and
												more
											</p>
										</div>
									</PopoverContent>
								</Popover>

								<Select
									value={mode}
									onValueChange={(value) => {
										if (value === "logs" || value === "describe") {
											setMode(value);
										}
									}}
									disabled={isSending}
								>
									<SelectTrigger
										size="sm"
										className="h-8 min-w-33 rounded-full border border-border/70 bg-white/80 px-3 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-white dark:bg-white/5 dark:text-slate-200"
									>
										<SlidersHorizontal className="size-4" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent align="start">
										<SelectItem value="logs">Logs</SelectItem>
										<SelectItem value="describe">Describe</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="ml-auto flex items-center gap-1 sm:gap-2">
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled
									className="rounded-full border border-border/70 bg-white/80 text-muted-foreground shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-slate-200"
								>
									<Mic className="size-4" />
									<span className="sr-only">Voice input</span>
								</Button>

								<Button
									type="submit"
									disabled={!canSend}
									size="icon-sm"
									className="rounded-full bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)] hover:bg-slate-800 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
								>
									{isSending ? (
										<AudioLines className="size-4 animate-pulse" />
									) : (
										<SendHorizontal className="size-4" />
									)}
									<span className="sr-only">Send message</span>
								</Button>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

export default Composer;
