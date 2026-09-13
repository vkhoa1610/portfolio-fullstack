"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { WikiNav } from "@/lib/wiki";
import WikiSearch from "./WikiSearch";

export default function WikiSidebar({ nav }: { nav: WikiNav }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Extract current slug from /wiki/<slug> path.
  const currentSlug = pathname.replace(/^\/wiki\//, "").replace(/\/$/, "");

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-40 rounded-full bg-primary-600 p-3 text-white shadow-lg md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          ${mobileOpen ? "fixed inset-y-0 left-0 z-50 w-64" : "hidden"}
          md:sticky md:top-14 md:z-auto md:flex md:h-[calc(100vh-3.5rem)] md:w-60
          md:flex-shrink-0
          flex-col border-r
        `}
        style={{
          background: "var(--color-card-bg)",
          borderColor: "var(--color-card-border)",
        }}
      >
        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-3 rounded-md p-1 hover:opacity-80 md:hidden"
            style={{ color: "var(--color-neutral-400)" }}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search */}
        <div className="p-3">
          <WikiSearch onNavigate={() => setMobileOpen(false)} />
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {nav.sections.map((section) => (
            <div key={section.title} className="mb-5">
              <h3
                className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--color-neutral-400)" }}
              >
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = currentSlug === item.slug;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/wiki/${item.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:opacity-90"
                        style={
                          active
                            ? {
                                background: "var(--color-nav-active-bg, rgba(66,68,219,0.08))",
                                color: "var(--color-nav-active-text, #4244db)",
                                fontWeight: 600,
                              }
                            : { color: "var(--color-neutral-700)" }
                        }
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
