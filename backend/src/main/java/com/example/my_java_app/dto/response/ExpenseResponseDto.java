package com.example.my_java_app.dto.response;

import com.example.my_java_app.dto.common.PolicyEvaluationSnapshotDto;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ExpenseResponseDto {
    private Long id;
    private String userSub;
    private String type;
    private String title;
    private BigDecimal amount;
    private String currency;
    private String status;

    // Receipt
    private String vendorName;
    private String receiptDate;
    private BigDecimal vatAmount;
    private String receiptFileUrl;
    private String aiExtractedData;
    private String aiFlags;

    // Per Diem
    private String tripFrom;
    private String tripTo;
    private String countryCode;
    private BigDecimal perDiemRate;
    private Integer perDiemDays;

    // Mileage
    private BigDecimal distanceKm;
    private BigDecimal ratePerKm;

    // Workflow
    private String submittedAt;
    private String reviewedAt;
    private String reviewedBy;
    private String rejectionReason;
    private String paidAt;

    // GoBD retention deadline (paid_at + 10 years). Null when not yet PAID.
    private String retentionExpiresAt;

    private String createdAt;

    // Create-time policy evaluation snapshot for detail screen
    private PolicyEvaluationSnapshotDto policyEvaluationSnapshot;

    // Set only by the manager approval queue (joins user_profiles) — null
    // everywhere else, including on the employee's own expense responses.
    private String submitterName;

    // Set only by the manager approval queue's duplicate-detection subquery —
    // null everywhere else. duplicateOfId is the id of the earlier matching
    // RECEIPT this one duplicates; duplicateOfStatus is that row's current
    // status, so the UI can escalate to a red flag when it's already
    // APPROVED/PAID (real double-payment risk) vs merely PENDING_REVIEW.
    private Long duplicateOfId;
    private String duplicateOfStatus;

    // Set only by the manager approval-history query — resolves reviewedBy
    // (a raw user_sub) to a display name. Null for PENDING_REVIEW expenses.
    private String reviewerName;
}
