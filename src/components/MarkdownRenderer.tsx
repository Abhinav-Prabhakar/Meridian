"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

interface TableBlock {
  header: string[];
  rows: string[][];
  consumed: number;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Simple, robust Markdown block renderer
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      elements.push(<div key={index} style={{ height: "6px" }} />);
      continue;
    }

    // Tables: consume a contiguous block of pipe-delimited rows
    if (trimmed.startsWith("|")) {
      const block = consumeTable(lines, index);
      if (block) {
        elements.push(renderTable(block, index));
        index += block.consumed - 1;
        continue;
      }
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={index} style={{ fontSize: "14px", fontWeight: "700", margin: "6px 0 4px 0", color: "var(--accent)" }}>
          {renderInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={index} style={{ fontSize: "15px", fontWeight: "700", margin: "8px 0 4px 0", color: "var(--text-main)" }}>
          {renderInlineMarkdown(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={index} style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px 0", color: "var(--text-main)" }}>
          {renderInlineMarkdown(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // List items
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const listText = trimmed.replace(/^[-*•]\s+/, "");
      elements.push(
        <div key={index} style={{ display: "flex", gap: "6px", marginLeft: "8px", marginBottom: "3px", fontSize: "13px" }}>
          <span style={{ color: "var(--accent)", fontWeight: "bold" }}>•</span>
          <span>{renderInlineMarkdown(listText)}</span>
        </div>
      );
      continue;
    }

    // Default paragraph
    elements.push(
      <p key={index} style={{ margin: "3px 0", fontSize: "13px", lineHeight: "1.5" }}>
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  }

  return <div>{elements}</div>;
};

function consumeTable(lines: string[], start: number): TableBlock | null {
  const rows: string[][] = [];
  let consumed = 0;
  let cursor = start;

  // Skip leading whitespace-only pipes
  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    if (line.startsWith("|")) break;
    cursor++;
  }
  if (cursor >= lines.length) return null;

  // Header row
  const headerCells = parseTableRow(lines[cursor].trim());
  if (headerCells.length === 0) return null;
  consumed++;
  cursor++;

  // Separator row (e.g. | --- | --- |)
  if (cursor < lines.length) {
    const sepCells = parseTableRow(lines[cursor].trim());
    const isSeparator =
      sepCells.length === headerCells.length && sepCells.every((cell) => /^:?-+:?$/.test(cell.trim()));
    if (isSeparator) {
      consumed++;
      cursor++;
    }
  }

  // Body rows
  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    if (!line.startsWith("|")) break;
    const cells = parseTableRow(line);
    if (cells.length === 0) break;
    rows.push(cells);
    consumed++;
    cursor++;
  }

  return { header: headerCells, rows, consumed };
}

function parseTableRow(line: string): string[] {
  if (!line.startsWith("|") || !line.endsWith("|")) return [];
  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(block: TableBlock, key: number): React.ReactNode {
  const cellStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: "12px",
    lineHeight: "1.45",
    textAlign: "left",
    verticalAlign: "top",
    borderRight: "1px solid var(--border)",
  };

  return (
    <div key={key} style={{ margin: "6px 0", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--border)", borderRadius: "8px" }}>
        <thead>
          <tr>
            {block.header.map((h, i) => (
              <th
                key={i}
                style={{
                  ...cellStyle,
                  fontWeight: "700",
                  color: "var(--accent)",
                  background: "var(--bg-2)",
                  borderBottom: "2px solid var(--border-bright)",
                  whiteSpace: "nowrap",
                }}
              >
                {renderInlineMarkdown(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {row.map((cell, ci) => (
                <td key={ci} style={cellStyle}>
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Process bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "11px",
            background: "rgba(255,255,255,0.1)",
            padding: "2px 5px",
            borderRadius: "4px",
            color: "var(--accent)",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
