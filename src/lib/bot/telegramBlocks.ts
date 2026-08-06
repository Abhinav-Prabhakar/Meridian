import type { Block } from "caspian-sdk";

/**
 * Convert the assistant's small Markdown subset into Caspian rich blocks.
 * Telegram renders these blocks natively, avoiding Telegram MarkdownV2's
 * strict escaping rules while keeping the same reply readable elsewhere.
 */
export function markdownToTelegramBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", text: stripInlineMarkdown(heading[1]) });
      index += 1;
      continue;
    }

    const listMatch = line.match(/^[-*•]\s+(.+)$/);
    if (listMatch) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^[-*•]\s+(.+)$/);
        if (!item) break;
        items.push(stripInlineMarkdown(item[1]));
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^\d+[.)]\s+(.+)$/);
        if (!item) break;
        items.push(stripInlineMarkdown(item[1]));
        index += 1;
      }
      blocks.push({ type: "list", items, ordered: true });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || /^#{1,6}\s+/.test(next) || /^[-*•]\s+/.test(next) || /^\d+[.)]\s+/.test(next)) {
        break;
      }
      paragraph.push(stripInlineMarkdown(next));
      index += 1;
    }
    if (paragraph.length > 0) {
      blocks.push({ type: "text", text: paragraph.join("\n") });
    } else {
      index += 1;
    }
  }

  return blocks;
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
    .replace(/(^|[^_])_([^_]+)_(?!_)/g, "$1$2")
    .replace(/\\([\\_*[\]()~`>#+\-.!|])/g, "$1")
    .trim();
}
