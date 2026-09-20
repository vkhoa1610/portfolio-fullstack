import { Suspense } from "react";
import ApprovalsView from "@/components/manager/approvals-view";

export default function ManagerApprovalsPage() {
  return (
    <Suspense>
      <ApprovalsView />
    </Suspense>
  );
}
