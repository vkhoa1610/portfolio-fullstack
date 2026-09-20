import { Suspense } from "react";
import ReportTemplateDesigner from "@/components/admin/report-template-designer";

// ReportTemplateDesigner renders its own PageHeader hero — no wrapper header
// here, otherwise the page would show two stacked headers.
export default function ManagerReportTemplatePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ReportTemplateDesigner />
    </Suspense>
  );
}
