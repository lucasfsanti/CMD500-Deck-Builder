import { useState } from "react";
import type { DeckCard } from "../../lib/deck/types";
import { generateLigaMagicExport, generateReadableExport } from "../../lib/export/generate-decklist";
import { copyToClipboard } from "../../lib/export/clipboard";
import { downloadTextFile } from "../../lib/export/download";

export interface ExportMenuProps {
  cards: DeckCard[];
}

type ExportFormat = "ligamagic" | "readable";

export function ExportMenu({ cards }: ExportMenuProps) {
  const [format, setFormat] = useState<ExportFormat>("ligamagic");
  const [feedback, setFeedback] = useState<string | undefined>();

  function currentText(): string {
    return format === "ligamagic" ? generateLigaMagicExport(cards) : generateReadableExport(cards);
  }

  async function handleCopy() {
    await copyToClipboard(currentText());
    setFeedback("Copied");
    setTimeout(() => setFeedback(undefined), 1500);
  }

  function handleDownload() {
    const filename = format === "ligamagic" ? "deck.txt" : "deck-readable.txt";
    downloadTextFile(currentText(), filename);
  }

  return (
    <div className="c500-export">
      <select
        className="c500-export__format"
        value={format}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
        aria-label="Export format"
      >
        <option value="ligamagic">For LigaMagic import</option>
        <option value="readable">Readable list</option>
      </select>
      <button type="button" className="c500-export__button" onClick={handleCopy}>
        Copy
      </button>
      <button type="button" className="c500-export__button" onClick={handleDownload}>
        Download
      </button>
      {feedback && <span className="c500-export__feedback">{feedback}</span>}
    </div>
  );
}
