import { Suspense } from "react";
import AdminImportView from "@/components/admin/admin-import-view";

export default function AdminImportPage() {
  return (
    <Suspense>
      <AdminImportView />
    </Suspense>
  );
}
