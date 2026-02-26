import { FileSearch, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChatMode } from "@/lib/api";

interface ModeToggleProps {
  mode: ChatMode;
  disabled?: boolean;
  onChange: (mode: ChatMode) => void;
}

function ModeToggle({ mode, disabled, onChange }: ModeToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        if (value === "logs" || value === "describe") {
          onChange(value);
        }
      }}
      className="w-full"
    >
      <TabsList className="w-full rounded-lg bg-muted/70">
        <TabsTrigger value="logs" disabled={disabled} className="data-[state=active]:bg-background">
          <FileText className="size-4" />
          Logs
        </TabsTrigger>
        <TabsTrigger value="describe" disabled={disabled} className="data-[state=active]:bg-background">
          <FileSearch className="size-4" />
          Describe
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default ModeToggle;
