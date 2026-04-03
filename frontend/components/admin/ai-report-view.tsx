"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, AlertCircle, ChevronLeft, ChevronDown, ChevronUp, FileDown } from "lucide-react";
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
  const isManager = session?.user?.role === "MANAGER";

  const [period, setPeriod] = useState<string>(getCurrentPeriod());
  const [reportCollapsed, setReportCollapsed] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [displayedReport, setDisplayedReport] = useState<ExpenseReport | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: templatesData } = useGetReportTemplatesQuery();

  // Auth guard — accessible by Admin or Manager
  useEffect(() => {
    if (!isAuthLoading && session !== null && !isAdmin && !isManager) {
      router.replace("/not-found");
    }
  }, [isAuthLoading, session, isAdmin, isManager, router]);

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

      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
        {/* Period tab pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {buildPeriodOptions().map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              disabled={isGenerating || isPolling}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                o.value === period
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-6 w-px shrink-0 bg-neutral-200" />

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || isPolling}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating || isPolling
            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            : <Sparkles className="h-3.5 w-3.5" />
          }
          {isGenerating || isPolling ? "Generating..." : "Generate"}
        </button>

        {/* Status */}
        {isPolling && currentStatus && <StatusBadge status={currentStatus} />}
        {statusData?.status === "FAILED" && !isPolling && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </div>
        )}

        {/* Template + Download — pushed to the right */}
        {displayedReport && (
          <div className="ml-auto flex items-center gap-2">
            <select
              id="pdf-template"
              value={selectedTemplateId ?? ''}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
              className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {templatesData?.templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading || !selectedTemplateId}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {isDownloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              {isDownloading ? "Generating..." : "PDF"}
            </button>
          </div>
        )}
      </div>

      {/* Report display */}
      {displayedReport ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          {/* Report header — clickable to collapse */}
          <button
            onClick={() => setReportCollapsed((v) => !v)}
            className="flex w-full items-center justify-between border-b border-neutral-100 px-5 py-3 text-left hover:bg-neutral-50/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-neutral-700">
                Report — {displayedReport.period}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {displayedReport.generatedAt && (
                <span className="text-xs text-neutral-400">
                  Generated {new Date(displayedReport.generatedAt).toLocaleString()}
                </span>
              )}
              {reportCollapsed
                ? <ChevronDown className="h-4 w-4 text-neutral-400" />
                : <ChevronUp className="h-4 w-4 text-neutral-400" />
              }
            </div>
          </button>
          {!reportCollapsed && (
            <div className="px-6 py-5">
              <MarkdownRenderer markdown={displayedReport.markdown ?? ""} />
            </div>
          )}
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
