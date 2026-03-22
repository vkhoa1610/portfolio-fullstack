"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Download, CheckCircle, XCircle, X, ChevronLeft } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { useImportUsersMutation, useImportPermissionsMutation } from "@/ducks/admin/adminApi";
import type { ImportResult } from "@/ducks/admin/types";

type Tab = "users" | "permissions";

const TEMPLATE_HEADERS: Record<Tab, string[]> = {
  users: ["Email", "Role", "Budget"],
  permissions: ["User Email", "Permission Code", "Action"],
};

export default function AdminImportView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isLoading: isAuthLoading, session } = useAuth();

  const initialTab = (searchParams.get("tab") as Tab) ?? "users";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importUsers, { isLoading: isImportingUsers }] = useImportUsersMutation();
  const [importPermissions, { isLoading: isImportingPerms }] = useImportPermissionsMutation();
  const isImporting = isImportingUsers || isImportingPerms;

  useEffect(() => {
    if (!isAuthLoading && session !== null && !isAdmin) {
      router.replace("/not-found");
    }
  }, [isAuthLoading, session, isAdmin, router]);

  // Switch tab → clear state
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setFile(null);
    setPreviewRows([]);
    setResult(null);
  };

  // Parse CSV in browser using FileReader
  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    setResult(null);
    setPreviewRows([]);
    if (!selected) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text
        .replace(/^\uFEFF/, "") // strip BOM
        .split(/\r?\n/)
        .filter((l) => l.trim());
      // Skip header row, parse data rows
      const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
      setPreviewRows(rows);
    };
    reader.readAsText(selected, "utf-8");
  };

  const handleConfirm = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res =
        activeTab === "users"
          ? await importUsers(formData).unwrap()
          : await importPermissions(formData).unwrap();
      setResult(res);
    } catch {
      setResult({ successCount: 0, failCount: 1, errors: [{ row: "-", message: "Upload failed" }] });
    }
  };

  const headers = TEMPLATE_HEADERS[activeTab];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin')}
          className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">CSV Import</h2>
          <p className="text-sm text-neutral-500">Bulk import users or permissions from a CSV file</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {(["users", "permissions"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tab === "users" ? "Import Users" : "Import Permissions"}
          </button>
        ))}
      </div>

      {/* Step 1: Download template */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-neutral-700">Step 1 — Download template</p>
        <a
          href={`/adm-010/template/${activeTab}`}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <Download className="h-4 w-4" />
          Download {activeTab}_template.csv
        </a>
      </div>

      {/* Step 2: Upload file */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-neutral-700">Step 2 — Upload CSV file</p>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 p-8 transition-colors hover:border-primary-400 hover:bg-primary-50/30"
        >
          <Upload className="mb-2 h-8 w-8 text-neutral-400" />
          <p className="text-sm text-neutral-500">
            {file ? file.name : "Click to select a .csv file"}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {file && (
          <button
            onClick={() => { setFile(null); setPreviewRows([]); setResult(null); }}
            className="mt-2 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Step 3: Preview */}
      {previewRows.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-neutral-700">
            Step 3 — Preview ({previewRows.length} row{previewRows.length !== 1 ? "s" : ""})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {previewRows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    {headers.map((_, j) => (
                      <td key={j} className="px-3 py-2 text-neutral-700">
                        {row[j] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 20 && (
              <p className="mt-2 text-xs text-neutral-400">
                Showing first 20 of {previewRows.length} rows
              </p>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={isImporting}
            className="mt-4 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isImporting ? "Importing..." : "Confirm Import"}
          </button>
        </div>
      )}

      {/* Step 4: Result */}
      {result && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-700">Import Result</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">{result.successCount} success</span>
            </div>
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">{result.failCount} failed</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-red-100">
              <table className="w-full text-sm">
                <thead className="bg-red-50 text-left text-xs font-medium uppercase text-red-500">
                  <tr>
                    <th className="px-3 py-2 w-20">Row</th>
                    <th className="px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50">
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-neutral-500">{e.row}</td>
                      <td className="px-3 py-2 text-red-600">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
