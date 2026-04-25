"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useGetUploadUrlMutation, useScanReceiptMutation, useCreateExpenseMutation } from "@/ducks/expenses";
import type { ScanResponse } from "@/ducks/expenses";
import styles from "./scan-view.module.css";

function MIcon({ name, size = 24, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

export default function ScanView() {
  const { t } = useTranslation();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({ vendor: "", date: "", amount: "", vatAmount: "" });

  const [getUploadUrl] = useGetUploadUrlMutation();
  const [scanReceipt, { isLoading: isScanning }] = useScanReceiptMutation();
  const [createExpense, { isLoading: isSaving }] = useCreateExpenseMutation();

  const isProcessing = isUploading || isScanning;

  const processFile = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    setUploadError(null);

    try {
      const { uploadUrl, fileUrl } = await getUploadUrl(file.name).unwrap();
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
      setUploadedFileUrl(fileUrl);
      setIsUploading(false);

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
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
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
    <div className={styles.page}>
      {/* Error banner */}
      {uploadError && (
        <div className={styles.errorBanner}>
          <MIcon name="error_outline" size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      <div className={styles.grid}>
        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          {!scanResult ? (
            /* Upload dropzone */
            <label
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneDrag : ""} ${isProcessing ? styles.dropzoneDisabled : ""}`}
              onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />

              {isProcessing ? (
                <div className={styles.processingState}>
                  <div className={styles.spinner} />
                  <p className={styles.processingText}>
                    {isUploading
                      ? t("expense.scan.uploading", { defaultValue: "Uploading…" })
                      : t("expense.scan.analyzing", { defaultValue: "AI is analyzing your receipt…" })}
                  </p>
                </div>
              ) : (
                <div className={styles.dropzoneContent}>
                  <div className={styles.uploadIconWrap}>
                    <MIcon name="cloud_upload" size={48} />
                  </div>
                  <h3 className={styles.dropzoneTitle}>
                    {t("expense.scan.drop_title", { defaultValue: "Drop your receipts here" })}
                  </h3>
                  <p className={styles.dropzoneHint}>
                    {t("expense.scan.supported_formats", { defaultValue: "Supports JPG, PNG, and PDF (Max 20MB)" })}
                  </p>
                  <div className={styles.selectBtn}>
                    <MIcon name="folder_open" size={18} />
                    {t("expense.scan.select_from_computer", { defaultValue: "Select from Computer" })}
                  </div>
                </div>
              )}

              {/* File type decoration */}
              {!isProcessing && (
                <div className={styles.fileTypeIcons}>
                  <div className={styles.fileTypeIcon}>
                    <MIcon name="picture_as_pdf" size={20} />
                  </div>
                  <div className={styles.fileTypeIcon}>
                    <MIcon name="image" size={20} />
                  </div>
                </div>
              )}
            </label>
          ) : (
            /* Scan result: preview + form */
            <div className={styles.resultWrap}>
              {/* Preview */}
              <div className={styles.previewBox}>
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Receipt preview" className={styles.previewImg} />
                )}
              </div>

              {/* Extracted form */}
              <div className={styles.formBox}>
                <div className={styles.formSuccessRow}>
                  <MIcon name="check_circle" size={18} fill />
                  <span>{t("expense.scan.ai_complete", { defaultValue: "AI extraction complete" })}</span>
                </div>

                {scanResult.flags.length > 0 && (
                  <div className={styles.flagsBox}>
                    <div className={styles.flagsHeader}>
                      <MIcon name="warning" size={15} fill />
                      <span>{t("expense.scan.ai_warnings", { defaultValue: "AI Warnings" })}</span>
                    </div>
                    {scanResult.flags.map((f, i) => (
                      <p key={i} className={styles.flagText}>{f}</p>
                    ))}
                  </div>
                )}

                <Field label={t("expense.scan.label_vendor", { defaultValue: "Vendor" })} value={form.vendor} onChange={(v) => setForm({ ...form, vendor: v })} />
                <Field label={t("expense.scan.label_date", { defaultValue: "Date" })} value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
                <Field label={t("expense.scan.label_amount", { defaultValue: "Amount (€)" })} value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" />
                <Field label={`${t("expense.scan.label_vat", { defaultValue: "VAT" })} — ${scanResult.vatRate}`} value={form.vatAmount} onChange={(v) => setForm({ ...form, vatAmount: v })} type="number" />

                <button onClick={handleSave} disabled={isSaving} className={styles.saveBtn}>
                  {isSaving
                    ? t("expense.scan.saving", { defaultValue: "Saving…" })
                    : t("expense.scan.btn_save", { defaultValue: "Save Expense" })}
                </button>
              </div>
            </div>
          )}

          {/* Feature cards */}
          {!scanResult && (
            <div className={styles.featureRow}>
              <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <MIcon name="auto_stories" size={20} />
                  <span className={styles.featureLabel}>Editorial Accuracy</span>
                </div>
                <p className={styles.featureDesc}>
                  Our models are trained on complex financial typography to ensure 99.9% data fidelity across 40+ languages.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={`${styles.featureHeader} ${styles.featureHeaderSecondary}`}>
                  <MIcon name="lock" size={20} />
                  <span className={styles.featureLabel}>Secure Vault</span>
                </div>
                <p className={styles.featureDesc}>
                  Bank-grade encryption for every pixel. Your sensitive financial data remains private and strictly audited.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className={styles.rightCol}>
          {/* AI Assistant card */}
          <div className={styles.aiCard}>
            <div className={styles.aiCardInner}>
              <div className={styles.aiCardTop}>
                <span className={styles.aiBadge}>AI Assistant</span>
                <MIcon name="auto_awesome" size={20} fill />
              </div>
              <h4 className={styles.aiQuote}>
                &ldquo;Upload receipts in bulk to save up to 15 minutes of manual entry today.&rdquo;
              </h4>
              <div className={styles.aiProgressWrap}>
                <div className={styles.aiProgressRow}>
                  <span>AI Extraction Progress</span>
                  <span className={isProcessing ? styles.aiProgressStatusActive : ""}>
                    {isProcessing ? "Processing…" : "Ready"}
                  </span>
                </div>
                <div className={styles.aiProgressTrack}>
                  <div className={`${styles.aiProgressBar} ${isProcessing ? styles.aiProgressBarActive : ""}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent extractions */}
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <span>Recent Extractions</span>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.recentList}>
              <div className={styles.recentItem}>
                <div className={styles.recentLeft}>
                  <div className={styles.recentIcon}>
                    <MIcon name="local_cafe" size={20} />
                  </div>
                  <div>
                    <p className={styles.recentName}>Blue Bottle Coffee</p>
                    <p className={styles.recentDate}>Today, 9:41 AM</p>
                  </div>
                </div>
                <div className={styles.recentRight}>
                  <p className={styles.recentAmount}>$12.50</p>
                  <span className={styles.badgeVerified}>Verified</span>
                </div>
              </div>
              <div className={`${styles.recentItem} ${styles.recentItemDim}`}>
                <div className={styles.recentLeft}>
                  <div className={styles.recentIcon}>
                    <MIcon name="flight" size={20} />
                  </div>
                  <div>
                    <p className={styles.recentName}>Delta Airlines</p>
                    <p className={styles.recentDate}>Yesterday</p>
                  </div>
                </div>
                <div className={styles.recentRight}>
                  <p className={styles.recentAmount}>$482.00</p>
                  <span className={styles.badgePending}>Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pro tip */}
          <div className={styles.tipCard}>
            <MIcon name="lightbulb" size={20} fill />
            <div>
              <p className={styles.tipTitle}>Pro Tip</p>
              <p className={styles.tipText}>
                Take photos directly from your phone&apos;s browser for instant sync to this desktop view.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.fieldInput}
      />
    </div>
  );
}
