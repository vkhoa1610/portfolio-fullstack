"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, AlertCircle, ChevronLeft, FileDown } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import {
  useGenerateReportMutation,
  useGetReportStatusQuery,
  useGetLatestReportQuery,
  useGetReportTemplatesQuery,
} from "@/ducks/admin/adminApi";
import MarkdownRenderer from "@/common/markdown-renderer/MarkdownRenderer";
import type { ExpenseReport } from "@/ducks/admin/types";

// ─── Period selector helpers ─────────────────────────────────────────────────

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function buildPeriodOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    options.push({ value, label });
  }
  return options;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AiReportView() {
  const router = useRouter();
  const { isAdmin, isLoading: isAuthLoading, session } = useAuth();

  const [period, setPeriod] = useState<string>(getCurrentPeriod());
  const [jobId, setJobId] = useState<number | null>(null);
  const [displayedReport, setDisplayedReport] = useState<ExpenseReport | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: templatesData } = useGetReportTemplatesQuery();

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && session !== null && !isAdmin) {
      router.replace("/not-found");
    }
  }, [isAuthLoading, session, isAdmin, router]);

  // Load latest report on mount
  const { data: latestData } = useGetLatestReportQuery();

  useEffect(() => {
    if (latestData && latestData.exists) {
      setDisplayedReport(latestData);
    }
  }, [latestData]);

  // Poll job status while a job is running
  const { data: statusData } = useGetReportStatusQuery(jobId!, {
    skip: jobId === null,
    pollingInterval: jobId !== null ? 2000 : 0,
  });

  useEffect(() => {
    if (!statusData) return;
    if (statusData.status === "DONE") {
      setDisplayedReport(statusData);
      setJobId(null);
    } else if (statusData.status === "FAILED") {
      setJobId(null);
    }
  }, [statusData]);

  // Auto-select first template
  useEffect(() => {
    if (templatesData?.templates.length && selectedTemplateId === null) {
      setSelectedTemplateId(templatesData.templates[0].id);
    }
  }, [templatesData]);

  const [generateReport, { isLoading: isGenerating }] = useGenerateReportMutation();

  const handleGenerate = async () => {
    try {
      const result = await generateReport(period).unwrap();
      setJobId(result.jobId);
    } catch {
      // error handled below via statusData
    }
  };

  const handleDownloadPdf = async () => {
    if (!displayedReport || !selectedTemplateId) return;
    setIsDownloading(true);
    try {
      const res = await fetch('/api/adm-016/report-templates/generate-pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplateId, reportId: displayedReport.id }),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${displayedReport.period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — user sees no download
    } finally {
      setIsDownloading(false);
    }
  };

  const isPolling = jobId !== null;
  const currentStatus = isPolling ? statusData?.status ?? "PENDING" : null;

  if (isAuthLoading) {
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
          onClick={() => router.push("/admin")}
          className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">AI Report Generator</h2>
          <p className="text-sm text-neutral-500">
            Aggregate expense data and generate an AI-powered financial summary
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="report-period" className="text-xs font-medium text-neutral-600">Period</label>
          <select
            id="report-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={isGenerating || isPolling}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
          >
            {buildPeriodOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || isPolling}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating || isPolling ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating || isPolling ? "Generating..." : "Generate Report"}
        </button>

        {/* Template selector + Download PDF */}
        {displayedReport && (
          <div className="flex items-end gap-2 ml-auto">
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

        {/* Status badge */}
        {isPolling && currentStatus && (
          <StatusBadge status={currentStatus} />
        )}
        {statusData?.status === "FAILED" && !isPolling && (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Generation failed. Please try again.
          </div>
        )}
      </div>

      {/* Report display */}
      {displayedReport ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-neutral-700">
                Report — {displayedReport.period}
              </span>
            </div>
            {displayedReport.generatedAt && (
              <span className="text-xs text-neutral-400">
                Generated {new Date(displayedReport.generatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <div className="px-6 py-5">
            <MarkdownRenderer markdown={displayedReport.markdown ?? ""} />
          </div>
        </div>
      ) : (
        !isPolling && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              No report generated yet. Select a period and click <strong>Generate Report</strong>.
            </p>
          </div>
        )
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending..." },
    DONE:    { bg: "bg-green-50",  text: "text-green-700",  label: "Done" },
    FAILED:  { bg: "bg-red-50",    text: "text-red-700",    label: "Failed" },
  };
  const c = config[status] ?? config.PENDING;
  return (
    <span className={`rounded-full ${c.bg} ${c.text} px-3 py-1 text-xs font-medium`}>
      {c.label}
    </span>
  );
}
