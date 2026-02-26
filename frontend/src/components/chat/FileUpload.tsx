import { useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  file: File | null;
  disabled?: boolean;
  className?: string;
  onFileChange: (file: File | null) => void;
}

function FileUpload({ file, disabled, className, onFileChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const clearFile = () => {
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".txt,.log,.json,text/plain,application/json"
        disabled={disabled}
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          onFileChange(nextFile);
        }}
      />

      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={openFileDialog}>
        <Paperclip className="size-4" />
        Upload log file
      </Button>

      {file ? (
        <div className="flex items-center gap-2 rounded-md border border-border/80 bg-background/70 px-2 py-1">
          <Badge variant="outline" className="max-w-56 truncate border-border/80 text-xs text-muted-foreground">
            {file.name}
          </Badge>
          <Button type="button" variant="ghost" size="icon-xs" onClick={clearFile} disabled={disabled}>
            <X className="size-3.5" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default FileUpload;
