import { useRef, type ChangeEvent } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
	disabled?: boolean;
	onFilesChange: (files: File[]) => void;
}

function FileUpload({ disabled, onFilesChange }: FileUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const openFileDialog = () => {
		inputRef.current?.click();
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(event.target.files ?? []);
		if (selectedFiles.length === 0) {
			return;
		}

		onFilesChange(selectedFiles);
		event.target.value = "";
	};

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				accept=".txt,.log,.json,text/plain,application/json"
				multiple
				disabled={disabled}
				onChange={handleFileChange}
			/>

			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				disabled={disabled}
				onClick={openFileDialog}
				className="rounded-full border border-border/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm hover:bg-white dark:bg-white/5 dark:text-slate-200"
			>
				<Paperclip className="size-4" />
				<span className="sr-only">Upload files</span>
			</Button>
		</>
	);
}

export default FileUpload;
