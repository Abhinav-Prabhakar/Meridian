"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Simple, robust Markdown line-by-line renderer
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={index} style={{ height: "6px" }} />);
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={index} style={{ fontSize: "14px", fontWeight: "700", margin: "6px 0 4px 0", color: "var(--accent)" }}>
          {renderInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={index} style={{ fontSize: "15px", fontWeight: "700", margin: "8px 0 4px 0", color: "var(--text-main)" }}>
          {renderInlineMarkdown(trimmed.slice(3))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={index} style={{ fontSize: "16px", fontWeight: "700", margin: "10px 0 6px 0", color: "var(--text-main)" }}>
          {renderInlineMarkdown(trimmed.slice(2))}
        </h2>
      );
      return;
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
      return;
    }

    // Default paragraph
    elements.push(
      <p key={index} style={{ margin: "3px 0", fontSize: "13px", lineHeight: "1.5" }}>
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  return <div>{elements}</div>;
};

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
