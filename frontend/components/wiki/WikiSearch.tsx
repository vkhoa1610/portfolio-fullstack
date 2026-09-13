"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type IndexEntry = { slug: string; title: string; excerpt: string };

export default function WikiSearch({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Load the pre-built index once.
  useEffect(() => {
    fetch("/wiki-search-index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: IndexEntry[]) => setIndex(data))
      .catch(() => setIndex([]));
  }, []);

  // Cmd/Ctrl+K focuses the input; Esc closes the dropdown.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside → close.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? index
        .filter(
          (e) =>
            e.title.toLowerCase().includes(trimmed) ||
            e.excerpt.toLowerCase().includes(trimmed)
        )
        .slice(0, 6)
    : [];

  const handleSelect = (slug: string) => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(`/wiki/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
        style={{
          borderColor: "var(--color-neutral-200)",
          background: "var(--color-neutral-50)",
        }}
      >
        <Search className="h-3.5 w-3.5" style={{ color: "var(--color-neutral-400)" }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search docs..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--foreground)" }}
        />
        <kbd
          className="hidden rounded border px-1.5 py-0.5 text-[10px] md:inline"
          style={{
            borderColor: "var(--color-neutral-300)",
            background: "var(--color-card-bg)",
            color: "var(--color-neutral-500)",
          }}
        >
          ⌘K
        </kbd>
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border shadow-lg"
          style={{
            borderColor: "var(--color-neutral-200)",
            background: "var(--color-card-bg)",
          }}
        >
          {results.map((r) => (
            <button
              key={r.slug}
              onClick={() => handleSelect(r.slug)}
              className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:opacity-90"
              style={{ borderColor: "var(--color-neutral-100)" }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--color-neutral-900)" }}>
                {r.title}
              </div>
              <div
                className="mt-0.5 line-clamp-1 text-xs"
                style={{ color: "var(--color-neutral-500)" }}
              >
                {r.excerpt}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && trimmed && results.length === 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border p-3 text-center text-xs shadow-lg"
          style={{
            borderColor: "var(--color-neutral-200)",
            background: "var(--color-card-bg)",
            color: "var(--color-neutral-400)",
          }}
        >
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
