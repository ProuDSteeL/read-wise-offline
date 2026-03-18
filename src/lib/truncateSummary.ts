export function truncateSummary(content: string, targetPercent: number = 0.25): string {
  if (!content) return "";
  const paragraphs = content.split(/\n\n+/);
  if (paragraphs.length <= 1) return content;

  const totalLength = content.length;
  const targetLength = totalLength * targetPercent;

  let accumulated = 0;
  const kept: string[] = [];

  for (const p of paragraphs) {
    kept.push(p);
    accumulated += p.length + 2; // +2 for the \n\n separator
    if (accumulated >= targetLength) break;
  }

  return kept.join("\n\n");
}
