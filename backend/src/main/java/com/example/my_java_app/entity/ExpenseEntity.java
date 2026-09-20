package com.example.my_java_app.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Maps table `expenses` from TableMaster.sql
 */
@Data
public class ExpenseEntity {
    private Long id;
    private String userSub;
    private String type;        // RECEIPT | PER_DIEM | MILEAGE
    private String title;
    private BigDecimal amount;
    private String currency;
    private String status;      // DRAFT | PENDING_REVIEW | APPROVED | REJECTED

    // Receipt
    private String vendorName;
    private LocalDate receiptDate;
    private BigDecimal vatAmount;
    private String receiptFileUrl;
    private String aiExtractedData; // JSON string
    private String aiFlags;         // JSON string

    // Per Diem
    private LocalDate tripFrom;
    private LocalDate tripTo;
    private String countryCode;
    private BigDecimal perDiemRate;
    private Integer perDiemDays;

    // Mileage
    private BigDecimal distanceKm;
    private BigDecimal ratePerKm;

    // Workflow
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private String rejectionReason;
    private LocalDateTime paidAt;
    private LocalDate retentionExpiresAt;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;

    // Populated only by queries that JOIN user_profiles (e.g. the manager
    // approval queue) — null on every other query since expenses.user_sub
    // has no FK (intentional, see GDPR pseudonymization design). Never
    // persisted; purely a read-time convenience for the resultMap.
    private String submitterName;

    // Populated only by findPendingForManager's correlated duplicate-detection
    // subquery. duplicateOfId is the id of the EARLIEST prior RECEIPT from the
    // same submitter with the same vendor+amount+receipt_date that is still
    // PENDING_REVIEW/APPROVED/PAID (never REJECTED/DRAFT) — so only the LATER
    // submission gets flagged, never the original. duplicateOfStatus lets the
    // UI escalate severity: a duplicate of an already-APPROVED/PAID expense
    // is a real double-payment risk, not just visual clutter in the queue.
    private Long duplicateOfId;
    private String duplicateOfStatus;

    // Populated only by findForManagerByStatus — resolves reviewed_by (a raw
    // user_sub, same GDPR-pseudonymizable identifier as user_sub) to a
    // display name via the same user_profiles join pattern as submitterName.
    // Null for PENDING_REVIEW rows (nothing has reviewed them yet).
    private String reviewerName;
}
