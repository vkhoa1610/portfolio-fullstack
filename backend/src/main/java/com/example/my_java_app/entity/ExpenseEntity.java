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
}
