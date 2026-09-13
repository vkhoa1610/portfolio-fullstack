import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import { listSlugs, loadPage } from "@/lib/wiki";
import WikiContent from "@/components/wiki/WikiContent";
import WikiBreadcrumb from "@/components/wiki/WikiBreadcrumb";

interface Props {
  params: Promise<{ slug: string[] }>;
}

/** Pre-render every markdown file at build time so no runtime file I/O runs. */
export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs.map((s) => ({ slug: [s] }));
}

/** Write the search index into public/ as a side effect of build. */
async function ensureSearchIndex() {
  const { buildSearchIndex } = await import("@/lib/wiki");
  try {
    const idx = await buildSearchIndex();
    const outPath = path.join(process.cwd(), "public", "wiki-search-index.json");
    await fs.writeFile(outPath, JSON.stringify(idx), "utf8");
  } catch {
    /* best-effort — page still renders without the index */
  }
}

export default async function WikiPage({ params }: Props) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  // Runs once per unique slug during build; cheap during dev.
  await ensureSearchIndex();

  try {
    const page = await loadPage(slugStr);
    return (
      <>
        <WikiBreadcrumb slug={page.slug} sectionTitle={page.sectionTitle} pageTitle={page.title} />
        <WikiContent html={page.html} toc={page.toc} title={page.title} />
      </>
    );
  } catch {
    notFound();
  }
}
