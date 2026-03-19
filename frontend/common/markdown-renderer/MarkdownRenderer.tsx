import React from "react";

interface Props {
  markdown: string;
  className?: string;
}

/**
 * Renders a subset of markdown to React elements without external deps.
 * Supported: ## headings (h1–h3), **bold**, - bullet lists, blank-line paragraphs.
 */
export default function MarkdownRenderer({ markdown, className = "" }: Props) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++} className="mb-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="mb-1 mt-4 text-base font-semibold text-neutral-800">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="mb-2 mt-5 text-lg font-bold text-neutral-900">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={key++} className="mb-3 mt-6 text-xl font-bold text-neutral-900">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(
        <li key={key++}>{renderInline(line.slice(2))}</li>
      );
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="mb-2 text-sm text-neutral-700">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();

  return <div className={className}>{elements}</div>;
}
