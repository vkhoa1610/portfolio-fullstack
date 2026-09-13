import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Props {
  slug: string;
  sectionTitle: string | null;
  pageTitle: string;
}

export default function WikiBreadcrumb({ sectionTitle, pageTitle }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto mb-4 flex max-w-5xl items-center gap-1.5 text-xs"
      style={{ color: "var(--color-neutral-500)" }}
    >
      <Link
        href="/wiki/home"
        className="hover:opacity-80"
        style={{ color: "var(--color-neutral-500)" }}
      >
        Wiki
      </Link>
      {sectionTitle && (
        <>
          <ChevronRight className="h-3 w-3" style={{ color: "var(--color-neutral-300)" }} />
          <span>{sectionTitle}</span>
        </>
      )}
      <ChevronRight className="h-3 w-3" style={{ color: "var(--color-neutral-300)" }} />
      <span className="font-medium" style={{ color: "var(--color-neutral-800)" }}>
        {pageTitle}
      </span>
    </nav>
  );
}
