"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, ChevronLeft, FileDown } from "lucide-react";
import {
  useGetManagerLatestReportQuery,
  useGetReportTemplatesQuery,
} from "@/ducks/admin/adminApi";
import MarkdownRenderer from "@/common/markdown-renderer/MarkdownRenderer";

export default function ManagerAiReportView() {
  const router = useRouter();

  const { data: reportData, isLoading } = useGetManagerLatestReportQuery();
  const { data: templatesData } = useGetReportTemplatesQuery();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (templatesData?.templates.length && selectedTemplateId === null) {
      setSelectedTemplateId(templatesData.templates[0].id);
    }
  }, [templatesData]);

  const report = reportData?.exists ? reportData : null;

  const handleDownloadPdf = async () => {
    if (!report || !selectedTemplateId) return;
    setIsDownloading(true);
    try {
      const res = await fetch('/api/adm-016/report-templates/generate-pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplateId, reportId: report.id }),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${report.period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/manager/approvals")}
          className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">AI Expense Report</h2>
          <p className="text-sm text-neutral-500">
            AI-generated financial summary for your team
          </p>
        </div>
      </div>

      {/* Download controls */}
      {report && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <label htmlFor="pdf-template" className="text-xs font-medium text-neutral-600">Template</label>
            <select
              id="pdf-template"
              value={selectedTemplateId ?? ''}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {templatesData?.templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading || !selectedTemplateId}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {isDownloading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isDownloading ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>
      )}

      {/* Report */}
      {report ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-neutral-700">
                Report — {report.period}
              </span>
            </div>
            {report.generatedAt && (
              <span className="text-xs text-neutral-400">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <div className="px-6 py-5">
            <MarkdownRenderer markdown={report.markdown ?? ""} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            No AI report available yet. Please ask Finance or Admin to generate one.
          </p>
        </div>
      )}
    </div>
  );
}
