import React from "react";

// This layout intentionally renders no header of its own — both child routes
// (the approvals list and the approval detail page) already own their own
// header (PageHeader hero on the list, a custom header on the detail view).
// A previous version of this file hardcoded a duplicate flat header here
// (mixed German/Vietnamese title text, a fake "Team Budget: 85%" badge not
// backed by any real data) that rendered ABOVE whatever the page itself
// showed — leaving two headers stacked on the list page once it got its own
// PageHeader hero.
export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}