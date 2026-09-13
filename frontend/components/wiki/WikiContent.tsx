"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { TocItem } from "@/lib/wiki";
import "./wiki-prose.css";

interface Props {
  html: string;
  toc: TocItem[];
  title: string;
}

export default function WikiContent({ html, toc, title }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Render Mermaid diagrams. rehype-highlight leaves ```mermaid blocks as
  // <pre><code class="language-mermaid">...</code></pre>. We swap each for a
  // <div class="mermaid"> and call mermaid.run() to render inline SVGs.
  //
  // Uses a MutationObserver so if the DOM is re-hydrated (Next.js HMR, React
  // strict-mode remount) the diagram is re-rendered instead of reverting to
  // the raw <pre> text.
  useEffect(() => {
    if (!contentRef.current) return;
    const root = contentRef.current;
    let cancelled = false;
    let mermaidLib: typeof import("mermaid").default | null = null;

    const renderPending = async () => {
      const pres = root.querySelectorAll<HTMLPreElement>("pre:has(code.language-mermaid)");
      if (pres.length === 0) return;

      if (!mermaidLib) {
        const isDark =
          document.documentElement.getAttribute("data-theme") === "dark" ||
          document.documentElement.classList.contains("dark");
        mermaidLib = (await import("mermaid")).default;
        mermaidLib.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "var(--font-sans, Inter, sans-serif)",
        });
        if (cancelled) return;
      }

      const targets: HTMLElement[] = [];
      pres.forEach((pre) => {
        const code = pre.querySelector<HTMLElement>("code.language-mermaid");
        if (!code) return;
        const div = document.createElement("div");
        div.className = "mermaid wiki-mermaid";
        div.textContent = code.innerText;
        pre.replaceWith(div);
        targets.push(div);
      });

      if (targets.length > 0) {
        try {
          await mermaidLib.run({ nodes: targets });
        } catch (err) {
          console.error("[wiki] mermaid render failed", err);
        }
      }
    };

    // Initial render.
    void renderPending();

    // Re-render if new mermaid pres appear (HMR / re-hydration).
    const observer = new MutationObserver(() => void renderPending());
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [html]);

  // Attach copy buttons to every <pre><code> block after render.
  useEffect(() => {
    if (!contentRef.current) return;
    const pres = contentRef.current.querySelectorAll("pre");
    const buttons: HTMLButtonElement[] = [];

    pres.forEach((pre) => {
      // Skip if we've already wrapped this one (React re-renders).
      if (pre.dataset.copyAttached === "true") return;
      // Skip mermaid pres — they're about to be replaced with an SVG div;
      // attaching a Copy button here would race with the replacement.
      if (pre.querySelector("code.language-mermaid")) return;
      pre.dataset.copyAttached = "true";
      pre.style.position = "relative";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "absolute right-2 top-2 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 transition-opacity hover:bg-white/20 hover:text-white group-hover:opacity-100";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code");
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.innerText ?? pre.innerText;
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 1200);
        } catch {
          btn.textContent = "Err";
        }
      });

      pre.classList.add("group");
      pre.appendChild(btn);
      buttons.push(btn);
    });

    return () => {
      buttons.forEach((b) => b.remove());
    };
  }, [html]);

  // Scroll-spy: highlight the TOC entry whose heading is currently at top.
  useEffect(() => {
    if (toc.length === 0 || !contentRef.current) return;
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost heading that's currently intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="mx-auto flex max-w-5xl gap-8">
      <article className="min-w-0 flex-1">
        <h1
          className="mb-6 text-3xl font-bold"
          style={{ color: "var(--color-neutral-900)" }}
        >
          {title}
        </h1>
        <div
          ref={contentRef}
          className="wiki-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      {/* TOC — desktop only, sticky */}
      {toc.length > 1 && (
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="sticky top-20">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-neutral-400)" }}
            >
              On this page
            </p>
            <ul
              className="space-y-1 border-l"
              style={{ borderColor: "var(--color-neutral-200)" }}
            >
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`block border-l-2 py-1 pl-3 text-xs transition-colors ${
                      item.level === 3 ? "pl-5" : ""
                    }`}
                    style={
                      activeId === item.id
                        ? {
                            marginLeft: "-1px",
                            borderColor: "var(--color-primary-600, #4244db)",
                            color: "var(--color-primary-700, #2e30c7)",
                            fontWeight: 600,
                          }
                        : {
                            marginLeft: "-1px",
                            borderColor: "transparent",
                            color: "var(--color-neutral-500)",
                          }
                    }
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}
