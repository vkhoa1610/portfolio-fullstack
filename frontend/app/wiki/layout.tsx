import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { loadNav } from "@/lib/wiki";
import WikiSidebar from "@/components/wiki/WikiSidebar";
import "highlight.js/styles/github-dark.css";

export const metadata = {
  title: "Documentation — FintechSaaS",
};

export default async function WikiLayout({ children }: { children: React.ReactNode }) {
  const nav = await loadNav();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Header — self-contained, does NOT inherit the app's role-based nav.
          Uses CSS vars so the wiki follows the app's light/dark theme. */}
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-6"
        style={{
          background: "var(--color-card-bg)",
          borderColor: "var(--color-card-border)",
        }}
      >
        <Link
          href="/wiki/home"
          className="flex items-center gap-2"
          style={{ color: "var(--foreground)" }}
        >
          <BookOpen className="h-5 w-5" style={{ color: "var(--color-primary-600, #4244db)" }} />
          <span className="font-semibold">Documentation</span>
        </Link>
        <Link
          href="/my-expenses"
          className="flex items-center gap-1.5 text-sm hover:opacity-80"
          style={{ color: "var(--color-neutral-500)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <WikiSidebar nav={nav} />
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
