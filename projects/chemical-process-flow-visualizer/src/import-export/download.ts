export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = window.document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export function downloadText(text: string, filename: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  downloadDataUrl(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function safeFilename(title: string): string {
  return title.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim() || 'process-flow';
}
