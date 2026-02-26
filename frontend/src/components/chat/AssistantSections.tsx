import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTION_HEADER_MAP = {
  "most likely pattern": "Most likely pattern",
  "why i think so": "Why I think so",
  "top 3 hypotheses": "Top 3 hypotheses",
  "what to check next": "What to check next",
  "what would change my mind": "What would change my mind",
} as const;

type SectionHeader = (typeof SECTION_HEADER_MAP)[keyof typeof SECTION_HEADER_MAP];

interface ParsedSection {
  title: SectionHeader;
  lines: string[];
}

interface ParsedSectionsResult {
  intro: string;
  sections: ParsedSection[];
}

interface AssistantSectionsProps {
  content: string;
}

function trimTrailingEmptyLines(lines: string[]): string[] {
  const nextLines = [...lines];
  while (nextLines.length > 0 && nextLines[nextLines.length - 1].trim() === "") {
    nextLines.pop();
  }
  return nextLines;
}

function parseAssistantSections(content: string): ParsedSectionsResult | null {
  const lines = content.split(/\r?\n/);
  const introLines: string[] = [];
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const headerMatch = trimmedLine.match(/^([^:]+):\s*(.*)$/);

    if (headerMatch) {
      const header = SECTION_HEADER_MAP[headerMatch[1].trim().toLowerCase() as keyof typeof SECTION_HEADER_MAP];
      if (header) {
        if (currentSection) {
          sections.push({
            ...currentSection,
            lines: trimTrailingEmptyLines(currentSection.lines),
          });
        }

        currentSection = {
          title: header,
          lines: headerMatch[2] ? [headerMatch[2]] : [],
        };
        continue;
      }
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (currentSection) {
    sections.push({
      ...currentSection,
      lines: trimTrailingEmptyLines(currentSection.lines),
    });
  }

  if (sections.length === 0) {
    return null;
  }

  return {
    intro: introLines.join("\n").trim(),
    sections,
  };
}

function renderSectionBody(rawText: string, sectionTitle: string): ReactNode {
  const blocks = rawText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No additional details provided.</p>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        const isList = lines.length > 1 && lines.every((line) => /^([-*]|\d+\.)\s+/.test(line));

        if (isList) {
          return (
            <ul key={`${sectionTitle}-${blockIndex}`} className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {lines.map((line) => (
                <li key={`${sectionTitle}-${blockIndex}-${line}`}>{line.replace(/^([-*]|\d+\.)\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${sectionTitle}-${blockIndex}`} className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {block}
          </p>
        );
      })}
    </div>
  );
}

function AssistantSections({ content }: AssistantSectionsProps) {
  const parsed = parseAssistantSections(content);

  if (!parsed) {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{content}</p>;
  }

  return (
    <div className="space-y-3">
      {parsed.intro ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{parsed.intro}</p>
      ) : null}

      {parsed.sections.map((section) => (
        <Card key={section.title} className="gap-2 border-0 bg-background/62 py-3 shadow-none">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-sm font-semibold tracking-tight">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-0">
            {renderSectionBody(section.lines.join("\n").trim(), section.title)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default AssistantSections;
