import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

export type TocItem = { level: 2 | 3; text: string; id: string };

export type WikiNav = {
  sections: Array<{
    title: string;
    items: Array<{ title: string; slug: string }>;
  }>;
};

export type WikiPage = {
  slug: string;
  title: string;
  html: string;
  toc: TocItem[];
  excerpt: string;
  sectionTitle: string | null;
};

/**
 * Locate the docs/ folder. Two supported layouts:
 *   1. Local dev / `next build` from ./frontend  → docs/ is one level up (../docs)
 *   2. Docker image (Dockerfile copies docs into /app/docs) → ./docs
 * The `WIKI_DOCS_DIR` env var overrides both if set (useful for tests/CI).
 */
const DOCS_CANDIDATES = [
  process.env.WIKI_DOCS_DIR,
  path.join(process.cwd(), "docs"),        // Docker: /app/docs
  path.join(process.cwd(), "..", "docs"),  // Local dev: repo-root/docs
].filter((p): p is string => !!p);

let cachedDocsDir: string | null = null;
async function docsDir(): Promise<string> {
  if (cachedDocsDir) return cachedDocsDir;
  for (const candidate of DOCS_CANDIDATES) {
    try {
      await fs.access(candidate);
      cachedDocsDir = candidate;
      return candidate;
    } catch {
      // try next
    }
  }
  // Fallback for error messages — still return something.
  cachedDocsDir = DOCS_CANDIDATES[0];
  return cachedDocsDir;
}

/** Best-effort read; returns [] if the folder is missing (e.g. isolated tests). */
async function readDocsDir(): Promise<string[]> {
  try {
    const dir = await docsDir();
    const entries = await fs.readdir(dir);
    return entries.filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

/** Lowercase, spaces → hyphens, strip non-alphanumerics — matches rehype-slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Extract H2 and H3 headings from raw markdown (before conversion) for the TOC. */
function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = markdown.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = (m[1].length as 2 | 3);
    const text = m[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    toc.push({ level, text, id: slugify(text) });
  }
  return toc;
}

/** Grab the first H1 as the page title, or return the slug as fallback. */
function extractTitle(markdown: string, fallback: string): string {
  const m = markdown.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : fallback;
}

/** First ~200 chars of plain text after the title, for search excerpts. */
function extractExcerpt(markdown: string): string {
  const withoutHeadings = markdown.replace(/^#+\s+.+$/gm, "");
  const withoutCodeBlocks = withoutHeadings.replace(/```[\s\S]*?```/g, "");
  const plain = withoutCodeBlocks
    .replace(/[*_`>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 200);
}

async function markdownToHtml(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    // Cast: rehype-highlight typings differ across versions; the runtime
    // option `ignoreMissing` is real and prevents unknown ``` lang tags from throwing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .use(rehypeHighlight as any, { ignoreMissing: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(file);
}

/** Load wiki-nav.json. Falls back to an empty structure if missing. */
export async function loadNav(): Promise<WikiNav> {
  try {
    const raw = await fs.readFile(path.join(await docsDir(), "wiki-nav.json"), "utf8");
    return JSON.parse(raw) as WikiNav;
  } catch {
    return { sections: [] };
  }
}

/** Look up which nav section a slug belongs to (for breadcrumb rendering). */
export async function sectionTitleForSlug(slug: string): Promise<string | null> {
  const nav = await loadNav();
  for (const section of nav.sections) {
    if (section.items.some((item) => item.slug === slug)) return section.title;
  }
  return null;
}

/** Read one page (used by the [...slug] route). Throws if file missing. */
export async function loadPage(slug: string): Promise<WikiPage> {
  const filePath = path.join(await docsDir(), `${slug}.md`);
  const raw = await fs.readFile(filePath, "utf8");
  const { content } = matter(raw);
  const html = await markdownToHtml(content);
  return {
    slug,
    title: extractTitle(content, slug),
    html,
    toc: extractToc(content),
    excerpt: extractExcerpt(content),
    sectionTitle: await sectionTitleForSlug(slug),
  };
}

/** List every slug that has a .md file — used by generateStaticParams. */
export async function listSlugs(): Promise<string[]> {
  const files = await readDocsDir();
  return files.map((f) => f.replace(/\.md$/, ""));
}

/** Compact index for client-side search — { slug, title, excerpt }. */
export async function buildSearchIndex(): Promise<
  Array<{ slug: string; title: string; excerpt: string }>
> {
  const slugs = await listSlugs();
  const dir = await docsDir();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const raw = await fs.readFile(path.join(dir, `${slug}.md`), "utf8");
      const { content } = matter(raw);
      return {
        slug,
        title: extractTitle(content, slug),
        excerpt: extractExcerpt(content),
      };
    })
  );
  return entries;
}
