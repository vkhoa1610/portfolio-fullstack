"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useGetUploadUrlMutation, useScanReceiptMutation, useCreateExpenseMutation } from "@/ducks/expenses";
import type { ScanResponse } from "@/ducks/expenses";

export default function ScanView() {
  const { t } = useTranslation();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({ vendor: "", date: "", amount: "", vatAmount: "" });

  const [getUploadUrl] = useGetUploadUrlMutation();
  const [scanReceipt, { isLoading: isScanning }] = useScanReceiptMutation();
  const [createExpense, { isLoading: isSaving }] = useCreateExpenseMutation();

  const isProcessing = isUploading || isScanning;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show local preview immediately
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);

    setUploadError(null);
    try {
      // 2. Get presigned PUT URL from backend (via BFF)
      const { uploadUrl, fileUrl } = await getUploadUrl(file.name).unwrap();

      // 3. Upload file directly to MinIO (bypasses backend)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error(`MinIO upload failed: ${putRes.status}`);

      setUploadedFileUrl(fileUrl);
      setIsUploading(false);

      // 4. Call mock OCR with the stored fileUrl
      const result = await scanReceipt({ fileUrl }).unwrap();
      setScanResult(result);
      setForm({
        vendor: result.vendor,
        date: result.date,
        amount: String(result.amount),
        vatAmount: String(result.vatAmount),
      });
    } catch (err: unknown) {
      setIsUploading(false);
      setPreviewUrl(null);
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      console.error("[ScanView] upload error:", err);
    }
  };

  const handleSave = async () => {
    await createExpense({
      type: "RECEIPT",
      title: form.vendor,
      amount: parseFloat(form.amount),
      vendorName: form.vendor,
      receiptDate: form.date,
      vatAmount: parseFloat(form.vatAmount),
      receiptFileUrl: uploadedFileUrl ?? undefined,
      aiExtractedData: scanResult ? JSON.stringify(scanResult) : undefined,
      aiFlags: scanResult?.flags?.length ? JSON.stringify(scanResult.flags) : undefined,
    }).unwrap();
    router.push("/my-expenses");
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">{t("expense.scan.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("expense.scan.subtitle")}</p>
      </div>

      {uploadError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {!scanResult ? (
        /* ── Upload Area ── */
        <label className={`flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isProcessing ? "cursor-not-allowed border-neutral-200 bg-neutral-100" : "cursor-pointer border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50"}`}>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              <p className="text-sm text-neutral-500">
                {isUploading ? t("expense.scan.uploading") : t("expense.scan.analyzing")}
              </p>
            </div>
          ) : (
            <>
              <Upload className="mb-3 h-10 w-10 text-neutral-400" />
              <p className="font-medium text-neutral-700">{t("expense.scan.click_to_upload")}</p>
              <p className="text-xs text-neutral-400">{t("expense.scan.supported_formats")}</p>
            </>
          )}
        </label>
      ) : (
        /* ── Split View: Preview + Form ── */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Preview (blob URL for instant display) */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-neutral-400">{t("expense.scan.preview")}</p>
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Receipt" className="max-h-80 w-full rounded-lg object-contain" />
            )}
          </div>

          {/* Right: Extracted Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-500" />
              <p className="text-sm font-medium text-neutral-700">{t("expense.scan.ai_complete")}</p>
            </div>

            {/* AI Flags */}
            {scanResult.flags.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning-600" />
                <div>
                  <p className="text-xs font-semibold text-warning-700">{t("expense.scan.ai_warnings")}</p>
                  {scanResult.flags.map((f, i) => (
                    <p key={i} className="text-xs text-warning-600">{f}</p>
                  ))}
                </div>
              </div>
            )}

            <Field label={t("expense.scan.label_vendor")} value={form.vendor} onChange={(v) => setForm({ ...form, vendor: v })} />
            <Field label={t("expense.scan.label_date")} value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
            <Field label={t("expense.scan.label_amount")} value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" />
            <Field label={`${t("expense.scan.label_vat")} — ${scanResult.vatRate}`} value={form.vatAmount} onChange={(v) => setForm({ ...form, vatAmount: v })} type="number" />

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isSaving ? t("expense.scan.saving") : t("expense.scan.btn_save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
      />
    </div>
  );
}
