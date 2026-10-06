/** Copy text to the clipboard. Resolves to false (never throws) when the clipboard refuses, so callers can say so. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Save text as a file through the browser/webview download mechanism. `bom` helps Excel read UTF-8 CSV. */
export function downloadTextFile(filename: string, content: string, mime: string, bom = false): void {
  const blob = new Blob([bom ? `﻿${content}` : content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
