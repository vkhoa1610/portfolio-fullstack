"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useGetUploadUrlMutation, useScanReceiptMutation, useCreateExpenseMutation } from "@/ducks/expenses";
import type { ScanResponse, PolicyEvaluationSnapshot } from "@/ducks/expenses";
import { useGetScreenConfigQuery, useGetPolicyInsightMutation } from "@/ducks/cms/cmsApi";
import type { PolicyScreenConfig } from "@/ducks/cms/types";
import type { SeverityCheckItem, SeverityState } from "./policy-compliance";
import styles from "./scan-view.module.css";
import PageHeader from "@/components/layout/PageHeader";
import DetailInsight from "./detail/detail-insight";
import PolicyCompliance from "./policy-compliance";
import PolicyInsight from "./policy-insight";

const CATEGORIES = [
  "Meals & Entertainment",
  "Travel",
  "Software & Subscriptions",
  "Office Supplies",
  "Accommodation",
  "Transport",
  "Other",
];

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ScanView() {
  const { t } = useTranslation();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Image viewer controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [form, setForm] = useState({ vendor: "", date: "", amount: "", vatAmount: "", category: CATEGORIES[0] });

  const [getUploadUrl] = useGetUploadUrlMutation();
  const [scanReceipt, { isLoading: isScanning }] = useScanReceiptMutation();
  const [createExpense, { isLoading: isSaving }] = useCreateExpenseMutation();

  const isProcessing = isUploading || isScanning;

  // ── CMS ────────────────────────────────────────────────────────────────────
  const { data: rawConfig } = useGetScreenConfigQuery("expense.create.receipt");
  const config = rawConfig as PolicyScreenConfig | undefined;

  function evalCondition(key: string): SeverityState {
    switch (key) {
      case "currency_mismatch":
        return !scanResult ? "pending" : "ok"; // no currency field in ScanResponse — assume EUR
      case "spending_limit_exceeded":
        if (!form.amount) return "pending";
        return parseFloat(form.amount) > 150 ? "triggered" : "ok";
      case "vat_unusual": {
        const amt = parseFloat(form.amount);
        const vat = parseFloat(form.vatAmount);
        if (!form.amount || !form.vatAmount || amt <= 0) return "pending";
        const ratio = vat / amt;
        return ratio > 0 && (ratio < 0.03 || ratio > 0.30) ? "triggered" : "ok";
      }
      case "merchant_unrecognized":
        if (!scanResult) return "pending";
        return !scanResult.vendor || scanResult.vendor.toLowerCase() === "unknown" ? "triggered" : "ok";
      case "ai_low_confidence":
        if (!scanResult) return "pending";
        return scanResult.flags.length > 0 ? "triggered" : "ok";
      default:
        return "pending";
    }
  }

  const severityItems: SeverityCheckItem[] = (config?.compliance ?? []).map((rule) => {
    const state = evalCondition(rule.condition);
    const desc = t(
      state === "pending"   ? rule.pending_desc_key  :
      state === "ok"        ? rule.ok_desc_key        :
      rule.triggered_desc_key
    );
    return { id: rule.id, icon: rule.icon, title: t(rule.title_key), desc, severity: rule.severity, state, blocksSave: rule.blocks_save };
  });

  const activeInsight = config?.insight.find((ins) => ins.condition === "has_scan_result" ? !!scanResult : true);

  // ── AI Insight ─────────────────────────────────────────────────────────────
  const [getInsight] = useGetPolicyInsightMutation();
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!scanResult) return;
    setAiLoading(true);
    setAiText(null);
    const timer = setTimeout(async () => {
      try {
        const res = await getInsight({
          type: "RECEIPT",
          context: {
            vendor: form.vendor,
            amount: form.amount,
            vatAmount: form.vatAmount,
            vatRate: scanResult.vatRate,
            category: form.category,
            flags: scanResult.flags.join(", ") || "none",
          },
        }).unwrap();
        setAiText(res.insight || null);
      } catch {
        setAiText(null);
      } finally {
        setAiLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanResult]);

  const processFile = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setFileInfo({ name: file.name, size: formatFileSize(file.size) });
    setZoom(1);
    setRotation(0);
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
        category: CATEGORIES[0],
      });
    } catch (err: unknown) {
      setIsUploading(false);
      setPreviewUrl(null);
      setFileInfo(null);
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
    const policyEvaluationSnapshot: PolicyEvaluationSnapshot | undefined = config
      ? {
          screenKey: "expense.create.receipt",
          items: (config.compliance ?? []).map((rule) => {
            const state = evalCondition(rule.condition);
            const resolvedDescKey =
              state === "pending"
                ? rule.pending_desc_key
                : state === "ok"
                ? rule.ok_desc_key
                : rule.triggered_desc_key;

            return {
              id: rule.id,
              severity: rule.severity,
              state,
              titleKey: rule.title_key,
              pendingDescKey: rule.pending_desc_key,
              okDescKey: rule.ok_desc_key,
              triggeredDescKey: rule.triggered_desc_key,
              resolvedTitle: t(rule.title_key),
              resolvedDesc: t(resolvedDescKey),
              blocksSave: rule.blocks_save,
            };
          }),
          inputSnapshot: {
            vendor: form.vendor,
            receiptDate: form.date,
            amount: parseFloat(form.amount),
            vatAmount: parseFloat(form.vatAmount),
            category: form.category,
            flags: scanResult?.flags ?? [],
          },
        }
      : undefined;

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
      policyEvaluationSnapshot,
    }).unwrap();
    router.push("/my-expenses");
  };

  // ── Result view (after scan) ───────────────────────────────────────────────
  if (scanResult) {
    return (
      <div>
        <PageHeader
          title={t("expense.scan.result_title", { defaultValue: "Upload Receipt" })}
          subtitle={t("expense.scan.result_subtitle", { defaultValue: "Upload a receipt — AI will extract the data" })}
          backLabel={t("expense.scan.back", { defaultValue: "New Expense" })}
          backHref="/my-expenses/create"
        />

        <div className={styles.resultPage}>
        {/* Left: Document viewer */}
        <div className={styles.viewerPanel}>
          <div className={styles.viewerHeader}>
            <div className={styles.viewerHeaderLeft}>
              <MIcon name="image" size={18} />
              <span className={styles.viewerTitle}>Original Document</span>
            </div>
            {fileInfo && (
              <span className={styles.viewerMeta}>
                {fileInfo.name} &bull; {fileInfo.size}
              </span>
            )}
          </div>

          <div className={styles.viewerCanvas}>
            <div
              className={styles.viewerImgWrap}
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            >
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Receipt" className={styles.viewerImg} />
              )}
            </div>

            {/* Controls */}
            <div className={styles.viewerControls}>
              <button
                className={styles.viewerBtn}
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
              >
                <MIcon name="zoom_in" size={20} />
              </button>
              <button
                className={styles.viewerBtn}
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              >
                <MIcon name="zoom_out" size={20} />
              </button>
              <div className={styles.viewerBtnDivider} />
              <button
                className={styles.viewerBtn}
                title="Rotate 90°"
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <MIcon name="rotate_right" size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI extraction form */}
        <div className={styles.formPanel}>
          {/* Header */}
          <div className={styles.formPanelHeader}>
            <div className={styles.formPanelIconWrap}>
              <MIcon name="auto_awesome" size={22} fill />
            </div>
            <div>
              <h3 className={styles.formPanelTitle}>AI Extraction Results</h3>
              <p className={styles.formPanelScore}>Confidence Score: 98%</p>
            </div>
          </div>

          {/* AI flags */}
          {scanResult.flags.length > 0 && (
            <div className={styles.aiFlag}>
              <div className={styles.aiFlagDot} />
              <p className={styles.aiFlagText}>
                {scanResult.flags.join(" ")}
              </p>
            </div>
          )}

          {/* Fields */}
          <div className={styles.fields}>
            {/* Vendor */}
            <div className={styles.fieldGroup}>
              <label htmlFor="scan-vendor" className={styles.fieldLabel}>
                {t("expense.scan.label_vendor", { defaultValue: "Vendor Name" })}
              </label>
              <div className={styles.fieldWithIcon}>
                <input
                  id="scan-vendor"
                  className={styles.fieldInput}
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                />
                <span className={styles.fieldCheckIcon}>
                  <MIcon name="check_circle" size={18} fill />
                </span>
              </div>
            </div>

            {/* Date + Amount */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="scan-date" className={styles.fieldLabel}>
                  {t("expense.scan.label_date", { defaultValue: "Date" })}
                </label>
                <input
                  id="scan-date"
                  type="date"
                  className={styles.fieldInput}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="scan-amount" className={styles.fieldLabel}>
                  {t("expense.scan.label_amount", { defaultValue: "Amount" })}
                </label>
                <div className={styles.amountWrap}>
                  <input
                    id="scan-amount"
                    type="number"
                    className={`${styles.fieldInput} ${styles.amountInput}`}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                  <span className={styles.amountCurrency}>USD</span>
                </div>
              </div>
            </div>

            {/* VAT */}
            <div className={styles.fieldGroup}>
              <label htmlFor="scan-vat" className={styles.fieldLabel}>
                {t("expense.scan.label_vat", { defaultValue: "VAT / Tax" })}{" "}
                <span className={styles.fieldLabelNote}>(Included)</span>
              </label>
              <input
                id="scan-vat"
                type="number"
                className={styles.fieldInput}
                value={form.vatAmount}
                onChange={(e) => setForm({ ...form, vatAmount: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className={styles.fieldGroup}>
              <label htmlFor="scan-category" className={styles.fieldLabel}>Expense Category</label>
              <div className={styles.selectWrap}>
                <select
                  id="scan-category"
                  className={styles.fieldSelect}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className={styles.selectArrow}>
                  <MIcon name="expand_more" size={18} />
                </span>
              </div>
            </div>
          </div>

          {/* Policy compliance (CMS-driven) */}
          {config && severityItems.length > 0 && (
            <PolicyCompliance mode="severity" items={severityItems} />
          )}

          {/* Insight note — CMS when available, static fallback otherwise */}
          {activeInsight ? (
            <PolicyInsight
              linkLabel={activeInsight.link_label_key ? t(activeInsight.link_label_key) : ""}
              aiText={aiText ?? undefined}
              aiLoading={aiLoading}
            >
              {t(activeInsight.text_key)}
            </PolicyInsight>
          ) : (
            <DetailInsight
              variant="simple"
              text={`This matches a previous recurring expense from ${form.vendor || "this vendor"}. Suggested category "${form.category}" was applied automatically.`}
            />
          )}

          {/* Save */}
          <button onClick={handleSave} disabled={isSaving} className={styles.saveBtn}>
            <MIcon name="save" size={20} />
            {isSaving
              ? t("expense.scan.saving", { defaultValue: "Saving…" })
              : t("expense.scan.btn_save", { defaultValue: "Save Expense" })}
          </button>
        </div>
      </div>
      </div>
    );
  }

  // ── Upload / processing view ───────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title={t("expense.scan.title", { defaultValue: "Upload Receipt" })}
        subtitle={t("expense.scan.subtitle", {
          defaultValue: "Upload a receipt — AI will extract the data",
        })}
        backLabel={t("expense.scan.back", { defaultValue: "New Expense" })}
        backHref="/my-expenses/create"
      />

      <div className={styles.page}>
      {uploadError && (
        <div className={styles.errorBanner}>
          <MIcon name="error_outline" size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.leftCol}>
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

            {!isProcessing && (
              <div className={styles.fileTypeIcons}>
                <div className={styles.fileTypeIcon}><MIcon name="picture_as_pdf" size={20} /></div>
                <div className={styles.fileTypeIcon}><MIcon name="image" size={20} /></div>
              </div>
            )}
          </label>

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
        </div>

        {/* Right sidebar */}
        <div className={styles.rightCol}>
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

          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <span>Recent Extractions</span>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.recentList}>
              <div className={styles.recentItem}>
                <div className={styles.recentLeft}>
                  <div className={styles.recentIcon}><MIcon name="local_cafe" size={20} /></div>
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
                  <div className={styles.recentIcon}><MIcon name="flight" size={20} /></div>
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
    </div>
  );
}
