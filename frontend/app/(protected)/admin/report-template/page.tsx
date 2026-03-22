import { Suspense } from 'react';
import ReportTemplateDesigner from '@/components/admin/report-template-designer';

export default function ReportTemplatePage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Report Template Designer</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ReportTemplateDesigner />
      </Suspense>
    </div>
  );
}
