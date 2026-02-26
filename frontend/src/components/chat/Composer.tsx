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
    <div className="border-t border-border/70 px-4 pb-4 pt-3 md:px-8 md:pb-8 md:pt-5">
      <form onSubmit={handleSubmit}>
        <Card className="gap-4 border-border/80 bg-card/80 py-5 shadow-none backdrop-blur-sm">
          <CardHeader className="space-y-3 px-4 py-0 md:px-5">
            <ModeToggle mode={mode} onChange={setMode} disabled={isSending} />
            <FileUpload file={file} onFileChange={setFile} disabled={isSending} />
          </CardHeader>

          <CardContent className="px-4 py-0 md:px-5">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                mode === "logs"
                  ? "Paste logs, traces, and metric snippets..."
                  : "Describe user impact, regions, recent deploys, and symptoms..."
              }
              disabled={isSending}
              className="min-h-32 w-full resize-y rounded-xl border border-input bg-background/70 px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </CardContent>

          <CardFooter className="flex flex-col items-start justify-between gap-3 px-4 py-0 md:flex-row md:items-center md:px-5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Include region, service name, timestamp window, and recent changes to improve
              hypothesis quality.
            </p>

            <Button type="submit" disabled={!canSend} className="min-w-32 self-end md:self-auto">
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

