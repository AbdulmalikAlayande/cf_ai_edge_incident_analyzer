import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SendHorizontal } from "lucide-react";
import FileUpload from "@/components/chat/FileUpload";
import ModeToggle from "@/components/chat/ModeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
  const [mode, setMode] = useState<ChatMode>("describe");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!preset) {
      return;
    }

    setMode(preset.mode);
    setMessage(preset.text);
  }, [preset]);

  const canSend = useMemo(() => {
    return !isSending && (message.trim().length > 0 || file !== null);
  }, [file, isSending, message]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    await onSend({
      mode,
      message,
      file,
    });

    setMessage("");
    setFile(null);
  };

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
      <form onSubmit={handleSubmit}>
        <Card className="gap-4 border-0 bg-card/82 py-5 shadow-xl shadow-background/25 backdrop-blur-sm">
          <CardHeader className="space-y-3 px-4 py-0 sm:px-5">
            <ModeToggle mode={mode} onChange={setMode} disabled={isSending} />
            <FileUpload file={file} onFileChange={setFile} disabled={isSending} />
          </CardHeader>

          <CardContent className="px-4 py-0 sm:px-5">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                mode === "logs"
                  ? "Paste logs, traces, and metric snippets..."
                  : "Describe user impact, regions, recent deploys, and symptoms..."
              }
              disabled={isSending}
              className="min-h-28 w-full resize-y rounded-2xl bg-background/80 px-4 py-3 text-sm leading-relaxed text-foreground outline-none ring-1 ring-input/70 transition focus-visible:ring-2 focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-32"
            />
          </CardContent>

          <CardFooter className="flex flex-col items-start justify-between gap-3 px-4 py-0 sm:flex-row sm:items-center sm:px-5">
            <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-[70%]">
              Include region, service name, timestamp window, and recent changes to improve
              hypothesis quality.
            </p>

            <Button type="submit" disabled={!canSend} className="min-w-28 self-end sm:min-w-32 sm:self-auto">
              <SendHorizontal className="size-4" />
              {isSending ? "Analyzing..." : "Send"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default Composer;
